const EscapeStaff = (() => {
  const el = id => document.getElementById(id);
  const backToResult = new URLSearchParams(location.search).get('return') === 'result';
  if (backToResult) {
    el('staff-continue').href = 'ending.html?view=result';
    el('staff-continue').textContent = '기록 등록으로 돌아가기';
  }
  function display(user) {
    el('staff-form').hidden = Boolean(user);
    el('staff-actions').hidden = !user;
    el('staff-status').textContent = user ? '직원 계정으로 로그인되어 있습니다.' : '기록을 등록할 직원 계정으로 로그인해주세요.';
  }
  function busy(value) {
    el('staff-signin').disabled = value;
    el('staff-signout').disabled = value;
  }
  el('staff-form').addEventListener('submit', async event => {
    event.preventDefault(); busy(true);
    try {
      display(await EscapeRecords.signIn(el('staff-email').value.trim(), el('staff-password').value));
    } catch (error) { el('staff-status').textContent = EscapeRecords.message(error); }
    finally { el('staff-password').value = ''; busy(false); }
  });
  el('staff-signout').addEventListener('click', async () => {
    busy(true);
    try { await EscapeRecords.signOut(); display(null); }
    catch (error) { el('staff-status').textContent = EscapeRecords.message(error); }
    finally { busy(false); }
  });
  busy(true);
  const ready = EscapeRecords.staff().then(display).catch(error => {
    el('staff-status').textContent = EscapeRecords.message(error);
  }).finally(() => busy(false));
  return { ready };
})();
