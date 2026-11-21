(() => {
  "use strict";

  const INTRO_DIALOGUE = {
    speaker: "???",
    typingSpeedMs: 45,
    finishButton: {
      // 序章對話結尾按鈕文字，可在此修改。
      text: "拿出員工證",
    },
    lines: [
      {
        text: "以前加班到半夜，是為了別人的專案。現在站在這裡，倒也沒什麼不同",
        image: "./image/game/tachie/tachieA-1.png",
      },
      {
        text: "面試時，那位人事部長一直在笑，從頭笑到尾，連講到「我沒什麼特別的優點」的時候也在笑。",
        image: "./image/game/tachie/tachieA-2.png",
      },
      {
        text: "他提到深夜的學校「有一點不太乾淨」，但只要處理掉任何一個，月底就會多給一點錢。",
        image: "./image/game/tachie/tachieA-1.png",
      },
      {
        text: "今天是我要去藝償學校的第一天，希望一切順利。",
        image: "./image/game/tachie/tachieA-1.png",
      },
    ],
  };

  const speaker = document.querySelector("#intro-speaker");
  const dialogue = document.querySelector("#intro-dialogue");
  const continueHint = document.querySelector("#intro-continue");
  const portrait = document.querySelector("#intro-portrait");
  const portraitImage = document.querySelector("#intro-portrait-image");
  const finishButton = document.querySelector("#intro-finish-button");
  const finishText = document.querySelector("#intro-finish-text");
  const scene = document.querySelector("#intro-dialogue-scene");
  const nameCard = document.querySelector("#intro-name-card");
  const nameForm = document.querySelector("#intro-name-form");
  const nameInput = document.querySelector("#traveler-name");
  const nameSubmitButton = nameForm.querySelector('button[type="submit"]');

  let lineIndex = 0;
  let isTyping = false;
  let typingTimer = 0;

  speaker.textContent = INTRO_DIALOGUE.speaker;
  finishText.textContent = INTRO_DIALOGUE.finishButton.text;

  function updateControls() {
    const hasNextLine = lineIndex < INTRO_DIALOGUE.lines.length - 1;
    continueHint.hidden = isTyping || !hasNextLine;
    finishButton.hidden = isTyping || hasNextLine;
  }

  function renderLine() {
    const line = INTRO_DIALOGUE.lines[lineIndex];
    dialogue.textContent = "";
    if (portraitImage.getAttribute("src") !== line.image) {
      portraitImage.src = line.image;
    }
    portrait.classList.remove("ending-portrait--speaking");
    void portrait.offsetWidth;
    portrait.classList.add("ending-portrait--speaking");
    isTyping = true;
    updateControls();

    const characters = Array.from(line.text);
    let characterIndex = 0;
    const typeNextCharacter = () => {
      if (characterIndex >= characters.length) {
        typingTimer = 0;
        isTyping = false;
        updateControls();
        return;
      }
      dialogue.textContent += characters[characterIndex];
      characterIndex += 1;
      typingTimer = window.setTimeout(
        typeNextCharacter,
        INTRO_DIALOGUE.typingSpeedMs,
      );
    };
    typeNextCharacter();
  }

  function advanceDialogue() {
    if (isTyping) {
      window.clearTimeout(typingTimer);
      typingTimer = 0;
      dialogue.textContent = INTRO_DIALOGUE.lines[lineIndex].text;
      isTyping = false;
      updateControls();
      return;
    }
    if (lineIndex >= INTRO_DIALOGUE.lines.length - 1) return;
    lineIndex += 1;
    renderLine();
  }

  document
    .querySelector(".intro-dialogue-panel")
    .addEventListener("click", advanceDialogue);

  finishButton.addEventListener("click", () => {
    scene.hidden = true;
    nameCard.hidden = false;
    nameInput.focus();
  });

  nameInput.addEventListener("input", () => {
    const hasName = Boolean(nameInput.value.trim());
    nameSubmitButton.hidden = !hasName;
    nameSubmitButton.disabled = !hasName;
  });

  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const travelerName = nameInput.value.trim();
    if (!travelerName) {
      nameInput.focus();
      return;
    }
    window.location.href = `./game.html?traveler=${encodeURIComponent(travelerName)}`;
  });

  renderLine();
})();
