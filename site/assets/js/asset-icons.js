import { iconSVG } from './icons.js';

// 仅允许固定的本地图标，不接受动态 URL 或 HTML。
const files = {
  crypto: 'crypto', json: 'json', timestamp: 'timestamp', encoder: 'encoder',
  quantdinger: 'quant', daily: 'diary', n8n: 'automation', video: 'video'
};
export function setAssetIcon(container, name) {
  const file = files[name];
  if (!file) { container.replaceChildren(iconSVG(name)); return; }
  const image = document.createElement('img');
  image.className = 'asset-icon';
  image.alt = '';
  image.width = 256;
  image.height = 256;
  image.decoding = 'async';
  image.addEventListener('error', () => {
    container.classList.remove('has-image-icon');
    container.replaceChildren(iconSVG(name));
  }, { once: true });
  container.classList.add('has-image-icon');
  image.src = new URL(`../images/icons-v2/${file}-v2.webp`, import.meta.url).href;
  container.replaceChildren(image);
}
