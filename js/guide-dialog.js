const guideDialog = document.getElementById('guide-dialog');
document.getElementById('open-guide').addEventListener('click', () => guideDialog.showModal());
document.getElementById('close-guide').addEventListener('click', () => guideDialog.close());
window.addEventListener('message', event => {
  if (event.source === document.getElementById('guide-frame').contentWindow && event.data === 'close-guide') guideDialog.close();
});
