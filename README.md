# Epson ET-2850 for Homey

The best use case for this flow is to schedule a weekly flow and print a test color page to ensure the ink doesnt dry up in the printer

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

The app communicates with the printer using the **Internet Printing Protocol (IPP)** over port 631 (IPPS/TLS). No cloud service or Epson account is required — everything stays on your local network. Ink levels are read directly from the printer via IPP and updated every 30 minutes.

## Changelog

### 1.6.0
- Ink level monitoring — Black, Cyan, Magenta, and Yellow ink levels are shown on the device card and logged to Homey Insights
- Ink levels are polled automatically every 30 minutes and refreshed whenever the printer is discovered on the network

### 1.5.0
- Fixed mDNS discovery — printer now found correctly during pairing
- Fixed flow action timeout — action returns as soon as the printer accepts the job instead of waiting for it to complete
- Suppressed Node.js TLS warning noise in logs

### 1.4.0
- Paired printer device now has a settings page — manually set or override the IP address if mDNS fails or the printer is on a different subnet
- IP address changes from mDNS are reflected in the settings page automatically
- User-facing error messages now use `locales/en.json` for future translation support

### 1.3.1
- Image fetch now times out after 30s instead of hanging indefinitely
- Redirect chain capped at 5 hops to prevent infinite redirect loops
- Removed build artefacts and IDE config from git (`.homeybuild/`, `.DS_Store`, `.claude/`)

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
