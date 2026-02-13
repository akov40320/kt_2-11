/**
 * КТ7:
 * 1) поле для сброса файлов
 * 2) input для выбора файлов
 * 3) отображение полученных файлов (имя, тип, вес)
 * 4) сохранить все файлы в localStorage
 * 5) фильтрация по размеру и типу
 */

const LS_KEY = "kt7_files_v1";
const listEl = document.getElementById("list");

function loadFiles() {
  return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
}

function saveFiles(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

function fmtBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb/1024).toFixed(1)} MB`;
}

function openModal(title, bodyNode) {
  document.getElementById("modalTitle").textContent = title;
  const body = document.getElementById("modalBody");
  body.innerHTML = "";
  body.appendChild(bodyNode);
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
});

function matchesFilters(file, typeSub, maxSize) {
  if (typeSub && !String(file.type || "").includes(typeSub)) return false;
  if (Number.isFinite(maxSize) && maxSize >= 0 && Number(file.size) > maxSize) return false;
  return true;
}

function render() {
  const typeSub = document.getElementById("typeFilter").value.trim();
  const sizeVal = document.getElementById("sizeFilter").value;
  const maxSize = sizeVal === "" ? null : Number(sizeVal);

  const files = loadFiles();
  listEl.innerHTML = "";

  const filtered = files.filter(f => matchesFilters(f, typeSub, maxSize));

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="fileItem"><div class="meta">Нет файлов (или фильтр всё скрыл).</div></div>`;
    return;
  }

  for (const f of filtered.slice().reverse()) {
    const div = document.createElement("div");
    div.className = "fileItem";

    const viewBtn = document.createElement("span");
    viewBtn.className = "action";
    viewBtn.textContent = "Просмотреть";

    viewBtn.onclick = () => {
      // images: show <img>, text: show <pre>, others: open new tab
      if ((f.type || "").startsWith("image/")) {
        const wrap = document.createElement("div");
        wrap.className = "preview";
        const img = document.createElement("img");
        img.src = f.dataUrl;
        wrap.appendChild(img);
        openModal(f.name, wrap);
      } else if ((f.type || "").startsWith("text/") || f.name.endsWith(".json") || f.name.endsWith(".md")) {
        const pre = document.createElement("pre");
        pre.textContent = f.textContent || "(текст не сохранён)";
        openModal(f.name, pre);
      } else {
        // fallback: open in new tab
        const w = window.open();
        if (w) {
          w.document.write(`<iframe src="${f.dataUrl}" style="width:100%;height:100%;border:0"></iframe>`);
        } else {
          alert("Браузер заблокировал новое окно.");
        }
      }
    };

    const delBtn = document.createElement("span");
    delBtn.className = "action bad";
    delBtn.textContent = "Удалить";
    delBtn.onclick = () => deleteOne(f.id);

    div.innerHTML = `
      <b>${f.name}</b>
      <div class="meta">${f.type || "unknown"} · ${fmtBytes(f.size)} · ${new Date(f.lastModified).toLocaleString()}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "row";
    actions.appendChild(viewBtn);
    actions.appendChild(delBtn);

    div.appendChild(actions);
    listEl.appendChild(div);
  }
}

function deleteOne(id) {
  const arr = loadFiles().filter(x => x.id !== id);
  saveFiles(arr);
  render();
}

async function fileToStoredObject(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

  let textContent = null;
  const looksText = (file.type || "").startsWith("text/") || file.name.endsWith(".json") || file.name.endsWith(".md");
  if (looksText) {
    try {
      textContent = await file.text();
    } catch { /* ignore */ }
  }

  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    dataUrl,
    textContent
  };
}

async function handleFiles(fileList) {
  const incoming = Array.from(fileList || []);
  if (incoming.length === 0) return;

  const arr = loadFiles();

  for (const f of incoming) {
    try {
      const stored = await fileToStoredObject(f);
      arr.push(stored);
    } catch (e) {
      alert("Ошибка чтения файла: " + (e?.message || e));
    }
  }

  try {
    saveFiles(arr);
  } catch (e) {
    alert("Не удалось сохранить в localStorage (скорее всего, превышен лимит).");
    console.error(e);
  }
  render();
}

function resetFiles() {
  if (!confirm("Сбросить (удалить) все сохранённые файлы?")) return;
  localStorage.removeItem(LS_KEY);
  document.getElementById("fileInput").value = "";
  render();
}

document.getElementById("fileInput").addEventListener("change", (e) => handleFiles(e.target.files));
document.getElementById("resetBtn").addEventListener("click", resetFiles);
document.getElementById("applyFilterBtn").addEventListener("click", render);

window.onload = render;
