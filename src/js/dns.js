import { showToast } from './utils.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("dns-form");
  const queryInput = document.getElementById("dns-query");
  const tabs = document.querySelectorAll(".tool-tab");
  const loader = document.getElementById("dns-loader");
  const noRecords = document.getElementById("no-records");
  const tableWrapper = document.getElementById("dns-table-wrapper");
  const recordsBody = document.getElementById("dns-records-body");

  let activeType = "ALL";
  let currentQueryDomain = "";
  let lastQueryStatus = "empty"; // "empty", "success", "no_records", "error"

  // DNS Type Mapping
  const DNS_TYPES = {
    "A": 1,
    "NS": 2,
    "CNAME": 5,
    "MX": 15,
    "TXT": 16,
    "AAAA": 28
  };

  // Convert Type code back to Name
  const TYPE_NAMES = {
    1: "A",
    2: "NS",
    5: "CNAME",
    15: "MX",
    16: "TXT",
    28: "AAAA"
  };

  // Fetch DNS records from Cloudflare DoH API
  async function fetchDnsRecord(domain, typeName) {
    const typeCode = DNS_TYPES[typeName];
    if (!typeCode) return [];
    
    try {
      const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${typeName}`;
      const response = await fetch(url, {
        headers: {
          "Accept": "application/dns-json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.Answer || [];
    } catch (e) {
      console.error(`DNS query failed for type ${typeName}:`, e);
      return [];
    }
  }

  // Perform DNS resolution
  async function resolveDns(domain, type) {
    if (!domain) return;
    
    currentQueryDomain = domain;
    loader.style.display = "flex";
    loader.style.opacity = "1";
    tableWrapper.style.display = "none";
    noRecords.style.display = "none";
    recordsBody.innerHTML = "";

    let answers = [];

    try {
      if (type === "ALL") {
        // Query all types in parallel
        const queryPromises = Object.keys(DNS_TYPES).map(t => fetchDnsRecord(domain, t));
        const results = await Promise.all(queryPromises);
        answers = results.flat();
      } else {
        // Query single type
        answers = await fetchDnsRecord(domain, type);
      }

      if (answers.length === 0) {
        lastQueryStatus = "no_records";
        noRecords.style.display = "block";
        noRecords.textContent = window.i18n.t("dns_no_records_found").replace("{type}", type);
      } else {
        lastQueryStatus = "success";
        // Sort answers: A, AAAA, CNAME, MX, TXT, NS
        const typePriority = { "A": 1, "AAAA": 2, "CNAME": 3, "MX": 4, "TXT": 5, "NS": 6 };
        
        answers.sort((a, b) => {
          const typeA = TYPE_NAMES[a.type] || "UNKNOWN";
          const typeB = TYPE_NAMES[b.type] || "UNKNOWN";
          return (typePriority[typeA] || 99) - (typePriority[typeB] || 99);
        });

        // Populate table rows
        answers.forEach(record => {
          const row = document.createElement("tr");
          const typeName = TYPE_NAMES[record.type] || record.type;
          
          // Format text (strip final trailing dot in name for cleaner view)
          const recordName = record.name.endsWith('.') ? record.name.slice(0, -1) : record.name;
          
          row.innerHTML = `
            <td>${escapeHtml(recordName)}</td>
            <td><span class="dns-badge dns-${typeName.toLowerCase()}">${typeName}</span></td>
            <td><code>${record.TTL}s</code></td>
            <td><code>${escapeHtml(record.data)}</code></td>
          `;
          recordsBody.appendChild(row);
        });

        tableWrapper.style.display = "block";
      }

    } catch (error) {
      console.error("DNS query error:", error);
      showToast(window.i18n.t("dns_failed_toast"));
      lastQueryStatus = "error";
      noRecords.style.display = "block";
      noRecords.textContent = window.i18n.t("dns_failed_desc");
    } finally {
      loader.style.opacity = "0";
      setTimeout(() => {
        loader.style.display = "none";
      }, 300);
    }
  }

  // HTML escape helper
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Clean URL/Domain string helper
  function cleanDomainInput(input) {
    let domain = input.trim();
    // Remove protocol if present
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, "");
    // Remove paths / query params / ports
    domain = domain.split("/")[0].split(":")[0];
    return domain;
  }

  // Tab click listeners
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeType = tab.getAttribute("data-type");

      // If a search has already run, re-run immediately with the new type filter
      if (currentQueryDomain) {
        resolveDns(currentQueryDomain, activeType);
      }
    });
  });

  // Form Submit Handler
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const rawInput = queryInput.value;
    const domain = cleanDomainInput(rawInput);
    if (domain) {
      queryInput.value = domain;
      
      // Update URL query params
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("query", domain);
      window.history.pushState({ path: newUrl.href }, "", newUrl.href);

      resolveDns(domain, activeType);
    }
  });

  // Handle URL Query Params
  const urlParams = new URLSearchParams(window.location.search);
  const urlQuery = urlParams.get("query") || urlParams.get("domain");
  if (urlQuery) {
    const domain = cleanDomainInput(urlQuery);
    queryInput.value = domain;
    resolveDns(domain, activeType);
  }

  // Back/Forward support
  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("query");
    if (q) {
      const domain = cleanDomainInput(q);
      queryInput.value = domain;
      resolveDns(domain, activeType);
    } else {
      currentQueryDomain = "";
      queryInput.value = "";
      tableWrapper.style.display = "none";
      noRecords.style.display = "block";
      lastQueryStatus = "empty";
      noRecords.textContent = window.i18n.t("dns_no_records");
    }
  });

  // Handle language change for dynamic text
  window.addEventListener("lang-change", () => {
    if (noRecords.style.display !== "none") {
      if (lastQueryStatus === "empty") {
        noRecords.textContent = window.i18n.t("dns_no_records");
      } else if (lastQueryStatus === "no_records") {
        noRecords.textContent = window.i18n.t("dns_no_records_found").replace("{type}", activeType);
      } else if (lastQueryStatus === "error") {
        noRecords.textContent = window.i18n.t("dns_failed_desc");
      }
    }
  });
});
