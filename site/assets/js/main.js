import { loadBookmarks, tools, projects } from './data.js';
import { $, el, externalLink } from './dom.js';
import { createNavigation, createFavorites } from './navigation.js';
import { createSearch } from './search.js';
import { iconSVG } from './icons.js';
for (const node of document.querySelectorAll('[data-icon]')) node.replaceChildren(iconSVG(node.dataset.icon));
for (const tool of tools) {
  const card = el('a', 'tool-card'); card.href = tool.url;
  const icon = el('span', 'icon'); icon.append(iconSVG(tool.id)); icon.style.background = tool.color; icon.setAttribute('aria-hidden', 'true');
  card.append(icon, el('span', 'card-arrow', '↗'), el('h3', '', tool.title), el('p', '', tool.description));
  $('#tool-grid').append(card);
}
const track = $('#project-track');
for (const project of projects) {
  const card = el('article', 'project-card'); card.id = `project-${project.id}`; card.tabIndex = -1;
  const visual = el('div', `project-visual ${project.style}`); visual.setAttribute('aria-hidden', 'true');
  visual.append(el('span', 'project-symbol', project.icon), el('span', 'project-mini', project.caption));
  const body = el('div', 'project-body');
  body.append(el('h3', '', project.title), el('p', '', project.description));
  if (project.url) { const link = externalLink(project.url); link.textContent = project.linkText; body.append(link); }
  else body.append(el('span', 'project-status', '探索记录 · 暂无公开链接'));
  card.append(visual, body); track.append(card);
}
const move = direction => track.scrollBy({ left: direction * (track.firstElementChild.getBoundingClientRect().width + 22), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
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
    $('#navigation-status').textContent = bookmarks.length ? '选一个分类，开启新的发现。' : '还没有书签，等待公共数据更新。';
  } catch {
    $('#navigation-status').textContent = '导航数据读取失败。请检查网络，或稍后重新加载。';
    $('#favorite-list').replaceChildren(el('p', 'muted', '常用入口暂时不可用，请在网站导航中重新加载。'));
    retry.hidden = false; search.setError();
  }
}
$('#retry-data').addEventListener('click', refresh);
refresh();

// 主导航状态随当前可见板块更新。
const sectionObserver = new IntersectionObserver(entries => {
  const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  for (const link of document.querySelectorAll('.site-header nav a')) {
    if (link.hash === `#${visible.target.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}, { rootMargin: '-110px 0px -45% 0px', threshold: [0, 0.25, 0.5] });
for (const section of document.querySelectorAll('main > section[id]')) if (section.id !== 'favorites') sectionObserver.observe(section);
