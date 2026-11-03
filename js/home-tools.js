const EscapeHomeTools = (() => {
  const link = document.getElementById('staff-link');
  let request = 0;
  async function refresh() {
    const current = ++request;
    try {
      const user = await EscapeRecords.staff();
      if (current !== request) return;
      link.dataset.status = user ? 'signed-in' : 'signed-out';
      const label = user ? '직원 로그인됨 · 계정 관리' : '직원 로그인';
      link.setAttribute('aria-label', label);
      link.title = label;
    } catch {
      if (current !== request) return;
      link.dataset.status = 'unknown';
      link.setAttribute('aria-label', '로그인 상태 확인 불가 · 직원 로그인');
      link.title = '로그인 상태 확인 불가 · 직원 로그인';
    }
  }
  window.addEventListener('pageshow', refresh);
  window.addEventListener('focus', refresh);
  window.addEventListener('storage', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  const ready = refresh();
  return { ready, refresh };
})();
