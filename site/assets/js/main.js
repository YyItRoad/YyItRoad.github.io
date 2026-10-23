import { loadBookmarks, loadProjects, normalizeProjects, fallbackProjects, tools } from './data.js?v=ad9f144f503e';
import { $, el, externalLink } from './dom.js?v=f21f1696d2cb';
import { createNavigation, createFavorites } from './navigation.js?v=f226d9142c31';
import { createSearch } from './search.js?v=b8042b8b6816';
import { iconSVG } from './icons.js?v=2b16b074aa2b';
import { setAssetIcon, setProjectIcon } from './asset-icons.js?v=833dc666d804';
for (const node of document.querySelectorAll('[data-icon]')) {
  if (node.classList.contains('section-icon')) setAssetIcon(node, node.dataset.icon);
  else node.replaceChildren(iconSVG(node.dataset.icon));
}
for (const tool of tools) {
  const card = el('a', 'tool-card'); card.href = tool.url;
  const icon = el('span', 'icon'); setAssetIcon(icon, tool.id); icon.setAttribute('aria-hidden', 'true');
  card.append(icon, el('span', 'card-arrow', '↗'), el('h3', '', tool.title), el('p', '', tool.description));
  $('#tool-grid').append(card);
}
const track = $('#project-track');
function renderProjects(projects) {
  track.replaceChildren();
  const styles = ['quant', 'diary', 'automation', 'video'];
  for (const [index, project] of projects.entries()) {
    const card = el('article', 'project-card'); card.id = `project-${project.id}`; card.tabIndex = -1;
    const visual = el('div', `project-visual ${styles[index % styles.length]}`); visual.setAttribute('aria-hidden', 'true');
    setProjectIcon(visual, project);
    const body = el('div', 'project-body');
    const description = el('p', '', project.description); description.title = project.description;
    body.append(el('h3', '', project.title), description);
    if (project.status) body.append(el('span', 'project-status', project.status));
    const tags = el('div', 'project-tags');
    for (const tag of project.tags) tags.append(el('span', 'tag', tag));
    body.append(tags);
    const url = project.url || project.github_url;
    if (url) {
      const label = project.url ? '访问项目' : '查看 GitHub';
      const link = externalLink(url, 'project-link'); link.setAttribute('aria-label', `${project.title}：${label}`); link.title = label; card.append(link);
    } else card.setAttribute('aria-label', `${project.title}，暂无公开链接`);
    // 两个地址并存时保留整卡访问入口，额外提供可独立聚焦的 GitHub 链接。
    if (project.url && project.github_url) {
      const github = externalLink(project.github_url, 'project-github'); github.textContent = 'GitHub ↗'; body.append(github);
    }
    card.append(visual, body); track.append(card);
  }
  $('#projects-prev').disabled = $('#projects-next').disabled = projects.length < 2;
}
const move = direction => track.scrollBy({ left: direction * ((track.firstElementChild?.getBoundingClientRect().width || 0) + 14), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
$('#projects-prev').addEventListener('click', () => move(-1));
$('#projects-next').addEventListener('click', () => move(1));
track.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
});
const navigation = createNavigation(), favorites = createFavorites(), search = createSearch(favorites);
async function refreshProjects() {
  const retry = $('#retry-projects'); retry.hidden = true;
  $('#projects-status').textContent = '正在加载项目数据…';
  try {
    const projects = await loadProjects();
    renderProjects(projects); search.setProjects(projects);
    $('#projects-status').textContent = projects.length ? '' : '还没有公开项目，等待公共数据更新。';
  } catch {
    const projects = normalizeProjects({ projects: fallbackProjects });
    renderProjects(projects); search.setProjects(projects);
    $('#projects-status').textContent = '项目数据读取失败，当前显示内置备用列表，可能不是最新内容。';
    retry.hidden = false;
  }
}
$('#retry-projects').addEventListener('click', refreshProjects);
refreshProjects();
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
