(() => {
  "use strict";

  /** @typedef {{ id: string, text: string, checked: boolean }} Item */

  const TABLE = "shopping_items";

  const url = window.SUPABASE_URL;
  const anonKey = window.SUPABASE_ANON_KEY;

  if (!url || !anonKey || !window.supabase) {
    console.error(
      "[shopping-list] Supabase가 설정되지 않았습니다. index.html의 SUPABASE_URL / SUPABASE_ANON_KEY를 확인하세요."
    );
  }

  const db =
    url && anonKey && window.supabase
      ? window.supabase.createClient(url, anonKey)
      : null;

  /** @type {Item[]} */
  let items = [];

  const form = document.getElementById("add-form");
  const input = document.getElementById("item-input");
  const listEl = document.getElementById("list");
  const emptyEl = document.getElementById("empty");
  const summaryEl = document.getElementById("summary");
  const clearCheckedBtn = document.getElementById("clear-checked");
  const template = document.getElementById("item-template");

  async function load() {
    if (!db) return;
    const { data, error } = await db
      .from(TABLE)
      .select("id, text, checked")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[shopping-list] load failed:", error);
      return;
    }
    items = (data || []).map((it) => ({
      id: String(it.id),
      text: it.text,
      checked: Boolean(it.checked),
    }));
    render();
  }

  async function addItem(text) {
    const trimmed = text.trim();
    if (!trimmed || !db) return;
    const { data, error } = await db
      .from(TABLE)
      .insert({ text: trimmed, checked: false })
      .select("id, text, checked")
      .single();
    if (error) {
      console.error("[shopping-list] add failed:", error);
      return;
    }
    items.push({
      id: String(data.id),
      text: data.text,
      checked: Boolean(data.checked),
    });
    render();
  }

  async function toggleItem(id) {
    const item = items.find((it) => it.id === id);
    if (!item || !db) return;
    const next = !item.checked;
    item.checked = next;
    render();
    const { error } = await db
      .from(TABLE)
      .update({ checked: next })
      .eq("id", id);
    if (error) {
      console.error("[shopping-list] toggle failed:", error);
      item.checked = !next;
      render();
    }
  }

  async function deleteItem(id) {
    if (!db) return;
    const prev = items;
    items = items.filter((it) => it.id !== id);
    render();
    const { error } = await db.from(TABLE).delete().eq("id", id);
    if (error) {
      console.error("[shopping-list] delete failed:", error);
      items = prev;
      render();
    }
  }

  async function clearChecked() {
    if (!db) return;
    const checkedIds = items.filter((it) => it.checked).map((it) => it.id);
    if (checkedIds.length === 0) return;
    const prev = items;
    items = items.filter((it) => !it.checked);
    render();
    const { error } = await db.from(TABLE).delete().in("id", checkedIds);
    if (error) {
      console.error("[shopping-list] clearChecked failed:", error);
      items = prev;
      render();
    }
  }

  function render() {
    listEl.textContent = "";

    for (const item of items) {
      const node = template.content.firstElementChild.cloneNode(true);
      node.dataset.id = item.id;
      node.classList.toggle("list__item--checked", item.checked);

      const checkbox = node.querySelector(".list__checkbox");
      checkbox.checked = item.checked;

      node.querySelector(".list__text").textContent = item.text;

      listEl.appendChild(node);
    }

    const total = items.length;
    const checked = items.filter((it) => it.checked).length;

    emptyEl.hidden = total > 0;
    summaryEl.textContent =
      total === 0 ? "항목 0개" : `항목 ${total}개 · 완료 ${checked}개`;
    clearCheckedBtn.hidden = checked === 0;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    addItem(input.value);
    input.value = "";
    input.focus();
  });

  listEl.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.classList.contains("list__checkbox")) return;
    const li = target.closest(".list__item");
    if (li) toggleItem(li.dataset.id);
  });

  listEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const deleteBtn = target.closest(".list__delete");
    if (!deleteBtn) return;
    const li = deleteBtn.closest(".list__item");
    if (li) deleteItem(li.dataset.id);
  });

  clearCheckedBtn.addEventListener("click", clearChecked);

  render();
  load();
})();
