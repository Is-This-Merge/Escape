const EscapeLeaderboard = (() => {
  const concept = EscapeTheme.current;
  const el = id => document.getElementById(id);
  const dialog = el('record-dialog');
  let run;
  try { run = JSON.parse(localStorage.getItem('escape_run_' + concept)); } catch {}
  const valid = run?.concept === concept && typeof run.id === 'string' && run.solved === 5
    && Number.isFinite(run.finishedAt) && Number.isFinite(run.startedAt) && run.finishedAt >= run.startedAt
    && Number.isInteger(run.penalty) && run.penalty >= 0;
  const resultView = new URLSearchParams(location.search).get('view') === 'result' && valid;
  const total = valid ? Math.floor((run.finishedAt - run.startedAt) / 1000) + run.penalty : null;
  const format = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  let registered = false, saving = false, checking = false, page = 0, size = 3, count = 0, request = 0;
  const pending = () => resultView && !registered;
  const errorText = error => EscapeRecords.message(error);
  function sync() {
    el('leaderboard').hidden = pending();
    el('record-form').hidden = !pending();
    el('save-record').disabled = !pending() || saving || checking;
    el('save-record').textContent = saving ? '등록 중…' : '기록 등록';
    el('inp-nick').disabled = !pending() || saving;
    if (pending() && !dialog.open) dialog.showModal();
    if (!pending() && dialog.open) dialog.close();
  }
  function render(records) {
    const list = el('records-list');
    list.replaceChildren();
    el('records-page').textContent = `${page + 1} / ${Math.max(1, Math.ceil(count / size))}`;
    el('records-prev').disabled = page === 0;
    el('records-next').disabled = (page + 1) * size >= count;
    if (!records.length) { list.textContent = '아직 등록된 기록이 없습니다.'; return; }
    records.forEach((record, offset) => {
      const rankNumber = page * size + offset + 1;
      const card = document.createElement('div'); card.className = 'rec-card ' + (rankNumber <= 3 ? 'r' + rankNumber : '');
      const rank = document.createElement('div'); rank.className = 'rec-rank'; rank.textContent = rankNumber + '위';
      const info = document.createElement('div'); info.className = 'rec-info';
      const nick = document.createElement('div'); nick.className = 'rec-nick'; nick.textContent = record.nickname;
      const date = document.createElement('div'); date.className = 'rec-date'; date.textContent = new Date(record.created_at).toLocaleString('ko-KR');
      const time = document.createElement('div'); time.className = 'rec-time'; time.textContent = format(record.total_seconds);
      const stats = document.createElement('div'); stats.className = 'rec-stats';
      const hints = document.createElement('div'); hints.className = 'rec-hints';
      hints.textContent = Number.isInteger(record.hint_count) ? `힌트 사용 ${record.hint_count}회` : record.penalty_seconds === 0 ? '힌트 사용 0회' : '힌트 미기록';
      stats.append(time, hints);
      info.append(nick, date); card.append(rank, info, stats); list.append(card);
    });
  }
  async function refresh() {
    if (pending()) return;
    const token = ++request;
    el('records-prev').disabled = true; el('records-next').disabled = true;
    el('board-status').textContent = '순위표를 불러오는 중…';
    el('board-retry').hidden = true;
    try {
      const result = await EscapeRecords.list(concept, page, size);
      if (token !== request) return;
      count = result.count;
      const lastPage = Math.max(0, Math.ceil(count / size) - 1);
      if (page > lastPage) { page = lastPage; return refresh(); }
      render(result.records);
      el('board-status').textContent = '';
    } catch (error) {
      if (token !== request) return;
      el('records-list').replaceChildren();
      el('board-status').textContent = errorText(error);
      el('board-retry').hidden = false;
    }
  }
  async function checkRegistration() {
    if (!resultView) return refresh();
    checking = true; sync();
    el('record-error').textContent = '';
    try {
      registered = Boolean(await EscapeRecords.find(run.id, concept));
      if (registered) { sync(); await refresh(); }
    } catch (error) { el('record-error').textContent = errorText(error); }
    finally { checking = false; sync(); }
  }
  dialog.addEventListener('cancel', event => event.preventDefault());
  el('record-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!pending() || saving || checking) return;
    const nickname = el('inp-nick').value.trim();
    if (!nickname || nickname.length > 12) { el('record-error').textContent = '닉네임을 1~12자로 입력하세요.'; return; }
    saving = true; sync(); el('record-error').textContent = '';
    try {
      await EscapeRecords.save({ id: run.id, concept, nickname, total_seconds: total, penalty_seconds: run.penalty,
        hint_count: Array.isArray(run.hints) ? new Set(run.hints).size : null });
      registered = true; page = 0; sync(); await refresh();
    } catch (error) { el('record-error').textContent = errorText(error); }
    finally { saving = false; sync(); }
  });
  el('records-prev').addEventListener('click', async () => { if (page > 0) { page--; await refresh(); } });
  el('records-next').addEventListener('click', async () => { if ((page + 1) * size < count) { page++; await refresh(); } });
  el('board-retry').addEventListener('click', refresh);
  el('result-time').textContent = valid ? format(total) : '--:--';
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      const list = el('records-list');
      if (!list.clientHeight || pending()) return;
      const style = getComputedStyle(list);
      const row = parseFloat(style.getPropertyValue('--record-height')) || 88;
      const gap = parseFloat(style.rowGap) || 8;
      const nextSize = Math.min(100, Math.max(1, Math.floor((list.clientHeight + gap) / (row + gap))));
      if (size !== nextSize) { size = nextSize; page = 0; refresh(); }
    }).observe(el('records-list'));
  }
  sync();
  const ready = checkRegistration();
  return { ready };
})();
