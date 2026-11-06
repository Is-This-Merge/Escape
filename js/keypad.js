// Keep brief tablet taps visible, then fade out without expanding the background.
document.querySelectorAll('.number-pad button').forEach(button => {
  let releaseTimer;
  const clearPress = () => {
    clearTimeout(releaseTimer);
    button.classList.remove('is-pressed');
  };
  button.addEventListener('pointerdown', () => {
    if (button.disabled) return;
    clearTimeout(releaseTimer);
    button.classList.add('is-pressed');
  });
  button.addEventListener('pointerup', () => {
    releaseTimer = setTimeout(clearPress, 120);
  });
  button.addEventListener('pointercancel', clearPress);
  button.addEventListener('pointerleave', clearPress);
  button.addEventListener('blur', clearPress);
});

function renderCode() {
  for (let i = 0; i < 3; i++) {
    document.getElementById('code-slot-' + i).textContent = keyInput.value[i] || '';
  }
}
keyInput.addEventListener('input', () => {
  keyInput.value = keyInput.value.normalize('NFKC').replace(/[^0-9]/g, '').slice(0, 3);
  renderCode();
});
document.querySelectorAll('[data-digit]').forEach(button => {
  button.addEventListener('click', () => {
    if (keyInput.value.length < 3) keyInput.value += button.dataset.digit;
    renderCode();
  });
});
document.getElementById('code-backspace').addEventListener('click', () => {
  keyInput.value = keyInput.value.slice(0, -1);
  renderCode();
});
renderCode();
