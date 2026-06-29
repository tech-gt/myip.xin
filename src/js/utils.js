// Toast notification helper
export function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  const msgEl = document.getElementById("toast-message");
  
  if (!toast) return;
  
  msgEl.textContent = message;
  toast.classList.add("show");
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// Clipboard copy helper
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      showToast("复制成功！");
    } else {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("复制成功！");
    }
  } catch (err) {
    console.error("Copy failed:", err);
    showToast("复制失败，请手动选择复制。");
  }
}

// Map initialization with dark style tiles
let activeMapInstance = null;
let activeMarker = null;

export function renderMap(mapId, lat, lng, popupText = "大致位置") {
  // If lat or lng is missing, use default coordinates
  const latitude = parseFloat(lat) || 0;
  const longitude = parseFloat(lng) || 0;

  if (activeMapInstance) {
    // If map already exists, update center and marker
    activeMapInstance.setView([latitude, longitude], 11);
    if (activeMarker) {
      activeMarker.setLatLng([latitude, longitude]).setPopupContent(popupText).openPopup();
    } else {
      activeMarker = L.marker([latitude, longitude]).addTo(activeMapInstance)
        .bindPopup(popupText)
        .openPopup();
    }
    return activeMapInstance;
  }

  // Otherwise create new map
  activeMapInstance = L.map(mapId, {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([latitude, longitude], 11);

  // Use CartoDB Dark Matter tiles for modern dark look
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(activeMapInstance);

  activeMarker = L.marker([latitude, longitude]).addTo(activeMapInstance)
    .bindPopup(popupText)
    .openPopup();

  return activeMapInstance;
}

// Clear map instance (useful when switching targets on Lookup page)
export function resetMapInstance() {
  activeMapInstance = null;
  activeMarker = null;
}
