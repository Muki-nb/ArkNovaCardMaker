const V = window.APP_VERSION || "1.0.0";
const withVersion = window.withVersion || ((url) => {
  if (!url) return url;
  if (/^(data:|blob:)/i.test(url)) return url;
  const hasVersion = /[?&]version=/.test(url);
  if (hasVersion) {
    return url.replace(/[?&]version=[^&]*/i, (match) => {
      const prefix = match.startsWith("?") ? "?" : "&";
      return `${prefix}version=${encodeURIComponent(V)}`;
    });
  }
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}version=${encodeURIComponent(V)}`;
});

const imageInput = document.getElementById("imageInput");
const actionType = document.getElementById("actionType");
const plusIconInput = document.getElementById("plusIconInput");
const abilityList = document.getElementById("abilityList");
const upgradePlusIconInput = document.getElementById("upgradePlusIconInput");
const upgradeAbilityList = document.getElementById("upgradeAbilityList");
const offsetXInput = document.getElementById("offsetX");
const offsetYInput = document.getElementById("offsetY");
const offsetXValue = document.getElementById("offsetXValue");
const offsetYValue = document.getElementById("offsetYValue");
const downloadBeforeBtn = document.getElementById("downloadBeforeBtn");
const downloadAfterBtn = document.getElementById("downloadAfterBtn");
const clearButtons = document.querySelectorAll("[data-clear]");
const addParagraphButtons = document.querySelectorAll("[data-add]");
const removeParagraphButtons = document.querySelectorAll("[data-remove]");
const syncPlusIconButton = document.getElementById("syncPlusIcon");
const toggleOffsetButton = document.getElementById("toggleOffset");
const offsetControls = document.getElementById("offsetControls");

const cardImageBefore = document.querySelector(".card--before .layer--image");
const cardImageAfter = document.querySelector(".card--after .layer--image");
const imageWraps = document.querySelectorAll(".layer--image-wrap");
const scopeBefore = document.querySelector(".card--before .layer--scope");
const scopeAfter = document.querySelector(".card--after .layer--scope");
const actionIconBefore = document.querySelector(".card--before .layer--action-icon");
const actionIconAfter = document.querySelector(".card--after .layer--action-icon");
const plusIconBefore = document.querySelector(".card--before .layer--plus-icon");
const plusIconAfter = document.querySelector(".card--after .layer--plus-icon");
const actionNameBefore = document.getElementById("actionNameBefore");
const actionNameAfter = document.getElementById("actionNameAfter");
const abilityText = document.getElementById("abilityText");
const abilityTextUpgrade = document.getElementById("abilityTextUpgrade");

const userImage = new Image();
const plusIconImage = new Image();
const plusIconUpgradeImage = new Image();
let hasUserImage = false;

const maskCanvas = document.createElement("canvas");
const maskSourceCanvas = document.createElement("canvas");
const maskSourceSize = { width: 745, height: 1040 };
const maskRegion = { x: 5, y: 8, width: 735, height: 543 };
maskSourceCanvas.width = maskSourceSize.width;
maskSourceCanvas.height = maskSourceSize.height;
maskCanvas.width = maskRegion.width;
maskCanvas.height = maskRegion.height;

const maskSource = new Image();
maskSource.src = "img/action_back_1.png";

function buildImageMask() {
  const sourceCtx = maskSourceCanvas.getContext("2d");
  const ctx = maskCanvas.getContext("2d");
  sourceCtx.clearRect(0, 0, maskSourceSize.width, maskSourceSize.height);
  sourceCtx.drawImage(maskSource, 0, 0, maskSourceSize.width, maskSourceSize.height);

  try {
    const imageData = sourceCtx.getImageData(
      maskRegion.x,
      maskRegion.y,
      maskRegion.width,
      maskRegion.height
    );
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const isWhite = r >= 250 && g >= 250 && b >= 250;
      data[i + 3] = isWhite ? 255 : 0;
    }
    ctx.clearRect(0, 0, maskRegion.width, maskRegion.height);
    ctx.putImageData(imageData, 0, 0);
    const maskUrl = maskCanvas.toDataURL("image/png");
    imageWraps.forEach((wrap) => {
      wrap.style.webkitMaskImage = `url("${maskUrl}")`;
      wrap.style.maskImage = `url("${maskUrl}")`;
    });
  } catch (error) {
    console.warn("无法读取像素，请通过本地 HTTP 方式打开页面。", error);
  }
}

let offsetXPercent = 0;
let offsetYPercent = 0;

const actionIconMap = {
  animal: "img/animal.png",
  sponsor: "img/sponsor.png",
  association: "img/association.png",
  build: "img/build.png",
  card: "img/card.png",
};

const defaultImageMap = {
  sponsor: "default/sponsor.png",
  association: "default/association.png",
  build: "default/build.png",
};

function getDefaultImageSrc(type) {
  return defaultImageMap[type] || "";
}

const actionNameMap = {
  animal: "动物",
  sponsor: "赞助商",
  association: "协会",
  build: "建造",
  card: "卡牌",
};

function updateImagePosition() {
  const posX = Math.min(100, Math.max(0, 50 + offsetXPercent));
  const posY = Math.min(100, Math.max(0, 50 + offsetYPercent));
  document.documentElement.style.setProperty("--img-pos-x", `${posX}%`);
  document.documentElement.style.setProperty("--img-pos-y", `${posY}%`);
  offsetXValue.textContent = `${offsetXPercent}%`;
  offsetYValue.textContent = `${offsetYPercent}%`;
}

function updateCardScale() {
  const card = document.querySelector(".card");
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const scale = rect.width / 745;
  document.documentElement.style.setProperty("--card-scale", `${scale}`);
  applyRichIconSize(abilityText);
  applyRichIconSize(abilityTextUpgrade);
}

function setImageOpacity(img, hasImage) {
  img.style.opacity = hasImage ? "1" : "0";
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeColorValue(value) {
  const normalized = value.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(normalized)) {
    return normalized;
  }
  if (/^(rgb|rgba|hsl|hsla)\([0-9\s.,%]+\)$/.test(normalized)) {
    return normalized;
  }
  if (/^[a-zA-Z]+$/.test(normalized)) {
    return normalized;
  }
  return null;
}

function renderRichText(rawText) {
  let html = escapeHtml(rawText);
  html = html
    .replace(/&amp;lt;/g, "&lt;")
    .replace(/&amp;gt;/g, "&gt;")
    .replace(/&amp;amp;/g, "&amp;");
  const hasBoldPair = rawText.includes("<b>") && rawText.includes("</b>");
  if (hasBoldPair) {
    html = html.replace(/&lt;b&gt;/g, "<b>").replace(/&lt;\/b&gt;/g, "</b>");
  }
  const hasItalicPair = rawText.includes("<i>") && rawText.includes("</i>");
  if (hasItalicPair) {
    html = html.replace(/&lt;i&gt;/g, "<i>").replace(/&lt;\/i&gt;/g, "</i>");
  }
  const hasColorPair = rawText.includes("<color=") && rawText.includes("</color>");
  if (hasColorPair) {
    html = html
      .replace(/&lt;color=([^&]+?)&gt;/g, (_, colorValue) => {
        const safeColor = sanitizeColorValue(colorValue);
        if (!safeColor) return `&lt;color=${colorValue}&gt;`;
        return `<span class="rich-color" style="color:${safeColor}">`;
      })
      .replace(/&lt;\/color&gt;/g, "</span>");
  }
  html = html.replace(/\{([a-zA-Z0-9_]+):([^}]+)\}/g, "{$1-$2}");
  html = html.replace(/\{([^}]+)\}/g, (_, token) => {
    const [iconName, value] = token.split("-");
    const safeName = iconName.toLowerCase();
    const imgSrc = withVersion(`rich-icon/${safeName}.png`);
    if (!value || safeName === "or") {
      return `<span class="rich-icon" data-icon="${safeName}"><img class="rich-icon__img" src="${imgSrc}" alt="${safeName}" /></span>`;
    }
    const valueClass = safeName === "appeal" ? "rich-icon__value rich-icon__value--dark" : "rich-icon__value";
    return `<span class="rich-icon" data-icon="${safeName}"><img class="rich-icon__img" src="${imgSrc}" alt="${safeName}" /><span class="${valueClass}">${value}</span></span>`;
  });
  html = html.replace(/\n/g, "<br />");
  return html
    .split(/(<[^>]+>)/g)
    .map((part) => {
      if (part.startsWith("<")) return part;
      const entities = [];
      let safe = part.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
        entities.push(entity);
        return String.fromCharCode(0xe000 + entities.length - 1);
      });
      safe = safe.replace(/([A-Za-z0-9]+)/g, "<span class=\"text-latin\">$1</span>");
      return safe
        .replace(/[\uE000-\uF8FF]/g, (marker) => {
          const index = marker.charCodeAt(0) - 0xe000;
          return entities[index] ?? marker;
        });
    })
    .join("");
}

function renderAbility(listElement, targetElement) {
  const values = Array.from(listElement.querySelectorAll(".paragraph-input"))
    .map((input) => input.value.trim())
    .filter((value) => value.length > 0);
  if (!values.length) {
    targetElement.innerHTML = "";
    targetElement.style.opacity = "0";
    return;
  }
  targetElement.innerHTML = values
    .map((value) => `<div class="ability-paragraph">${renderRichText(value)}</div>`)
    .join("");
  targetElement.style.opacity = "1";
  applyRichIconSize(targetElement);
}

function applyRichIconSize(container) {
  if (!container) return;
  const scaleRaw = getComputedStyle(document.documentElement).getPropertyValue("--card-scale");
  const scale = Number(scaleRaw) || 1;
  container.querySelectorAll(".rich-icon__img").forEach((img) => {
    const wrapper = img.closest(".rich-icon");
    if (!wrapper) return;
    const applySize = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) return;
      wrapper.style.width = `${width * scale}px`;
      wrapper.style.height = `${height * scale}px`;
    };
    if (img.complete) {
      applySize();
    } else {
      img.addEventListener("load", applySize, { once: true });
    }
  });
}

function createParagraphInput(listElement, targetElement, value = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "paragraph-item";
  const input = document.createElement("textarea");
  input.className = "paragraph-input";
  input.placeholder = "输入段落内容";
  input.value = value;
  input.addEventListener("input", () => renderAbility(listElement, targetElement));
  wrapper.appendChild(input);
  listElement.appendChild(wrapper);
}

function removeParagraphInput(listElement, targetElement) {
  const items = listElement.querySelectorAll(".paragraph-item");
  if (items.length <= 1) return;
  listElement.removeChild(items[items.length - 1]);
  renderAbility(listElement, targetElement);
}

function updateActionIcon() {
  const value = actionType.value;
  const src = actionIconMap[value];
  const showScope = value === "animal" || value === "sponsor" || value === "association";
  const actionName = actionNameMap[value] || "";
  if (src) {
    actionIconBefore.src = src;
    actionIconAfter.src = src;
    actionIconBefore.style.opacity = "1";
    actionIconAfter.style.opacity = "1";
  } else {
    actionIconBefore.src = "";
    actionIconAfter.src = "";
    actionIconBefore.style.opacity = "0";
    actionIconAfter.style.opacity = "0";
  }
  scopeBefore.style.opacity = showScope ? "1" : "0";
  scopeAfter.style.opacity = showScope ? "1" : "0";
  actionNameBefore.textContent = actionName;
  actionNameAfter.textContent = actionName;
  const nameOpacity = actionName ? "1" : "0";
  actionNameBefore.style.opacity = nameOpacity;
  actionNameAfter.style.opacity = nameOpacity;

  if (!hasUserImage) {
    const defaultSrc = getDefaultImageSrc(value);
    if (defaultSrc) {
      userImage.src = defaultSrc;
    } else {
      cardImageBefore.src = "";
      cardImageAfter.src = "";
      setImageOpacity(cardImageBefore, false);
      setImageOpacity(cardImageAfter, false);
    }
  }

  updateActionDefaultText();
}

const defaultAction_1= {
    animal: [""],
    sponsor: ["打出1张赞助商卡牌，最高等级为{strength-X}。","{or}", "休息{break-X}，获得{money-X}。","{line}"],
    association: ["执行 <b>1项协会任务</b>且最大任务强度为{strength-X}。"],
    build: ["建造 <b>1个建筑</b>，最高面积为{strength-X}。", "为每个六角格支付{money-2}。", "可建建筑：<b>贩售亭</b>，<b>休憩亭</b>，<b>海洋馆</b>，\n<b>标准饲养区</b>以及<b>萌宠园</b>。"],
    card: [""],
};

const defaultAction_2 = {
    animal: [""],
    sponsor: ["打出<b>1张或多张</b>赞助商卡牌，最高等级总和为{strength-X}+1。","{or_2}", "休息{break-X}，获得 2x{money-X}。","{line_2}"],
    association: ["执行 <b>1项或多项不同的协会任务</b>且最大任务强度总和为{strength-X}。", "另外，你可以进行1次<b>捐赠</b>。"],
    build: ["建造 <b>1个或多个不同的建筑</b>，最高面积总和为{strength-X}。", "为每个六角格支付{money-2}。", "新增可建建筑：<b>鸟禽馆</b>和<b>爬行馆</b>。"],
    card: [""],
};

function updateActionDefaultText() {
    const value = actionType.value;
    const defaultText1 = defaultAction_1[value] || [];
    const defaultText2 = defaultAction_2[value] || [];
    abilityList.innerHTML = "";
    upgradeAbilityList.innerHTML = "";
    defaultText1.forEach(text => createParagraphInput(abilityList, abilityText, text));
    defaultText2.forEach(text => createParagraphInput(upgradeAbilityList, abilityTextUpgrade, text));
    renderAbility(abilityList, abilityText);
    renderAbility(upgradeAbilityList, abilityTextUpgrade);
}

imageInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    hasUserImage = false;
    updateActionIcon();
    cardImageBefore.src = "";
    cardImageAfter.src = "";
    setImageOpacity(cardImageBefore, false);
    setImageOpacity(cardImageAfter, false);
    return;
  }

  hasUserImage = true;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    userImage.src = dataUrl;
  };
  reader.readAsDataURL(file);
});

userImage.onload = () => {
  cardImageBefore.src = userImage.src;
  cardImageAfter.src = userImage.src;
  setImageOpacity(cardImageBefore, true);
  setImageOpacity(cardImageAfter, true);
};

plusIconInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    plusIconBefore.src = "";
    plusIconBefore.style.opacity = "0";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    plusIconImage.src = reader.result;
  };
  reader.readAsDataURL(file);
});

plusIconImage.onload = () => {
  plusIconBefore.src = plusIconImage.src;
  plusIconBefore.style.opacity = "1";
};

upgradePlusIconInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    plusIconAfter.src = "";
    plusIconAfter.style.opacity = "0";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    plusIconUpgradeImage.src = reader.result;
  };
  reader.readAsDataURL(file);
});

plusIconUpgradeImage.onload = () => {
  plusIconAfter.src = plusIconUpgradeImage.src;
  plusIconAfter.style.opacity = "1";
};

syncPlusIconButton?.addEventListener("click", () => {
  const srcAttr = plusIconBefore.getAttribute("src");
  const hasIcon = srcAttr && plusIconBefore.style.opacity !== "0";
  if (hasIcon) {
    plusIconAfter.src = srcAttr;
    plusIconAfter.style.opacity = "1";
    upgradePlusIconInput.value = "";
  } else {
    plusIconAfter.src = "";
    plusIconAfter.style.opacity = "0";
  }
});

clearButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.clear;
    const input = document.getElementById(targetId);
    if (!input) return;
    input.value = "";

    if (targetId === "imageInput") {
      hasUserImage = false;
      updateActionIcon();
    }

    if (targetId === "plusIconInput") {
      plusIconBefore.src = "";
      plusIconBefore.style.opacity = "0";
    }

    if (targetId === "upgradePlusIconInput") {
      plusIconAfter.src = "";
      plusIconAfter.style.opacity = "0";
    }
  });
});

toggleOffsetButton?.addEventListener("click", () => {
  offsetControls?.classList.toggle("hidden");
});

addParagraphButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.add;
    if (target === "ability") {
      createParagraphInput(abilityList, abilityText);
    }
    if (target === "upgrade") {
      createParagraphInput(upgradeAbilityList, abilityTextUpgrade);
    }
  });
});

removeParagraphButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.remove;
    if (target === "ability") {
      removeParagraphInput(abilityList, abilityText);
    }
    if (target === "upgrade") {
      removeParagraphInput(upgradeAbilityList, abilityTextUpgrade);
    }
  });
});

offsetXInput.addEventListener("input", (event) => {
  offsetXPercent = Number(event.target.value) || 0;
  updateImagePosition();
});

offsetYInput.addEventListener("input", (event) => {
  offsetYPercent = Number(event.target.value) || 0;
  updateImagePosition();
});

actionType.addEventListener("change", updateActionIcon);

if (window.domtoimage) {
  downloadBeforeBtn.addEventListener("click", () => {
    const card = document.querySelector(".card--before");
    exportCardWithFixedScale(card, 745, 1040, actionNameBefore.textContent + "_升级前.png");
  });

  downloadAfterBtn.addEventListener("click", () => {
    const card = document.querySelector(".card--after");
    exportCardWithFixedScale(card, 745, 1040, actionNameAfter.textContent + "_升级后.png");
  });
}

maskSource.onload = buildImageMask;

updateImagePosition();
updateActionIcon();
updateCardScale();
/*
createParagraphInput(abilityList, abilityText);
createParagraphInput(upgradeAbilityList, abilityTextUpgrade);
*/
window.addEventListener("resize", updateCardScale);
