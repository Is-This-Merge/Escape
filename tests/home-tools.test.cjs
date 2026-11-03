const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('home staff badge follows verified staff status, logout, errors and stale responses', async () => {
  let user = { id: 'staff' };
  const link = { dataset: {}, setAttribute(key, value) { this[key] = value; } };
  const events = {};
  const api = { staff: async () => user };
  const context = vm.createContext({
    EscapeRecords: api,
    document: { getElementById: () => link, addEventListener() {} },
    window: { addEventListener(name, callback) { events[name] = callback; } }
  });
  vm.runInContext(fs.readFileSync('js/home-tools.js', 'utf8'), context);
  await vm.runInContext('EscapeHomeTools.ready', context);
  assert.equal(link.dataset.status, 'signed-in');
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
