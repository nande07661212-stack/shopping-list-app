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

  /** 현재 인라인 수정 중인 항목 id (없으면 null) */
  let editingId = null;

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

  async function editItem(id, text) {
    const item = items.find((it) => it.id === id);
    if (!item) {
      render();
      return;
    }
    const trimmed = text.trim();
    if (!trimmed || trimmed === item.text || !db) {
      render();
      return;
    }
    const prevText = item.text;
    item.text = trimmed;
    render();
    const { error } = await db.from(TABLE).update({ text: trimmed }).eq("id", id);
    if (error) {
      console.error("[shopping-list] edit failed:", error);
      item.text = prevText;
      render();
    }
  }

  /** 수정 모드 진입 */
  function startEdit(id) {
    if (editingId === id) return;
    editingId = id;
    render();
  }

  /** 입력값을 저장하고 수정 모드 종료 */
  function commitEdit(inputEl) {
    const li = inputEl.closest(".list__item");
    if (!li || editingId !== li.dataset.id) return;
    const id = editingId;
    editingId = null;
    editItem(id, inputEl.value);
  }

  /** 저장하지 않고 수정 모드 종료 */
  function cancelEdit() {
    if (editingId === null) return;
    editingId = null;
    render();
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

      if (item.id === editingId) {
        node.classList.add("list__item--editing");
        const editInput = document.createElement("input");
        editInput.className = "list__edit-input";
        editInput.type = "text";
        editInput.maxLength = 80;
        editInput.value = item.text;
        editInput.setAttribute("aria-label", "항목 수정");
        node.querySelector(".list__label").replaceWith(editInput);
      }

      listEl.appendChild(node);
    }

    if (editingId !== null) {
      const activeInput = listEl.querySelector(".list__edit-input");
      if (activeInput) {
        activeInput.focus();
        const end = activeInput.value.length;
        activeInput.setSelectionRange(end, end);
      }
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

    const editBtn = target.closest(".list__edit");
    if (editBtn) {
      const li = editBtn.closest(".list__item");
      if (li) startEdit(li.dataset.id);
      return;
    }

    const deleteBtn = target.closest(".list__delete");
    if (!deleteBtn) return;
    const li = deleteBtn.closest(".list__item");
    if (li) deleteItem(li.dataset.id);
  });

  listEl.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.classList.contains("list__edit-input")) return;
    if (event.key === "Enter") {
      event.preventDefault();
      target.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
    }
  });

  listEl.addEventListener("focusout", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.classList.contains("list__edit-input")) return;
    commitEdit(target);
  });

  clearCheckedBtn.addEventListener("click", clearChecked);

  render();
  load();
})();
