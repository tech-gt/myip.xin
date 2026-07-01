# myip.xin - 我的 IP 地址与地理位置查询工具

🌐 **[English](README.md)** | 🇨🇳 **简体中文** | 🇷🇺 **[Русский](README_RU.md)**

[![Deploy Status](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Pages-orange?logo=cloudflare)](https://myip.xin)
[![CLI Friendly](https://img.shields.io/badge/CLI-Friendly-brightgreen?logo=gnuterminal)](https://myip.xin)

**[myip.xin](https://myip.xin)** 是一款专为开发者与普通用户设计的优质、高效的公共 IP 地址查询工具。除了获取您的 IPv4/IPv6 地址外，它还支持 IP 归属地查询、DNS 泄露测试以及 WHOIS 域名及 IP 信息检索。

本服务针对浏览器访问和终端命令行接口（CLI）进行了深度优化，响应迅速、轻量无广告、且不追踪用户隐私。

---

## 🚀 主要特性

*   **快速 IP 诊断**：瞬间返回您的当前公网 IP 地址。
*   **命令行友好**：支持使用 `curl`、`wget` 或 `httpie` 在终端中直接获取 IP 或地理位置详细信息。
*   **高精度 IP 定位**：提供包含城市、省份/地区、国家、经纬度坐标、邮政编码、ASN 自治域、运营商名称以及时区在内的完整地理数据。
*   **标准 JSON 格式**：提供 `/json` 接口，输出格式与常用的 `ipinfo.io/json` 保持 100% 一致，支持无缝替代。
*   **极致速度与隐私**：依托 Cloudflare 全球边缘网络部署，零日志、高安全、极低延迟。

---

## 💻 命令行用法与示例

您可以通过终端极其方便地调用 **myip.xin** 接口。

### 1. 获取干净的纯文本 IP 地址

直接返回当前公网 IP（非常适合 Shell 脚本自动化）：

```bash
curl https://myip.xin
```

**输出示例：**
```text
57.182.85.71
```

### 2. 获取 JSON 格式的 IP 详细地理位置信息

获取与 `ipinfo.io/json` 格式一致的 JSON 信息，包含坐标、ASN 等详细信息：

```bash
curl https://myip.xin/json
```

**输出示例：**
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

## 🛠️ Geolocation JSON 接口字段对照表

| 字段 | 类型 | 说明 | 示例值 |
| :--- | :--- | :--- | :--- |
| `ip` | String | 客户端公网 IP 地址 | `"57.182.85.71"` |
| `hostname` | String | 反向 DNS 解析主机名 | `"ec2-57-182-85-71.ap-northeast-1..."` |
| `city` | String | 城市名称 | `"Tokyo"` |
| `region` | String | 省份、州或地区名称 | `"Tokyo"` |
| `country` | String | 2位 ISO 国家代码 | `"JP"` |
| `loc` | String | 地理位置坐标 (`纬度,经度`) | `"35.6895,139.6917"` |
| `org` | String | 自治域编码 (ASN) 及组织/运营商名称 | `"AS16509 Amazon.com, Inc."` |
| `postal` | String | 邮政编码 | `"100-0001"` |
| `timezone` | String | 时区 ID | `"Asia/Tokyo"` |

---

## ⚙️ 本地开发与配置

本网站是一个静态网页项目，后端 API 基于 **Cloudflare Pages Functions** 驱动。

### 环境准备

*   Node.js (v18+)
*   npm 或 yarn

### 安装依赖

克隆项目并安装开发依赖：

```bash
npm install
```

### 启动本地前端开发服务器

仅运行 Vite 前端热重载服务：

```bash
npm run dev
```

### 启动 Cloudflare Pages 仿真环境 (推荐)

如果您需要调试 API 接口（如 `/json`、`/api/myip` 等），推荐运行 Wrangler 仿真服务：

```bash
npm run pages:dev
```

该服务默认运行在 `http://localhost:8788`，您可以直接使用 `curl` 进行测试：

```bash
curl http://localhost:8788
curl http://localhost:8788/json
```

---

## 📄 开源协议

本项目采用 MIT 协议开源。
