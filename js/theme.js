const EscapeTheme = (() => {
  const concepts = { doll: { title: 'The Escape', subtitle: '저주받은 인형' }, hideout: { title: 'DEAD END', subtitle: '옛 은신처' } };
  let current = localStorage.getItem('escape_theme');
  if (!concepts[current]) current = 'doll';
  function apply(id) {
    current = concepts[id] ? id : 'doll';
    localStorage.setItem('escape_theme', current);
    document.documentElement.dataset.theme = current;
    document.title = concepts[current].title + ': ' + concepts[current].subtitle;
    document.querySelectorAll('[data-concept-title]').forEach(el => el.textContent = concepts[current].title);
    document.querySelectorAll('[data-concept-subtitle]').forEach(el => el.textContent = concepts[current].subtitle);
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      const label = (current === 'doll' ? '옛 은신처' : '저주받은 인형') + ' 컨셉으로 전환';
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
    }
  }
  document.documentElement.dataset.theme = current;
  document.addEventListener('DOMContentLoaded', () => {
    apply(current);
    document.getElementById('theme-toggle')?.addEventListener('click', () => apply(current === 'doll' ? 'hideout' : 'doll'));
  });
  return { concepts, apply, get current() { return current; } };
})();
