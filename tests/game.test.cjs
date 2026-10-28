const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(concept, storage = new Map(), search = '?view=result') {
  const elements = new Map();
  function element() {
    return { textContent: '', innerHTML: '', value: '', disabled: false, hidden: false, children: [], handlers: {},
      classList: { add() {}, remove() {} }, addEventListener(name, fn) { this.handlers[name] = fn; },
      setAttribute(name, value) { this[name] = value; },
      closest() { return this; }, showModal() { this.open = true; }, close() { this.open = false; },
      append(...items) { this.children.push(...items); }, replaceChildren() { this.children = []; }, focus() {} };
  }
  const context = vm.createContext({ console, crypto, Date, URLSearchParams, localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) },
    EscapeTheme: { current: concept }, document: { handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; }, getElementById: id => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }, createElement: element },
    location: { href: '', search }, setInterval: () => 1, clearInterval() {}, setTimeout() {} });
  const run = source => vm.runInContext(source, context);
  const file = name => run(fs.readFileSync('js/' + name, 'utf8'));
  const el = id => context.document.getElementById(id);
  const submit = answer => { el('problem-key').value = answer; el('key-form').handlers.submit({ preventDefault() {} }); };
  return { context, storage, el, run, file, submit };
}
for (const concept of ['doll', 'hideout']) {
  test(concept + ': arbitrary keys, invalid keys, repeat hints, resume and completion', () => {
    let s = setup(concept); s.file('time.js'); s.file('problem.js');
    s.submit('wrong'); assert.equal(s.run('EscapeGame.run.penalty'), 0);
    assert.notEqual(s.el('hint-dialog').open, true);
    assert.ok(s.el('key-error').textContent);
    s.submit(concept === 'doll' ? 'H01' : 'D01');
    assert.equal(s.run('EscapeGame.run.penalty'), 0);
    const lastKey = s.run('problems[4].key');
    s.submit('  ' + lastKey.toLowerCase() + '  ');
    assert.equal(s.el('hint-text').textContent, s.run('problems[4].hint'));
    assert.equal(s.el('hint-dialog').open, true);
    assert.equal(s.el('key-error').textContent, '');
    assert.equal(s.run('EscapeGame.run.penalty'), 600);
    s.el('close-hint').handlers.click();
    assert.equal(s.el('hint-dialog').open, false);
    s.submit(lastKey);
    assert.equal(s.el('hint-dialog').open, true);
    assert.equal(s.run('EscapeGame.run.penalty'), 600);
    const stored = JSON.parse(s.storage.get('escape_run_' + concept));
    stored.startedAt -= 65000; s.storage.set('escape_run_' + concept, JSON.stringify(stored));
    s = setup(concept, s.storage); s.file('time.js'); s.file('problem.js');
    s.submit(lastKey);
    assert.equal(s.run('EscapeGame.run.penalty'), 600);
    assert.ok(s.run('EscapeGame.elapsed()') >= 665);
    for (let i = 0; i < 4; i++) s.submit(s.run('problems[' + i + '].key'));
    assert.equal(s.run('EscapeGame.run.penalty'), 3000);
    assert.equal(s.context.location.href, '');
    s.file('ending-shortcut.js');
    s.el('ending-password').value = '1234';
    s.el('ending-password-form').handlers.submit({ preventDefault() {} });
    assert.equal(s.context.location.href, 'ending.html?view=result');
    const end = setup(concept, s.storage); end.file('app.js');
    end.el('inp-nick').value = '<test>';
    end.el('record-form').handlers.submit({ preventDefault() {} });
    end.el('record-form').handlers.submit({ preventDefault() {} });
    const records = JSON.parse(end.storage.get('escape_records_' + concept));
    assert.equal(records.length, 1); assert.equal(records[0].nick, '<test>'); assert.ok(records[0].totalSec >= 665);
    assert.equal(end.el('save-record').disabled, true);
    assert.equal(end.el('records-list').children[0].children[1].children[0].textContent, '<test>');
    const otherBoard = setup(concept === 'doll' ? 'hideout' : 'doll', s.storage);
    otherBoard.file('app.js');
    assert.equal(otherBoard.el('rec-count').textContent, '0명');
    const reload = setup(concept, s.storage); reload.file('app.js'); assert.equal(reload.el('save-record').disabled, true);
  });
}
test('direct ending visit cannot submit a completion', () => {
  const s = setup('doll'); s.file('app.js'); assert.equal(s.el('save-record').disabled, true);
  s.el('record-form').handlers.submit({ preventDefault() {} }); assert.equal(s.storage.size, 0);
});
test('home leaderboard hides result even with a finished run and cannot submit', () => {
  const s = setup('doll', new Map(), '?view=leaderboard');
  s.storage.set('escape_run_doll', JSON.stringify({ id: 'finished', concept: 'doll', solved: 5, startedAt: 1000, finishedAt: 61000, penalty: 0 }));
  s.file('app.js');
  assert.equal(s.el('record-form').hidden, true);
  s.el('inp-nick').value = 'test';
  s.el('record-form').handlers.submit({ preventDefault() {} });
  assert.equal(s.storage.has('escape_records_doll'), false);
  const result = setup('doll', s.storage, '?view=result'); result.file('app.js');
  assert.equal(result.el('record-form').hidden, false);
});
test('guide shows both sections without tab controls and escape requests closing', () => {
  const html = fs.readFileSync('guide.html', 'utf8');
  assert.ok(!html.includes('role="tab'));
  for (const id of ['site-guide', 'lock-guide']) {
    const tag = html.match(new RegExp('<section[^>]*id="' + id + '"[^>]*>'))[0];
    assert.ok(!tag.includes('hidden'));
  }
  const s = setup('doll');
  let message;
  s.context.window = { parent: { postMessage(value) { message = value; } } };
  s.file('guide.js');
  s.context.document.handlers.keydown({ key: 'Escape' });
  assert.equal(message, 'close-guide');
});
test('guide modal opens and closes without ending or resetting the game', () => {
  const s = setup('doll');
  s.context.window = { addEventListener() {} };
  s.file('time.js'); s.file('guide-dialog.js');
  const before = s.storage.get('escape_run_doll');
  s.el('open-guide').handlers.click();
  assert.equal(s.el('guide-dialog').open, true);
  s.el('close-guide').handlers.click();
  assert.equal(s.el('guide-dialog').open, false);
  assert.equal(s.storage.get('escape_run_doll'), before);
  assert.equal(s.context.location.href, '');
});
test('ending shortcut requires password and cancellation keeps the game running', () => {
  const s = setup('doll'); s.file('time.js'); s.file('ending-shortcut.js');
  s.el('open-ending').handlers.click();
  assert.equal(s.el('ending-dialog').open, true);
  s.el('ending-password').value = 'wrong';
  s.el('ending-password-form').handlers.submit({ preventDefault() {} });
  assert.equal(s.context.location.href, '');
  assert.equal(s.run('EscapeGame.run.finishedAt'), null);
  assert.equal(s.run('EscapeGame.run.solved'), 0);
  assert.ok(s.el('ending-error').textContent.length > 0);
  s.el('cancel-ending').handlers.click();
  assert.equal(s.el('ending-dialog').open, false);
  s.el('open-ending').handlers.click();
  assert.equal(s.el('ending-password').value, '');
  s.el('ending-password').value = '1234';
  s.el('ending-password-form').handlers.submit({ preventDefault() {} });
  assert.equal(s.context.location.href, 'ending.html?view=result');
  assert.equal(s.run('EscapeGame.run.solved'), 5);
  assert.ok(s.run('EscapeGame.run.finishedAt') > 0);
  const ending = setup('doll', s.storage); ending.file('app.js');
  assert.equal(ending.el('save-record').disabled, false);
});
test('leaderboard sorts fastest first', () => {
  const s = setup('doll');
  s.storage.set('escape_records_doll', JSON.stringify([{ nick: 'slow', totalSec: 200, ts: 1 }, { nick: 'fast', totalSec: 100, ts: 2 }]));
  s.file('app.js'); assert.equal(s.el('records-list').children[0].children[1].children[0].textContent, 'fast');
});
test('leaderboard paginates selected home concept and a new visit uses the new home concept', () => {
  const s = setup('doll');
  s.storage.set('escape_records_doll', JSON.stringify(Array.from({ length: 8 }, (_, i) => ({ nick: 'player' + i, totalSec: i + 1, ts: 1 }))));
  s.file('app.js');
  assert.equal(s.el('records-list').children.length, 3);
  assert.equal(s.el('records-page').textContent, '1 / 3');
  assert.equal(s.el('records-prev').disabled, true);
  s.el('records-next').handlers.click();
  assert.equal(s.el('records-list').children[0].children[0].textContent, '4위');
  s.el('records-next').handlers.click();
  assert.equal(s.el('records-list').children.length, 2);
  assert.equal(s.el('records-next').disabled, true);
  s.el('records-next').handlers.click();
  assert.equal(s.el('records-page').textContent, '3 / 3');
  s.el('records-prev').handlers.click();
  assert.equal(s.el('records-page').textContent, '2 / 3');
  const otherBoard = setup('hideout', s.storage);
  otherBoard.storage.set('escape_records_hideout', JSON.stringify([{ nick: 'hideout-player', totalSec: 50, ts: 1 }]));
  otherBoard.file('app.js');
  assert.equal(otherBoard.el('records-page').textContent, '1 / 1');
  assert.equal(otherBoard.el('records-next').disabled, true);
  assert.equal(otherBoard.el('records-list').children[0].children[1].children[0].textContent, 'hideout-player');
});
for (const concept of ['doll', 'hideout']) {
  test(concept + ': starting again resets time, progress and hints only for this concept', () => {
    const s = setup(concept);
    const other = concept === 'doll' ? 'hideout' : 'doll';
    s.storage.set('escape_run_' + concept, JSON.stringify({ id: 'old', concept, startedAt: Date.now() - 90000, solved: 2, hints: [0], penalty: 300, finishedAt: null }));
    s.storage.set('escape_run_' + other, 'other-progress');
    s.storage.set('escape_records_' + concept, 'saved-records');
    s.file('index.js'); s.context.document.handlers.DOMContentLoaded();
    s.el('start-button').handlers.click({ preventDefault() {} });
    assert.equal(s.context.location.href, 'playing.html');
    s.file('time.js');
    assert.equal(s.run('EscapeGame.run.solved'), 0);
    assert.equal(s.run('EscapeGame.run.hints.length'), 0);
    assert.equal(s.run('EscapeGame.run.penalty'), 0);
    assert.equal(s.el('timer').textContent, '00:00');
    assert.notEqual(s.run('EscapeGame.run.id'), 'old');
    assert.equal(s.storage.get('escape_run_' + other), 'other-progress');
    assert.equal(s.storage.get('escape_records_' + concept), 'saved-records');
  });
}
