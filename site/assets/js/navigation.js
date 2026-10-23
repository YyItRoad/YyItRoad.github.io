import { categories, matches } from './data.js?v=ad9f144f503e';
import { $, el, externalLink, favicon } from './dom.js?v=f21f1696d2cb';
import { iconSVG } from './icons.js?v=2b16b074aa2b';
export function createNavigation() {
  let items = [], selected = null, initialized = false;
  const grid = $('#category-grid'), panel = $('#navigation-panel'), filter = $('#category-search');
  function renderList() {
    const list = $('#bookmark-grid');
    list.replaceChildren();
    const visible = items.filter(item => item.category === selected && matches(item, filter.value));
    for (const item of visible) {
      const card = externalLink(item.url, 'bookmark');
      const content = el('div', 'bookmark-content');
      content.append(el('strong', '', item.title), el('p', '', item.description));
      const tags = el('div', 'tags');
      for (const tag of item.tags) tags.append(el('span', 'tag', tag));
      content.append(tags);
      const arrow = el('span', 'bookmark-open', '↗'); arrow.setAttribute('aria-hidden', 'true');
      card.append(favicon(item), content, arrow);
      list.append(card);
    }
    if (!visible.length) list.append(el('div', 'empty', filter.value ? '没有匹配的网站，换个关键词试试。' : '这个分类还在慢慢收集中。'));
    $('#category-status').textContent = `当前分类有 ${visible.length} 个结果`;
  }
  function renderCategories() {
    grid.replaceChildren();
    const config = [...categories];
    for (const item of items) if (!config.some(category => category.title === item.category)) {
      config.push({ title: item.category, description: '更多值得收藏的发现', icon: '✦', color: 'var(--soft)' });
    }
    for (const category of config) {
      const count = items.filter(item => item.category === category.title).length;
      const button = el('button', 'category');
      button.type = 'button';
      button.dataset.category = category.title;
      button.setAttribute('aria-pressed', String(selected === category.title));
      button.setAttribute('aria-controls', 'navigation-panel');
      button.setAttribute('aria-expanded', String(selected === category.title));
      const icon = el('span', 'icon'); icon.append(iconSVG(category.title));
      icon.style.background = category.color;
      icon.setAttribute('aria-hidden', 'true');
      const label = el('span');
      label.append(el('strong', '', category.title), el('small', '', selected ? `${count} 个网站` : `${category.description} · ${count}`));
      button.append(icon, label);
      button.addEventListener('click', () => {
        const closing = selected === category.title;
        selected = closing ? null : category.title;
        filter.value = '';
        update();
        grid.querySelectorAll('button').forEach(node => {
          if (node.dataset.category === category.title) node.focus({ preventScroll: true });
        });
      });
      grid.append(button);
    }
  }
  function update() {
    grid.classList.toggle('compact', Boolean(selected));
    panel.hidden = !selected;
    renderCategories();
    if (selected) renderList();
  }
  filter.addEventListener('input', renderList);
  $('#collapse-navigation').addEventListener('click', () => {
    const previous = selected;
    selected = null;
    update();
    [...grid.querySelectorAll('button')].find(node => node.dataset.category === previous)?.focus();
  });
  renderCategories();
  return { setItems(value) {
    items = value;
    if (!initialized) { selected = items.find(item => item.category === '开发技术')?.category || items[0]?.category || null; initialized = true; }
    if (selected && !items.some(item => item.category === selected)) selected = items[0]?.category || null;
    update();
  } };
}
export function createFavorites() {
  let items = [], preferences = { order: [], hidden: [] };
  try {
    const stored = JSON.parse(localStorage.getItem('yy-favorites'));
    if (stored && Array.isArray(stored.order) && Array.isArray(stored.hidden)) preferences = stored;
  } catch { /* 存储损坏或被禁用，使用默认顺序 */ }
  const save = () => {
    try {
      localStorage.setItem('yy-favorites', JSON.stringify(preferences));
      $('#preference-status').textContent = '已保存到当前浏览器。';
    } catch { $('#preference-status').textContent = '浏览器不允许保存偏好，本次调整仅在当前页面生效。'; }
  };
  const ordered = () => [...items].sort((a, b) => {
    const rank = item => preferences.order.includes(item.id) ? preferences.order.indexOf(item.id) : preferences.order.length + items.indexOf(item);
    return rank(a) - rank(b);
  });
  function render() {
    const list = $('#favorite-list');
    list.replaceChildren();
    const sorted = ordered();
    for (const item of sorted.filter(item => !preferences.hidden.includes(item.id))) {
      const link = externalLink(item.url, 'favorite-link');
      link.append(favicon(item), el('span', '', item.title));
      list.append(link);
    }
    if (!list.children.length) list.append(el('p', 'muted', items.length ? '入口已隐藏，可以在「自定义入口」中恢复。' : '还没有常用入口，公共书签标记为收藏后会出现在这里。'));
    const editor = $('#preference-list');
    editor.replaceChildren();
    sorted.forEach((item, index) => {
      const row = el('div', 'preference-row');
      const label = el('label');
      const checkbox = el('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !preferences.hidden.includes(item.id);
      label.append(checkbox, document.createTextNode(item.title));
      checkbox.addEventListener('change', () => {
        preferences.hidden = preferences.hidden.filter(id => id !== item.id);
        if (!checkbox.checked) preferences.hidden.push(item.id);
        save(); render();
        editor.querySelectorAll('input')[index]?.focus();
      });
      row.append(label);
      for (const [offset, title] of [[-1, '上移'], [1, '下移']]) {
        const button = el('button', '', title);
        button.setAttribute('aria-label', `${title} ${item.title}`);
        button.disabled = index + offset < 0 || index + offset >= sorted.length;
        button.addEventListener('click', () => {
          const ids = sorted.map(item => item.id);
          [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
          preferences.order = ids;
          save(); render();
          const movedRow = editor.children[index + offset];
          const sameButton = movedRow.querySelectorAll('button')[offset === -1 ? 0 : 1];
          (sameButton.disabled ? movedRow.querySelector('input') : sameButton).focus();
        });
        row.append(button);
      }
      editor.append(row);
    });
  }
  $('#edit-favorites').addEventListener('click', () => {
    const editor = $('#favorites-editor');
    editor.hidden = !editor.hidden;
    $('#edit-favorites').setAttribute('aria-expanded', String(!editor.hidden));
  });
  $('#reset-favorites').addEventListener('click', () => {
    preferences = { order: [], hidden: [] }; save(); render();
  });
  return { setItems(value) { items = value.filter(item => item.favorite); render(); }, visibleItems() { return ordered().filter(item => !preferences.hidden.includes(item.id)); } };
}
