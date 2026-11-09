import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const landingPage = readFileSync(new URL('../site/index.html', import.meta.url), 'utf8');

test('keeps the complete landing experience inside one viewport', () => {
  assert.match(landingPage, /\.page-shell\s*{[^}]*height:\s*100dvh;[^}]*overflow:\s*hidden;/s);
});

test('centers the signup panel as the primary landing action', () => {
  assert.match(landingPage, /\.hero\s*{[^}]*place-items:\s*center;/s);
  assert.match(landingPage, /\.access-panel\s*{[^}]*width:\s*min\(100%,\s*560px\);/s);
});

test('uses the requested high-contrast Join us action', () => {
  assert.match(landingPage, /<button type="submit" id="submitBtn">Join us<\/button>/);
  assert.match(landingPage, /button\s*{[^}]*background:\s*#000;[^}]*color:\s*#fff;/s);
  assert.match(landingPage, /submitButton\.textContent = 'Join us';/);
});
