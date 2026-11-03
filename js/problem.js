// Each puzzle owns its hints, ordered from general to specific.
const puzzleSets = {
  "doll": [
    {
      "key": "353",
      "title": "맞춤 인형 주문서",
      "hints": [
        "3152"
      ]
    },
    {
      "key": "707",
      "title": "인형 시선 교정",
      "hints": [
        "공방 주인의 작업일지를 자세히 살펴보세요. 인형의 눈을 완성한 순서와 사용해서는 안 되는 눈에 대한 기록이 있습니다.",
        "공방 주인의 딸은 숫자 7을 두려워했습니다. 교정 위치표에 7이 포함된 인형은 제외하고, 남은 인형들의 제작 순서를 확인하세요.",
        "남은 인형들의 눈동자가 바라보는 방향을 확인하세요. 각 인형의 교정 위치표에서 해당 방향의 숫자를 찾아 제작 순서대로 배열하면 됩니다.",
        "3842"
      ]
    },
    {
      "key": "061",
      "title": "상자",
      "hints": [
        "상자를 잘 살펴보세요.",
        "눈의 모양을 잘 관찰하세요.",
        "눈을 잘 살펴보세요.",
        "답"
      ]
    },
    {
      "key": "415",
      "title": "저주인형 사용 방법",
      "hints": [
        "사진들의 위치",
        "답"
      ]
    },
    {
      "key": "769",
      "title": "탈출",
      "hints": [
        "처음 받았던 목각인형을 이용하세요.",
        "목각인형의 숫자는 순서를 의미합니다.",
        "답"
      ]
    }
  ],
  "hideout": [
    {
      "key": "571",
      "title": "은신처 입구",
      "hints": [
        "매번 5가 더해집니다.",
        "10 − 5와 15 − 10을 계산해 공통된 간격을 찾으세요.",
        "마지막 기록 20에 공통 간격인 5를 더하세요."
      ]
    },
    {
      "key": "142",
      "title": "낡은 무전기",
      "hints": [
        "낱말을 순서대로 숫자로 바꾸세요.",
        "아홉은 9, 하나는 1입니다. 낱말의 순서를 바꾸지 마세요.",
        "아홉 = 9, 하나 = 1, 일곱 = 7입니다. 세 숫자를 이어 쓰세요."
      ]
    },
    {
      "key": "713",
      "title": "비밀 지도",
      "hints": [
        "서쪽의 반대 방향입니다.",
        "해가 뜨는 방향과 해가 지는 방향은 서로 반대입니다.",
        "해는 동쪽에서 뜹니다. 방향 이름인 동쪽을 입력하세요."
      ]
    },
    {
      "key": "285",
      "title": "보급 창고",
      "hints": [
        "4 곱하기 3을 계산하세요.",
        "상자 하나에 3개씩 있으므로 3을 상자 수만큼 더하세요.",
        "상자는 4개입니다. 3 + 3 + 3 + 3을 계산하세요."
      ]
    },
    {
      "key": "856",
      "title": "비상 출구",
      "hints": [
        "8, 6 다음의 두 숫자를 이어 적으세요.",
        "첫 숫자는 8입니다. 바로 다음 숫자는 8 − 2인 6입니다.",
        "6에서 2를 빼면 4, 다시 2를 빼면 2입니다. 8부터 네 숫자를 이어 쓰세요."
      ]
    }
  ]
};
const problems = puzzleSets[EscapeTheme.current];
const keyInput = document.getElementById('problem-key');
const hintTitle = document.getElementById('hint-title');
const hintText = document.getElementById('hint-text');
const hintDialog = document.getElementById('hint-dialog');
const keyError = document.getElementById('key-error');
let hintSteps = [];
let hintStep = 0;
function renderHintStep() {
  hintText.textContent = hintSteps[hintStep];
  document.getElementById('hint-page').textContent = `${hintStep + 1} / ${hintSteps.length}`;
  document.getElementById('previous-hint').disabled = hintStep === 0;
  document.getElementById('next-hint').disabled = hintStep === hintSteps.length - 1;
}
function moveHint(step) {
  if (!hintSteps.length) return;
  hintStep = Math.max(0, Math.min(hintSteps.length - 1, hintStep + step));
  renderHintStep();
}
document.getElementById('previous-hint').addEventListener('click', () => moveHint(-1));
document.getElementById('next-hint').addEventListener('click', () => moveHint(1));
hintDialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    moveHint(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
let touchStart = null;
hintText.addEventListener('touchstart', event => {
  const touch = event.touches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });
hintText.addEventListener('touchend', event => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) moveHint(dx < 0 ? 1 : -1);
  touchStart = null;
}, { passive: true });
hintText.addEventListener('touchcancel', () => { touchStart = null; });
function updateHintCount() {
  document.getElementById('hint-count').textContent = `${EscapeGame.run.hints.length} / ${problems.length}`;
}
updateHintCount();
document.getElementById('close-hint').addEventListener('click', () => hintDialog.close());
hintDialog.addEventListener('close', () => keyInput.focus());
document.getElementById('key-form').addEventListener('submit', event => {
  event.preventDefault();
  const key = keyInput.value.trim().normalize('NFKC');
  const currentConcept = EscapeTheme.current;
  if (currentConcept !== EscapeGame.run.concept) {
    keyError.textContent = '컨셉이 변경되었습니다. 홈에서 다시 시작해주세요.';
    return;
  }
  const currentProblems = puzzleSets[currentConcept] || [];
  const index = /^[0-9]{3}$/.test(key) ? currentProblems.findIndex(problem => problem.key === key) : -1;
  if (index === -1) {
    keyError.textContent = '일치하는 문제가 없습니다. 키를 확인해주세요.';
    keyInput.focus();
    return;
  }
  const problem = currentProblems[index];
  keyError.textContent = '';
  const firstView = !EscapeGame.run.hints.includes(index);
  if (firstView) {
    EscapeGame.run.hints.push(index);
    EscapeGame.run.penalty += 600;
    EscapeGame.save();
    EscapeGame.update();
    updateHintCount();
  }
  hintTitle.textContent = problem.title;
  hintSteps = problem.hints;
  hintStep = 0;
  renderHintStep();
  if (!hintDialog.open) hintDialog.showModal();
});
