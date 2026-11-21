(() => {
  const buttonSound = new Audio("./audio/button.mp3");
  const menuSound = new Audio("./audio/sticky.mp3");
  const collectionSound = new Audio("./audio/irregular.mp3");
  const doorSound = new Audio("./audio/door.mp3");
  const screamSound = new Audio("./audio/scream.mp3");
  const startSound = new Audio("./audio/start.mp3");
  const effectVolume = 0.75;
  const buttonSelector =
    ".action-button, .text-button, .ending-dialogue-finish, .intro-name-form button, .menu-button";
  let isNavigatingToIntro = false;

  buttonSound.volume = effectVolume;
  menuSound.volume = effectVolume;
  collectionSound.volume = effectVolume;
  doorSound.volume = effectVolume;
  screamSound.volume = effectVolume;

  function playSound(audio, label) {
    audio.currentTime = 0;
    return audio.play().catch((error) => {
      console.error(`[Light the Void] ${label} 音效播放失敗。`, error);
      return false;
    });
  }

  document.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof Element)) return;
      const startLink = event.target.closest(".play-button");
      if (startLink) {
        const isModifiedClick =
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey;
        if (isModifiedClick) {
          playSound(startSound, "首頁開始");
          return;
        }

        event.preventDefault();
        if (isNavigatingToIntro) return;
        isNavigatingToIntro = true;
        playSound(startSound, "首頁開始").then((started) => {
          window.setTimeout(
            () => window.location.assign(startLink.href),
            started === false ? 0 : 200,
          );
        });
        return;
      }

      const button = event.target.closest(buttonSelector);
      if (!button || button.disabled) return;
      playSound(
        button.matches(".menu-button") ? menuSound : buttonSound,
        "按鈕",
      );
    },
    true,
  );

  window.playCollectionSound = (imageNumber) => {
    if (imageNumber === 4) return playSound(doorSound, "物件 4");
    if (imageNumber === 14) return playSound(screamSound, "物件 14");
    return playSound(collectionSound, "收集物件");
  };
})();
