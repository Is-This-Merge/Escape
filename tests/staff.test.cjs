const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(user = null) {
  const elements = new Map();
  const el = id => {
    if (!elements.has(id)) elements.set(id, { value: '', handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } });
    return elements.get(id);
  };
  const location = { replace(url) { this.destination = url; } };
  const api = { staff: async () => user, signIn: async () => ({ id: 'staff' }), message: error => error.message };
  const context = vm.createContext({ document: { getElementById: el }, location, EscapeRecords: api });
  vm.runInContext(fs.readFileSync('js/staff.js', 'utf8'), context);
  return { el, location, api, ready: vm.runInContext('EscapeStaff.ready', context) };
}
test('successful staff login redirects home and clears the password', async () => {
  const s = setup(); await s.ready;
  s.el('staff-email').value = 'staff@example.com';
  s.el('staff-password').value = 'example-password';
  await s.el('staff-form').handlers.submit({ preventDefault() {} });
  assert.equal(s.location.destination, 'index.html');
  assert.equal(s.el('staff-password').value, '');
});
test('existing staff session redirects home, failed login stays on form', async () => {
  const active = setup({ id: 'staff' }); await active.ready;
  assert.equal(active.location.destination, 'index.html');
  const s = setup(); await s.ready;
  s.api.signIn = async () => { throw new Error('denied'); };
  s.el('staff-password').value = 'wrong';
  await s.el('staff-form').handlers.submit({ preventDefault() {} });
  assert.equal(s.location.destination, undefined);
  assert.equal(s.el('staff-status').textContent, 'denied');
  assert.equal(s.el('staff-password').value, '');
});
