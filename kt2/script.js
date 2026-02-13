/**
 * КТ2. Требования:
 * - updateTable(): очистить tbody, считать данные из currentStorage, если пусто — показать emptyHeader,
 *   иначе заполнить таблицу; в "Удалить" — span 'X' с onclick deleteItem(key)
 * - updateTable как обработчик onload окна
 * - getStorage(): выбрать текущее хранилище, записать в currentStorage, вызвать updateTable()
 * - saveItem(): получить key/value, добавить запись, updateTable()
 * - clearStorage(): confirm, при да — очистить, updateTable()
 */

let currentStorage = localStorage;

const emptyHeader = `<tr><td class="empty" colspan="3">Хранилище пустое</td></tr>`;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
}

function updateTable() {
  const tbody = document.getElementById("tbody");
  // 1) очищает таблицу (удаляет все tr в tbody)
  tbody.innerHTML = "";

  // 2) зачитывает данные из текущего хранилища
  const keys = [];
  for (let i = 0; i < currentStorage.length; i++) {
    keys.push(currentStorage.key(i));
  }
  keys.sort((a,b) => a.localeCompare(b));

  // 3) если данных нет, создаёт tr с emptyHeader
  if (keys.length === 0) {
    tbody.innerHTML = emptyHeader;
    return;
  }

  // 4) если есть, в цикле заполняет таблицу данными
  for (const k of keys) {
    const v = currentStorage.getItem(k);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="key">${escapeHtml(k)}</td>
      <td class="value">${escapeHtml(v)}</td>
      <td>
        <span class="deleteX" title="Удалить">X</span>
      </td>
    `;

    // 5) в колонку "Удалить" вставить span с текстом 'X' и onclick deleteItem(key)
    tr.querySelector(".deleteX").onclick = () => deleteItem(k);

    tbody.appendChild(tr);
  }
}

function getStorage() {
  const mode = document.getElementById("storageSelect").value;
  // выбирает текущее хранилище
  currentStorage = (mode === "session") ? sessionStorage : localStorage;
  // записывает результат в currentStorage + вызывает updateTable()
  updateTable();
}

function saveItem() {
  const key = document.getElementById("keyInput").value.trim();
  const value = document.getElementById("valueInput").value;

  if (!key) {
    alert("Введите ключ.");
    return;
  }

  // добавляет новую запись в хранилище
  currentStorage.setItem(key, value);

  // вызывает updateTable()
  updateTable();
}

function deleteItem(key) {
  currentStorage.removeItem(key);
  updateTable();
}

function clearStorage() {
  const ok = confirm("Вы уверены, что хотите полностью очистить локальное хранилище?");
  if (!ok) return;
  currentStorage.clear();
  updateTable();
}

window.onload = () => {
  // обработчик onload
  document.getElementById("storageSelect").addEventListener("change", getStorage);
  document.getElementById("saveBtn").addEventListener("click", saveItem);
  document.getElementById("clearBtn").addEventListener("click", clearStorage);
  getStorage();
};
