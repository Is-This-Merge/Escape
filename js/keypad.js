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
