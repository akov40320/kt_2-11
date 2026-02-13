/**
 * КТ3. IndexedDB CRUD.
 * - open + onupgradeneeded: создать objectStore tableName если нет
 * - onsuccess: db = result
 * - onerror: вывести ошибку
 * - updateTable(): перерисовать таблицу, вывести все записи
 * - saveItem(): взять ввод и записать в БД
 * - updateItem(key): обновить запись
 * - deleteItem(key): удалить запись
 * - alert по успешным операциям
 */

const dbName = "kt3_db";
const tableName = "items";
const dbVersion = 1;

let db = null;

function openDb() {
  const request = indexedDB.open(dbName, dbVersion);

  request.onupgradeneeded = (event) => {
    const _db = request.result;
    // создать таблицу(tableName), если не существует
    if (!_db.objectStoreNames.contains(tableName)) {
      _db.createObjectStore(tableName, { keyPath: "key" });
    }
  };

  request.onsuccess = () => {
    db = request.result;
    updateTable();
  };

  request.onerror = () => {
    console.error("IndexedDB error:", request.error);
  };
}

function txStore(mode = "readonly") {
  const tx = db.transaction(tableName, mode);
  return tx.objectStore(tableName);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
}

function updateTable() {
  if (!db) return;

  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";

  const store = txStore("readonly");
  const req = store.getAll();

  req.onsuccess = () => {
    const rows = req.result || [];
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="color:var(--muted);text-align:center">База пустая</td></tr>`;
      return;
    }

    rows.sort((a,b) => String(a.key).localeCompare(String(b.key)));

    for (const item of rows) {
      const tr = document.createElement("tr");
      tr.dataset.key = item.key;

      tr.innerHTML = `
        <td>${escapeHtml(item.key)}</td>
        <td class="val" contenteditable="true">${escapeHtml(item.value ?? "")}</td>
        <td><span class="action" onclick='updateItem(${JSON.stringify(item.key)})'>Изменить</span></td>
        <td><span class="action" onclick='deleteItem(${JSON.stringify(item.key)})'>Удалить</span></td>
      `;

      tbody.appendChild(tr);
    }
  };

  req.onerror = () => console.error("getAll error:", req.error);
}

function saveItem() {
  const key = document.getElementById("keyInput").value.trim();
  const value = document.getElementById("valueInput").value;

  if (!key) return alert("Введите ключ.");

  const store = txStore("readwrite");
  const req = store.put({ key, value });

  req.onsuccess = () => {
    alert("Запись успешно добавлена");
    updateTable();
  };
  req.onerror = () => alert("Ошибка при добавлении записи: " + (req.error?.message || req.error));
}

function updateItem(key) {
  const tr = document.querySelector(`tr[data-key="${CSS.escape(String(key))}"]`);
  if (!tr) return;

  const valueCell = tr.querySelector(".val");
  const newValue = valueCell ? valueCell.textContent : "";

  const store = txStore("readwrite");
  const req = store.put({ key, value: newValue });

  req.onsuccess = () => {
    alert("Запись успешно изменена");
    updateTable();
  };
  req.onerror = () => alert("Ошибка при изменении записи: " + (req.error?.message || req.error));
}

function deleteItem(key) {
  const store = txStore("readwrite");
  const req = store.delete(key);

  req.onsuccess = () => {
    alert("Запись успешно удалена");
    updateTable();
  };
  req.onerror = () => alert("Ошибка при удалении записи: " + (req.error?.message || req.error));
}

function clearAll() {
  if (!confirm("Удалить все записи из IndexedDB?")) return;
  const store = txStore("readwrite");
  const req = store.clear();
  req.onsuccess = () => {
    alert("База очищена");
    updateTable();
  };
  req.onerror = () => alert("Ошибка при очистке: " + (req.error?.message || req.error));
}

window.onload = () => {
  document.getElementById("saveBtn").addEventListener("click", saveItem);
  document.getElementById("clearBtn").addEventListener("click", clearAll);
  openDb();
};
