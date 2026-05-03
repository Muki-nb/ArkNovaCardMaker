function exportCardWithFixedScale(target, exportWidth = 745, exportHeight = 1040, filename = "行动卡牌.png") {
  const originalTransform = target.style.transform;
  const originalWidth = target.style.width;
  const originalHeight = target.style.height;
  const scaleX = exportWidth / target.offsetWidth;
  const scaleY = exportHeight / target.offsetHeight;

  target.style.transform = `scale(${scaleX}, ${scaleY})`;
  target.style.transformOrigin = "top left";
  target.style.width = `${target.offsetWidth}px`;
  target.style.height = `${target.offsetHeight}px`;

  setTimeout(() => {
    domtoimage
      .toPng(target, {
        width: exportWidth,
        height: exportHeight,
        bgcolor: null,
      })
      .then(function (dataUrl) {
        target.style.transform = originalTransform;
        target.style.width = originalWidth;
        target.style.height = originalHeight;
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();
      })
      .catch(() => {
        target.style.transform = originalTransform;
        target.style.width = originalWidth;
        target.style.height = originalHeight;
      });
  }, 50);
}
