(() => {
  "use strict";

  const STORAGE_KEY = "shopping-list.items";

  /** @typedef {{ id: string, text: string, checked: boolean }} Item */

  /** @type {Item[]} */
  let items = load();

  const form = document.getElementById("add-form");
  const input = document.getElementById("item-input");
  const listEl = document.getElementById("list");
  const emptyEl = document.getElementById("empty");
  const summaryEl = document.getElementById("summary");
  const clearCheckedBtn = document.getElementById("clear-checked");
  const template = document.getElementById("item-template");

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((it) => it && typeof it.text === "string")
        .map((it) => ({
          id: typeof it.id === "string" ? it.id : createId(),
          text: it.text,
          checked: Boolean(it.checked),
        }));
    } catch (err) {
      console.warn("[shopping-list] load failed:", err);
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn("[shopping-list] save failed:", err);
    }
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function addItem(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    items.push({ id: createId(), text: trimmed, checked: false });
    save();
    render();
  }

  function toggleItem(id) {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    item.checked = !item.checked;
    save();
    render();
  }

  function deleteItem(id) {
    items = items.filter((it) => it.id !== id);
    save();
    render();
  }

  function clearChecked() {
    items = items.filter((it) => !it.checked);
    save();
    render();
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
})();
