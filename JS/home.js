// 取得五個背景圖層與圖片式遊戲入口，統一更新 X/Y 軸視差偏移。
const parallaxTargets = document.querySelectorAll(
  ".parallax__layer, .play-button",
);
let animationFrame = 0;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;

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
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(() => {
    updateParallax();
  });
});

// 視窗尺寸改變時重新計算偏移；初始游標位置視為畫面中心。
window.addEventListener("resize", updateParallax);
updateParallax();
