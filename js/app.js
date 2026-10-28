const concept = EscapeTheme.current;
let boardPage = 0;
let pageSize = 3;
let completedRun;
try { completedRun = JSON.parse(localStorage.getItem('escape_run_' + concept)); } catch {}
const validCompletion = completedRun?.concept === concept && completedRun?.solved === 5
  && Number.isFinite(completedRun?.finishedAt) && Number.isFinite(completedRun?.startedAt)
  && completedRun.finishedAt >= completedRun.startedAt && Number.isFinite(completedRun?.penalty);
const totalSec = validCompletion ? Math.floor((completedRun.finishedAt - completedRun.startedAt) / 1000) + completedRun.penalty : null;
const showResult = new URLSearchParams(location.search).get('view') === 'result' && validCompletion;
document.getElementById('record-form').hidden = !showResult;
function loadRecords(id) {
  try {
    const records = JSON.parse(localStorage.getItem('escape_records_' + id));
    return Array.isArray(records) ? records.filter(r => typeof r.nick === 'string' && Number.isFinite(r.totalSec) && r.totalSec >= 0).sort((a, b) => a.totalSec - b.totalSec || a.ts - b.ts) : [];
  } catch { return []; }
}
function formatTime(seconds) {
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
}
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message; toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
function renderRecords() {
  const records = loadRecords(concept);
  document.getElementById('rec-count').textContent = records.length + '명';
  const list = document.getElementById('records-list');
  list.replaceChildren();
  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
  boardPage = Math.min(boardPage, pageCount - 1);
  document.getElementById('records-page').textContent = `${boardPage + 1} / ${pageCount}`;
  document.getElementById('records-prev').disabled = boardPage === 0;
  document.getElementById('records-next').disabled = boardPage >= pageCount - 1;
  if (!records.length) { list.textContent = '아직 기록이 없습니다. 첫 탈출 기록을 남겨보세요.'; return; }
  records.slice(boardPage * pageSize, (boardPage + 1) * pageSize).forEach((record, offset) => {
    const index = boardPage * pageSize + offset;
    const card = document.createElement('div');
    card.className = 'rec-card ' + (index < 3 ? 'r' + (index + 1) : '');
    const rank = document.createElement('div'); rank.className = 'rec-rank'; rank.textContent = (index + 1) + '위';
    const info = document.createElement('div'); info.className = 'rec-info';
    const nick = document.createElement('div'); nick.className = 'rec-nick'; nick.textContent = record.nick;
    const date = document.createElement('div'); date.className = 'rec-date';
    date.textContent = new Date(record.ts).toLocaleString('ko-KR');
    const time = document.createElement('div'); time.className = 'rec-time'; time.textContent = formatTime(record.totalSec);
    info.append(nick, date); card.append(rank, info, time); list.append(card);
  });
}
function updateCompletion() {
  const saved = validCompletion && loadRecords(concept).some(r => r.id === completedRun.id);
  document.getElementById('result-time').textContent = validCompletion ? formatTime(totalSec) : '--:--';
  document.getElementById('completion-message').textContent = !validCompletion ? '문제 5개를 모두 해결하면 탈출 시간을 등록할 수 있습니다.' : saved ? '등록이 완료된 탈출 기록입니다.' : '탈출 성공! 닉네임을 입력해 기록을 남겨주세요.';
  document.getElementById('save-record').disabled = !validCompletion || saved;
  document.getElementById('inp-nick').disabled = !validCompletion || saved;
  if (validCompletion) document.getElementById('penalty-note').textContent = '힌트 추가 시간: ' + formatTime(completedRun.penalty);
}
document.getElementById('record-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!showResult) return;
  const nick = document.getElementById('inp-nick').value.trim();
  if (!nick || nick.length > 12) { showToast('닉네임을 1~12자로 입력하세요.'); return; }
  const records = loadRecords(concept);
  if (records.some(r => r.id === completedRun.id)) { updateCompletion(); return; }
  records.push({ id: completedRun.id, concept, nick, totalSec, penalty: completedRun.penalty, ts: completedRun.finishedAt });
  try { localStorage.setItem('escape_records_' + concept, JSON.stringify(records)); }
  catch { showToast('저장하지 못했습니다. 브라우저 저장 공간을 확인하고 다시 시도하세요.'); return; }
  boardPage = 0;
  renderRecords(); updateCompletion(); showToast('탈출 기록을 등록했습니다!');
});
document.getElementById('records-prev').addEventListener('click', () => {
  if (boardPage > 0) { boardPage--; renderRecords(); }
});
document.getElementById('records-next').addEventListener('click', () => {
  if ((boardPage + 1) * pageSize < loadRecords(concept).length) { boardPage++; renderRecords(); }
});
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => {
    const list = document.getElementById('records-list');
    const style = getComputedStyle(list);
    const row = parseFloat(style.getPropertyValue('--record-height')) || 88;
    const gap = parseFloat(style.rowGap) || 8;
    const count = Math.max(1, Math.floor((list.clientHeight + gap) / (row + gap)));
    if (count !== pageSize) { pageSize = count; boardPage = 0; renderRecords(); }
  }).observe(document.getElementById('records-list'));
}
renderRecords(); updateCompletion();
