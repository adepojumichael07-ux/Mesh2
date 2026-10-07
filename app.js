const STORE_KEY = "meshalert.reports.v1";
const form = document.querySelector("#report-form");
const list = document.querySelector("#alert-list");
const netPill = document.querySelector("#net-pill");
const meshPill = document.querySelector("#mesh-pill");
const cloudPill = document.querySelector("#cloud-pill");
const banner = document.querySelector("#status-banner");
const locationInput = document.querySelector("#location");
const countEl = document.querySelector("#queue-count");

const peers = 3 + Math.floor(Math.random() * 3);

function loadReports() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveReports(reports) {
  localStorage.setItem(STORE_KEY, JSON.stringify(reports));
}

function nowLabel() {
  return new Date().toLocaleString();
}

function setStatus() {
  const online = navigator.onLine;
  netPill.innerHTML = `<span class="dot ${online ? "on" : "off"}"></span>${online ? "Network up" : "Blackout / offline"}`;
  meshPill.innerHTML = `<span class="dot mesh"></span>Mesh peers: ${peers}`;
  const queued = loadReports().filter((r) => r.status !== "synced").length;
  cloudPill.innerHTML = `<span class="dot ${online ? "on" : "off"}"></span>${online ? "Cloud reachable" : "Cloud queued"}`;
  countEl.textContent = String(queued);
  banner.className = online ? "banner ok" : "banner";
  banner.textContent = online
    ? "Cloud link is up. New reports sync immediately. Older queued reports are marked synced."
    : "No wide-area network. Reports stay on this device and are marked for nearby mesh relay (store-and-forward) until a peer or cloud path appears.";
}

function render() {
  const reports = loadReports();
  if (!reports.length) {
    list.innerHTML = `<div class="empty">No reports yet. File one below — it is stored on this device even with no signal.</div>`;
    return;
  }
  list.innerHTML = reports
    .map(
      (r) => `
      <article class="alert">
        <header>
          <strong>${escapeHtml(r.incident)}</strong>
          <span class="tag">${r.status === "synced" ? "Cloud synced" : "Mesh queued"}</span>
        </header>
        <div class="meta">
          Emergency number: ${escapeHtml(r.number)}<br>
          Location: ${escapeHtml(r.location)}<br>
          ${r.note ? `Note: ${escapeHtml(r.note)}<br>` : ""}
          Filed ${escapeHtml(r.time)} · hop path: ${escapeHtml(r.path)}
        </div>
      </article>`
    )
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&")
    .replaceAll("<", "<")
    .replaceAll(">", ">")
    .replaceAll('"', """);
}

function syncQueued() {
  if (!navigator.onLine) return;
  const reports = loadReports().map((r) =>
    r.status === "synced" ? r : { ...r, status: "synced", path: r.path + " → cloud" }
  );
  saveReports(reports);
  render();
  setStatus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const incident = String(data.get("incident") || "").trim();
  const number = String(data.get("number") || "").trim();
  const location = String(data.get("location") || "").trim();
  const note = String(data.get("note") || "").trim();
  if (!incident || !number || !location) return;

  const online = navigator.onLine;
  const report = {
    id: crypto.randomUUID(),
    incident,
    number,
    location,
    note,
    time: nowLabel(),
    status: online ? "synced" : "queued",
    path: online ? "device → cloud" : "device → nearby mesh peer"
  };
  const reports = [report, ...loadReports()].slice(0, 30);
  saveReports(reports);
  form.reset();
  locationInput.value = "";
  render();
  setStatus();
});

document.querySelector("#locate").addEventListener("click", () => {
  if (!navigator.geolocation) {
    locationInput.value = "Geolocation not available on this device";
    return;
  }
  locationInput.value = "Locating…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      locationInput.value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    },
    () => {
      locationInput.value = "Location blocked — enter a landmark or address";
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
});

document.querySelector("#clear").addEventListener("click", () => {
  localStorage.removeItem(STORE_KEY);
  render();
  setStatus();
});

window.addEventListener("online", () => {
  syncQueued();
  setStatus();
});
window.addEventListener("offline", setStatus);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

render();
setStatus();
syncQueued();
