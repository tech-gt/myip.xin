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
  let loadedWhoisData = null;
  let lastQueryErrorMsg = "";

  function renderWhoisData(data) {
    if (!data) return;

    const unknownVal = window.i18n.t("unknown_value");

    // 1. Populate summary fields
    document.getElementById("whois-val-name").textContent = data.name || queryInput.value;
    document.getElementById("whois-val-registrar").textContent = data.registrar || unknownVal;
    
    // Formatting Dates
    document.getElementById("whois-val-created").textContent = data.events?.created ? formatDate(data.events.created) : window.i18n.t("whois_val_unopened");
    document.getElementById("whois-val-updated").textContent = data.events?.updated ? formatDate(data.events.updated) : window.i18n.t("whois_val_unopened");
    document.getElementById("whois-val-expires").textContent = data.events?.expires ? formatDate(data.events.expires) : window.i18n.t("whois_val_unopened");
    
    // Name servers
    if (data.nameservers && data.nameservers.length > 0) {
      document.getElementById("whois-val-ns").innerHTML = data.nameservers.map(ns => `<code>${ns}</code>`).join(" ");
    } else {
      document.getElementById("whois-val-ns").textContent = window.i18n.t("whois_ns_empty");
    }

    // Status
    if (data.status && data.status.length > 0) {
      document.getElementById("whois-val-status").innerHTML = data.status.map(st => `<span class="dns-badge" style="margin-right:0.25rem;">${st}</span>`).join("");
    } else {
      document.getElementById("whois-val-status").textContent = window.i18n.t("whois_status_unknown");
    }

    // 2. Prettify raw JSON for presentation
    rawJsonDataStr = JSON.stringify(data.raw, null, 2);
    rawContainer.textContent = rawJsonDataStr;
  }

  function renderErrorState(errorMessage) {
    document.getElementById("whois-val-name").textContent = window.i18n.t("whois_failed_field");
    document.getElementById("whois-val-registrar").textContent = "-";
    document.getElementById("whois-val-created").textContent = "-";
    document.getElementById("whois-val-updated").textContent = "-";
    document.getElementById("whois-val-expires").textContent = "-";
    document.getElementById("whois-val-ns").textContent = "-";
    document.getElementById("whois-val-status").textContent = "-";
    rawContainer.textContent = `${window.i18n.t("whois_failed_raw")}${errorMessage}`;
  }

  // Perform WHOIS RDAP query
  async function performWhoisQuery(query) {
    if (!query) return;

    loader.style.display = "flex";
    loader.style.opacity = "1";
    resultsWrapper.style.display = "block";
    emptyPlaceholder.style.display = "none";
    
    const loadingText = window.i18n.t("whois_loading_data");
    // Clear old data
    document.getElementById("whois-val-name").textContent = loadingText;
    document.getElementById("whois-val-registrar").textContent = loadingText;
    document.getElementById("whois-val-created").textContent = loadingText;
    document.getElementById("whois-val-updated").textContent = loadingText;
    document.getElementById("whois-val-expires").textContent = loadingText;
    document.getElementById("whois-val-ns").textContent = loadingText;
    document.getElementById("whois-val-status").textContent = loadingText;
    rawContainer.textContent = window.i18n.t("whois_loading_raw");

    try {
      const response = await fetch(`/api/whois?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || window.i18n.t("whois_failed_toast"));
      }

      loadedWhoisData = data;
      lastQueryErrorMsg = "";
      renderWhoisData(data);

    } catch (error) {
      console.error("Whois error:", error);
      showToast(error.message || window.i18n.t("whois_failed_toast"));
      loadedWhoisData = null;
      lastQueryErrorMsg = error.message;
      renderErrorState(error.message);
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
      showToast(window.i18n.t("whois_no_data_copy"));
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
      loadedWhoisData = null;
      lastQueryErrorMsg = "";
    }
  });

  // Handle language change for dynamic elements
  window.addEventListener("lang-change", () => {
    if (loadedWhoisData) {
      renderWhoisData(loadedWhoisData);
    } else if (lastQueryErrorMsg) {
      renderErrorState(lastQueryErrorMsg);
    }
  });
});
