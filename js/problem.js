// 실제 운영 시 각 문제의 key, 설명, 힌트를 교체하세요.
const puzzleSets = {
  doll: [
    { key: 'D01', title: '닫힌 인형 상자', description: '상자에 적힌 숫자는 2, 4, 6, 8입니다. 다음에 올 숫자를 입력하세요.', hint: '숫자가 두 개씩 커집니다.', answer: '10' },
    { key: 'D02', title: '인형의 생일', description: '카드에 “3월 14일, 네가 처음 눈을 뜬 날”이라고 적혀 있습니다. 네 자리 비밀번호를 찾으세요.', hint: '월과 일을 각각 두 자리로 적으세요.', answer: '0314' },
    { key: 'D03', title: '멈춘 자장가', description: '악보가 “도, 레, 미, 파”에서 끊겼습니다. 다음 음은 무엇인가요?', hint: '도레미파 다음에 오는 음입니다.', answer: '솔' },
    { key: 'D04', title: '거울 속 이름', description: '거울에 비친 글자는 “형인”입니다. 순서를 뒤집어 이름을 읽으세요.', hint: '두 글자를 뒤에서부터 읽으세요.', answer: '인형' },
    { key: 'D05', title: '마지막 봉인', description: '봉인에 “하나, 셋, 다섯, 일곱”이 새겨져 있습니다. 순서대로 네 자리 숫자를 입력하세요.', hint: '각 낱말을 숫자 한 자리로 바꾸세요.', answer: '1357' }
  ],
  hideout: [
    { key: 'H01', title: '은신처 입구', description: '출입 기록은 5, 10, 15, 20에서 끊겼습니다. 다음 숫자를 입력하세요.', hint: '매번 5가 더해집니다.', answer: '25' },
    { key: 'H02', title: '낡은 무전기', description: '메모에 “아홉, 하나, 일곱”이라고 적혀 있습니다. 세 자리 코드를 입력하세요.', hint: '낱말을 순서대로 숫자로 바꾸세요.', answer: '917' },
    { key: 'H03', title: '비밀 지도', description: '지도에 “해가 뜨는 방향으로 이동하라”라고 적혀 있습니다. 어느 방향인가요?', hint: '서쪽의 반대 방향입니다.', answer: '동쪽' },
    { key: 'H04', title: '보급 창고', description: '상자 네 개에 각각 건전지가 세 개씩 있습니다. 건전지는 모두 몇 개인가요?', hint: '4 곱하기 3을 계산하세요.', answer: '12' },
    { key: 'H05', title: '비상 출구', description: '마지막 메모는 “8에서 시작해 2씩 줄여라”입니다. 8을 포함해 네 자리 코드를 입력하세요.', hint: '8, 6 다음의 두 숫자를 이어 적으세요.', answer: '8642' }
  ]
};
const problems = puzzleSets[EscapeTheme.current];
const keyInput = document.getElementById('problem-key');
const hintTitle = document.getElementById('hint-title');
const hintText = document.getElementById('hint-text');
const keyFeedback = document.getElementById('key-feedback');
const hintDialog = document.getElementById('hint-dialog');
const keyError = document.getElementById('key-error');
document.getElementById('close-hint').addEventListener('click', () => hintDialog.close());
hintDialog.addEventListener('close', () => keyInput.focus());
document.getElementById('key-form').addEventListener('submit', event => {
  event.preventDefault();
  const key = keyInput.value.trim().normalize('NFKC').toUpperCase();
  const index = problems.findIndex(problem => problem.key === key);
  if (index === -1) {
    keyError.textContent = '일치하는 문제가 없습니다. 키를 확인해주세요.';
    keyInput.focus();
    return;
  }
  const problem = problems[index];
  keyError.textContent = '';
  const firstView = !EscapeGame.run.hints.includes(index);
  if (firstView) {
    EscapeGame.run.hints.push(index);
    EscapeGame.run.penalty += 600;
    EscapeGame.save();
    EscapeGame.update();
  }
  hintTitle.textContent = problem.title;
  hintText.textContent = problem.hint;
  keyFeedback.textContent = firstView ? '10분이 추가되었습니다.' : '추가 시간 없음';
  if (!hintDialog.open) hintDialog.showModal();
});
