const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('home staff badge follows verified staff status, logout, errors and stale responses', async () => {
  let user = { id: 'staff' };
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, { dataset: {}, handlers: {}, setAttribute(key, value) { this[key] = value; }, addEventListener(name, fn) { this.handlers[name] = fn; }, showModal() { this.open = true; }, close() { this.open = false; } });
    return elements.get(id);
  }
  const link = element('staff-link');
  const events = {};
  let signouts = 0;
  const api = { staff: async () => user, signOut: async () => { signouts++; user = null; }, message: error => error.message };
  const context = vm.createContext({
    EscapeRecords: api,
    location: { href: '' },
    document: { getElementById: element, addEventListener() {} },
    window: { addEventListener(name, callback) { events[name] = callback; } }
  });
  vm.runInContext(fs.readFileSync('js/home-tools.js', 'utf8'), context);
  await vm.runInContext('EscapeHomeTools.ready', context);
  assert.equal(link.dataset.status, 'signed-in');
  await link.handlers.click({ preventDefault() {} });
  assert.equal(element('logout-dialog').open, true);
  assert.equal(signouts, 0);
  element('cancel-logout').handlers.click();
  assert.equal(element('logout-dialog').open, false);
  assert.equal(signouts, 0);
  await link.handlers.click({ preventDefault() {} });
  api.signOut = async () => { throw new Error('offline'); };
  await element('confirm-logout').handlers.click();
  assert.equal(element('logout-dialog').open, true);
  assert.equal(element('logout-error').textContent, 'offline');
  api.signOut = async () => { signouts++; user = null; };
  await element('confirm-logout').handlers.click();
  assert.equal(element('logout-dialog').open, false);
  assert.equal(link.dataset.status, 'signed-out');
  assert.equal(signouts, 1);
  await link.handlers.click({ preventDefault() {} });
  assert.equal(context.location.href, 'staff.html');
  user = null;
  await events.storage();
  assert.equal(link.dataset.status, 'signed-out');
  let resolveOld;
  api.staff = () => new Promise(resolve => { resolveOld = resolve; });
  const oldRequest = events.focus();
  api.staff = async () => null;
  await events.pageshow();
  resolveOld({ id: 'old-staff' }); await oldRequest;
  assert.equal(link.dataset.status, 'signed-out');
  api.staff = async () => { throw new Error('offline'); };
  await events.focus();
  assert.equal(link.dataset.status, 'unknown');
  assert.ok(link['aria-label']);
});
