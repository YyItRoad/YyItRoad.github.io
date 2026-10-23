import { iconSVG } from './icons.js?v=2b16b074aa2b';

// 仅允许固定的本地图标，不接受动态 URL 或 HTML。
const files = {
  crypto: 'crypto', json: 'json', timestamp: 'timestamp', encoder: 'encoder',
  quantdinger: 'quant', daily: 'diary', n8n: 'automation', video: 'video',
  favorites: 'section-favorites', tools: 'section-tools',
  navigation: 'section-navigation', projects: 'section-projects'
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
    if (!container.contains(image)) return;
    container.classList.remove('has-image-icon');
    container.replaceChildren(iconSVG(name));
  }, { once: true });
  container.classList.add('has-image-icon');
  image.src = new URL(`../images/icons-v2/${file}-v2.webp`, import.meta.url).href;
  container.replaceChildren(image);
}

// 自定义项目图片优先；尚未上传时复用现有 3D 素材，新文件名使用统一栏目回退。
// 这里只查已有素材表，不限制用户可上传的合法文件名，也不要求维护新映射。
export function setProjectIcon(container, project) {
  const directory = new URL('../images/projects/', import.meta.url).href;
  const url = typeof project.icon === 'string' && project.icon.startsWith(directory) ? project.icon : null;
  const stem = url?.slice(directory.length).replace(/\.(svg|png|webp|jpg|jpeg)$/, '');
  const fallback = Object.keys(files).find(key => files[key] === stem) || 'projects';
  setAssetIcon(container, fallback);
  if (!url) return;
  const image = document.createElement('img');
  image.className = 'project-icon asset-icon'; image.alt = ''; image.referrerPolicy = 'no-referrer';
  image.addEventListener('load', () => {
    container.classList.add('has-image-icon'); container.replaceChildren(image);
  }, { once: true });
  image.src = url;
}
