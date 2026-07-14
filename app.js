// ── State ──────────────────────────────────────────────
let currentFile = null;
let originalWidth = 0;
let originalHeight = 0;
const API_URL = "http://127.0.0.1:8000/detect";

// ── Map Setup ──────────────────────────────────────────
const map = L.map("map").setView([4.88, 6.03], 8);
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution: "© OpenStreetMap © CARTO",
  maxZoom: 18,
}).addTo(map);

let currentMarker = null;

// ── Drop Zone ──────────────────────────────────────────
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});
fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

function handleFile(file) {
  currentFile = file;
  document.getElementById("file-name").textContent = `📎 ${file.name}`;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      originalWidth = img.naturalWidth;
      originalHeight = img.naturalHeight;
      drawImageOnly(img);
      // Auto-trigger analysis immediately after image loads
      autoAnalyze();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function autoAnalyze() {
  if (!currentFile) return;

  // Show scanning progress bar
  showScanProgress();

  try {
    const formData = new FormData();
    formData.append("file", currentFile);

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const data = await response.json();

    // Complete the progress bar then show results
    completeScanProgress(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          drawImageOnly(img);
          if (data.detections.length > 0) drawBoundingBoxes(data.detections);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(currentFile);

      updateStats(data);
      showAlertPanel(data);
      plotMarker(data.status);
    });

  } catch (err) {
    alert(`Detection failed: ${err.message}`);
    console.error(err);
  }
}

let progressInterval = null;
let progressValue = 0;

function showScanProgress() {
  // Create progress bar if it doesn't exist
  let bar = document.getElementById("scan-progress");
  if (!bar) {
    const container = document.getElementById("progress-container");
    container.innerHTML = `
      <div class="w-full bg-slate-700 rounded-full h-2 mt-2">
        <div id="scan-bar" class="bg-emerald-400 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
      </div>
      <p id="scan-label" class="text-xs text-emerald-400 mt-1 text-center">Scanning... 0%</p>
    `;
  }

  progressValue = 0;
  progressInterval = setInterval(() => {
    // Simulate progress up to 85% while waiting for API
    if (progressValue < 85) {
      progressValue += Math.random() * 8;
      progressValue = Math.min(progressValue, 85);
      updateProgressBar(progressValue);
    }
  }, 200);
}

function completeScanProgress(callback) {
  clearInterval(progressInterval);
  progressValue = 100;
  updateProgressBar(100);
  document.getElementById("scan-label").textContent = "Analysis complete ✓";
  setTimeout(callback, 500);
}

function updateProgressBar(value) {
  const bar = document.getElementById("scan-bar");
  const label = document.getElementById("scan-label");
  if (bar) bar.style.width = `${value}%`;
  if (label && value < 100) label.textContent = `Scanning... ${Math.round(value)}%`;
}



// ── Canvas Drawing ─────────────────────────────────────
function drawImageOnly(img) {
  const canvas = document.getElementById("image-canvas");
  const placeholder = document.getElementById("canvas-placeholder");
  placeholder.style.display = "none";

  canvas.width = canvas.offsetWidth || 600;
  const ratio = canvas.width / img.naturalWidth;
  canvas.height = img.naturalHeight * ratio;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

function drawBoundingBoxes(detections) {
  const canvas = document.getElementById("image-canvas");
  const ctx = canvas.getContext("2d");

  const scaleX = canvas.width / originalWidth;
  const scaleY = canvas.height / originalHeight;

  detections.forEach((det) => {
    const [xmin, ymin, xmax, ymax] = det.bbox;
    const x = xmin * scaleX;
    const y = ymin * scaleY;
    const w = (xmax - xmin) * scaleX;
    const h = (ymax - ymin) * scaleY;

    // Box
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    // Label background
    const label = `Oil Spill ${(det.confidence * 100).toFixed(1)}%`;
    ctx.font = "bold 13px monospace";
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(x, y - 22, textWidth + 10, 22);

    // Label text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + 5, y - 6);
  });
}

// ── Map Marker ─────────────────────────────────────────
function plotMarker(status) {
  if (currentMarker) map.removeLayer(currentMarker);

  // Randomize slightly around Niger Delta center for realism
  const lat = 4.88 + (Math.random() - 0.5) * 0.8;
  const lng = 6.03 + (Math.random() - 0.5) * 0.8;

  const color = status === "Alert" ? "#f43f5e" : "#10b981";
  const icon = L.divIcon({
    className: "",
    html: `<div style="
      width:16px;height:16px;
      background:${color};
      border-radius:50%;
      border:2px solid white;
      box-shadow:0 0 8px ${color}
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  const popupText = status === "Alert"
    ? `⚠️ Oil spill detected<br>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
    : `✅ Area clear<br>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;

  currentMarker = L.marker([lat, lng], { icon })
    .addTo(map)
    .bindPopup(popupText)
    .openPopup();

  map.setView([lat, lng], 10);
}

// ── UI State ───────────────────────────────────────────
function setLoading(loading) {
  const btn = document.getElementById("analyze-btn");
  btn.disabled = loading;
  btn.textContent = loading ? "Scanning Telemetry..." : "Analyze Drone Feed";
  if (loading) btn.classList.add("scanning");
  else btn.classList.remove("scanning");
}

function updateStats(data) {
  const statusEl = document.getElementById("stat-status");
  statusEl.textContent = data.status;
  statusEl.className = data.status === "Alert"
    ? "text-lg font-bold text-rose-400 mt-1"
    : "text-lg font-bold text-emerald-400 mt-1";

  document.getElementById("stat-count").textContent = data.detection_count;
  document.getElementById("stat-confidence").textContent =
    data.highest_confidence > 0 ? `${data.highest_confidence}%` : "—";
}

function showAlertPanel(data) {
  const panel = document.getElementById("alert-panel");
  const content = document.getElementById("alert-content");
  panel.classList.remove("hidden");

  const borderColor = data.status === "Alert" ? "border-rose-500" : "border-emerald-500";
  panel.className = `bg-slate-800 border ${borderColor} rounded-xl p-5`;

  content.innerHTML = `
    <p><span class="text-slate-400">Status:</span> 
      <span class="${data.status === "Alert" ? "text-rose-400" : "text-emerald-400"} font-bold">
        ${data.status}
      </span>
    </p>
    <p><span class="text-slate-400">Detections:</span> ${data.detection_count}</p>
    <p><span class="text-slate-400">Highest confidence:</span> ${data.highest_confidence}%</p>
    <p><span class="text-slate-400">Timestamp:</span> ${new Date(data.timestamp).toLocaleString()}</p>
  `;
}

// ── Main Analysis Function ─────────────────────────────
async function analyzeImage() {
  if (!currentFile) {
    alert("Please upload a drone image first.");
    return;
  }

  setLoading(true);

  try {
    const formData = new FormData();
    formData.append("file", currentFile);

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const data = await response.json();

    // Redraw image then overlay boxes
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        drawImageOnly(img);
        if (data.detections.length > 0) drawBoundingBoxes(data.detections);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(currentFile);

    updateStats(data);
    showAlertPanel(data);
    plotMarker(data.status);

  } catch (err) {
    alert(`Detection failed: ${err.message}`);
    console.error(err);
  } finally {
    setLoading(false);
  }
}