const EscapeGame = (() => {
  const key = `escape_run_${EscapeTheme.current}`;
  let run;
  try { run = JSON.parse(localStorage.getItem(key)); } catch { /* Start a new run. */ }
  if (!run || !Number.isFinite(run.startedAt) || !Number.isInteger(run.solved) || run.solved < 0 || run.solved > 5 || !Array.isArray(run.hints) || !Number.isFinite(run.penalty)) {
    run = { id: crypto.randomUUID(), concept: EscapeTheme.current, startedAt: Date.now(), solved: 0, hints: [], penalty: 0, finishedAt: null };
  }
  const save = () => localStorage.setItem(key, JSON.stringify(run));
  const elapsed = () => Math.max(0, Math.floor(((run.finishedAt ?? Date.now()) - run.startedAt) / 1000)) + run.penalty;
  const format = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  function update() { document.getElementById('timer').textContent = format(elapsed()); }
  save(); update();
  const interval = setInterval(update, 250);
  function finish() {
    run.finishedAt = run.finishedAt ?? Date.now();
    save(); clearInterval(interval); location.href = 'ending.html?view=result';
  }
  if (run.finishedAt) finish();
  return { run, save, elapsed, update, finish };
})();
