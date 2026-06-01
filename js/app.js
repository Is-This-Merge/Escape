const STORAGE_KEY = 'the_escape_records';

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function shake(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 400);
}

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function rankClass(i) {
  return i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : '';
}

function rankLabel(i) {
  return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
  );
}

function renderRecords() {
  const records = loadRecords();
  const list = document.getElementById('records-list');
  const count = document.getElementById('rec-count');

  count.textContent = `${records.length}명`;

  if (records.length === 0) {
    list.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🏁</div>
        <div class="empty-txt">아직 기록이 없어요</div>
      </div>`;
    return;
  }

  list.innerHTML = records.map((r, i) => `
    <div class="rec-card ${rankClass(i)}">
      <div class="rec-rank ${rankClass(i)}">${rankLabel(i)}</div>
      <div class="rec-info">
        <div class="rec-nick">${escapeHtml(r.nick)}</div>
        <div class="rec-date">${formatDate(r.ts)}</div>
      </div>
      <div class="rec-time">${formatTime(r.totalSec)}</div>
      <button class="rec-del" onclick="deleteRecord(${i})" title="삭제">✕</button>
    </div>
  `).join('');
}

function addRecord() {
  const nick = document.getElementById('inp-nick').value.trim();
  const minVal = document.getElementById('inp-min').value;
  const secVal = document.getElementById('inp-sec').value;

  if (!nick) { showToast('닉네임을 입력해주세요'); shake('inp-nick'); return; }
  if (minVal === '' || secVal === '') { showToast('시간을 모두 입력해주세요'); return; }

  const min = parseInt(minVal, 10);
  const sec = parseInt(secVal, 10);

  if (isNaN(min) || min < 0 || min > 99) { showToast('분은 0–99 사이로 입력해주세요'); shake('inp-min'); return; }
  if (isNaN(sec) || sec < 0 || sec > 59) { showToast('초는 0–59 사이로 입력해주세요'); shake('inp-sec'); return; }

  const totalSec = min * 60 + sec;
  const records = loadRecords();

  records.push({ nick, totalSec, ts: Date.now() });
  records.sort((a, b) => a.totalSec - b.totalSec);

  saveRecords(records);
  renderRecords();
  showToast('기록이 추가됐어요! 🎉');

  document.getElementById('inp-nick').value = '';
  document.getElementById('inp-min').value = '';
  document.getElementById('inp-sec').value = '';
}

function deleteRecord(index) {
  const records = loadRecords();
  records.splice(index, 1);
  saveRecords(records);
  renderRecords();
  showToast('기록을 삭제했어요');
}

renderRecords();