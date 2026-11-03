const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup({ session = { user: { id: 'staff-id' } }, member = true, insertError = null, existing = null, config } = {}) {
  const calls = [];
  const api = {
    auth: {
      async getSession() { return { data: { session }, error: null }; },
      async signInWithPassword(args) { calls.push(['login', args]); return { data: {}, error: null }; },
      async signOut(args) { calls.push(['logout', args]); return { data: {}, error: null }; }
    },
    from(table) {
      calls.push(['table', table]);
      const builder = {
        select(...args) { calls.push(['select', ...args]); return this; },
        eq(...args) { calls.push(['eq', ...args]); return this; },
        order(...args) { calls.push(['order', ...args]); return this; },
        async range(...args) { calls.push(['range', ...args]); return { data: [], count: 0 }; },
        async maybeSingle() { return { data: table === 'escape_staff' ? (member ? { user_id: 'staff-id' } : null) : existing }; },
        insert(record) { calls.push(['insert', record]); this.record = record; return this; },
        async single() { return { data: this.record, error: insertError }; }
      };
      return builder;
    }
  };
  const context = vm.createContext({ window: {
    ESCAPE_SUPABASE: config ?? { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' },
    supabase: { createClient(...args) { calls.push(['client', ...args]); return api; } }
  } });
  vm.runInContext(fs.readFileSync('js/supabase.js', 'utf8'), context);
  return { records: vm.runInContext('EscapeRecords', context), calls };
}
const record = { id: 'run-id', concept: 'doll', nickname: 'Player', total_seconds: 700, penalty_seconds: 600 };
test('unconfigured backend fails closed instead of falling back to local records', async () => {
  const s = setup({ config: { url: '', publishableKey: '' } });
  await assert.rejects(s.records.list('doll', 0, 3));
  assert.equal(s.calls.length, 0);
});
test('secret key is rejected before client initialization', async () => {
  const s = setup({ config: { url: 'https://example.supabase.co', publishableKey: 'sb_secret_do-not-use' } });
  await assert.rejects(s.records.list('doll', 0, 3));
  assert.equal(s.calls.length, 0);
});
test('public leaderboard is concept-filtered, ordered and paginated without staff fields', async () => {
  const s = setup({ session: null });
  await s.records.list('hideout', 2, 5);
  assert.ok(s.calls.some(c => c[0] === 'eq' && c[1] === 'concept' && c[2] === 'hideout'));
  assert.ok(s.calls.some(c => c[0] === 'range' && c[1] === 10 && c[2] === 14));
  assert.equal(s.calls.filter(c => c[0] === 'order').length, 3);
  assert.ok(s.calls.filter(c => c[0] === 'select').every(c => !c[1].includes('staff_id')));
});
test('anonymous and non-staff accounts cannot submit through the client', async () => {
  for (const options of [{ session: null }, { member: false }]) {
    const s = setup(options);
    await assert.rejects(s.records.save(record));
    assert.ok(!s.calls.some(c => c[0] === 'insert'));
  }
});
test('staff inserts once; duplicate ID retry reads existing record without updating', async () => {
  const first = setup();
  assert.equal(await first.records.save(record), record);
  const retry = setup({ insertError: { code: '23505' }, existing: record });
  assert.equal(await retry.records.save(record), record);
  assert.equal(retry.calls.filter(c => c[0] === 'insert').length, 1);
  assert.ok(retry.calls.some(c => c[0] === 'eq' && c[1] === 'id' && c[2] === record.id));
});
test('RLS rejection propagates, allowing the registration popup to retry', async () => {
  const s = setup({ insertError: { code: '42501' } });
  await assert.rejects(s.records.save(record), error => error.code === '42501');
});
test('non-staff login is signed out and successful sessions persist', async () => {
  const s = setup({ member: false });
  await assert.rejects(s.records.signIn('staff@example.com', 'test-password'));
  assert.ok(s.calls.some(c => c[0] === 'logout' && c[1].scope === 'local'));
  const good = setup();
  assert.equal((await good.records.signIn('staff@example.com', 'test-password')).id, 'staff-id');
  const options = good.calls.find(c => c[0] === 'client')[3];
  assert.equal(options.auth.persistSession, true);
  assert.equal(options.auth.detectSessionInUrl, false);
});
