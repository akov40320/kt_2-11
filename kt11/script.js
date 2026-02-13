/* ===== History navigation ===== */
const routePill = document.getElementById("routePill");

function setRoute(route) {
  history.pushState({ route }, "", "#" + route);
  routePill.textContent = route;
}

window.addEventListener("popstate", () => {
  const r = location.hash.replace(/^#/, "") || "/";
  routePill.textContent = r;
});

document.getElementById("goA").addEventListener("click", () => setRoute("/A"));
document.getElementById("goB").addEventListener("click", () => setRoute("/B"));
document.getElementById("backBtn").addEventListener("click", () => history.back());
document.getElementById("fwdBtn").addEventListener("click", () => history.forward());

/* ===== Canvas animation + interactions ===== */
const cv = document.getElementById("cv");
const ctx = cv.getContext("2d");

let anim = false;
const ball = { x: 120, y: 120, r: 16, vx: 5, vy: 3 };
const points = [];

cv.addEventListener("click", (e) => {
  const rect = cv.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (cv.width / rect.width);
  const y = (e.clientY - rect.top) * (cv.height / rect.height);
  points.push({ x, y });
});

document.getElementById("toggleAnim").addEventListener("click", () => anim = !anim);
document.getElementById("clear").addEventListener("click", () => { points.length = 0; ctx.clearRect(0,0,cv.width,cv.height); });

function frame() {
  ctx.clearRect(0, 0, cv.width, cv.height);

  // draw points
  ctx.fillStyle = "#e6e8ef";
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // animate ball
  if (anim) {
    ball.x += ball.vx;
    ball.y += ball.vy;
    if (ball.x - ball.r < 0 || ball.x + ball.r > cv.width) ball.vx *= -1;
    if (ball.y - ball.r < 0 || ball.y + ball.r > cv.height) ball.vy *= -1;
  }

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = "#6ea8fe";
  ctx.fill();

  ctx.fillStyle = "#9aa3b2";
  ctx.font = "14px system-ui";
  ctx.fillText("Клик: добавить точки. Анимация: requestAnimationFrame()", 12, 22);

  requestAnimationFrame(frame);
}
frame();

/* ===== Worker + Notifications ===== */
let worker = null;
const log = document.getElementById("log");
const status = document.getElementById("workerStatus");
let notifyOnDone = false;

function logLine(s) {
  const p = document.createElement("p");
  p.textContent = s;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

function setWorkerStatus(s) {
  status.textContent = s;
}

function startWorker() {
  if (worker) return;
  const n = Number(document.getElementById("n").value);
  if (!n || n < 10000) return alert("Введите N (например 200000).");

  worker = new Worker("worker.js");
  setWorkerStatus("running");
  logLine("start: N=" + n);

  worker.onmessage = (e) => {
    const msg = e.data || {};
    if (msg.type === "progress") {
      logLine(`progress: i=${msg.i}/${msg.N}, primes=${msg.count}`);
    } else if (msg.type === "done") {
      logLine(`done: primes до ${msg.N} = ${msg.count}, время ${msg.ms}ms`);
      setWorkerStatus("done");
      stopWorker(true);

      if (notifyOnDone && "Notification" in window && Notification.permission === "granted") {
        new Notification("КТ11: вычисление завершено", { body: `Простых до ${msg.N}: ${msg.count}` });
      }
    } else if (msg.type === "cancelled") {
      logLine("cancelled");
      setWorkerStatus("cancelled");
      stopWorker(false);
    }
  };

  worker.onerror = (err) => {
    logLine("worker error: " + (err.message || err));
    setWorkerStatus("error");
    stopWorker(false);
  };

  worker.postMessage({ type: "start", n });
}

function stopWorker(silent=false) {
  if (!worker) return;
  worker.terminate();
  worker = null;
  if (!silent) setWorkerStatus("idle");
}

document.getElementById("start").addEventListener("click", startWorker);
document.getElementById("stop").addEventListener("click", () => stopWorker(false));

document.getElementById("notify").addEventListener("click", async () => {
  if (!("Notification" in window)) return alert("Notifications API недоступно.");
  const perm = await Notification.requestPermission();
  if (perm === "granted") {
    notifyOnDone = true;
    alert("Уведомления разрешены. При завершении worker будет показано уведомление.");
  } else {
    notifyOnDone = false;
    alert("Уведомления не разрешены.");
  }
});

window.onload = () => {
  const r = location.hash.replace(/^#/, "") || "/";
  routePill.textContent = r;
  setWorkerStatus("idle");
};
