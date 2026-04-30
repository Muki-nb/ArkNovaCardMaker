const imageInput = document.getElementById("imageInput");
const idInput = document.getElementById("idInput");
const downloadBtn = document.getElementById("downloadBtn");
const cardText = document.getElementById("cardText");
const cardImage = document.querySelector(".layer--image");
const cardImageWrap = document.querySelector(".layer--image-wrap");
const offsetXInput = document.getElementById("offsetX");
const offsetYInput = document.getElementById("offsetY");
const offsetXValue = document.getElementById("offsetXValue");
const offsetYValue = document.getElementById("offsetYValue");
const exportCanvas = document.getElementById("exportCanvas");

const bottomSrc = "img/explorer_buttom.png";
const topSrc = "img/explorer_top.png";
const canvasSize = { width: 745, height: 1040 };
const textPosition = { x: 0.5, y: 0.82 };

const bottomImage = new Image();
const topImage = new Image();
const userImage = new Image();
const maskCanvas = document.createElement("canvas");
maskCanvas.width = canvasSize.width;
maskCanvas.height = canvasSize.height;
let maskReady = false;
let offsetXPercent = 0;
let offsetYPercent = 0;
let posXPercent = 50;
let posYPercent = 50;

bottomImage.src = bottomSrc;
topImage.src = topSrc;

function buildWhiteMask() {
  const ctx = maskCanvas.getContext("2d");
  ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
  ctx.drawImage(bottomImage, 0, 0, canvasSize.width, canvasSize.height);
  try {
    const imageData = ctx.getImageData(0, 0, canvasSize.width, canvasSize.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const y = Math.floor(pixelIndex / canvasSize.width);
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const isWhite = r >= 250 && g >= 250 && b >= 250;
      let alpha = data[i + 3];
      if (y < 565) {
        if (isWhite) {
          alpha = 255;
        } else {
          // 565行以上才处理非白色
        }
      } else if (y < 640) {
        if (isWhite) {
          alpha = Math.round(255 * 0.08); // 白色78%不透明度
        } else {
          alpha = Math.round(255 * 0.15); // 非白色15%不透明度
        }
      } else {
        alpha = 0; // 底部全透明
      }
      data[i + 3] = alpha;
    }
    ctx.putImageData(imageData, 0, 0);
    const maskUrl = maskCanvas.toDataURL("image/png");
    cardImageWrap.style.webkitMaskImage = `url("${maskUrl}")`;
    cardImageWrap.style.maskImage = `url("${maskUrl}")`;
    maskReady = true;
  } catch (error) {
    maskReady = false;
    console.warn("无法读取像素，请通过本地 HTTP 方式打开页面。", error);
  }
}

bottomImage.onload = buildWhiteMask;

userImage.onload = () => {
  cardImage.src = userImage.src;
  cardImage.style.opacity = "1";
};

function updatePreviewOffset() {
  posXPercent = Math.min(100, Math.max(0, 50 + offsetXPercent));
  posYPercent = Math.min(100, Math.max(0, 50 + offsetYPercent));
  cardImage.style.setProperty("--img-pos-x", `${posXPercent}%`);
  cardImage.style.setProperty("--img-pos-y", `${posYPercent}%`);
  if (offsetXValue) {
    offsetXValue.textContent = `${offsetXPercent}%`;
  }
  if (offsetYValue) {
    offsetYValue.textContent = `${offsetYPercent}%`;
  }
}

imageInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    cardImage.style.opacity = "0";
    cardImage.src = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    userImage.src = dataUrl;
  };
  reader.readAsDataURL(file);
});

idInput.addEventListener("input", (event) => {
  const value = event.target.value.trim();
  cardText.textContent = value || "";
  if (value) {
    cardText.style.display = "flex";
  } else {
    cardText.style.display = "none";
  }
});

offsetXInput?.addEventListener("input", (event) => {
  offsetXPercent = Number(event.target.value) || 0;
  updatePreviewOffset();
});

offsetYInput?.addEventListener("input", (event) => {
  offsetYPercent = Number(event.target.value) || 0;
  updatePreviewOffset();
});

updatePreviewOffset();

function drawCanvas() {
  const ctx = exportCanvas.getContext("2d");
  ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

  ctx.drawImage(bottomImage, 0, 0, canvasSize.width, canvasSize.height);

  if (userImage.src) {
    const img = userImage;
    const scale = Math.max(
      canvasSize.width / img.width,
      canvasSize.height / img.height
    );
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const offsetX = (canvasSize.width - drawWidth) * (posXPercent / 100);
    const offsetY = (canvasSize.height - drawHeight) * (posYPercent / 100);

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasSize.width;
    tempCanvas.height = canvasSize.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    if (maskReady) {
      tempCtx.globalCompositeOperation = "destination-in";
      tempCtx.drawImage(maskCanvas, 0, 0);
      tempCtx.globalCompositeOperation = "source-over";
    }

    ctx.drawImage(tempCanvas, 0, 0);
  }

  const text = cardText.textContent || "";
  ctx.font = "900 16px 'Noto Sans SC Black', 'Noto Sans SC', 'PingFang SC', 'Segoe UI', sans-serif";
  ctx.fillStyle = "#f5f7ff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 2;
  ctx.fillText(
    text,
    canvasSize.width * textPosition.x,
    canvasSize.height * textPosition.y
  );
  ctx.shadowBlur = 0;

  ctx.drawImage(topImage, 0, 0, canvasSize.width, canvasSize.height);
}

function ensureAssetsLoaded() {
  return Promise.all([
    new Promise((resolve) => {
      if (bottomImage.complete) {
        resolve();
      } else {
        bottomImage.onload = () => {
          if (!maskReady) {
            buildWhiteMask();
          }
          resolve();
        };
      }
    }),
    new Promise((resolve) => {
      if (topImage.complete) {
        resolve();
      } else {
        topImage.onload = resolve;
      }
    }),
  ]);
}

// 只保留高DPI导出逻辑，按钮名为“下载图片”
if (window.domtoimage) {
  downloadBtn.addEventListener("click", () => {
    exportCardWithFixedScale(document.querySelector('.card'));
  });
}

// 初始化ID和text默认值
const defaultId = "探险家 - 你的名字";
idInput.value = defaultId;
cardText.textContent = defaultId;
cardText.style.display = "flex";

function adjustTextPosition() {
  const card = document.querySelector('.card');
  const text = document.querySelector('.layer--text');
  if (!card || !text) return;
  // 以设计稿 380*530.47 为基准
  const left = card.offsetWidth * 10 / 380;
  const top = card.offsetHeight * 260 / 530.47;
  text.style.left = left + 'px';
  text.style.top = top + 'px';
}
window.addEventListener('DOMContentLoaded', adjustTextPosition);
window.addEventListener('resize', adjustTextPosition);