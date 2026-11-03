const EscapeHomeTools = (() => {
  const link = document.getElementById('staff-link');
  const dialog = document.getElementById('logout-dialog');
  const confirm = document.getElementById('confirm-logout');
  const cancel = document.getElementById('cancel-logout');
  const errorText = document.getElementById('logout-error');
  let signingOut = false;
  let request = 0;
  async function refresh() {
    const current = ++request;
    try {
      const user = await EscapeRecords.staff();
      if (current !== request) return;
      link.dataset.status = user ? 'signed-in' : 'signed-out';
      const label = user ? '직원 로그인됨 · 로그아웃' : '직원 로그인';
      link.setAttribute('aria-label', label);
      link.title = label;
    } catch {
      if (current !== request) return;
      link.dataset.status = 'unknown';
      link.setAttribute('aria-label', '로그인 상태 확인 불가 · 직원 로그인');
      link.title = '로그인 상태 확인 불가 · 직원 로그인';
    }
  }
  link.addEventListener('click', async event => {
    event.preventDefault();
    await refresh();
    if (link.dataset.status === 'signed-in') {
      errorText.textContent = '';
      if (!dialog.open) dialog.showModal();
    } else { location.href = 'staff.html'; }
  });
  cancel.addEventListener('click', () => { if (!signingOut) dialog.close(); });
  dialog.addEventListener('cancel', event => { if (signingOut) event.preventDefault(); });
  confirm.addEventListener('click', async () => {
    if (signingOut) return;
    signingOut = true; confirm.disabled = true; cancel.disabled = true;
    errorText.textContent = '';
    try {
      await EscapeRecords.signOut();
      ++request;
      link.dataset.status = 'signed-out';
      link.setAttribute('aria-label', '직원 로그인'); link.title = '직원 로그인';
      dialog.close();
    } catch (error) { errorText.textContent = EscapeRecords.message(error); }
    finally { signingOut = false; confirm.disabled = false; cancel.disabled = false; }
  });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('focus', refresh);
  window.addEventListener('storage', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  const ready = refresh();
  return { ready, refresh };
})();
