import { renderMap, resetMapInstance, showToast } from './utils.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lookup-form");
  const queryInput = document.getElementById("lookup-query");
  const resultsWrapper = document.getElementById("results-wrapper");
  const targetDisplay = document.getElementById("target-display");
  const loader = document.getElementById("loader");

  // Query handler
  async function performLookup(query) {
    if (!query) return;
    
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
        throw new Error(data.message || "查询失败");
      }

      // Populate table values
      document.getElementById("val-ip").textContent = data.ip || "-";
      document.getElementById("val-city").textContent = data.city || "未知城市";
      document.getElementById("val-country").textContent = data.countryName || "未知国家/地区";
      document.getElementById("val-country-code").textContent = data.country || "-";
      document.getElementById("val-lat").textContent = data.latitude || "-";
      document.getElementById("val-lng").textContent = data.longitude || "-";
      document.getElementById("val-asn").textContent = data.asn ? `AS${data.asn}` : "未知";
      document.getElementById("val-org").textContent = data.asnOrg || data.isp || "未知";
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
        renderMap("map", data.latitude, data.longitude, `查询目标: ${data.ip}<br>${data.city || ""}, ${data.countryName || ""}`);
      } else {
        document.getElementById("map").innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">暂无可用位置坐标</div>`;
      }

    } catch (error) {
      console.error("Lookup error:", error);
      showToast(error.message || "解析出错，请检查输入是否正确");
      
      // Reset values
      document.getElementById("val-ip").textContent = "-";
      document.getElementById("val-city").textContent = "查询失败";
      document.getElementById("val-country").textContent = "查询失败";
      document.getElementById("val-country-code").textContent = "-";
      document.getElementById("val-lat").textContent = "-";
      document.getElementById("val-lng").textContent = "-";
      document.getElementById("val-asn").textContent = "-";
      document.getElementById("val-org").textContent = "查询失败";
      document.getElementById("val-timezone").textContent = "-";
      document.getElementById("country-badge").innerHTML = "";
      
      document.getElementById("map").innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--error);">获取数据失败: ${error.message}</div>`;
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
    }
  });
});
