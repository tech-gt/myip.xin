import { renderMap, resetMapInstance, showToast, updateMapTheme } from './utils.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lookup-form");
  const queryInput = document.getElementById("lookup-query");
  const resultsWrapper = document.getElementById("results-wrapper");
  const targetDisplay = document.getElementById("target-display");
  const loader = document.getElementById("loader");

  let loadedLookupData = null;
  let activeQuery = "";

  function renderLookupData(data) {
    if (!data) return;

    const unknownVal = window.i18n.t("unknown_value");

    // Populate table values
    document.getElementById("val-ip").textContent = data.ip || "-";
    document.getElementById("val-city").textContent = data.city || window.i18n.t("unknown_city");
    document.getElementById("val-country").textContent = window.i18n.tCountry(data.country) || data.countryName || window.i18n.t("unknown_country");
    document.getElementById("val-country-code").textContent = data.country || "-";
    document.getElementById("val-lat").textContent = data.latitude || "-";
    document.getElementById("val-lng").textContent = data.longitude || "-";
    document.getElementById("val-asn").textContent = data.asn ? `AS${data.asn}` : unknownVal;
    document.getElementById("val-org").textContent = data.asnOrg || data.isp || unknownVal;
    document.getElementById("val-timezone").textContent = data.timezone || "-";

    // Country Flag Badge
    const countryBadge = document.getElementById("country-badge");
    if (data.country) {
      // Generate flag emoji
      const flagEmoji = data.country
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
      countryBadge.innerHTML = `<span class="flag-emoji">${flagEmoji}</span> <span>${data.country}</span>`;
    } else {
      countryBadge.innerHTML = "";
    }

    // Render map
    if (data.latitude && data.longitude) {
      const localizedCountry = window.i18n.tCountry(data.country) || data.countryName || "";
      const popupText = `${window.i18n.t("map_popup_query")}: ${data.ip}<br>${data.city || ""}${data.city && localizedCountry ? ", " : ""}${localizedCountry}`;
      renderMap("map", data.latitude, data.longitude, popupText);
    } else {
      document.getElementById("map").innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">${window.i18n.t("no_coords_lookup")}</div>`;
    }
  }

  function renderErrorState(errorMessage) {
    // Reset values
    document.getElementById("val-ip").textContent = "-";
    document.getElementById("val-city").textContent = window.i18n.t("failed_title");
    document.getElementById("val-country").textContent = window.i18n.t("failed_title");
    document.getElementById("val-country-code").textContent = "-";
    document.getElementById("val-lat").textContent = "-";
    document.getElementById("val-lng").textContent = "-";
    document.getElementById("val-asn").textContent = "-";
    document.getElementById("val-org").textContent = window.i18n.t("failed_title");
    document.getElementById("val-timezone").textContent = "-";
    document.getElementById("country-badge").innerHTML = "";
    
    document.getElementById("map").innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--error);">${window.i18n.t("failed_data_lookup")}${errorMessage}</div>`;
  }

  // Query handler
  async function performLookup(query) {
    if (!query) return;
    
    activeQuery = query;
    // Show results section and loading spinner
    resultsWrapper.style.display = "block";
    loader.style.display = "flex";
    loader.style.opacity = "1";
    targetDisplay.textContent = query;
    
    // Clear previous map instance to prevent caching issues
    resetMapInstance();

    try {
      const response = await fetch(`/api/lookup?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || window.i18n.t("failed_title"));
      }

      loadedLookupData = data;
      renderLookupData(data);

    } catch (error) {
      console.error("Lookup error:", error);
      showToast(error.message || window.i18n.t("failed_lookup_toast"));
      loadedLookupData = null;
      renderErrorState(error.message);
    } finally {
      // Fade out loader
      loader.style.opacity = "0";
      setTimeout(() => {
        loader.style.display = "none";
      }, 300);
    }
  }

  // Handle URL Query Params
  const urlParams = new URLSearchParams(window.location.search);
  const urlQuery = urlParams.get("query") || urlParams.get("ip");
  if (urlQuery) {
    const cleanQuery = urlQuery.trim();
    queryInput.value = cleanQuery;
    performLookup(cleanQuery);
  }

  // Form Submit Handler
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = queryInput.value.trim();
    if (query) {
      // Update browser history state to include parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("query", query);
      window.history.pushState({ path: newUrl.href }, "", newUrl.href);
      
      performLookup(query);
    }
  });

  // Listen to popstate to handle browser back/forward buttons
  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("query") || params.get("ip");
    if (q) {
      queryInput.value = q.trim();
      performLookup(q.trim());
    } else {
      resultsWrapper.style.display = "none";
      queryInput.value = "";
      loadedLookupData = null;
      activeQuery = "";
    }
  });

  // Listen to theme change to update Leaflet tiles
  window.addEventListener("theme-change", () => {
    updateMapTheme();
  });

  // Listen to language change to update dynamic strings
  window.addEventListener("lang-change", () => {
    if (loadedLookupData) {
      renderLookupData(loadedLookupData);
    } else if (activeQuery) {
      renderErrorState("");
    }
  });
});
