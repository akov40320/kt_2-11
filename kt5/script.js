/* ======= 1) Audio / Video ======= */
function fmtTime(sec) {
  if (!isFinite(sec)) return "0:00";
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function setupMedia(fileInputId, mediaId, playId, pauseId, volId, timeId) {
  const fileInput = document.getElementById(fileInputId);
  const media = document.getElementById(mediaId);
  const playBtn = document.getElementById(playId);
  const pauseBtn = document.getElementById(pauseId);
  const vol = document.getElementById(volId);
  const time = document.getElementById(timeId);

  media.volume = Number(vol.value);

  fileInput.addEventListener("change", () => {
    const f = fileInput.files?.[0];
    if (!f) return;
    media.src = URL.createObjectURL(f);
    media.load();
  });

  playBtn.addEventListener("click", () => media.play());
  pauseBtn.addEventListener("click", () => media.pause());
  vol.addEventListener("input", () => media.volume = Number(vol.value));

  const tick = () => {
    time.textContent = `${fmtTime(media.currentTime)} / ${fmtTime(media.duration)}`;
    requestAnimationFrame(tick);
  };
  tick();
}

/* ======= 2) Canvas Draw + Animation ======= */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let mode = "draw"; // draw | anim
let drawing = false;
let last = null;

const brushSizeEl = document.getElementById("brush");
const vxEl = document.getElementById("vx");
const vyEl = document.getElementById("vy");

const ball = { x: 120, y: 120, r: 18, vx: 6, vy: 3 };

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function setMode(newMode) {
  mode = newMode;
  document.getElementById("drawModeBtn").classList.toggle("primary", mode === "draw");
  document.getElementById("animModeBtn").classList.toggle("primary", mode === "anim");
}

canvas.addEventListener("mousedown", (e) => {
  if (mode !== "draw") return;
  drawing = true;
  last = { x: e.offsetX, y: e.offsetY };
});
canvas.addEventListener("mousemove", (e) => {
  if (mode !== "draw" || !drawing) return;
  const size = Number(brushSizeEl.value);
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#e6e8ef";

  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();

  last = { x: e.offsetX, y: e.offsetY };
});
window.addEventListener("mouseup", () => drawing = false);

function animFrame() {
  if (mode === "anim") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ball.vx = Number(vxEl.value);
    ball.vy = Number(vyEl.value);

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -1; vxEl.value = String(ball.vx); }
    if (ball.x + ball.r > canvas.width) { ball.x = canvas.width - ball.r; ball.vx *= -1; vxEl.value = String(ball.vx); }
    if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy *= -1; vyEl.value = String(ball.vy); }
    if (ball.y + ball.r > canvas.height) { ball.y = canvas.height - ball.r; ball.vy *= -1; vyEl.value = String(ball.vy); }

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "#6ea8fe";
    ctx.fill();

    ctx.fillStyle = "#9aa3b2";
    ctx.font = "14px system-ui";
    ctx.fillText("requestAnimationFrame() анимация", 12, 22);
  }
  requestAnimationFrame(animFrame);
}

/* ======= 3) Image upload + Canvas filters ======= */
const imgFile = document.getElementById("imgFile");
const origImg = document.getElementById("origImg");
const origHint = document.getElementById("origHint");
const imgCanvas = document.getElementById("imgCanvas");
const ictx = imgCanvas.getContext("2d");

let currentBitmap = null; // ImageBitmap for processing

function drawBitmapToCanvas(bmp, targetW=null, targetH=null) {
  const w = targetW ?? bmp.width;
  const h = targetH ?? Math.round((bmp.height / bmp.width) * w);

  imgCanvas.width = w;
  imgCanvas.height = h;

  ictx.clearRect(0,0,w,h);

  const filter = document.getElementById("filter").value;
  const brightness = Number(document.getElementById("brightness").value);
  let cssFilter = `brightness(${brightness})`;
  if (filter === "grayscale") cssFilter += " grayscale(1)";
  if (filter === "sepia") cssFilter += " sepia(1)";
  if (filter === "invert") cssFilter += " invert(1)";

  ictx.filter = cssFilter;
  ictx.drawImage(bmp, 0, 0, w, h);
  ictx.filter = "none";
}

imgFile.addEventListener("change", async () => {
  const f = imgFile.files?.[0];
  if (!f) return;
  origHint.style.display = "none";
  origImg.style.display = "block";
  origImg.src = URL.createObjectURL(f);

  currentBitmap = await createImageBitmap(f);
  document.getElementById("resizeW").value = String(Math.min(800, currentBitmap.width));
  drawBitmapToCanvas(currentBitmap, Number(document.getElementById("resizeW").value));
});

document.getElementById("applyBtn").addEventListener("click", () => {
  if (!currentBitmap) return alert("Сначала загрузите изображение.");
  const w = Number(document.getElementById("resizeW").value);
  if (!w || w < 50) return alert("Некорректная ширина.");
  drawBitmapToCanvas(currentBitmap, w);
});

document.getElementById("cropBtn").addEventListener("click", async () => {
  if (!currentBitmap) return alert("Сначала загрузите изображение.");

  // центр-кроп до квадрата
  const size = Math.min(currentBitmap.width, currentBitmap.height);
  const sx = Math.floor((currentBitmap.width - size) / 2);
  const sy = Math.floor((currentBitmap.height - size) / 2);

  const tmp = document.createElement("canvas");
  tmp.width = size;
  tmp.height = size;
  tmp.getContext("2d").drawImage(currentBitmap, sx, sy, size, size, 0, 0, size, size);

  currentBitmap = await createImageBitmap(tmp);
  document.getElementById("resizeW").value = String(Math.min(600, size));
  drawBitmapToCanvas(currentBitmap, Number(document.getElementById("resizeW").value));
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = "result.png";
  a.href = imgCanvas.toDataURL("image/png");
  a.click();
});

/* ======= Init ======= */
window.onload = () => {
  setupMedia("audioFile", "audio", "aPlay", "aPause", "aVol", "aTime");
  setupMedia("videoFile", "video", "vPlay", "vPause", "vVol", "vTime");

  document.getElementById("drawModeBtn").addEventListener("click", () => setMode("draw"));
  document.getElementById("animModeBtn").addEventListener("click", () => setMode("anim"));
  document.getElementById("clearCanvasBtn").addEventListener("click", clearCanvas);

  setMode("draw");
  animFrame();
};
