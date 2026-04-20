# Epson ET-2850 for Homey

Print images and documents from a URL directly on your Epson ET-2850 printer via Wi-Fi, using Homey flows.

## Setup

### Option A — Paired device (recommended)

1. Go to **Devices → Add device → Epson ET-2850**
2. Homey will scan your network via mDNS and list any Epson ET-2850 printers it finds
3. Select your printer and complete pairing
4. Use the **"Print image from URL on paired printer"** flow action — no IP address needed, and Homey tracks the printer's address automatically if it changes

### Option B — Manual IP

Use the **"Print image from URL"** flow action and enter the printer's local IP address each time (e.g. `192.168.1.42`). Find the IP in the printer's network settings or your router's DHCP table.

## Flow actions

### Print image from URL on paired printer *(recommended)*

| Argument | Description |
|---|---|
| Printer | Select a paired Epson ET-2850 device |
| Image URL | Direct URL to a JPEG, PNG, PDF, or GIF |
| Number of copies | 1–20 |
| Paper size | A4, Letter (US), A5, or 4×6 Photo |
| Sides | One-sided, Two-sided long edge, or Two-sided short edge |
| Color mode | Color or Black & White |

### Print image from URL *(manual IP)*

Same arguments as above, but with a **Printer IP address** text field instead of a device picker.

## Supported file formats

- JPEG / JPG
- PNG
- PDF
- GIF

The file type is detected from the HTTP `Content-Type` response header, with the URL extension as fallback.

## How it works

The app communicates with the printer using the **Internet Printing Protocol (IPP)** over port 631 (IPPS/TLS). No cloud service or Epson account is required — everything stays on your local network. After submitting a print job, the app polls the printer for job status and reports success or failure back to the flow.

## Changelog

### 1.3.0
- Added mDNS printer discovery — pair your ET-2850 as a Homey device for automatic IP tracking
- Added "Print image from URL on paired printer" flow action
- Added job status polling — flows now wait for the print job to actually complete (60s timeout)
- Added unit test suite (`npm test`)
- Refactored utility functions into `lib/utils.js`

### 1.2.0
- Content type detected from HTTP `Content-Type` response header, with URL extension as fallback
- Fixed author metadata
- Removed stale README.txt

### 1.1.0
- Added configurable paper size (A4, Letter, A5, 4×6 Photo)
- Added duplex/sides option (one-sided, two-sided long/short edge)
- Added color mode option (color or black & white)
- Added input validation for printer IP address and image URL
- Fixed TLS certificate handling — scoped to printer connection only
- Removed unused dependencies (`node-fetch`, `fix`)

### 1.0.0
- Initial release — print images from a URL via a Homey flow action
