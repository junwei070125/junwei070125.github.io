(() => {
  "use strict";

  // 遊戲的畫布座標為 1280 × 720；CSS 只等比例縮放，不改變遊戲世界座標。
  const CONFIG = {
    canvas: { width: 1280, height: 720 },
    homePath: "./index.html",
    // 作者檢查工具預設關閉；發布前請保持 false。需要檢查時以 true 開啟並使用 #author-dev。
    developerMode: false,
    background: {
      startPosition: 0,
      speed: 220, // 初始背景速度；調整遊戲一開始的速度（畫布像素／秒）。
      accelerationStartAfterCollectedItems: 8, // 收集達指定數量後開始加速。
      speedIncreaseAtStart: 150, // 開始加速時額外增加的速度（畫布像素／秒）。
      speedIncreaseAtEnd: 300, // 加速至最後物件前的最高額外速度（畫布像素／秒）。
      endingDecelerationPower: 2, // >>> 最後物件後減速：越大越晚減慢，抵達終點時速度仍為 0。
      background1Length: 43008, // 背景圖原始顯示寬度，單位：畫布像素。
      background2Length: 43008, // 第二層實際顯示寬度；兩層共用同一世界位移。
      backgroundHeight: 720, // 背景圖顯示高度，單位：畫布像素。
      endPadding: 0, // 終點位置可微調的像素值；0 表示底層背景右緣到達畫面右緣。
    },
    spotlight: {
      x: 300, // 扇形圓心，單位：畫布像素。
      y: 440,
      radius: 650, // 遮罩半徑，單位：畫布像素。
      angleDegrees: 60, // 固定圓心角。
      initialDirectionDegrees: 0, // 初始朝向畫面右方；滑鼠移動後即時跟隨。
    },
    character: {
      x: 250, // 主角固定畫布位置，不隨背景移動。
      y: 420,
      width: 115, // 顯示寬、高分開調整，單位：畫布像素。
      height: 150,
      collisionRadius: 38, // 主角圓形碰撞半徑，單位：畫布像素。
      walkImage: "./image/game/character/character-1.gif",
      runImage: "./image/game/character/character-2.gif",
    },
    collectible: {
      count: 60,
      image: "./image/game/item/item.png", // 指定素材位置；不以其他素材代替。
      collisionRadius: 22, // 與主角碰撞的半徑，單位：畫布像素。
      clickPadding: 20, // 點擊範圍額外擴大的像素。
      score: 1000, // 每個物件成功收集所得分數。
    },
    player: {
      startingHealth: 3,
      startingScore: 196,
      damageFlashMs: 1000, // 扣血後 HP 圖示閃爍時間，單位：毫秒。
    },
    combo: {
      startingValue: 0,
      comboBonusMultiplier: 100, // 結算時每點最高 Combo 額外分數。
    },
    ending: {
      // >>> character-3 位置：手動調整下方 X/Y（背景世界座標，非畫面座標）。
      characterX: 42500,
      characterY: 420,
      characterWidth: 110,
      characterHeight: 150,
      dialogue: {
        typingSpeedMs: 45,
        layout: {
          portraitA: { left: "4%", bottom: "24%", width: "34%", height: "70%" },
          portraitB: {
            right: "4%",
            bottom: "24%",
            width: "34%",
            height: "70%",
          },
          panel: { left: "7%", bottom: "4%", width: "86%" },
          finishButton: { right: "7%", bottom: "29%" },
        },
      },
    },
    assets: {
      background1: "./image/game/background/background-1.png",
      background2: "./image/game/background/background-2.png",
      fullHealth: "./image/game/icon/HP.png",
      emptyHealth: "./image/game/icon/empty.png",
      money: "./image/game/icon/money.png",
      // 以下素材由 HTML 載入並同樣列入失敗檢查。
      ui: [
        "./image/game/howtoplay.png",
        "./image/game/gotit.png",
        "./image/game/menu.png",
        "./image/game/menubg.gif",
        "./image/game/button.png",
        "./image/game/result.png",
      ],
    },
  };

  // 結局對話資料：每段可用 images 覆寫任一角色立繪，未指定時使用角色預設圖。
  const ENDING_DIALOGUE = {
    portraits: {
      player: {
        name: "旅人",
        image: "./image/game/tachie/tachieA-1.png",
      },
      director: {
        name: "主任",
        image: "./image/game/tachie/tachieB-1.png",
      },
    },
    lines: [
      { speaker: "director", text: "終於抵達旅程的終點了。" },
      {
        speaker: "player",
        text: "謝謝你一路陪著我，讓我能點亮前方的黑暗。",
        images: { player: "./image/game/tachie/tachieA-2.png" },
      },
      {
        speaker: "director",
        text: "謝謝你一路點亮黑暗，接下來就由我陪你回家吧。",
      },
    ],
  };

  // 60 個物件的固定背景世界座標（x、y 單位皆為畫布像素）。
  // imageNumber 是該物件使用的圖片編號；例如改成 12 就會載入 item-12.png。
  const ITEM_POSITIONS = [
    { x: 1380, y: 454, imageNumber: 5 },
    { x: 1812, y: 383, imageNumber: 12 },
    { x: 2064, y: 310, imageNumber: 7 },
    { x: 2507, y: 452, imageNumber: 8 },
    { x: 2913, y: 433, imageNumber: 9 },
    { x: 3345, y: 309, imageNumber: 14 },
    { x: 3818, y: 462, imageNumber: 1 },
    { x: 4112, y: 337, imageNumber: 10 },
    { x: 4931, y: 461, imageNumber: 3 },
    { x: 5603, y: 437, imageNumber: 13 },
    { x: 6398, y: 461, imageNumber: 2 },
    { x: 6777, y: 264, imageNumber: 6 },
    { x: 6930, y: 380, imageNumber: 14 },
    { x: 7676, y: 343, imageNumber: 11 },
    { x: 8127, y: 365, imageNumber: 4 },
    { x: 8593, y: 309, imageNumber: 12 },
    { x: 9017, y: 265, imageNumber: 6 },
    { x: 9571, y: 453, imageNumber: 8 },
    { x: 10253, y: 338, imageNumber: 10 },
    { x: 10956, y: 252, imageNumber: 6 },
    { x: 11363, y: 365, imageNumber: 4 },
    { x: 12307, y: 310, imageNumber: 7 },
    { x: 13135, y: 468, imageNumber: 3 },
    { x: 14177, y: 430, imageNumber: 9 },
    { x: 15034, y: 459, imageNumber: 5 },
    { x: 15480, y: 266, imageNumber: 6 },
    { x: 16145, y: 460, imageNumber: 2 },
    { x: 16658, y: 382, imageNumber: 14 },
    { x: 16978, y: 462, imageNumber: 1 },
    { x: 17758, y: 461, imageNumber: 3 },
    { x: 18450, y: 310, imageNumber: 7 },
    { x: 20484, y: 265, imageNumber: 6 },
    { x: 21117, y: 437, imageNumber: 13 },
    { x: 21984, y: 461, imageNumber: 2 },
    { x: 22743, y: 309, imageNumber: 12 },
    { x: 24061, y: 343, imageNumber: 11 },
    { x: 24418, y: 430, imageNumber: 9 },
    { x: 25256, y: 459, imageNumber: 5 },
    { x: 25641, y: 252, imageNumber: 6 },
    { x: 26457, y: 461, imageNumber: 3 },
    { x: 27090, y: 454, imageNumber: 8 },
    { x: 27635, y: 262, imageNumber: 6 },
    { x: 28515, y: 430, imageNumber: 9 },
    { x: 28945, y: 309, imageNumber: 12 },
    { x: 29710, y: 310, imageNumber: 7 },
    { x: 30696, y: 252, imageNumber: 6 },
    { x: 31232, y: 459, imageNumber: 5 },
    { x: 32205, y: 383, imageNumber: 12 },
    { x: 32783, y: 262, imageNumber: 6 },
    { x: 33810, y: 314, imageNumber: 7 },
    { x: 34300, y: 343, imageNumber: 11 },
    { x: 35616, y: 462, imageNumber: 1 },
    { x: 36110, y: 309, imageNumber: 14 },
    { x: 36408, y: 461, imageNumber: 3 },
    { x: 37401, y: 462, imageNumber: 1 },
    { x: 38138, y: 461, imageNumber: 3 },
    { x: 38752, y: 430, imageNumber: 9 },
    { x: 39015, y: 365, imageNumber: 4 },
    { x: 39519, y: 460, imageNumber: 8 },
    { x: 40046, y: 258, imageNumber: 6 },
  ];

  const canvas = document.querySelector("#game-canvas");
  const context = canvas.getContext("2d");
  const shell = document.querySelector(".game-shell");
  let characterElement = document.querySelector("#game-character");
  const assetWarning = document.querySelector("#asset-warning");
  const healthDisplay = document.querySelector("#health-display");
  const scoreDisplay = document.querySelector("#score-display");
  const comboDisplay = document.querySelector("#combo-display");
  const overlays = {
    intro: document.querySelector("#intro-overlay"),
    pause: document.querySelector("#pause-overlay"),
    failure: document.querySelector("#failure-overlay"),
    result: document.querySelector("#result-overlay"),
  };
  const missingAssets = new Set();
  const itemImages = new Map();
  const maxScroll =
    Math.max(
      CONFIG.background.background1Length,
      CONFIG.background.background2Length,
    ) -
    CONFIG.canvas.width +
    CONFIG.background.endPadding;

  let state = "intro";
  let scrollX = CONFIG.background.startPosition;
  let collectedItemCount = 0;
  let accelerationStartScrollX =
    CONFIG.background.accelerationStartAfterCollectedItems <= 0
      ? CONFIG.background.startPosition
      : null;
  let score = CONFIG.player.startingScore;
  let health = CONFIG.player.startingHealth;
  let currentCombo = CONFIG.combo.startingValue;
  let maxCombo = CONFIG.combo.startingValue;
  let spotlightAngle =
    (CONFIG.spotlight.initialDirectionDegrees * Math.PI) / 180;
  let animationFrameId = 0;
  let previousFrameTime = 0;
  let flashTimerId = 0;
  let dialogueTimerId = 0;
  let dialogueIndex = 0;
  let isDialogueTyping = false;
  let endingApproachElapsed = null;
  let endingApproachStart = 0;
  let endingApproachDuration = 0;
  let isFlashing = false;
  let developerScroll = null;
  let items = [];

  const isDeveloperMode =
    CONFIG.developerMode && window.location.hash === "#author-dev";
  const endingInteraction = document.querySelector("#ending-interaction");
  const endingDialogueScene = document.querySelector("#ending-dialogue-scene");
  const endingDialoguePanel = document.querySelector("#ending-dialogue-panel");
  const endingSpeaker = document.querySelector("#ending-speaker");
  const endingDialogue = document.querySelector("#ending-dialogue");
  const endingContinue = document.querySelector("#ending-continue");
  const endingFinishButton = document.querySelector("#ending-finish-button");
  const endingPortraitA = document.querySelector("#ending-portrait-a");
  const endingPortraitB = document.querySelector("#ending-portrait-b");
  const endingPortraitAImage = endingPortraitA.querySelector("img");
  const endingPortraitBImage = endingPortraitB.querySelector("img");
  const endingPortraitAName = endingPortraitA.querySelector(
    ".ending-portrait__name",
  );
  const endingPortraitBName = endingPortraitB.querySelector(
    ".ending-portrait__name",
  );
  const characterButton = document.querySelector("#character-button");
  characterButton.style.width = `${(CONFIG.ending.characterWidth / CONFIG.canvas.width) * 100}%`;
  characterButton.style.height = `${(CONFIG.ending.characterHeight / CONFIG.canvas.height) * 100}%`;
  const dialogueLayout = CONFIG.ending.dialogue.layout;
  Object.assign(endingPortraitA.style, dialogueLayout.portraitA);
  Object.assign(endingPortraitB.style, dialogueLayout.portraitB);
  Object.assign(endingDialoguePanel.style, dialogueLayout.panel);
  Object.assign(endingFinishButton.style, dialogueLayout.finishButton);
  endingPortraitAImage.src = ENDING_DIALOGUE.portraits.player.image;
  endingPortraitAName.textContent = ENDING_DIALOGUE.portraits.player.name;
  endingPortraitBImage.src = ENDING_DIALOGUE.portraits.director.image;
  endingPortraitBName.textContent = ENDING_DIALOGUE.portraits.director.name;

  function loadAsset(key, source) {
    const image = new Image();
    image.addEventListener("load", () => {
      if (key === "howtoplay") {
        document.querySelector(".instruction-art").style.display = "block";
        document.querySelector(".fallback-instructions").hidden = true;
      }
      draw();
    });
    image.addEventListener("error", () => reportMissingAsset(source));
    image.src = source;
    return image;
  }

  function reportMissingAsset(source) {
    if (missingAssets.has(source)) return;
    missingAssets.add(source);
    console.error(
      `[Light the Void] 素材載入失敗：${source}。請確認檔名及路徑。`,
    );
    assetWarning.hidden = false;
    assetWarning.textContent = `素材載入失敗（${missingAssets.size}）：${[...missingAssets].join("、")}`;
  }

  const background1 = loadAsset("background1", CONFIG.assets.background1);
  const background2 = loadAsset("background2", CONFIG.assets.background2);
  const fullHealthImage = loadAsset("fullHealth", CONFIG.assets.fullHealth);
  const emptyHealthImage = loadAsset("emptyHealth", CONFIG.assets.emptyHealth);
  const moneyImage = loadAsset("money", CONFIG.assets.money);
  let activeCharacterMode = null;
  CONFIG.assets.ui.forEach((source) => {
    const key = source.split("/").pop().split(".")[0];
    loadAsset(key, source);
  });

  function getItemImage(imageNumber) {
    if (
      !Number.isInteger(imageNumber) ||
      imageNumber < 1 ||
      imageNumber > CONFIG.collectible.count
    ) {
      throw new RangeError(
        `物件圖片編號必須介於 1 到 ${CONFIG.collectible.count}：${imageNumber}`,
      );
    }
    if (itemImages.has(imageNumber)) return itemImages.get(imageNumber);

    const itemDirectory = CONFIG.collectible.image.slice(
      0,
      CONFIG.collectible.image.lastIndexOf("/") + 1,
    );
    const image = loadAsset(
      `item-${imageNumber}`,
      `${itemDirectory}item-${imageNumber}.png`,
    );
    itemImages.set(imageNumber, image);
    return image;
  }

  document.querySelectorAll("img[data-asset-label]").forEach((image) => {
    image.addEventListener("error", () => {
      const source = image.getAttribute("src");
      reportMissingAsset(`${image.dataset.assetLabel}（${source}）`);
    });
    image.addEventListener("load", () => {
      image.style.display = "block";
      if (image.closest(".intro-card")) {
        document.querySelector(".fallback-instructions").hidden = true;
      }
    });
  });

  function makeItems() {
    return ITEM_POSITIONS.map((position, index) => ({
      id: index + 1,
      x: position.x,
      y: position.y,
      imageNumber: position.imageNumber,
      image: getItemImage(position.imageNumber),
      collected: false,
      touchingCharacter: false,
      offscreenHandled: false,
    }));
  }

  function getItemImageSize(item) {
    if (!item.image.complete || item.image.naturalWidth === 0) {
      return { width: 0, height: 0 };
    }
    const backgroundScale = getBackgroundScale();
    return {
      width: item.image.naturalWidth * backgroundScale.x,
      height: item.image.naturalHeight * backgroundScale.y,
    };
  }

  function getBackgroundScale() {
    if (
      !background2.complete ||
      background2.naturalWidth === 0 ||
      background2.naturalHeight === 0
    ) {
      return { x: 1, y: 1 };
    }
    return {
      x: CONFIG.background.background2Length / background2.naturalWidth,
      y: CONFIG.background.backgroundHeight / background2.naturalHeight,
    };
  }

  function updateHud() {
    healthDisplay.classList.toggle("health-display--flash", isFlashing);
    healthDisplay.replaceChildren();
    for (let index = 0; index < CONFIG.player.startingHealth; index += 1) {
      const icon = document.createElement("span");
      const isAlive = index < health;
      icon.className = `health-icon${isAlive ? "" : " health-icon--empty"}`;
      icon.setAttribute("aria-label", isAlive ? "剩餘生命" : "已失去生命");
      const image = isAlive ? fullHealthImage : emptyHealthImage;
      if (image.complete && image.naturalWidth > 0) {
        const iconImage = document.createElement("img");
        iconImage.src = image.src;
        iconImage.alt = "";
        icon.append(iconImage);
      } else {
        icon.textContent = isAlive ? "♥" : "♡";
      }
      healthDisplay.append(icon);
    }

    scoreDisplay.replaceChildren();
    if (moneyImage.complete && moneyImage.naturalWidth > 0) {
      const icon = document.createElement("img");
      icon.src = moneyImage.src;
      icon.alt = "";
      icon.width = 24;
      icon.height = 24;
      icon.style.verticalAlign = "middle";
      scoreDisplay.append(icon, document.createTextNode(` ${score}`));
    } else {
      scoreDisplay.textContent = `✦ ${score}`;
    }
    comboDisplay.textContent = `COMBO ${currentCombo}`;
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CONFIG.canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * CONFIG.canvas.height,
    };
  }

  function isInsideSpotlight(x, y) {
    const dx = x - CONFIG.spotlight.x;
    const dy = y - CONFIG.spotlight.y;
    const distance = Math.hypot(dx, dy);
    if (distance > CONFIG.spotlight.radius) return false;
    const angle = Math.atan2(dy, dx);
    const difference = Math.atan2(
      Math.sin(angle - spotlightAngle),
      Math.cos(angle - spotlightAngle),
    );
    return (
      Math.abs(difference) <= (CONFIG.spotlight.angleDegrees * Math.PI) / 360
    );
  }

  function paintBackground(image, length, fallbackColor) {
    if (image.complete && image.naturalWidth > 0) {
      context.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        -scrollX,
        0,
        length,
        CONFIG.background.backgroundHeight,
      );
      return;
    }
    context.fillStyle = fallbackColor;
    context.fillRect(-scrollX, 0, length, CONFIG.canvas.height);
    context.fillStyle = "rgb(223 204 255 / 28%)";
    for (let index = 0; index < 70; index += 1) {
      const worldX = (index * 619 + 97) % length;
      const y = (index * 173 + 49) % CONFIG.canvas.height;
      const x = worldX - scrollX;
      if (x >= -2 && x <= CONFIG.canvas.width + 2) {
        context.fillRect(x, y, index % 4 === 0 ? 2 : 1, 1);
      }
    }
  }

  function drawSpotlightLayer() {
    const halfAngle = (CONFIG.spotlight.angleDegrees * Math.PI) / 360;
    context.save();
    context.beginPath();
    context.moveTo(CONFIG.spotlight.x, CONFIG.spotlight.y);
    context.arc(
      CONFIG.spotlight.x,
      CONFIG.spotlight.y,
      CONFIG.spotlight.radius,
      spotlightAngle - halfAngle,
      spotlightAngle + halfAngle,
    );
    context.closePath();
    context.clip();
    paintBackground(
      background2,
      CONFIG.background.background2Length,
      "#172338",
    );

    items.forEach((item) => {
      if (item.collected) return;
      const screenX = item.x - scrollX;
      const { width, height } = getItemImageSize(item);
      if (width === 0 || height === 0) return;
      if (
        screenX + width / 2 < 0 ||
        screenX - width / 2 > CONFIG.canvas.width ||
        item.y + height / 2 < 0 ||
        item.y - height / 2 > CONFIG.canvas.height
      ) {
        return;
      }
      context.drawImage(item.image, screenX - width / 2, item.y - height / 2);
    });
    context.restore();
  }

  function drawCharacter() {
    if (state !== "running") {
      if (state !== "ending") characterElement.hidden = true;
      activeCharacterMode = null;
      return;
    }

    const mode = maxScroll > 0 && scrollX / maxScroll > 0.5 ? "run" : "walk";
    if (mode !== activeCharacterMode) {
      activeCharacterMode = mode;
      const source = CONFIG.character[`${mode}Image`];
      const nextCharacter = document.createElement("img");
      nextCharacter.id = "game-character";
      nextCharacter.className = "game-character";
      nextCharacter.alt = "";
      nextCharacter.style.left = `${((CONFIG.character.x - CONFIG.character.width / 2) / CONFIG.canvas.width) * 100}%`;
      nextCharacter.style.top = `${((CONFIG.character.y - CONFIG.character.height / 2) / CONFIG.canvas.height) * 100}%`;
      nextCharacter.style.width = `${(CONFIG.character.width / CONFIG.canvas.width) * 100}%`;
      nextCharacter.style.height = `${(CONFIG.character.height / CONFIG.canvas.height) * 100}%`;
      nextCharacter.addEventListener(
        "error",
        () => reportMissingAsset(source),
        { once: true },
      );
      characterElement.replaceWith(nextCharacter);
      characterElement = nextCharacter;
      nextCharacter.src = source;
    }
    characterElement.hidden = false;
  }

  function freezeCharacterAnimation() {
    if (!(characterElement instanceof HTMLImageElement)) return;
    if (!characterElement.complete || characterElement.naturalWidth === 0) {
      characterElement.addEventListener(
        "load",
        () => {
          if (state === "ending") freezeCharacterAnimation();
        },
        { once: true },
      );
      return;
    }

    const frozenCharacter = document.createElement("canvas");
    frozenCharacter.id = characterElement.id;
    frozenCharacter.className = characterElement.className;
    frozenCharacter.style.cssText = characterElement.style.cssText;
    frozenCharacter.width = characterElement.naturalWidth;
    frozenCharacter.height = characterElement.naturalHeight;
    frozenCharacter
      .getContext("2d")
      .drawImage(
        characterElement,
        0,
        0,
        frozenCharacter.width,
        frozenCharacter.height,
      );
    characterElement.replaceWith(frozenCharacter);
    characterElement = frozenCharacter;
  }

  function resetCharacterAnimation() {
    characterElement.hidden = true;
    activeCharacterMode = null;
  }

  function positionEndingCharacter() {
    const screenX = CONFIG.ending.characterX - scrollX;
    characterButton.style.left = `${((screenX - CONFIG.ending.characterWidth / 2) / CONFIG.canvas.width) * 100}%`;
    characterButton.style.top = `${((CONFIG.ending.characterY - CONFIG.ending.characterHeight / 2) / CONFIG.canvas.height) * 100}%`;
    characterButton.style.pointerEvents = state === "ending" ? "auto" : "none";
  }

  function draw() {
    context.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    paintBackground(
      background1,
      CONFIG.background.background1Length,
      "#100d20",
    );
    drawSpotlightLayer();
    drawCharacter();
    positionEndingCharacter();
    updateHud();
  }

  function setOverlay(name) {
    Object.entries(overlays).forEach(([key, element]) => {
      element.hidden = key !== name;
    });
  }

  function stopAnimationLoop() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }
    previousFrameTime = 0;
  }

  function startAnimationLoop() {
    if (animationFrameId || state !== "running") return;
    animationFrameId = requestAnimationFrame(frame);
  }

  function frame(timestamp) {
    animationFrameId = 0;
    if (state !== "running") return;
    if (!previousFrameTime) previousFrameTime = timestamp;
    const deltaSeconds = Math.min((timestamp - previousFrameTime) / 1000, 0.05);
    previousFrameTime = timestamp;
    update(deltaSeconds);
    draw();
    if (state === "running") animationFrameId = requestAnimationFrame(frame);
  }

  function update(deltaSeconds) {
    if (isDeveloperMode && developerScroll !== null) {
      scrollX = developerScroll;
      return;
    }
    updateBackgroundScroll(deltaSeconds);

    const characterX = CONFIG.character.x;
    const characterY = CONFIG.character.y;
    for (const item of items) {
      if (item.collected) continue;

      const screenX = item.x - scrollX;
      const distance = Math.hypot(screenX - characterX, item.y - characterY);
      const backgroundScale = getBackgroundScale();
      const itemCollisionRadius =
        CONFIG.collectible.collisionRadius *
        Math.max(backgroundScale.x, backgroundScale.y);
      const touching =
        distance <= CONFIG.character.collisionRadius + itemCollisionRadius;
      if (touching && !item.touchingCharacter) {
        item.touchingCharacter = true;
        takeDamage();
        if (state !== "running") return;
      } else if (!touching) {
        item.touchingCharacter = false;
      }

      if (
        !item.offscreenHandled &&
        screenX + getItemImageSize(item).width / 2 < 0
      ) {
        item.offscreenHandled = true;
        currentCombo = CONFIG.combo.startingValue;
      }
    }

    if (health <= 0) {
      finishGame("failure");
      return;
    }
    if (scrollX >= maxScroll) finishGame("ending");
  }

  function getEndingApproachPosition() {
    const finalItem = items.at(-1);
    if (!finalItem) return maxScroll;
    return Math.min(maxScroll, Math.max(0, finalItem.x - CONFIG.character.x));
  }

  function updateBackgroundScroll(deltaSeconds) {
    if (endingApproachElapsed !== null) {
      advanceEndingApproach(deltaSeconds);
      return;
    }

    const approachPosition = getEndingApproachPosition();
    const currentSpeed = getBackgroundSpeed(scrollX, approachPosition);
    const nextScroll = scrollX + currentSpeed * deltaSeconds;
    if (nextScroll < approachPosition) {
      scrollX = nextScroll;
      return;
    }

    const distanceThisFrame = nextScroll - scrollX;
    const timeUntilApproach =
      distanceThisFrame > 0
        ? ((approachPosition - scrollX) / distanceThisFrame) * deltaSeconds
        : 0;
    scrollX = approachPosition;
    endingApproachStart = scrollX;
    const remainingDistance = maxScroll - endingApproachStart;
    const approachSpeed = getBackgroundSpeed(
      endingApproachStart,
      approachPosition,
    );
    endingApproachDuration =
      (CONFIG.background.endingDecelerationPower * remainingDistance) /
      approachSpeed;
    endingApproachElapsed = Math.max(0, deltaSeconds - timeUntilApproach);
    advanceEndingApproach(0);
  }

  function getBackgroundSpeed(position, accelerationEnd) {
    if (accelerationStartScrollX === null) return CONFIG.background.speed;

    const accelerationDistance = accelerationEnd - accelerationStartScrollX;
    const progress =
      accelerationDistance > 0
        ? Math.min(
            1,
            Math.max(
              0,
              (position - accelerationStartScrollX) / accelerationDistance,
            ),
          )
        : 1;
    const speedIncrease =
      CONFIG.background.speedIncreaseAtStart +
      (CONFIG.background.speedIncreaseAtEnd -
        CONFIG.background.speedIncreaseAtStart) *
        progress;
    return CONFIG.background.speed + speedIncrease;
  }

  function advanceEndingApproach(deltaSeconds) {
    endingApproachElapsed = Math.min(
      endingApproachDuration,
      endingApproachElapsed + deltaSeconds,
    );
    const progress =
      endingApproachDuration > 0
        ? endingApproachElapsed / endingApproachDuration
        : 1;
    scrollX =
      endingApproachStart +
      (maxScroll - endingApproachStart) *
        (1 - (1 - progress) ** CONFIG.background.endingDecelerationPower);
  }

  function takeDamage() {
    if (isDeveloperMode) return;
    health = Math.max(0, health - 1);
    currentCombo = CONFIG.combo.startingValue;
    if (flashTimerId) window.clearTimeout(flashTimerId);
    isFlashing = true;
    updateHud();
    flashTimerId = window.setTimeout(() => {
      flashTimerId = 0;
      isFlashing = false;
      updateHud();
    }, CONFIG.player.damageFlashMs);
    if (health === 0) finishGame("failure");
  }

  function finishGame(nextState) {
    if (state !== "running") return;
    stopAnimationLoop();
    if (nextState === "ending") freezeCharacterAnimation();
    else resetCharacterAnimation();
    state = nextState;
    if (nextState === "failure") {
      endingInteraction.hidden = true;
      document.querySelector("#failure-score").textContent = String(score);
      setOverlay("failure");
    } else {
      setOverlay(null);
      endingInteraction.hidden = false;
      endingDialogueScene.hidden = true;
      endingDialogue.textContent = "";
      endingFinishButton.hidden = true;
      characterButton.hidden = false;
      characterButton.setAttribute("aria-expanded", "false");
      dialogueIndex = 0;
      isDialogueTyping = false;
    }
    draw();
  }

  // 結局對話演出：逐字顯示、點擊補完文字，以及切換段落。
  function clearDialogueTimer() {
    if (!dialogueTimerId) return;
    window.clearTimeout(dialogueTimerId);
    dialogueTimerId = 0;
  }

  function updateDialogueControls() {
    const hasNextLine = dialogueIndex < ENDING_DIALOGUE.lines.length - 1;
    endingContinue.hidden = isDialogueTyping || !hasNextLine;
    endingFinishButton.hidden = isDialogueTyping || hasNextLine;
  }

  function setDialoguePortraitImage(image, source) {
    if (image.getAttribute("src") !== source) image.src = source;
  }

  function renderEndingDialogue() {
    const line = ENDING_DIALOGUE.lines[dialogueIndex];
    const speaker = ENDING_DIALOGUE.portraits[line.speaker];
    endingSpeaker.textContent = speaker.name;
    endingDialogue.textContent = "";
    setDialoguePortraitImage(
      endingPortraitAImage,
      line.images?.player ?? ENDING_DIALOGUE.portraits.player.image,
    );
    setDialoguePortraitImage(
      endingPortraitBImage,
      line.images?.director ?? ENDING_DIALOGUE.portraits.director.image,
    );
    endingPortraitA.classList.toggle(
      "ending-portrait--dimmed",
      line.speaker !== "player",
    );
    endingPortraitB.classList.toggle(
      "ending-portrait--dimmed",
      line.speaker !== "director",
    );
    const speakerPortrait =
      line.speaker === "player" ? endingPortraitA : endingPortraitB;
    endingPortraitA.classList.remove("ending-portrait--speaking");
    endingPortraitB.classList.remove("ending-portrait--speaking");
    void speakerPortrait.offsetWidth;
    speakerPortrait.classList.add("ending-portrait--speaking");
    isDialogueTyping = true;
    updateDialogueControls();

    const characters = Array.from(line.text);
    let characterIndex = 0;
    const typeNextCharacter = () => {
      if (state !== "dialogue") return;
      if (characterIndex >= characters.length) {
        dialogueTimerId = 0;
        isDialogueTyping = false;
        updateDialogueControls();
        return;
      }
      endingDialogue.textContent += characters[characterIndex];
      characterIndex += 1;
      dialogueTimerId = window.setTimeout(
        typeNextCharacter,
        CONFIG.ending.dialogue.typingSpeedMs,
      );
    };
    typeNextCharacter();
  }

  function beginEndingDialogue() {
    if (state !== "ending") return;
    state = "dialogue";
    characterButton.hidden = true;
    characterButton.setAttribute("aria-expanded", "true");
    endingDialogueScene.hidden = false;
    dialogueIndex = 0;
    renderEndingDialogue();
    draw();
  }

  function advanceEndingDialogue() {
    if (state !== "dialogue") return;
    if (isDialogueTyping) {
      clearDialogueTimer();
      endingDialogue.textContent = ENDING_DIALOGUE.lines[dialogueIndex].text;
      isDialogueTyping = false;
      updateDialogueControls();
      return;
    }
    if (dialogueIndex >= ENDING_DIALOGUE.lines.length - 1) return;
    dialogueIndex += 1;
    renderEndingDialogue();
  }

  function beginGame() {
    if (state !== "intro") return;
    state = "running";
    endingInteraction.hidden = false;
    setOverlay(null);
    previousFrameTime = 0;
    draw();
    startAnimationLoop();
  }

  function pauseGame() {
    if (state !== "running") return;
    state = "paused";
    stopAnimationLoop();
    resetCharacterAnimation();
    setOverlay("pause");
  }

  function resumeGame() {
    if (state !== "paused") return;
    state = "running";
    setOverlay(null);
    previousFrameTime = 0;
    startAnimationLoop();
  }

  function restartGame() {
    stopAnimationLoop();
    clearDialogueTimer();
    if (flashTimerId) {
      window.clearTimeout(flashTimerId);
      flashTimerId = 0;
    }
    state = "intro";
    scrollX = CONFIG.background.startPosition;
    score = CONFIG.player.startingScore;
    health = CONFIG.player.startingHealth;
    currentCombo = CONFIG.combo.startingValue;
    maxCombo = CONFIG.combo.startingValue;
    isFlashing = false;
    collectedItemCount = 0;
    accelerationStartScrollX =
      CONFIG.background.accelerationStartAfterCollectedItems <= 0
        ? CONFIG.background.startPosition
        : null;
    dialogueIndex = 0;
    isDialogueTyping = false;
    endingApproachElapsed = null;
    endingApproachStart = 0;
    endingApproachDuration = 0;
    developerScroll = null;
    items = makeItems();
    endingInteraction.hidden = true;
    endingDialogueScene.hidden = true;
    endingFinishButton.hidden = true;
    characterButton.hidden = false;
    characterButton.setAttribute("aria-expanded", "false");
    document.querySelector("#developer-scroll").value = String(scrollX);
    setOverlay("intro");
    draw();
  }

  function showResult() {
    if (
      state !== "dialogue" ||
      isDialogueTyping ||
      dialogueIndex !== ENDING_DIALOGUE.lines.length - 1
    ) {
      return;
    }
    const originalScore = score;
    const highestCombo = maxCombo;
    const comboBonus = highestCombo * CONFIG.combo.comboBonusMultiplier;
    const finalScore = originalScore + comboBonus;
    document.querySelector("#result-base-score").textContent =
      String(originalScore);
    document.querySelector("#result-max-combo").textContent =
      String(highestCombo);
    document.querySelector("#result-bonus").textContent = String(comboBonus);
    document.querySelector("#result-total").textContent = String(finalScore);
    state = "result";
    endingInteraction.hidden = true;
    endingDialogueScene.hidden = true;
    setOverlay("result");
  }

  function collectAt(point) {
    if (state !== "running" || isDeveloperMode) return;
    for (const item of items) {
      if (item.collected) continue;
      const screenX = item.x - scrollX;
      const { width, height } = getItemImageSize(item);
      if (width === 0 || height === 0) continue;
      const clickPadding =
        CONFIG.collectible.clickPadding *
        Math.max(getBackgroundScale().x, getBackgroundScale().y);
      const halfWidth = width / 2 + clickPadding;
      const halfHeight = height / 2 + clickPadding;
      const insideHitbox =
        Math.abs(point.x - screenX) <= halfWidth &&
        Math.abs(point.y - item.y) <= halfHeight;
      if (!insideHitbox || !isInsideSpotlight(screenX, item.y)) continue;

      item.collected = true;
      item.touchingCharacter = false;
      collectedItemCount += 1;
      if (
        accelerationStartScrollX === null &&
        collectedItemCount >=
          CONFIG.background.accelerationStartAfterCollectedItems
      ) {
        accelerationStartScrollX = scrollX;
      }
      score += CONFIG.collectible.score;
      currentCombo += 1;
      maxCombo = Math.max(maxCombo, currentCombo);
      draw();
      return;
    }
  }

  canvas.addEventListener("pointermove", (event) => {
    const point = canvasPoint(event);
    const dx = point.x - CONFIG.spotlight.x;
    const dy = point.y - CONFIG.spotlight.y;
    if (dx !== 0 || dy !== 0) spotlightAngle = Math.atan2(dy, dx);
    if (state === "running" || state === "intro" || state === "paused") draw();
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (state !== "running") return;
    collectAt(canvasPoint(event));
  });

  document.querySelector("#start-button").addEventListener("click", beginGame);
  document.querySelector("#pause-button").addEventListener("click", pauseGame);
  document
    .querySelector("#resume-button")
    .addEventListener("click", resumeGame);
  document.querySelector("#home-button").addEventListener("click", () => {
    window.location.href = CONFIG.homePath;
  });
  document.querySelectorAll("[data-go-home]").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = CONFIG.homePath;
    });
  });
  document
    .querySelector("#retry-button")
    .addEventListener("click", restartGame);
  document
    .querySelector("#result-retry-button")
    .addEventListener("click", restartGame);
  characterButton.addEventListener("click", beginEndingDialogue);
  endingDialoguePanel.addEventListener("click", advanceEndingDialogue);
  endingFinishButton.addEventListener("click", showResult);

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (state === "running") pauseGame();
    else if (state === "paused") resumeGame();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "running") pauseGame();
  });

  window.addEventListener("pagehide", () => {
    stopAnimationLoop();
    clearDialogueTimer();
    if (flashTimerId) window.clearTimeout(flashTimerId);
  });

  if (isDeveloperMode) {
    const panel = document.querySelector("#developer-panel");
    const scaleInput = document.querySelector("#developer-scale");
    const scrollInput = document.querySelector("#developer-scroll");
    const positionOutput = document.querySelector("#developer-position");
    panel.hidden = false;
    scrollInput.max = String(maxScroll);
    scaleInput.addEventListener("input", () => {
      shell.style.width = `${Number(scaleInput.value) * 100}%`;
      shell.style.margin = "auto";
    });
    scrollInput.addEventListener("input", () => {
      developerScroll = Number(scrollInput.value);
      scrollX = developerScroll;
      positionOutput.textContent = `${Math.round(scrollX)} px`;
      draw();
    });
  }

  items = makeItems();
  updateHud();
  draw();
})();
