import { matches, tools, projects } from './data.js';
import { $, el, externalLink, favicon } from './dom.js';
import { iconSVG } from './icons.js';
function highlighted(text, query) {
  const fragment = document.createDocumentFragment();
  let start = 0, index;
  const lower = text.toLocaleLowerCase(), needle = query.toLocaleLowerCase();
  while ((index = lower.indexOf(needle, start)) !== -1) {
    fragment.append(document.createTextNode(text.slice(start, index)), el('mark', '', text.slice(index, index + query.length)));
    start = index + query.length;
  }
  fragment.append(document.createTextNode(text.slice(start)));
  return fragment;
}
export function createSearch(favorites) {
  let bookmarks = [], options = [], active = -1, state = 'loading';
  const input = $('#global-search'), panel = $('#global-results');
  function close() {
    panel.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  }
  function activate(index) {
    active = index;
    options.forEach((option, i) => option.setAttribute('aria-selected', String(i === active)));
    input.setAttribute('aria-activedescendant', options[active].id);
    options[active].scrollIntoView({ block: 'nearest' });
  }
  function render() {
    const query = input.value.trim();
    if (!query) { close(); return; }
    panel.replaceChildren(); options = []; active = -1;
    input.removeAttribute('aria-activedescendant');
    const groups = [
      ['常用入口', favorites.visibleItems().map(item => ({ ...item, external: true }))],
      ['网站导航', bookmarks.map(item => ({ ...item, external: true }))],
      ['工具', tools],
      ['项目', projects.map(item => ({ ...item, url: item.url || `#project-${item.id}`, external: Boolean(item.url) }))]
    ];
    for (const [label, items] of groups) {
      const results = items.filter(item => matches(item, query)).slice(0, 12);
      if (!results.length) continue;
      const group = el('div');
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', label);
      const title = el('div', 'search-group', `${label} · ${results.length} 个结果`);
      title.setAttribute('aria-hidden', 'true');
      group.append(title);
      for (const item of results) {
        const option = item.external ? externalLink(item.url, 'search-option') : el('a', 'search-option');
        option.href = item.url;
        option.id = `search-option-${options.length}`;
        option.role = 'option';
        option.tabIndex = -1;
        option.setAttribute('aria-selected', 'false');
        const name = el('span'); name.append(highlighted(item.title, query));
        const details = el('small'); details.append(highlighted([item.description, ...(item.tags || [])].join(' · '), query));
        const graphic = el('span', 'search-result-icon');
        graphic.setAttribute('aria-hidden', 'true');
        graphic.append(item.external ? favicon(item) : iconSVG(label === '工具' ? item.id : 'projects'));
        const text = el('span', 'search-result-text');
        text.append(name, details);
        option.append(graphic, text);
        option.addEventListener('click', () => {
          close();
          if (item.url.startsWith('#')) {
            const target = document.querySelector(item.url);
            target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target?.focus({ preventScroll: true });
          }
        });
        options.push(option); group.append(option);
      }
      panel.append(group);
    }
    if (state !== 'ready') panel.append(el('p', 'search-group', state === 'loading' ? '书签正在加载，可先搜索工具与项目。' : '书签暂时不可用，请到网站导航重新加载。'));
    if (!options.length) panel.append(el('p', 'empty', '没有找到结果，试试「JSON」「量化」或「AI」。'));
    const header = el('div', 'search-results-header', `搜索结果 · ${options.length}`);
    header.setAttribute('role', 'presentation');
    header.append(el('small', '', '↑ ↓ 选择 · Enter 打开'));
    panel.prepend(header);
    panel.hidden = false;
    updatePanelHeight();
    input.setAttribute('aria-expanded', 'true');
    $('#search-announcement').textContent = `找到 ${options.length} 个结果，使用上下方向键选择，回车打开。`;
  }
  input.addEventListener('input', render);
  function updatePanelHeight() {
    if (panel.hidden) return;
    const viewport = window.visualViewport;
    const available = (viewport?.height || innerHeight) + (viewport?.offsetTop || 0) - input.getBoundingClientRect().bottom - 24;
    panel.style.maxHeight = `${Math.max(100, Math.min(620, available))}px`;
  }
  input.addEventListener('focus', () => {
    if (matchMedia('(max-width:640px)').matches) $('#search-container').scrollIntoView({ block: 'start', behavior: 'instant' });
    render();
  });
  window.visualViewport?.addEventListener('resize', updatePanelHeight);
  window.addEventListener('resize', updatePanelHeight);
  window.addEventListener('scroll', updatePanelHeight, { passive: true });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!input.value.trim()) return;
      if (panel.hidden) render();
      if (!options.length) return;
      event.preventDefault();
      activate(active < 0 ? (event.key === 'ArrowDown' ? 0 : options.length - 1) : (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    }
    if (event.key === 'Enter' && !panel.hidden && options.length) {
      event.preventDefault();
      options[active < 0 ? 0 : active].click();
    }
  });
  document.addEventListener('click', event => { if (!$('#search-container').contains(event.target) && !$('#search-open').contains(event.target)) close(); });
  document.addEventListener('focusin', event => { if (!$('#search-container').contains(event.target)) close(); });
  const open = () => { $('#home').scrollIntoView({ block: 'start' }); input.focus({ preventScroll: true }); render(); };
  $('#search-open').addEventListener('click', open);
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); open(); }
  });
  return { setItems(items) { bookmarks = items; state = 'ready'; if (document.activeElement === input) render(); }, setError() { state = 'error'; if (document.activeElement === input) render(); } };
}
