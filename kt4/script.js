/**
 * КТ4: Геолокация + LocalStorage + IndexedDB
 */
const LS_KEY = "kt4_geo_comments";

let lastGeo = null;

function setGeoStatus(text, ok=false) {
  const el = document.getElementById("geoStatus");
  el.textContent = text;
  el.classList.toggle("ok", ok);
  el.classList.toggle("bad", !ok && text !== "нет данных");
}

function formatTs(ts) {
  return new Date(ts).toLocaleString();
}

function renderLocalStorage() {
  const el = document.getElementById("lsList");
  el.innerHTML = "";
  const arr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  if (arr.length === 0) {
    el.innerHTML = `<div class="item"><p>Нет сохранённых записей.</p></div>`;
    return;
  }
  for (const it of arr.slice().reverse()) {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${formatTs(it.ts)}</h3>
      <div class="kv">
        <span class="pill">lat: ${it.lat.toFixed(6)}</span>
        <span class="pill">lng: ${it.lng.toFixed(6)}</span>
      </div>
      <p>${(it.text || "").replace(/</g,"&lt;")}</p>
    `;
    el.appendChild(div);
  }
}

const dbName = "kt4_db";
const storeName = "comments";
let db = null;

function openDb() {
  const req = indexedDB.open(dbName, 1);
  req.onupgradeneeded = () => {
    const _db = req.result;
    if (!_db.objectStoreNames.contains(storeName)) {
      _db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
    }
  };
  req.onsuccess = () => {
    db = req.result;
    renderIndexedDb();
  };
  req.onerror = () => console.error(req.error);
}

function dbStore(mode="readonly") {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function renderIndexedDb() {
  const el = document.getElementById("dbList");
  el.innerHTML = "";
  if (!db) return;

  const req = dbStore("readonly").getAll();
  req.onsuccess = () => {
    const rows = req.result || [];
    if (rows.length === 0) {
      el.innerHTML = `<div class="item"><p>Нет сохранённых записей.</p></div>`;
      return;
    }
    for (const it of rows.slice().reverse()) {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <h3>${formatTs(it.ts)}</h3>
        <div class="kv">
          <span class="pill">lat: ${Number(it.lat).toFixed(6)}</span>
          <span class="pill">lng: ${Number(it.lng).toFixed(6)}</span>
        </div>
        <p>${(it.text || "").replace(/</g,"&lt;")}</p>
      `;
      el.appendChild(div);
    }
  };
  req.onerror = () => console.error(req.error);
}

function getGeo() {
  if (!("geolocation" in navigator)) {
    setGeoStatus("Geolocation API недоступно", false);
    return;
  }

  setGeoStatus("определяем...", true);

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      lastGeo = { lat: latitude, lng: longitude, acc: accuracy };
      document.getElementById("lat").value = latitude;
      document.getElementById("lng").value = longitude;
      document.getElementById("acc").value = accuracy;
      setGeoStatus("готово", true);
    },
    (err) => {
      setGeoStatus(err.message || "ошибка", false);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function ensureGeo() {
  if (!lastGeo) {
    alert("Сначала определите местоположение.");
    return false;
  }
  return true;
}

function saveToLocalStorage() {
  if (!ensureGeo()) return;
  const text = document.getElementById("comment").value.trim();
  if (!text) return alert("Введите комментарий.");

  const arr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  arr.push({ ts: Date.now(), text, ...lastGeo });
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
  alert("Сохранено в LocalStorage");
  renderLocalStorage();
}

function saveToIndexedDb() {
  if (!ensureGeo()) return;
  if (!db) return alert("IndexedDB ещё не готов.");

  const text = document.getElementById("comment").value.trim();
  if (!text) return alert("Введите комментарий.");

  const req = dbStore("readwrite").add({ ts: Date.now(), text, ...lastGeo });
  req.onsuccess = () => {
    alert("Сохранено в IndexedDB");
    renderIndexedDb();
  };
  req.onerror = () => alert("Ошибка IndexedDB: " + (req.error?.message || req.error));
}

function clearLocalStorage() {
  if (!confirm("Очистить LocalStorage записи КТ4?")) return;
  localStorage.removeItem(LS_KEY);
  renderLocalStorage();
}

function clearIndexedDb() {
  if (!db) return;
  if (!confirm("Очистить IndexedDB записи КТ4?")) return;
  const req = dbStore("readwrite").clear();
  req.onsuccess = () => renderIndexedDb();
  req.onerror = () => alert("Ошибка IndexedDB: " + (req.error?.message || req.error));
}

window.onload = () => {
  document.getElementById("geoBtn").addEventListener("click", getGeo);
  document.getElementById("saveLsBtn").addEventListener("click", saveToLocalStorage);
  document.getElementById("saveDbBtn").addEventListener("click", saveToIndexedDb);
  document.getElementById("clearLsBtn").addEventListener("click", clearLocalStorage);
  document.getElementById("clearDbBtn").addEventListener("click", clearIndexedDb);

  renderLocalStorage();
  openDb();
};
