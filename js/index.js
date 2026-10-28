document.addEventListener('DOMContentLoaded', () => {
  const start = document.getElementById('start-button');
  function startGame(event) {
    event.preventDefault();
    localStorage.removeItem('escape_run_' + EscapeTheme.current);
    location.href = 'playing.html';
  }
  start.closest('a').addEventListener('click', startGame);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.repeat && (event.target === document.body || event.target === start)) startGame(event);
  });
});
