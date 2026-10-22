export const $ = selector => document.querySelector(selector);
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export function externalLink(url, className) {
  const node = el('a', className);
  node.href = url;
  node.target = '_blank';
  node.rel = 'noopener noreferrer';
  return node;
}
export function favicon(item) {
  const wrapper = el('span');
  wrapper.setAttribute('aria-hidden', 'true');
  const fallback = el('span', 'favicon-fallback', Array.from(item.title)[0] || '↗');
  const image = el('img', 'favicon');
  image.alt = '';
  image.loading = 'lazy';
  image.referrerPolicy = 'no-referrer';
  const host = new URL(item.url).hostname.replace(/^www\./, '');
  const known = { 'github.com':'github.ico', 'chatgpt.com':'chatgpt-brand.svg', 'tradingview.com':'tradingview.ico', 'vuejs.org':'vue.svg' };
  image.dataset.brand = host;
  image.src = known[host] ? new URL(`../images/brands/${known[host]}`, import.meta.url).href : new URL('/favicon.ico', item.url).href;
  image.addEventListener('error', () => image.replaceWith(fallback), { once: true });
  wrapper.append(image);
  return wrapper;
}
export function notify(message) {
  const node = $('#toast');
  node.textContent = message;
  node.hidden = false;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => { node.hidden = true; }, 3000);
}
