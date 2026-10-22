// 自绘的代码原生线条图标；只接收本文件中的固定路径，不解析书签文本为 HTML。
const paths = {
  quantdinger: ['M9 5a4 4 0 1 0-4 4', 'M15 19a4 4 0 1 0 4-4', 'M8 9c0 5 8 1 8 6', 'M6 13a4 4 0 1 0 4 6', 'M18 11a4 4 0 1 0-4-6'],
  daily: ['M5 3h14v18H5z', 'M3 6h3m-3 5h3m-3 5h3', 'M10 7v2m5-2v2', 'M10 13c1 3 4 3 5 0'],
  n8n: ['M5 12h5l5-7m-5 7 5 7', 'M2 9h5v6H2z', 'M15 2h6v6h-6z', 'M15 16h6v6h-6z'],
  video: ['M3 3h18v18H3z', 'm10 8 7 4-7 4z'],
  crypto: ['M7 11V7a5 5 0 0 1 10 0v4', 'M5 11h14v11H5z', 'M12 15v3'],
  json: ['M9 3H6v6l-3 3 3 3v6h3', 'M15 3h3v6l3 3-3 3v6h-3'],
  timestamp: ['M12 3a9 9 0 1 0 9 9', 'M12 7v6h5', 'M16 3h5v5'],
  encoder: ['m8 7-5 5 5 5', 'm16 7 5 5-5 5', 'm14 4-4 16'],
  '开发技术': ['M4 3h16v18H4z', 'M8 17v-4m4 4V7m4 10v-7'],
  'AI资源': ['M5 8h14v12H5z', 'M9 4h6m-3 0v4', 'M2 12v5m20-5v5', 'M9 12v2m6-2v2', 'M9 17h6'],
  '交易研究': ['M4 20V4', 'M4 20h17', 'M9 16V9m5 7V5m5 11v-4'],
  '内容创作': ['m4 16 12-12 4 4L8 20H4z', 'm13 7 4 4'],
  '生活兴趣': ['M6 3h12v8a6 6 0 0 1-12 0z', 'M6 5H3v5a5 5 0 0 0 4 4m11-9h3v5a5 5 0 0 1-4 4', 'M12 17v4m-4 0h8'],
  '效率办公': ['M4 8h16v13H4z', 'M8 8V4h8v4', 'm12 11-3 5h4l-1 3'],
  favorites: ['m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z'],
  tools: ['m15 3-3 3 3 3 3-3a6 6 0 0 1-7 8l-6 7-3-3 7-6a6 6 0 0 1 6-9z'],
  navigation: ['M5 3h14v18H5z', 'M9 7h6m-6 5h6m-6 5h6', 'M2 6h3m-3 6h3m-3 6h3'],
  projects: ['m12 2 9 5v10l-9 5-9-5V7z', 'm3 7 9 5 9-5', 'M12 12v10'],
  unknown: ['m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3z'],
  mountain: ['m2 18 7-12 5 8 3-5 5 9', 'm6 12 3 1 2-3', 'M3 22c4-3 6 2 10 0s5-1 8-1']
};
export function iconSVG(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  for (const d of paths[name] || paths.unknown) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}
