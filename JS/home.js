// 取得五個背景圖層與圖片式遊戲入口，統一更新 X/Y 軸視差偏移。
const parallaxTargets = document.querySelectorAll(
  ".parallax__layer, .play-button",
);
const cursorGlow = document.querySelector(".cursor-glow");
const homeOverlay = document.querySelector(".home-overlay");
const musicToggle = document.querySelector("#music-toggle");
const homeBgm = document.querySelector("#home-bgm");
const musicToggleImage = musicToggle.querySelector("img");
let isMusicEnabled = false;

let animationFrame = 0;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;

function hideHomeOverlayAfterPlayback() {
  // layer-4.gif 共 40 格、總長 1.76 秒；更換 GIF 時請同步調整。
  window.setTimeout(() => {
    homeOverlay.hidden = true;
  }, 1760);
}

function updateCursorGlow() {
  cursorGlow.style.setProperty("--pointer-x", `${pointerX}px`);
  cursorGlow.style.setProperty("--pointer-y", `${pointerY}px`);
}

function updateMusicToggle() {
  musicToggleImage.src = isMusicEnabled
    ? "./image/game/icon/music.png"
    : "./image/game/icon/off.png";
  musicToggle.setAttribute(
    "aria-label",
    isMusicEnabled ? "靜音音樂" : "開啟音樂",
  );
  musicToggle.setAttribute("aria-pressed", String(isMusicEnabled));
}

musicToggle.addEventListener("click", () => {
  isMusicEnabled = !isMusicEnabled;
  homeBgm.muted = !isMusicEnabled;
  updateMusicToggle();

  if (isMusicEnabled) {
    homeBgm.play().catch((error) => {
      console.error("[Light the Void] 首頁音樂播放失敗。", error);
      isMusicEnabled = false;
      homeBgm.muted = true;
      updateMusicToggle();
    });
  }
});
homeBgm.muted = true;

function updateParallax() {
  const horizontalPosition = (pointerX / window.innerWidth) * 2 - 1;
  const verticalPosition = (pointerY / window.innerHeight) * 2 - 1;

  parallaxTargets.forEach((target) => {
    // X/Y 軸移動距離由 CSS 中各自的 --parallax-range-x/y 控制。
    const styles = window.getComputedStyle(target);
    const rangeX = Number.parseFloat(
      styles.getPropertyValue("--parallax-range-x"),
    );
    const rangeY = Number.parseFloat(
      styles.getPropertyValue("--parallax-range-y"),
    );
    target.style.setProperty(
      "--parallax-offset-x",
      `${horizontalPosition * rangeX}px`,
    );
    target.style.setProperty(
      "--parallax-offset-y",
      `${verticalPosition * rangeY}px`,
    );
  });
}

// 使用 requestAnimationFrame 合併快速連續的滑鼠事件，維持更新效率。
window.addEventListener("pointermove", (event) => {
  pointerX = event.clientX;
  pointerY = event.clientY;
  updateCursorGlow();
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(() => {
    updateParallax();
  });
});

// 視窗尺寸改變時重新計算偏移；初始游標位置視為畫面中心。
window.addEventListener("resize", () => {
  pointerX = Math.min(pointerX, window.innerWidth);
  pointerY = Math.min(pointerY, window.innerHeight);
  updateCursorGlow();
  updateParallax();
});

if (homeOverlay.complete && homeOverlay.naturalWidth > 0) {
  hideHomeOverlayAfterPlayback();
} else {
  homeOverlay.addEventListener("load", hideHomeOverlayAfterPlayback, {
    once: true,
  });
}
updateCursorGlow();
updateParallax();
