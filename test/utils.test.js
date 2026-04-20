'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateInput, detectContentType } = require('../lib/utils');

// --- validateInput ---

test('validateInput: accepts valid IPv4 and https URL', () => {
  assert.doesNotThrow(() => validateInput('192.168.1.42', 'https://example.com/image.jpg'));
});

test('validateInput: accepts http URL', () => {
  assert.doesNotThrow(() => validateInput('10.0.0.1', 'http://example.com/image.png'));
});

test('validateInput: rejects IP with octet > 255', () => {
  assert.throws(() => validateInput('192.168.1.256', 'https://example.com/a.jpg'), /Invalid printer IP/);
});

test('validateInput: rejects non-IP string', () => {
  assert.throws(() => validateInput('not-an-ip', 'https://example.com/a.jpg'), /Invalid printer IP/);
});

test('validateInput: rejects partial IP', () => {
  assert.throws(() => validateInput('192.168.1', 'https://example.com/a.jpg'), /Invalid printer IP/);
});

test('validateInput: rejects URL without protocol', () => {
  assert.throws(() => validateInput('192.168.1.1', 'example.com/image.jpg'), /Invalid image URL/);
});

test('validateInput: rejects ftp URL', () => {
  assert.throws(() => validateInput('192.168.1.1', 'ftp://example.com/image.jpg'), /Invalid image URL/);
});

// --- detectContentType ---

test('detectContentType: uses Content-Type header when valid', () => {
  assert.equal(detectContentType('image/png; charset=utf-8', 'https://example.com/file'), 'image/png');
});

test('detectContentType: uses Content-Type header for PDF', () => {
  assert.equal(detectContentType('application/pdf', 'https://example.com/file'), 'application/pdf');
});

test('detectContentType: ignores unknown MIME type and falls back to URL', () => {
  assert.equal(detectContentType('text/html', 'https://example.com/image.png'), 'image/png');
});

test('detectContentType: falls back to URL extension .jpg', () => {
  assert.equal(detectContentType(null, 'https://example.com/photo.jpg'), 'image/jpeg');
});

test('detectContentType: falls back to URL extension .jpeg', () => {
  assert.equal(detectContentType(undefined, 'https://example.com/photo.jpeg'), 'image/jpeg');
});

test('detectContentType: falls back to URL extension .gif', () => {
  assert.equal(detectContentType(null, 'https://example.com/anim.gif'), 'image/gif');
});

test('detectContentType: strips query string before checking extension', () => {
  assert.equal(detectContentType(null, 'https://example.com/photo.png?v=123'), 'image/png');
});

test('detectContentType: defaults to image/jpeg for unknown extension', () => {
  assert.equal(detectContentType(null, 'https://example.com/file'), 'image/jpeg');
});
