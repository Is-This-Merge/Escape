(() => {
  const artwork = {
    doll: [
      ['img/doll-poster.png', '따뜻한 조명 아래 목각인형이 놓인 인형 공방'],
      ['img/doll-logo.png', 'The Escape: 저주받은 인형 로고']
    ],
    hideout: [
      ['img/hideout-poster.png', 'DEAD END: 보석을 쥔 도둑이 서 있는 계단'],
      ['img/hideout-jewel-poster.png', 'DEAD END 옛 은신처: 붉은 보석과 경찰 통제선']
    ]
  };
  const dialog = document.getElementById('artwork-dialog');
  const image = document.getElementById('artwork-image');
  let items = [];
  let index = 0;
  function render() {
    image.src = items[index][0];
    image.alt = items[index][1];
    document.getElementById('artwork-page').textContent = `${index + 1} / ${items.length}`;
  }
  function move(step) {
    index = (index + step + items.length) % items.length;
    render();
  }
  document.getElementById('open-artwork').addEventListener('click', () => {
    items = artwork[EscapeTheme.current];
    index = 0;
    render();
    dialog.showModal();
  });
  document.getElementById('close-artwork').addEventListener('click', () => dialog.close());
  document.getElementById('previous-artwork').addEventListener('click', () => move(-1));
  document.getElementById('next-artwork').addEventListener('click', () => move(1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
})();
