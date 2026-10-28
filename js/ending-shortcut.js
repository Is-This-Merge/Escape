// 현장 진행용 비밀번호입니다. 정적 웹이므로 서버 인증을 대신하지 않습니다.
const ENDING_PASSWORD = '1234';
const endingDialog = document.getElementById('ending-dialog');
const endingPassword = document.getElementById('ending-password');
const endingError = document.getElementById('ending-error');
document.getElementById('open-ending').addEventListener('click', () => {
  endingPassword.value = '';
  endingError.textContent = '';
  endingDialog.showModal();
  endingPassword.focus();
});
document.getElementById('cancel-ending').addEventListener('click', () => endingDialog.close());
document.getElementById('ending-password-form').addEventListener('submit', event => {
  event.preventDefault();
  if (endingPassword.value !== ENDING_PASSWORD) {
    endingError.textContent = '비밀번호가 올바르지 않습니다.';
    endingPassword.value = '';
    endingPassword.focus();
    return;
  }
  EscapeGame.run.solved = 5;
  EscapeGame.run.completedBy = 'operator';
  EscapeGame.finish();
});
