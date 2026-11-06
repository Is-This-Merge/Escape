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
  // In-memory remote API fixture. Production never reads legacy local records.
  const read = concept => JSON.parse(storage.get('escape_records_' + concept) || '[]');
  const remote = r => ({ id: r.id, concept: r.concept, nickname: r.nick, total_seconds: r.totalSec, penalty_seconds: r.penalty, hint_count: r.hintCount, created_at: new Date(r.ts).toISOString() });
  context.EscapeRecords = {
    message: error => error.message,
    async find(id, concept) { const row = read(concept).find(r => r.id === id); return row ? remote(row) : null; },
    async list(concept, page, size) {
      const rows = read(concept).sort((a,b) => a.totalSec - b.totalSec || a.ts - b.ts);
      return { records: rows.slice(page * size, (page + 1) * size).map(remote), count: rows.length };
    },
    async save(r) {
      const rows = read(r.concept);
      if (!rows.some(row => row.id === r.id)) {
        rows.push({ id: r.id, concept: r.concept, nick: r.nickname, totalSec: r.total_seconds, penalty: r.penalty_seconds, hintCount: r.hint_count, ts: Date.now() });
        context.localStorage.setItem('escape_records_' + r.concept, JSON.stringify(rows));
      }
      return r;
    }
  };
  const run = source => vm.runInContext(source, context);
  const file = name => run(fs.readFileSync('js/' + name, 'utf8'));
  const el = id => context.document.getElementById(id);
  const submit = answer => { el('problem-key').value = answer; el('key-form').handlers.submit({ preventDefault() {} }); };
  return { context, storage, el, run, file, submit };
}
for (const concept of ['doll', 'hideout']) {
  test(concept + ': arbitrary keys, invalid keys, repeat hints, resume and completion', async () => {
    let s = setup(concept); s.file('time.js'); s.file('problem.js');
    s.submit('wrong'); assert.equal(s.run('EscapeGame.run.penalty'), 0);
    assert.notEqual(s.el('hint-dialog').open, true);
    assert.ok(s.el('key-error').textContent);
    s.submit(concept === 'doll' ? 'H01' : 'D01');
    assert.equal(s.run('EscapeGame.run.penalty'), 0);
    const lastKey = s.run('problems[4].key');
    s.submit('  ' + lastKey.toLowerCase() + '  ');
    assert.equal(s.el('hint-text').textContent, s.run('problems[4].hints[0]'));
    assert.equal(s.el('hint-dialog').open, true);
    assert.equal(s.el('key-error').textContent, '');
    assert.equal(s.run('EscapeGame.run.penalty'), s.context.EscapeTheme.current === 'hideout' ? 180 : 600);
    s.el('close-hint').handlers.click();
    assert.equal(s.el('hint-dialog').open, false);
    s.submit(lastKey);
    assert.equal(s.el('hint-dialog').open, true);
    assert.equal(s.run('EscapeGame.run.penalty'), s.context.EscapeTheme.current === 'hideout' ? 180 : 600);
    const stored = JSON.parse(s.storage.get('escape_run_' + concept));
    stored.startedAt -= 65000; s.storage.set('escape_run_' + concept, JSON.stringify(stored));
    s = setup(concept, s.storage); s.file('time.js'); s.file('problem.js');
    s.submit(lastKey);
    assert.equal(s.run('EscapeGame.run.penalty'), s.context.EscapeTheme.current === 'hideout' ? 180 : 600);
    assert.ok(s.run('EscapeGame.elapsed()') >= (concept === 'hideout' ? 245 : 665));
    for (let i = 0; i < 4; i++) s.submit(s.run('problems[' + i + '].key'));
    assert.equal(s.run('EscapeGame.run.penalty'), concept === 'hideout' ? 900 : 3000);
    assert.equal(s.context.location.href, '');
    s.file('ending-shortcut.js');
    s.el('ending-password').value = s.context.EscapeTheme.current === 'hideout' ? '7002' : '1234';
    s.el('ending-password-form').handlers.submit({ preventDefault() {} });
    assert.equal(s.context.location.href, 'ending.html?view=result');
    const end = setup(concept, s.storage); end.file('app.js'); await end.run('EscapeLeaderboard.ready');
    end.el('inp-nick').value = '<test>';
    await end.el('record-form').handlers.submit({ preventDefault() {} });
    await end.el('record-form').handlers.submit({ preventDefault() {} });
    const records = JSON.parse(end.storage.get('escape_records_' + concept));
    assert.equal(records.length, 1); assert.equal(records[0].nick, '<test>'); assert.ok(records[0].totalSec >= (concept === 'hideout' ? 245 : 665));
    assert.equal(end.el('save-record').disabled, true);
    assert.equal(end.el('records-list').children[0].children[1].children[0].textContent, '<test>');
    assert.equal(records[0].hintCount, 5);
    assert.equal(end.el('records-list').children[0].children[2].children[1].textContent, '힌트 5회');
    const otherBoard = setup(concept === 'doll' ? 'hideout' : 'doll', s.storage);
    otherBoard.file('app.js'); await otherBoard.run('EscapeLeaderboard.ready');
    assert.equal(otherBoard.el('records-list').children.length, 0);
    const reload = setup(concept, s.storage); reload.file('app.js'); await reload.run('EscapeLeaderboard.ready'); assert.equal(reload.el('save-record').disabled, true);
  });
}
test('image hint pages render in order and returning to text clears the image without extra penalty', () => {
  const s = setup('doll'); s.file('time.js'); s.file('problem.js');
  s.run('problems[0].hints = ["text", { image: "img/힌트1.png", alt: "first image" }, { image: "img/힌트2.png", alt: "second image" }, "answer"]');
  s.submit(s.run('problems[0].key'));
  s.el('next-hint').handlers.click();
  assert.equal(s.el('hint-text').children[0].src, 'img/힌트1.png');
  assert.ok(s.el('hint-text').children[0].alt);
  s.el('next-hint').handlers.click();
  assert.equal(s.el('hint-text').children.length, 1);
  assert.equal(s.el('hint-text').children[0].src, 'img/힌트2.png');
  s.el('next-hint').handlers.click();
  assert.equal(s.el('hint-text').children.length, 0);
  assert.equal(s.el('hint-text').textContent, s.run('problems[0].hints[3]'));
  assert.equal(s.el('next-hint').disabled, true);
  s.el('previous-hint').handlers.click();
  assert.equal(s.el('hint-text').children[0].src, 'img/힌트2.png');
  assert.equal(s.run('EscapeGame.run.penalty'), s.context.EscapeTheme.current === 'hideout' ? 180 : 600);
});

test('direct ending visit cannot submit a completion', async () => {
  const s = setup('doll'); s.file('app.js'); await s.run('EscapeLeaderboard.ready'); assert.equal(s.el('save-record').disabled, true);
  await s.el('record-form').handlers.submit({ preventDefault() {} }); assert.equal(s.storage.size, 0);
});
test('100-minute gauge fills, includes hint penalties, and caps at full', async () => {
  const s = setup('doll'); s.file('time.js');
  s.run('EscapeGame.run.startedAt = 1000; EscapeGame.run.finishedAt = 1000; EscapeGame.update()');
  assert.equal(s.el('timer-progress')['stroke-dashoffset'], '100');
  assert.equal(s.el('timer-progress').opacity, '0');
  s.run('EscapeGame.run.finishedAt = 3001000; EscapeGame.update()');
  assert.equal(s.el('timer-progress')['stroke-dashoffset'], '50');
  assert.equal(s.el('timer').textContent, '50:00');
  s.run('EscapeGame.run.penalty = 600; EscapeGame.update()');
  assert.ok(Math.abs(Number(s.el('timer-progress')['stroke-dashoffset']) - 100 * (1 - 60 / 100)) < .001);
  s.run('EscapeGame.run.finishedAt = 5401000; EscapeGame.update()');
  assert.equal(s.el('timer').textContent, '100:00');
  assert.equal(s.el('timer-progress')['stroke-dashoffset'], '0');
  s.run('EscapeGame.run.finishedAt = 6001000; EscapeGame.update()');
  assert.equal(s.el('timer-progress')['stroke-dashoffset'], '0');
});
test('same numeric key returns only the active concept hint', async () => {
  const doll = setup('doll'); doll.file('time.js'); doll.file('problem.js');
  const hideout = setup('hideout'); hideout.file('time.js'); hideout.file('problem.js');
  // Shared-key fixture checks concept isolation independently of production keys.
  doll.run("problems[0].key = '001'"); hideout.run("problems[0].key = '001'");
  doll.submit('001'); hideout.submit('001');
  assert.equal(doll.el('hint-title').textContent, doll.run('problems[0].title'));
  assert.equal(hideout.el('hint-title').textContent, hideout.run('problems[0].title'));
  assert.notEqual(doll.el('hint-text').textContent, hideout.el('hint-text').textContent);
  doll.context.EscapeTheme.current = 'hideout';
  doll.submit('002');
  assert.equal(doll.run('EscapeGame.run.penalty'), 600);
  assert.ok(doll.el('key-error').textContent.includes('컨셉'));
  assert.equal(doll.el('hint-title').textContent, doll.run('problems[0].title'));
});
for (const concept of ['doll', 'hideout']) {
  test(concept + ': keypad uses only explicitly entered characters', async () => {
    const s = setup(concept); s.file('time.js'); s.file('problem.js');
    s.run("problems[0].key = '001'");
    const keys = Array.from('0123456789', digit => {
      const button = s.el('pad-' + digit); button.dataset = { digit }; return button;
    });
    s.context.document.querySelectorAll = () => keys;
    s.file('keypad.js');
    assert.equal(s.el('problem-key').value, '');
    s.el('pad-0').handlers.click();
    assert.equal(s.el('problem-key').value, '0');
    assert.equal(s.el('code-slot-0').textContent, '0');
    s.el('code-backspace').handlers.click();
    assert.equal(s.el('problem-key').value, '');
    for (const key of '001') s.el('pad-' + key).handlers.click();
    assert.equal(s.el('problem-key').value, '001');
    s.el('pad-2').handlers.click();
    assert.equal(s.el('problem-key').value, '001');
    assert.equal(s.el('code-slot-2').textContent, '1');
    s.el('key-form').handlers.submit({ preventDefault() {} });
    assert.equal(s.el('hint-dialog').open, true);
    assert.equal(s.run('EscapeGame.run.penalty'), s.context.EscapeTheme.current === 'hideout' ? 180 : 600);
    s.el('code-backspace').handlers.click();
    assert.equal(s.el('code-slot-2').textContent, '');
    s.el('problem-key').value = 'h002';
    s.el('problem-key').handlers.input();
    assert.equal(s.el('problem-key').value, '002');
    assert.equal(s.el('code-slot-0').textContent, '0');
  });
}
test('home leaderboard hides result even with a finished run and cannot submit', async () => {
  const s = setup('doll', new Map(), '?view=leaderboard');
  s.storage.set('escape_run_doll', JSON.stringify({ id: 'finished', concept: 'doll', solved: 5, startedAt: 1000, finishedAt: 61000, penalty: 0 }));
  s.file('app.js'); await s.run('EscapeLeaderboard.ready');
  assert.equal(s.el('record-form').hidden, true);
  s.el('inp-nick').value = 'test';
  await s.el('record-form').handlers.submit({ preventDefault() {} });
  assert.equal(s.storage.has('escape_records_doll'), false);
  const result = setup('doll', s.storage, '?view=result'); result.file('app.js'); await result.run('EscapeLeaderboard.ready');
  assert.equal(result.el('record-form').hidden, false);
});
test('guide shows both sections without tab controls and escape requests closing', async () => {
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
test('guide modal opens and closes without ending or resetting the game', async () => {
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
test('ending shortcut requires password and cancellation keeps the game running', async () => {
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
  s.el('ending-password').value = s.context.EscapeTheme.current === 'hideout' ? '7002' : '1234';
  s.el('ending-password-form').handlers.submit({ preventDefault() {} });
  assert.equal(s.context.location.href, 'ending.html?view=result');
  assert.equal(s.run('EscapeGame.run.solved'), 5);
  assert.ok(s.run('EscapeGame.run.finishedAt') > 0);
  const ending = setup('doll', s.storage); ending.file('app.js'); await ending.run('EscapeLeaderboard.ready');
  assert.equal(ending.el('save-record').disabled, false);
});
test('leaderboard sorts fastest first', async () => {
  const s = setup('doll');
  s.storage.set('escape_records_doll', JSON.stringify([{ nick: 'slow', totalSec: 200, ts: 1 }, { nick: 'fast', totalSec: 100, ts: 2 }]));
  s.file('app.js'); await s.run('EscapeLeaderboard.ready'); assert.equal(s.el('records-list').children[0].children[1].children[0].textContent, 'fast');
});
test('leaderboard paginates selected home concept and a new visit uses the new home concept', async () => {
  const s = setup('doll');
  s.storage.set('escape_records_doll', JSON.stringify(Array.from({ length: 8 }, (_, i) => ({ nick: 'player' + i, totalSec: i + 1, ts: 1 }))));
  s.file('app.js'); await s.run('EscapeLeaderboard.ready');
  assert.equal(s.el('records-list').children.length, 3);
  assert.equal(s.el('records-page').textContent, '1 / 3');
  assert.equal(s.el('records-prev').disabled, true);
  await s.el('records-next').handlers.click();
  assert.equal(s.el('records-list').children[0].children[0].textContent, '4위');
  await s.el('records-next').handlers.click();
  assert.equal(s.el('records-list').children.length, 2);
  assert.equal(s.el('records-next').disabled, true);
  await s.el('records-next').handlers.click();
  assert.equal(s.el('records-page').textContent, '3 / 3');
  await s.el('records-prev').handlers.click();
  assert.equal(s.el('records-page').textContent, '2 / 3');
  const otherBoard = setup('hideout', s.storage);
  otherBoard.storage.set('escape_records_hideout', JSON.stringify([{ nick: 'hideout-player', totalSec: 50, ts: 1 }]));
  otherBoard.file('app.js'); await otherBoard.run('EscapeLeaderboard.ready');
  assert.equal(otherBoard.el('records-page').textContent, '1 / 1');
  assert.equal(otherBoard.el('records-next').disabled, true);
  assert.equal(otherBoard.el('records-list').children[0].children[1].children[0].textContent, 'hideout-player');
});
for (const concept of ['doll', 'hideout']) {
  test(concept + ': starting again resets time, progress and hints only for this concept', async () => {
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

for (const concept of ['doll', 'hideout']) {
  test(concept + ': progressive hints navigate without extra penalties and reset per puzzle', async () => {
    const s = setup(concept); s.file('time.js'); s.file('problem.js');
    s.run("problems[0].hints = ['first', 'second', 'third']; problems[1].hints = ['other', 'detail', 'final']");
    s.submit(s.run('problems[0].key'));
    assert.equal(s.el('hint-page').textContent, '1 / 3');
    assert.equal(s.el('previous-hint').disabled, true);
    const first = s.el('hint-text').textContent;
    s.el('next-hint').handlers.click();
    assert.equal(s.el('hint-page').textContent, '2 / 3');
    assert.notEqual(s.el('hint-text').textContent, first);
    s.el('hint-text').handlers.touchstart({ touches: [{ clientX: 200, clientY: 100 }] });
    s.el('hint-text').handlers.touchend({ changedTouches: [{ clientX: 100, clientY: 105 }] });
    assert.equal(s.el('hint-page').textContent, '3 / 3');
    assert.equal(s.el('next-hint').disabled, true);
    s.el('next-hint').handlers.click();
    assert.equal(s.el('hint-page').textContent, '3 / 3');
    s.el('hint-dialog').handlers.keydown({ key: 'ArrowLeft', preventDefault() {} });
    assert.equal(s.el('hint-page').textContent, '2 / 3');
    assert.equal(s.run('EscapeGame.run.penalty'), s.context.EscapeTheme.current === 'hideout' ? 180 : 600);
    s.submit(s.run('problems[0].key'));
    assert.equal(s.el('hint-page').textContent, '1 / 3');
    assert.equal(s.run('EscapeGame.run.penalty'), s.context.EscapeTheme.current === 'hideout' ? 180 : 600);
    s.submit(s.run('problems[1].key'));
    assert.equal(s.el('hint-page').textContent, '1 / 3');
    assert.equal(s.el('hint-text').textContent, s.run('problems[1].hints[0]'));
    assert.equal(s.run('EscapeGame.run.penalty'), concept === 'hideout' ? 360 : 1200);
  });
}

test('result modal gates leaderboard until successful registration, including reload and save errors', async () => {
  const storage = new Map([['escape_run_doll', JSON.stringify({
    id: 'modal-run', concept: 'doll', solved: 5, startedAt: 1000, finishedAt: 61000, penalty: 600
  })]]);
  let s = setup('doll', storage); s.file('app.js'); await s.run('EscapeLeaderboard.ready');
  assert.equal(s.el('record-dialog').open, true);
  assert.equal(s.el('leaderboard').hidden, true);
  assert.equal(s.el('records-list').children.length, 0);
  let prevented = false;
  s.el('record-dialog').handlers.cancel({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  s = setup('doll', storage); s.file('app.js'); await s.run('EscapeLeaderboard.ready');
  assert.equal(s.el('record-dialog').open, true);
  s.el('inp-nick').value = 'Player';
  const save = s.context.localStorage.setItem;
  s.context.localStorage.setItem = () => { throw new Error('Storage full'); };
  await s.el('record-form').handlers.submit({ preventDefault() {} });
  assert.equal(s.el('record-dialog').open, true);
  assert.equal(s.el('leaderboard').hidden, true);
  assert.ok(s.el('record-error').textContent);
  s.context.localStorage.setItem = save;
  await s.el('record-form').handlers.submit({ preventDefault() {} });
  assert.equal(s.el('record-dialog').open, false);
  assert.equal(s.el('leaderboard').hidden, false);
  assert.equal(s.el('records-list').children.length, 1);
  const reload = setup('doll', storage); reload.file('app.js'); await reload.run('EscapeLeaderboard.ready');
  assert.notEqual(reload.el('record-dialog').open, true);
  assert.equal(reload.el('leaderboard').hidden, false);
  const home = setup('doll', new Map(), '?view=leaderboard'); home.file('app.js'); await home.run('EscapeLeaderboard.ready');
  assert.notEqual(home.el('record-dialog').open, true);
  assert.equal(home.el('leaderboard').hidden, false);
});

test('remote lookup failure keeps result gated and duplicate clicks cannot submit twice', async () => {
  const storage = new Map([['escape_run_doll', JSON.stringify({ id: 'remote-run', concept: 'doll', solved: 5, startedAt: 1000, finishedAt: 61000, penalty: 0 })]]);
  const s = setup('doll', storage);
  s.context.EscapeRecords.find = async () => { throw new Error('offline'); };
  s.file('app.js'); await s.run('EscapeLeaderboard.ready');
  assert.equal(s.el('record-dialog').open, true);
  assert.equal(s.el('leaderboard').hidden, true);
  assert.equal(s.el('record-error').textContent, 'offline');
  let resolveSave, calls = 0;
  s.context.EscapeRecords.save = () => { calls++; return new Promise(resolve => { resolveSave = resolve; }); };
  s.el('inp-nick').value = 'Player';
  const first = s.el('record-form').handlers.submit({ preventDefault() {} });
  await s.el('record-form').handlers.submit({ preventDefault() {} });
  assert.equal(calls, 1);
  assert.equal(s.el('save-record').disabled, true);
  resolveSave({}); await first;
  assert.equal(s.el('record-dialog').open, false);
});

test('public board read failure shows retry and never pretends the board is empty', async () => {
  const s = setup('doll', new Map(), '?view=leaderboard');
  const list = s.context.EscapeRecords.list;
  s.context.EscapeRecords.list = async () => { throw new Error('offline'); };
  s.file('app.js'); await s.run('EscapeLeaderboard.ready');
  assert.equal(s.el('board-status').textContent, 'offline');
  assert.equal(s.el('board-retry').hidden, false);
  assert.equal(s.el('records-next').disabled, true);
  s.context.EscapeRecords.list = list;
  await s.el('board-retry').handlers.click();
  assert.equal(s.el('board-status').textContent, '');
  assert.equal(s.el('board-retry').hidden, true);
});


