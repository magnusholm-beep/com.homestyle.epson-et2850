'use strict';

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

function validateInput(printerIp, imageUrl) {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(printerIp) || printerIp.split('.').some(p => parseInt(p, 10) > 255)) {
    throw new Error(`Invalid printer IP address: ${printerIp}`);
  }
  if (!/^https?:\/\/.+/.test(imageUrl)) {
    throw new Error('Invalid image URL: must start with http:// or https://');
  }
}

function detectContentType(headerValue, url) {
  if (headerValue) {
    const mime = headerValue.split(';')[0].trim().toLowerCase();
    if (SUPPORTED_MIME_TYPES.includes(mime)) return mime;
  }
  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

module.exports = { validateInput, detectContentType };
