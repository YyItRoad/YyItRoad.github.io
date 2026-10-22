// 尽早应用偏好，减少主题闪烁；存储不可用时仍可切换。
(() => {
  let saved;
  try { saved = localStorage.getItem('yy-theme'); } catch { /* 隐私模式 */ }
  const media = matchMedia('(prefers-color-scheme: dark)');
  const apply = theme => {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-label', theme === 'dark' ? '切换浅色模式' : '切换深色模式');
      button.setAttribute('aria-pressed', String(theme === 'dark'));
    });
  };
  apply(saved === 'dark' || saved === 'light' ? saved : media.matches ? 'dark' : 'light');
  document.addEventListener('DOMContentLoaded', () => {
    apply(document.documentElement.dataset.theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(button => button.addEventListener('click', () => {
      saved = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(saved);
      try { localStorage.setItem('yy-theme', saved); } catch { /* 当前页面仍有效 */ }
    }));
  });
  media.addEventListener('change', event => {
    if (saved !== 'dark' && saved !== 'light') apply(event.matches ? 'dark' : 'light');
  });
})();
