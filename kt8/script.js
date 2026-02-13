/**
 * КТ8:
 * - 3 колонки, карточки задач
 * - Drag&Drop между колонками
 * - подсветка колонки при hover (dragover)
 * - фиксация в новой колонке
 * - создание новых задач
 * - сохранение состояния в localStorage
 */
const LS_KEY = "kt8_board_v1";

function loadState() {
  return JSON.parse(localStorage.getItem(LS_KEY) || "null") || {
    todo: [],
    progress: [],
    done: []
  };
}

function saveState(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

let state = loadState();

function createTask(text) {
  return { id: crypto.randomUUID(), text, ts: Date.now() };
}

function counts() {
  document.getElementById("cTodo").textContent = String(state.todo.length);
  document.getElementById("cProg").textContent = String(state.progress.length);
  document.getElementById("cDone").textContent = String(state.done.length);
}

function render() {
  document.querySelectorAll(".dropzone").forEach(z => z.innerHTML = "");
  for (const col of ["todo","progress","done"]) {
    const zone = document.querySelector(`.dropzone[data-col="${col}"]`);
    for (const t of state[col]) {
      const card = document.createElement("div");
      card.className = "cardTask";
      card.draggable = true;
      card.dataset.id = t.id;
      card.dataset.col = col;
      card.innerHTML = `
        <div>${t.text.replace(/</g,"&lt;")}</div>
        <div class="taskRow">
          <small>${new Date(t.ts).toLocaleString()}</small>
          <span class="action bad" style="margin-left:auto">Удалить</span>
        </div>
      `;
      card.querySelector(".action.bad").onclick = () => removeTask(t.id);
      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ id: t.id, from: col }));
      });
      zone.appendChild(card);
    }
  }
  counts();
  saveState(state);
}

function removeTask(id) {
  for (const col of ["todo","progress","done"]) {
    state[col] = state[col].filter(t => t.id !== id);
  }
  render();
}

function addTask() {
  const inp = document.getElementById("taskText");
  const text = inp.value.trim();
  if (!text) return alert("Введите текст задачи.");
  state.todo.push(createTask(text));
  inp.value = "";
  render();
}

function resetAll() {
  if (!confirm("Сбросить все задачи?")) return;
  state = { todo: [], progress: [], done: [] };
  saveState(state);
  render();
}

function setupDnD() {
  document.querySelectorAll(".dropzone").forEach(zone => {
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("hover");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("hover"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("hover");

      let payload = null;
      try { payload = JSON.parse(e.dataTransfer.getData("text/plain")); } catch {}
      if (!payload?.id || !payload?.from) return;

      const to = zone.dataset.col;
      if (!to || to === payload.from) return;

      const fromList = state[payload.from];
      const idx = fromList.findIndex(t => t.id === payload.id);
      if (idx === -1) return;

      const [task] = fromList.splice(idx, 1);
      state[to].push(task);
      render();
    });
  });
}

window.onload = () => {
  document.getElementById("addBtn").addEventListener("click", addTask);
  document.getElementById("resetBtn").addEventListener("click", resetAll);
  setupDnD();
  render();
};
