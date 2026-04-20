# Epson ET-2850 for Homey

Print images and documents from a URL directly on your Epson ET-2850 printer via Wi-Fi, using Homey flows.

## Requirements

- Epson ET-2850 connected to your local network
- The printer's local IP address (find it in the printer's network settings or your router's DHCP list)

## Flow action

**Print image from URL** — fetches an image or PDF from a URL and sends it to the printer.

| Argument | Description |
|---|---|
| Printer IP address | Local IP of your ET-2850, e.g. `192.168.1.42` |
| Image URL | Direct URL to a JPEG, PNG, PDF, or GIF |
| Number of copies | 1–20 |
| Paper size | A4, Letter (US), A5, or 4×6 Photo |
| Sides | One-sided, Two-sided long edge, or Two-sided short edge |
| Color mode | Color or Black & White |

## Supported file formats

- JPEG / JPG
- PNG
- PDF
- GIF

## How it works

The app communicates with the printer using the **Internet Printing Protocol (IPP)** over port 631. No cloud service or Epson account is required — everything stays on your local network.

## Changelog

### 1.2.0
- Content type now detected from the HTTP `Content-Type` response header, with URL extension as fallback
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
