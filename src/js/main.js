import { renderMap, copyToClipboard } from './utils.js';

document.addEventListener("DOMContentLoaded", async () => {
  const ipDisplay = document.getElementById("ip-display");
  const btnCopy = document.getElementById("btn-copy-ip");
  const loader = document.getElementById("loader");

  let userIp = "";

  try {
    const response = await fetch("/api/myip");
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    const data = await response.json();
    userIp = data.ip;

    // 1. Display IP
    ipDisplay.textContent = userIp;

    // 2. Populate details
    document.getElementById("val-city").textContent = data.city || "未知城市";
    document.getElementById("val-country").textContent = data.countryName || "未知国家/地区";
    document.getElementById("val-country-code").textContent = data.country || "未知";
    document.getElementById("val-lat").textContent = data.latitude || "未知";
    document.getElementById("val-lng").textContent = data.longitude || "未知";
    document.getElementById("val-asn").textContent = data.asn ? `AS${data.asn}` : "未知";
    document.getElementById("val-org").textContent = data.asnOrg || "未知";
    document.getElementById("val-timezone").textContent = data.timezone || "未知";
    document.getElementById("val-colo").textContent = data.colo || "未知";

    // Country Flag Badge
    if (data.country) {
      const countryBadge = document.getElementById("country-badge");
      // Convert country code to regional indicator flag emoji
      const flagEmoji = data.country
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
      countryBadge.innerHTML = `<span class="flag-emoji">${flagEmoji}</span> <span>${data.country}</span>`;
    }

    // 3. Render map
    if (data.latitude && data.longitude) {
      renderMap("map", data.latitude, data.longitude, `您的 IP: ${userIp}<br>${data.city || ""}, ${data.countryName || ""}`);
    } else {
      document.getElementById("map").innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">暂无可用位置坐标</div>`;
    }

  } catch (error) {
    console.error("Error loading IP data:", error);
    ipDisplay.textContent = "获取失败";
    ipDisplay.style.color = "var(--error)";
    
    // Set descriptive errors
    const errorCells = ["val-city", "val-country", "val-country-code", "val-lat", "val-lng", "val-asn", "val-org", "val-timezone", "val-colo"];
    errorCells.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = "无法获取";
    });
    
    document.getElementById("map").innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--error);">获取地理位置数据失败</div>`;
  } finally {
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => {
        loader.style.display = "none";
      }, 300);
    }
  }

  // Copy IP Event
  btnCopy.addEventListener("click", () => {
    if (userIp) {
      copyToClipboard(userIp);
    }
  });
});
