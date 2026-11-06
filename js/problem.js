// Each puzzle owns its hints, ordered from general to specific.
const puzzleSets = {
  "doll": [
    {
      "key": "353",
      "title": "맞춤 인형 주문서",
      "hints": [
        "인형 B와 주문서를 대조해보세요.",
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
        "1109"
      ]
    },
    {
      "key": "415",
      "title": "저주인형 사용 방법",
      "hints": [
        "'압사'는 제시문이 있는 책상에 깔려있습니다.",
        "'못박기'는 입구 쪽 화이트보드에 있습니다.",
        "'생매장'은 입구 쪽 높은 책상 위의 화분에 있습니다.",
        "'난도질'은 입구 기준 오른편 파란 의자 위에 있습니다.",
        "'익사'는 입구 기준 왼편 책상 위 물컵 속에 있습니다.",
        "3697"
      ]
    },
    {
      "key": "769",
      "title": "탈출",
      "hints": [
        "두 개의 목각인형을 이용하세요.",
        "목각인형의 숫자는 순서를 의미합니다.",
        "칠판의 한자가 등장하는 순서를 이용하세요.",
        "0486"
      ]
    }
  ],
  "hideout": [
    {
      "key": "376",
      "title": "1번 문제",
      "hints": [
        "누른 횟수만큼 키패드의 알파벳을 고르세요. (2=A, 22=B, 222=C)",
        "2/66/4/33/555로 끊어읽으세요.",
        "1004"
      ]
    },
    {
      "key": "883",
      "title": "2번 문제",
      "hints": [
        "필름을 두 장씩 겹쳐 보세요.",
        "색칠된 칸이 아닌, 빈 칸을 보세요.",
        "B+G, C+F, D+H, A+E 메모 순서대로 읽으세요.",
        "5140"
      ]
    },
    {
      "key": "410",
      "title": "3번 문제",
      "hints": [
        "문제의 색을 보석 색끼리 섞어 만들어 보세요.",
        { "image": "img/힌트1.png", "alt": "색 혼합 힌트. 주황은 빨강과 노랑, 보라는 빨강과 파랑, 초록은 파랑과 노랑, 검정은 빨강과 파랑과 노랑의 조합입니다." },
        "5679"
      ]
    },
    {
      "key": "515",
      "title": "4번 문제",
      "hints": [
        "키패드의 모양과 비교해보세요.",
        { "image": "img/힌트2.png", "alt": "도형 힌트. 아래쪽과 오른쪽 선은 1, 위쪽과 왼쪽 선은 9, 위쪽과 오른쪽과 아래쪽 선은 4입니다." },
        "7256"
      ]
    },
    {
      "key": "219",
      "title": "5번 문제",
      "hints": [
        "달력에 UV를 비춰보세요.",
        "달력 아래 알파벳을 이어 읽으세요.",
        "달마다 표시된 날짜를 더해 아스키 코드로 읽으세요.",
        "fivethreenine = 539"
      ]
    },
    {
      "key": "017",
      "title": "6번 문제",
      "hints": [
        "왼쪽 위 M을 (1,1)로 보고, (가로, 세로)로 읽으세요.",
        "Where Sherlock lives",
        "221"
      ]
    },
    {
      "key": "629",
      "title": "7번 문제",
      "hints": [
        "신분증 뒷면을 보세요.",
        "네 장을 2x2로 이어 붙이세요.",
        "7002"
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
  // A step can be text or an object with image, alt and optional text.
  const step = hintSteps[hintStep];
  hintText.replaceChildren();
  hintText.classList.remove('has-image');
  hintDialog.classList.remove('has-image');
  if (typeof step === 'string') {
    hintText.textContent = step;
  } else {
    if (step.text) {
      const caption = document.createElement('p');
      caption.textContent = step.text;
      hintText.append(caption);
    }
    if (step.image) {
      const image = document.createElement('img');
      image.src = step.image;
      image.alt = step.alt || `${hintTitle.textContent} 이미지 힌트`;
      image.draggable = false;
      hintText.classList.add('has-image');
      hintDialog.classList.add('has-image');
      hintText.append(image);
    }
  }
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
  document.getElementById('hint-count').textContent = `힌트 사용 ${EscapeGame.run.hints.length}회`;
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
    EscapeGame.run.penalty += currentConcept === 'hideout' ? 180 : 420;
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

