const gallery = document.getElementById("gallery");

function esc(s){ return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

function addCard(title, contentNode) {
  const div = document.createElement("div");
  div.className = "pic";
  const h = document.createElement("div");
  h.innerHTML = `<b>${esc(title)}</b>`;
  div.appendChild(h);
  div.appendChild(contentNode);
  gallery.appendChild(div);
}

function clearGallery() {
  gallery.innerHTML = "";
}

async function handleFiles(files) {
  const arr = Array.from(files || []);
  for (const f of arr) {
    try {
      const reader = new FileReader();
      const data = await new Promise((resolve, reject) => {
        reader.onerror = () => reject(reader.error);
        reader.onload = () => resolve(reader.result);
        // images → DataURL, text → text
        if ((f.type || "").startsWith("image/")) reader.readAsDataURL(f);
        else reader.readAsText(f);
      });

      if ((f.type || "").startsWith("image/")) {
        const img = document.createElement("img");
        img.src = data;
        addCard(`${f.name} (${f.type}, ${f.size}B)`, img);
      } else {
        const pre = document.createElement("pre");
        pre.style.whiteSpace = "pre-wrap";
        pre.style.color = "var(--muted)";
        pre.textContent = String(data).slice(0, 6000);
        addCard(`${f.name} (${f.type || "text"}, ${f.size}B)`, pre);
      }
    } catch (e) {
      alert("Ошибка чтения файла: " + (e?.message || e));
    }
  }
}

document.getElementById("fileInput").addEventListener("change", (e) => handleFiles(e.target.files));
document.getElementById("clearBtn").addEventListener("click", clearGallery);

/* Drag & Drop */
const drop = document.getElementById("drop");
drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("hover"); });
drop.addEventListener("dragleave", () => drop.classList.remove("hover"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("hover");
  if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
});

/* Geolocation */
function geo() {
  const st = document.getElementById("geoStatus");
  if (!navigator.geolocation) {
    st.textContent = "Geolocation недоступно";
    return;
  }
  st.textContent = "определяем...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      document.getElementById("lat").value = pos.coords.latitude;
      document.getElementById("lng").value = pos.coords.longitude;
      st.textContent = "готово";
      alert("Геолокация получена");
    },
    (err) => {
      st.textContent = "ошибка";
      alert("Ошибка геолокации: " + (err.message || err));
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}
document.getElementById("geoBtn").addEventListener("click", geo);

/* Camera */
let stream = null;

async function camStart() {
  if (!navigator.mediaDevices?.getUserMedia) return alert("MediaDevices API недоступно.");
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    document.getElementById("video").srcObject = stream;
    alert("Камера включена");
  } catch (e) {
    alert("Ошибка камеры: " + (e?.message || e));
  }
}

function camStop() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
    document.getElementById("video").srcObject = null;
    alert("Камера выключена");
  }
}

function snap() {
  const v = document.getElementById("video");
  if (!v.srcObject) return alert("Сначала включите камеру.");
  const c = document.getElementById("photo");
  const ctx = c.getContext("2d");
  ctx.drawImage(v, 0, 0, c.width, c.height);
  alert("Фото сделано");
}

document.getElementById("camStart").addEventListener("click", camStart);
document.getElementById("camStop").addEventListener("click", camStop);
document.getElementById("snap").addEventListener("click", snap);
