import { loadBookmarks, tools, projects } from './data.js';
import { $, el, externalLink } from './dom.js';
import { createNavigation, createFavorites } from './navigation.js';
import { createSearch } from './search.js?v=icons-v2';
import { iconSVG } from './icons.js';
import { setAssetIcon } from './asset-icons.js';
for (const node of document.querySelectorAll('[data-icon]')) node.replaceChildren(iconSVG(node.dataset.icon));
for (const tool of tools) {
  const card = el('a', 'tool-card'); card.href = tool.url;
  const icon = el('span', 'icon'); setAssetIcon(icon, tool.id); icon.setAttribute('aria-hidden', 'true');
  card.append(icon, el('span', 'card-arrow', '↗'), el('h3', '', tool.title), el('p', '', tool.description));
  $('#tool-grid').append(card);
}
const track = $('#project-track');
for (const project of projects) {
  const card = el('article', 'project-card'); card.id = `project-${project.id}`; card.tabIndex = -1;
  const visual = el('div', `project-visual ${project.style}`); visual.setAttribute('aria-hidden', 'true');
  setAssetIcon(visual, project.id);
  const body = el('div', 'project-body');
  const description = el('p', '', project.description); description.title = project.description;
  body.append(el('h3', '', project.title), description);
  const tags = el('div', 'project-tags');
  for (const tag of project.tags.slice(0, 3)) tags.append(el('span', 'tag', tag));
  body.append(tags);
  if (project.url) {
    const link = externalLink(project.url, 'project-link'); link.setAttribute('aria-label', `${project.title}：${project.linkText}`); link.title = project.linkText; card.append(link);
  } else card.setAttribute('aria-label', `${project.title}，探索方向，暂无公开链接`);
  card.append(visual, body); track.append(card);
}
const move = direction => track.scrollBy({ left: direction * (track.firstElementChild.getBoundingClientRect().width + 14), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
$('#projects-prev').addEventListener('click', () => move(-1));
$('#projects-next').addEventListener('click', () => move(1));
track.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
});
const navigation = createNavigation(), favorites = createFavorites(), search = createSearch(favorites);
async function refresh() {
  const retry = $('#retry-data'); retry.hidden = true;
  $('#navigation-status').textContent = '正在加载导航数据…';
  try {
    const bookmarks = await loadBookmarks();
    navigation.setItems(bookmarks); favorites.setItems(bookmarks); search.setItems(bookmarks);
    $('#bookmark-count').textContent = `${bookmarks.length} 个值得收藏的网站`;
    $('#navigation-status').textContent = bookmarks.length ? '' : '还没有书签，等待公共数据更新。';
  } catch {
    $('#navigation-status').textContent = '导航数据读取失败。请检查网络，或稍后重新加载。';
    $('#favorite-list').replaceChildren(el('p', 'muted', '常用入口暂时不可用，请在网站导航中重新加载。'));
    retry.hidden = false; search.setError();
  }
}
$('#retry-data').addEventListener('click', refresh);
refresh();

// 按页面实际位置更新导航，避免布局变化后仅比较 observer 增量条目。
const sections = [...document.querySelectorAll('main > section[id]')].filter(section => section.id !== 'favorites');
function updateCurrentSection() {
  const marker = scrollY + document.querySelector('.site-header').offsetHeight + 80;
  let current = sections[0];
  for (const section of sections) if (section.offsetTop <= marker) current = section;
  if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) current = sections.at(-1);
  for (const link of document.querySelectorAll('.site-header nav a')) {
    if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
let pendingNavigationFrame = false;
window.addEventListener('scroll', () => {
  if (pendingNavigationFrame) return;
  pendingNavigationFrame = true;
  requestAnimationFrame(() => { updateCurrentSection(); pendingNavigationFrame = false; });
}, { passive: true });
new ResizeObserver(updateCurrentSection).observe(document.body);
updateCurrentSection();
