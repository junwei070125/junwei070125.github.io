(() => {
  const buttonSound = new Audio("./audio/button.mp3");
  const collectionSound = new Audio("./audio/irregular.mp3");
  const startSound = new Audio("./audio/start.mp3");
  const effectVolume = 0.75;
  const buttonSelector =
    ".action-button, .text-button, .ending-dialogue-finish, .intro-name-form button";
  let isNavigatingToIntro = false;

  buttonSound.volume = effectVolume;
  collectionSound.volume = effectVolume;

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
      playSound(buttonSound, "按鈕");
    },
    true,
  );

  window.playCollectionSound = () => playSound(collectionSound, "收集物件");
})();
