const guideTabs = ['site', 'lock'];
function selectGuide(name) {
  guideTabs.forEach(id => {
    const selected = id === name;
    const tab = document.getElementById(id + '-tab');
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(id + '-guide').hidden = !selected;
  });
}
guideTabs.forEach((name, index) => {
  const tab = document.getElementById(name + '-tab');
  tab.addEventListener('click', () => selectGuide(name));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'site' : event.key === 'End' ? 'lock' : guideTabs[1 - index];
    selectGuide(next);
    document.getElementById(next + '-tab').focus();
  });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && window.parent !== window) window.parent.postMessage('close-guide', '*');
});
