export const tools = [
  { id: 'crypto', title: 'AES 加密 / 解密', description: '兼容旧版的口令加解密，在本地安心处理。', tags: ['安全', '密文', 'CryptoJS'], url: 'tools/crypto.html', icon: '⌘', color: 'var(--peach)' },
  { id: 'json', title: 'JSON 格式化', description: '格式化、压缩与语法校验，整理每一段数据。', tags: ['开发', '数据', '校验'], url: 'tools/json.html', icon: '{ }', color: 'var(--accent-soft)' },
  { id: 'timestamp', title: '时间戳转换', description: '日期与时间戳互转，让时间一目了然。', tags: ['日期', '秒', '毫秒'], url: 'tools/timestamp.html', icon: '◷', color: 'var(--blue)' },
  { id: 'encoder', title: 'Base64 / URL', description: '支持中文的文本编码，让信息轻松转换。', tags: ['编码', '解码', '中文'], url: 'tools/encoder.html', icon: '↔', color: 'var(--lavender)' }
];
export const fallbackProjects = [
  { id: 'quantdinger', title: 'QuantDinger', description: '围绕行情分析、策略与交易研究，探索更有条理的市场工作台。', tags: ['量化', '交易', '研究'], icon: 'quant', style: 'quant', caption: 'MARKET & INSIGHT', url: 'https://github.com/YyItRoad/QuantDinger', linkText: '查看 GitHub →' },
  { id: 'daily', title: '孩子的日记', description: '把真实日常整理成故事，探索用动画留下成长中的小小瞬间。', tags: ['生活', '动画', '日记'], icon: 'diary', style: 'diary', caption: 'LITTLE MOMENTS, BIG MEMORIES' },
  { id: 'n8n', title: '让流程自己运转', description: '用 n8n 连接信息与工具，探索把重复步骤串成顺手的工作流。', tags: ['n8n', '自动化', '效率'], icon: 'automation', style: 'automation', caption: 'CONNECT THE LITTLE THINGS' },
  { id: 'video', title: '从灵感到画面', description: '尝试把选题、素材与视频制作串起来，为内容创作留出更多空间。', tags: ['视频', '内容创作', 'AI'], icon: 'video', style: 'video', caption: 'MAKE ROOM FOR CREATIVITY' }
];
export const categories = [
  { title: '开发技术', description: '代码、框架与技术灵感', icon: '⌨', color: 'var(--blue)' },
  { title: 'AI资源', description: '和新想法一起生长', icon: '✧', color: 'var(--lavender)' },
  { title: '交易研究', description: '观察市场，独立思考', icon: '⌁', color: 'var(--accent-soft)' },
  { title: '内容创作', description: '把灵感变成作品', icon: '✎', color: 'var(--peach)' },
  { title: '生活兴趣', description: '收藏生活里的小美好', icon: '☷', color: 'var(--accent-soft)' },
  { title: '效率办公', description: '让工作更从容一点', icon: '◈', color: 'var(--blue)' }
];
const text = value => typeof value === 'string' ? value : '';
export function normalizeCategory(value) {
  const label = text(value).trim();
  const compact = label.replace(/\s+/g, '');
  return categories.find(item => item.title === compact)?.title || label || '未分类';
}
export function safeURL(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export function normalizeBookmarks(payload) {
  if (!payload || !Array.isArray(payload.bookmarks)) throw new Error('数据格式不正确：缺少 bookmarks 数组');
  const seen = new Set();
  return payload.bookmarks.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const url = safeURL(item.url);
    if (!url) return [];
    // 重复或缺失 id 不应让单个收藏偏好影响其他链接。
    let id = text(String(item.id ?? '')) || `link-${index}`;
    if (seen.has(id)) id = `${id}-${index}`;
    seen.add(id);
    return [{ id, url, title: text(item.title).trim() || new URL(url).hostname,
      description: text(item.description), category: normalizeCategory(item.category),
      favorite: item.favorite === true, sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : 0,
      tags: Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === 'string') : [] }];
  }).sort((a, b) => a.sort_order - b.sort_order);
}
export async function loadBookmarks() {
  // 相对于当前脚本定位站点根目录，同时支持域名根路径和隔离预览子目录。
  const response = await fetch(new URL('../../data/bookmarks.json', import.meta.url), { cache: 'no-store', signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`读取失败（HTTP ${response.status}）`);
  return normalizeBookmarks(await response.json());
}
export function matches(item, query) {
  return [item.title, item.description, ...(item.tags || [])].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

// 只接受 ASCII 文件名；不解码、不修剪，拒绝路径、URL、查询串和 HTML。
export function projectIconURL(value) {
  if (typeof value !== 'string' || value.trim() !== value || !/^[a-zA-Z0-9_-]+(?:\.(?:svg|png|webp|jpg|jpeg))?$/.test(value)) return null;
  const filename = value.includes('.') ? value : `${value}.svg`;
  return new URL(`../images/projects/${filename}`, import.meta.url).href;
}
export function normalizeProjects(payload) {
  if (!payload || !Array.isArray(payload.projects)) throw new Error('数据格式不正确：缺少 projects 数组');
  const seen = new Set();
  return payload.projects.flatMap((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item) || item.visible === false) return [];
    let id = String(item.id ?? '').trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) id = `entry-${index}`;
    while (seen.has(id)) id += `-${index}`;
    seen.add(id);
    return [{ id, title: text(item.title).trim() || '未命名项目', description: text(item.description),
      tags: Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === 'string') : [],
      status: text(item.status), url: safeURL(item.url), github_url: safeURL(item.github_url),
      icon: projectIconURL(item.icon),
      sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : 0 }];
  }).sort((a, b) => a.sort_order - b.sort_order);
}
export async function loadProjects() {
  const response = await fetch(new URL('../../data/projects.json', import.meta.url), { cache: 'no-store', signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`读取失败（HTTP ${response.status}）`);
  return normalizeProjects(await response.json());
}
