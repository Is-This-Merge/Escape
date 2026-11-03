const EscapeStaff = (() => {
  const el = id => document.getElementById(id);
  function display(user) {
    if (user) { location.replace('index.html'); return; }
    el('staff-status').textContent = '기록을 등록할 직원 계정으로 로그인해주세요.';
  }
  function busy(value) {
    el('staff-signin').disabled = value;
  }
  el('staff-form').addEventListener('submit', async event => {
    event.preventDefault(); busy(true);
    try {
      display(await EscapeRecords.signIn(el('staff-email').value.trim(), el('staff-password').value));
    } catch (error) { el('staff-status').textContent = EscapeRecords.message(error); }
    finally { el('staff-password').value = ''; busy(false); }
  });
  busy(true);
  const ready = EscapeRecords.staff().then(display).catch(error => {
    el('staff-status').textContent = EscapeRecords.message(error);
  }).finally(() => busy(false));
  return { ready };
})();
