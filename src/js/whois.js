import { showToast, copyToClipboard } from './utils.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("whois-form");
  const queryInput = document.getElementById("whois-query");
  const resultsWrapper = document.getElementById("whois-results-wrapper");
  const emptyPlaceholder = document.getElementById("whois-empty");
  const loader = document.getElementById("whois-loader");
  const copyRawBtn = document.getElementById("btn-copy-raw");
  const rawContainer = document.getElementById("raw-whois-content");

  let rawJsonDataStr = "";

  // Perform WHOIS RDAP query
  async function performWhoisQuery(query) {
    if (!query) return;

    loader.style.display = "flex";
    loader.style.opacity = "1";
    resultsWrapper.style.display = "block";
    emptyPlaceholder.style.display = "none";
    
    // Clear old data
    document.getElementById("whois-val-name").textContent = "正在获取...";
    document.getElementById("whois-val-registrar").textContent = "正在获取...";
    document.getElementById("whois-val-created").textContent = "正在获取...";
    document.getElementById("whois-val-updated").textContent = "正在获取...";
    document.getElementById("whois-val-expires").textContent = "正在获取...";
    document.getElementById("whois-val-ns").textContent = "正在获取...";
    document.getElementById("whois-val-status").textContent = "正在获取...";
    rawContainer.textContent = "正在加载原始数据...";

    try {
      const response = await fetch(`/api/whois?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "获取 Whois 数据失败");
      }

      // 1. Populate summary fields
      document.getElementById("whois-val-name").textContent = data.name || query;
      document.getElementById("whois-val-registrar").textContent = data.registrar || "未知";
      
      // Formatting Dates
      document.getElementById("whois-val-created").textContent = data.events?.created ? formatDate(data.events.created) : "未公开";
      document.getElementById("whois-val-updated").textContent = data.events?.updated ? formatDate(data.events.updated) : "未公开";
      document.getElementById("whois-val-expires").textContent = data.events?.expires ? formatDate(data.events.expires) : "未公开";
      
      // Name servers
      if (data.nameservers && data.nameservers.length > 0) {
        document.getElementById("whois-val-ns").innerHTML = data.nameservers.map(ns => `<code>${ns}</code>`).join(" ");
      } else {
        document.getElementById("whois-val-ns").textContent = "无或未公开";
      }

      // Status
      if (data.status && data.status.length > 0) {
        document.getElementById("whois-val-status").innerHTML = data.status.map(st => `<span class="dns-badge" style="margin-right:0.25rem;">${st}</span>`).join("");
      } else {
        document.getElementById("whois-val-status").textContent = "未知";
      }

      // 2. Prettify raw JSON for presentation
      rawJsonDataStr = JSON.stringify(data.raw, null, 2);
      rawContainer.textContent = rawJsonDataStr;

    } catch (error) {
      console.error("Whois error:", error);
      showToast(error.message || "获取 Whois 失败");
      
      // Update displays to show failure
      document.getElementById("whois-val-name").textContent = "获取失败";
      document.getElementById("whois-val-registrar").textContent = "-";
      document.getElementById("whois-val-created").textContent = "-";
      document.getElementById("whois-val-updated").textContent = "-";
      document.getElementById("whois-val-expires").textContent = "-";
      document.getElementById("whois-val-ns").textContent = "-";
      document.getElementById("whois-val-status").textContent = "-";
      rawContainer.textContent = `无法加载原始数据: ${error.message}`;
    } finally {
      loader.style.opacity = "0";
      setTimeout(() => {
        loader.style.display = "none";
      }, 300);
    }
  }

  // Prettify UTC/ISO dates
  function formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      // Return YYYY-MM-DD HH:mm:ss in local time zone
      const pad = (num) => String(num).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    } catch (e) {
      return dateStr;
    }
  }

  // Clean URL/Domain string helper
  function cleanDomainInput(input) {
    let domain = input.trim();
    // Remove protocol
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, "");
    // Remove trailing paths / ports
    domain = domain.split("/")[0].split(":")[0];
    return domain;
  }

  // Form Submit Handler
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = cleanDomainInput(queryInput.value);
    if (query) {
      queryInput.value = query;
      
      // Update browser search params
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("query", query);
      window.history.pushState({ path: newUrl.href }, "", newUrl.href);

      performWhoisQuery(query);
    }
  });

  // Handle URL Query Params
  const urlParams = new URLSearchParams(window.location.search);
  const urlQuery = urlParams.get("query") || urlParams.get("domain");
  if (urlQuery) {
    const query = cleanDomainInput(urlQuery);
    queryInput.value = query;
    performWhoisQuery(query);
  }

  // Copy Raw WHOIS JSON
  copyRawBtn.addEventListener("click", () => {
    if (rawJsonDataStr) {
      copyToClipboard(rawJsonDataStr);
    } else {
      showToast("没有可复制的数据");
    }
  });

  // Back/Forward support
  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("query");
    if (q) {
      const query = cleanDomainInput(q);
      queryInput.value = query;
      performWhoisQuery(query);
    } else {
      queryInput.value = "";
      resultsWrapper.style.display = "none";
      emptyPlaceholder.style.display = "block";
    }
  });
});
