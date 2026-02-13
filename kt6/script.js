/* ===== Fake API + Fetch ===== */
const API = "https://jsonplaceholder.typicode.com";

function esc(s){ return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

async function loadEndpoint() {
  const endpoint = document.getElementById("endpoint").value;
  const limit = Math.max(1, Math.min(50, Number(document.getElementById("limit").value || 10)));
  const errEl = document.getElementById("fetchError");
  const cardsEl = document.getElementById("cards");

  errEl.textContent = "";
  cardsEl.innerHTML = "";

  try {
    const res = await fetch(`${API}/${endpoint}?_limit=${limit}`, { headers: { "Accept": "application/json" }});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    for (const item of data) {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <h3>${esc(item.name ?? item.title ?? ("ID " + item.id))}</h3>
        <pre style="white-space:pre-wrap;margin:0;color:var(--muted)">${esc(JSON.stringify(item, null, 2))}</pre>
      `;
      cardsEl.appendChild(div);
    }
  } catch (e) {
    errEl.textContent = "Ошибка Fetch: " + (e?.message || e);
  }
}

document.getElementById("loadBtn").addEventListener("click", loadEndpoint);

/* ===== WebSocket Chat ===== */
let ws = null;

function setWsStatus(ok, text) {
  const dot = document.getElementById("wsDot");
  const st = document.getElementById("wsStatus");
  dot.classList.toggle("ok", ok);
  st.textContent = text;
}

function logWs(msg) {
  const el = document.getElementById("wsLog");
  const p = document.createElement("p");
  p.textContent = msg;
  el.appendChild(p);
  el.scrollTop = el.scrollHeight;
}

function wsConnect() {
  const url = document.getElementById("wsUrl").value.trim();
  if (!url) return alert("Введите WS URL");

  try {
    ws = new WebSocket(url);
  } catch (e) {
    setWsStatus(false, "error");
    logWs("Ошибка создания WebSocket: " + (e?.message || e));
    return;
  }

  setWsStatus(false, "connecting...");

  ws.onopen = () => {
    setWsStatus(true, "connected");
    logWs("connected");
  };
  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      logWs(`[${data.ts}] ${data.name}: ${data.text}`);
    } catch {
      logWs("message: " + ev.data);
    }
  };
  ws.onerror = () => {
    setWsStatus(false, "error");
    logWs("WebSocket error");
  };
  ws.onclose = () => {
    setWsStatus(false, "disconnected");
    logWs("disconnected");
    ws = null;
  };
}

function wsDisconnect() {
  if (ws) ws.close();
}

function wsSend() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return alert("WebSocket не подключен.");
  const name = document.getElementById("wsName").value.trim() || "User";
  const text = document.getElementById("wsMsg").value.trim();
  if (!text) return;

  ws.send(JSON.stringify({ name, text }));
  document.getElementById("wsMsg").value = "";
}

document.getElementById("wsConnect").addEventListener("click", wsConnect);
document.getElementById("wsDisconnect").addEventListener("click", wsDisconnect);
document.getElementById("wsSend").addEventListener("click", wsSend);

/* ===== SSE ===== */
let es = null;

function setSseStatus(ok, text) {
  const dot = document.getElementById("sseDot");
  const st = document.getElementById("sseStatus");
  dot.classList.toggle("ok", ok);
  st.textContent = text;
}

function logSse(msg) {
  const el = document.getElementById("sseLog");
  const p = document.createElement("p");
  p.textContent = msg;
  el.appendChild(p);
  el.scrollTop = el.scrollHeight;
}

function sseConnect() {
  const url = document.getElementById("sseUrl").value.trim();
  if (!url) return alert("Введите SSE URL");

  es = new EventSource(url);

  setSseStatus(false, "connecting...");

  es.onopen = () => setSseStatus(true, "connected");
  es.onerror = () => {
    setSseStatus(false, "error");
    logSse("SSE error (сервер недоступен?)");
  };
  es.addEventListener("post", (ev) => {
    try {
      const data = JSON.parse(ev.data);
      logSse(`[${data.ts}] new post: ${data.title}`);
    } catch {
      logSse("event: " + ev.data);
    }
  });
  es.addEventListener("heartbeat", (ev) => logSse("heartbeat"));
}

function sseDisconnect() {
  if (es) {
    es.close();
    es = null;
    setSseStatus(false, "disconnected");
    logSse("disconnected");
  }
}

document.getElementById("sseConnect").addEventListener("click", sseConnect);
document.getElementById("sseDisconnect").addEventListener("click", sseDisconnect);

/* Init */
window.onload = () => {
  loadEndpoint();
  setWsStatus(false, "disconnected");
  setSseStatus(false, "disconnected");
};
