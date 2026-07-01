# myip.xin - What Is My IP Address & IP Geolocation Lookup Tool

[![Deploy Status](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Pages-orange?logo=cloudflare)](https://myip.xin)
[![CLI Friendly](https://img.shields.io/badge/CLI-Friendly-brightgreen?logo=gnuterminal)](https://myip.xin)

**[myip.xin](https://myip.xin)** is a premium, developer-friendly web tool to check your public IP address, look up IP geolocation, perform DNS leak tests, and query WHOIS details. It is ultra-fast, lightweight, and optimized for both web browsers and terminal command-line interfaces.

---

## 🚀 Key Features

*   **Quick IP Check**: Get your current public IP address (IPv4/IPv6) instantly.
*   **CLI Friendly**: Fetch your IP address or geolocation details directly from your terminal using `curl`, `wget`, or `httpie`.
*   **IP Geolocation**: Comprehensive geographical details including city, region, country, lat/long coordinates, postal code, ASN, ISP, and timezone.
*   **Standard JSON Format**: The `/json` endpoint returns details formatted identically to `ipinfo.io/json` for seamless drop-in integration.
*   **Privacy & Speed**: Served via the Cloudflare global edge network with no tracking.

---

## 💻 CLI Usage & Examples

You can access **myip.xin** programmatically from your terminal.

### 1. Plain Text IP Address

To retrieve your clean public IP address directly (useful for scripting):

```bash
curl https://myip.xin
```

**Output Example:**
```text
57.182.85.71
```

### 2. Geolocation JSON Info (ipinfo.io Compatible)

To get detailed geolocation information in JSON format (fully compatible with `ipinfo.io/json` response format):

```bash
curl https://myip.xin/json
```

**Output Example:**
```json
{
  "ip": "57.182.85.71",
  "hostname": "ec2-57-182-85-71.ap-northeast-1.compute.amazonaws.com",
  "city": "Tokyo",
  "region": "Tokyo",
  "country": "JP",
  "loc": "35.6895,139.6917",
  "org": "AS16509 Amazon.com, Inc.",
  "postal": "100-0001",
  "timezone": "Asia/Tokyo"
}
```

---

## 🛠️ Geolocation JSON API Fields Reference

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `ip` | String | Your client public IP address | `"57.182.85.71"` |
| `hostname` | String | Reverse DNS hostname | `"ec2-57-182-85-71.ap-northeast-1..."` |
| `city` | String | City name | `"Tokyo"` |
| `region` | String | State, province, or region name | `"Tokyo"` |
| `country` | String | 2-letter ISO country code | `"JP"` |
| `loc` | String | Geolocation coordinates (`latitude,longitude`) | `"35.6895,139.6917"` |
| `org` | String | Autonomous System Number and Organization (ASN) | `"AS16509 Amazon.com, Inc."` |
| `postal` | String | Postal or ZIP code | `"100-0001"` |
| `timezone` | String | Olson Time Zone ID | `"Asia/Tokyo"` |

---

## ⚙️ Development and Local Setup

This project is built as a static site and deployed using **Cloudflare Pages** with Edge Functions.

### Prerequisites

*   Node.js (v18+)
*   npm or yarn

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Local Server for Web Frontend

To run the Vite dev server for local frontend work:

```bash
npm run dev
```

### Local Simulation of Cloudflare Pages Functions

To run the edge functions (API endpoints like `/json`, `/api/myip`, etc.) locally using Wrangler:

```bash
npm run pages:dev
```

This will spin up a local server (typically at `http://localhost:8788`) mimicking the Cloudflare runtime. You can test CLI tools against this port:

```bash
curl http://localhost:8788
curl http://localhost:8788/json
```

---

## 📄 License

This project is open-source and licensed under the MIT License.
