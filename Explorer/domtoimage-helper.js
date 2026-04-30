// dom-to-image 高分辨率导出辅助函数（直接指定导出像素尺寸，临时scale卡片）
function exportCardWithFixedScale(target, exportWidth = 745, exportHeight = 1040) {
  const originalTransform = target.style.transform;
  const originalWidth = target.style.width;
  const originalHeight = target.style.height;
  // 计算缩放比例
  const scaleX = exportWidth / target.offsetWidth;
  const scaleY = exportHeight / target.offsetHeight;
  // 只缩放到目标像素
  target.style.transform = `scale(${scaleX}, ${scaleY})`;
  target.style.transformOrigin = 'top left';
  target.style.width = `${target.offsetWidth}px`;
  target.style.height = `${target.offsetHeight}px`;

  setTimeout(() => {
    domtoimage.toPng(target, {
      width: exportWidth,
      height: exportHeight,
      bgcolor: null
    }).then(function (dataUrl) {
      // 恢复原始样式
      target.style.transform = originalTransform;
      target.style.width = originalWidth;
      target.style.height = originalHeight;
      const link = document.createElement('a');
      link.download = '探险家.png';
      link.href = dataUrl;
      link.click();
    }).catch(() => {
      target.style.transform = originalTransform;
      target.style.width = originalWidth;
      target.style.height = originalHeight;
    });
  }, 50);
}

// 动态设置ID字体大小，使导出时为25px
function adjustIdFontSizeForExport(cardSelector, textSelector, exportWidth, targetFontPx) {
  const card = document.querySelector(cardSelector);
  const text = document.querySelector(textSelector);
  if (!card || !text) return;
  // 计算缩放比例
  const scale = exportWidth / card.offsetWidth;
  // 页面上应设置的font-size
  const pageFontSize = targetFontPx / scale;
  text.style.fontSize = pageFontSize + 'px';
}

// 页面加载和窗口变化时自适应
window.addEventListener('DOMContentLoaded', () => {
  adjustIdFontSizeForExport('.card', '.layer--text', 745, 25);
});
window.addEventListener('resize', () => {
  adjustIdFontSizeForExport('.card', '.layer--text', 745, 25);
});