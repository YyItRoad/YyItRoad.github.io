/* 本地端到端测试。依赖外部可用的 playwright，不进入生产运行路径。 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const payload = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/bookmarks.json'), 'utf8'));
const shots = path.join(__dirname, '../docs/screenshots');
fs.mkdirSync(shots, { recursive: true });
const results = [], errors = [];
function legacyKey(password, salt) {
  let previous = Buffer.alloc(0), derived = Buffer.alloc(0);
  while (derived.length < 48) {
    previous = crypto.createHash('md5').update(Buffer.concat([previous, Buffer.from(password), salt])).digest();
    derived = Buffer.concat([derived, previous]);
  }
  return { key: derived.subarray(0, 32), iv: derived.subarray(32, 48) };
}
function legacyEncrypt(text, password) {
  const salt = Buffer.from('0123456789abcdef', 'hex'), { key, iv } = legacyKey(password, salt);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([Buffer.from('Salted__'), salt, cipher.update(text), cipher.final()]).toString('base64');
}
function legacyDecrypt(ciphertext, password) {
  const raw = Buffer.from(ciphertext, 'base64'), { key, iv } = legacyKey(password, raw.subarray(8, 16));
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(raw.subarray(16)), decipher.final()]).toString('utf8');
}
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE || chromium.executablePath() });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Shanghai', reducedMotion: 'reduce' });
  // 确定性测试不依赖第三方 favicon 服务；单独人工视觉检查验证真实加载和 fallback。
  await context.route('**/favicon.ico', route => route.abort());
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  async function test(name, fn) {
    try { await fn(); results.push({ name, ok: true }); console.log(`通过：${name}`); }
    catch (error) { results.push({ name, ok: false, error: error.message }); console.error(`失败：${name}\n${error.stack}`); }
  }
  async function home() { await page.goto(base); await page.waitForFunction(() => document.querySelector('#bookmark-count').textContent.includes('7')); }
  async function action(name) { await page.locator(`[data-action="${name}"]`).click(); }
  async function value(selector) { return page.locator(selector).inputValue(); }
  async function hasStatus(text) { assert.match(await page.locator('#tool-status').innerText(), text); }
  await test('真实 JSON、六板块顺序、收藏派生与外链安全', async () => {
    await home();
    assert.deepEqual(await page.locator('main > section').evaluateAll(nodes => nodes.map(node => node.id)), ['home','favorites','tools','navigation','projects','about']);
    assert.equal(await page.locator('.favorite-link').count(), payload.bookmarks.filter(item => item.favorite).length);
    assert.equal(await page.locator('.tool-card').count(), 4);
    assert.equal(await page.locator('.category').count(), 7);
    assert.equal(await page.locator('.site-header img').count(), 0);
    assert(await page.locator('a[target="_blank"]').evaluateAll(nodes => nodes.every(node => node.rel.includes('noopener') && node.rel.includes('noreferrer'))));
  });
  await test('同区分类收缩、别名、未分类与专属搜索、空态', async () => {
    await page.locator('[data-category="开发技术"]').click();
    assert(await page.locator('#category-grid').evaluate(node => node.classList.contains('compact')));
    assert.equal(await page.locator('#bookmark-grid a').count(), 2);
    assert.equal(await page.locator('#navigation-panel h2, #navigation-panel h3').count(), 0);
    await page.locator('#category-search').fill('前端');
    assert.equal(await page.locator('#bookmark-grid a').count(), 1);
    assert.match(await page.locator('#bookmark-grid').innerText(), /Vue/);
    await page.locator('#category-search').fill('不存在的词');
    assert.match(await page.locator('#bookmark-grid').innerText(), /没有匹配/);
    await page.locator('[data-category="AI资源"]').click();
    assert.match(await page.locator('#bookmark-grid').innerText(), /ChatGPT/);
    await page.locator('[data-category="未分类"]').click();
    assert.equal(await page.locator('#bookmark-grid a').count(), 3);
    await page.locator('#collapse-navigation').click();
    assert(await page.locator('#navigation-panel').isHidden());
  });
  await test('收藏隐藏、顺序调整、刷新持久化与恢复默认', async () => {
    await page.locator('#edit-favorites').click();
    await page.getByRole('button', { name: '下移 GitHub', exact: true }).click();
    assert.equal(await page.locator('.favorite-link > span:last-child').first().innerText(), 'ChatGPT');
    await page.locator('#preference-list label').filter({ hasText: 'GitHub' }).locator('input').uncheck();
    assert.equal(await page.locator('.favorite-link').count(), 2);
    await home();
    assert.equal(await page.locator('.favorite-link > span:last-child').first().innerText(), 'ChatGPT');
    assert.equal(await page.locator('.favorite-link').count(), 2);
    await page.locator('#edit-favorites').click();
    await page.locator('#reset-favorites').click();
    assert.equal(await page.locator('.favorite-link > span:last-child').first().innerText(), 'GitHub');
    await page.locator('#edit-favorites').click();
  });
  await test('全局分组、中文和标签、高亮、上下回车 Escape 及快捷键', async () => {
    const search = page.locator('#global-search');
    await search.fill('GitHub');
    assert.equal(await page.locator('#global-results [role=group]').count(), 2);
    assert(await page.locator('#global-results mark').count() >= 2);
    const unobstructed = await page.locator('#global-results [role=option]').first().evaluate(node => { const rect = node.getBoundingClientRect(); return node.contains(document.elementFromPoint(rect.x + 10, rect.y + rect.height / 2)); });
    assert(unobstructed, '搜索浮层被其他板块遮挡');
    await page.screenshot({ path: path.join(shots, 'search.png') });
    await search.press('ArrowUp');
    const count = await page.locator('#global-results [role=option]').count();
    assert.equal(await search.getAttribute('aria-activedescendant'), `search-option-${count - 1}`);
    await search.press('Escape'); assert(await page.locator('#global-results').isHidden());
    await search.fill('量化');
    assert.match(await page.locator('#global-results').innerText(), /我的项目|项目/);
    assert.match(await page.locator('#global-results').innerText(), /QuantDinger/);
    await search.fill('格式化'); await search.press('ArrowDown'); await search.press('Enter');
    await page.waitForURL('**/tools/json.html');
    await home();
    await page.keyboard.press('Control+k');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'global-search');
    await search.fill('绝无此结果'); assert.match(await page.locator('#global-results').innerText(), /没有找到/);
    await search.fill('AI');
    await page.locator('#tools-title').click();
    assert(await page.locator('#global-results').isHidden());
  });
  await test('项目横向按钮与方向键、独立关于区、深色偏好', async () => {
    await page.locator('#projects-next').click();
    assert(await page.locator('#project-track').evaluate(node => node.scrollLeft > 0));
    await page.locator('#project-track').focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#project-track').evaluate(node => node.scrollLeft), 0);
    const project = await page.locator('#projects').boundingBox(), about = await page.locator('#about').boundingBox();
    assert(about.y >= project.y + project.height);
    await page.locator('[data-theme-toggle]').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await home(); assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.screenshot({ path: path.join(shots, 'desktop-dark.png'), fullPage: true });
    await page.locator('[data-theme-toggle]').click();
    await page.screenshot({ path: path.join(shots, 'desktop.png'), fullPage: true });
  });
  await test('动态增量数据、未知分类、缺省字段、危险 URL 与 XSS', async () => {
    await page.route('**/data/bookmarks.json', route => route.fulfill({ json: { bookmarks: [
      ...payload.bookmarks,
      { id: '8', title: '<img src=x onerror=alert(1)>', url: 'https://example.org', category: '新分类', favorite: true, tags: ['新标签'], sort_order: -5 },
      { url: 'https://example.com' },
      { title: '危险', url: 'javascript:alert(1)', favorite: true },
      null
    ] } }));
    await page.reload(); await page.waitForFunction(() => document.querySelector('#bookmark-count').textContent.includes('9'));
    await page.locator('[data-category="新分类"]').click();
    assert.match(await page.locator('#bookmark-grid').innerText(), /<img src=x onerror=alert\(1\)>/);
    assert.equal(await page.locator('[onerror]').count(), 0);
    assert.equal(await page.locator('a[href^="javascript:"]').count(), 0);
    assert.equal(await page.locator('.favorite-link > span:last-child').first().innerText(), '<img src=x onerror=alert(1)>');
    await page.unroute('**/data/bookmarks.json');
  });
  await test('读取失败、损坏 JSON、重试恢复与加载中提示', async () => {
    await page.route('**/data/bookmarks.json', route => route.fulfill({ status: 503, body: 'unavailable' }));
    await page.reload(); await page.locator('#retry-data').waitFor();
    assert.match(await page.locator('#navigation-status').innerText(), /读取失败/);
    await page.locator('#global-search').fill('JSON');
    assert.match(await page.locator('#global-results').innerText(), /书签暂时不可用/);
    await page.unroute('**/data/bookmarks.json');
    await page.route('**/data/bookmarks.json', route => route.fulfill({ body: '{broken', contentType: 'application/json' }));
    await page.locator('#retry-data').click(); await page.locator('#retry-data').waitFor();
    assert.match(await page.locator('#navigation-status').innerText(), /读取失败/);
    await page.unroute('**/data/bookmarks.json');
    await page.locator('#retry-data').click(); await page.waitForFunction(() => document.querySelector('#bookmark-count').textContent.includes('7'));
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/data/bookmarks.json', async route => { await gate; await route.continue(); });
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.match(await page.locator('#navigation-status').innerText(), /正在加载/);
    release();
    await page.waitForFunction(() => document.querySelector('#bookmark-count').textContent.includes('7'));
    await page.unroute('**/data/bookmarks.json');
  });
  await test('JSON 格式化、压缩、校验及错误清除旧结果', async () => {
    await page.goto(`${base}/tools/json.html`);
    await page.locator('#source').fill('{"你好":"世界","items":[1,2]}');
    await action('format'); assert.equal(await value('#result'), '{\n  "你好": "世界",\n  "items": [\n    1,\n    2\n  ]\n}');
    await action('minify'); assert.equal(await value('#result'), '{"你好":"世界","items":[1,2]}');
    await action('validate'); await hasStatus(/语法有效/);
    await page.locator('#source').fill('{bad'); await action('format');
    await hasStatus(/语法错误/); assert.equal(await value('#result'), '');
    await page.locator('#clear').click(); assert.equal(await value('#source'), '');
  });
  await test('AES 独立 Node/OpenSSL 兼容向量、随机盐、错误口令与隐藏清空', async () => {
    await page.goto(`${base}/tools/crypto.html`);
    const text = '旧版兼容测试：你好 🌄\n第二行', password = '测试口令!123';
    await page.locator('#source').fill(legacyEncrypt(text, password));
    await page.locator('#passphrase').fill(password);
    await action('decrypt'); assert.equal(await value('#result'), text);
    await page.locator('#source').fill(text); await action('encrypt');
    const encrypted = await value('#result'); assert.equal(legacyDecrypt(encrypted, password), text);
    await action('encrypt'); assert.notEqual(await value('#result'), encrypted);
    await page.locator('#source').fill(encrypted); await page.locator('#passphrase').fill('wrong-password');
    await action('decrypt'); await hasStatus(/解密失败/); assert.equal(await value('#result'), '');
    await page.locator('#source').fill('not base64!'); await action('decrypt'); await hasStatus(/解密失败/);
    await page.locator('#toggle-passphrase').click(); assert.equal(await page.locator('#passphrase').getAttribute('type'), 'text');
    await page.locator('#clear').click(); assert.equal(await value('#passphrase'), ''); assert.equal(await page.locator('#passphrase').getAttribute('type'), 'password');
    await action('encrypt'); await hasStatus(/请先输入/);
    await page.goto(`${base}/m.html`); await page.waitForURL('**/tools/crypto.html');
  });
  await test('中文 emoji Base64、URL 往返、大文本与非法编码', async () => {
    await page.goto(`${base}/tools/encoder.html`);
    const text = '你好 🌄 /?a=1&b=+%';
    await page.locator('#source').fill(text); await action('base64-encode');
    const encoded = await value('#result'); assert.equal(encoded, Buffer.from(text).toString('base64'));
    await page.locator('#source').fill(encoded); await action('base64-decode'); assert.equal(await value('#result'), text);
    await page.locator('#source').fill(text); await action('url-encode');
    await page.locator('#source').fill(await value('#result')); await action('url-decode'); assert.equal(await value('#result'), text);
    for (const invalid of ['abc!', 'ab=c', '/w==', 'Zh==']) {
      await page.locator('#source').fill(invalid); await action('base64-decode');
      assert.equal(await page.locator('#tool-status').getAttribute('data-error'), 'true');
    }
    await page.locator('#source').fill('%E0%A4'); await action('url-decode'); await hasStatus(/无效的 URL/);
    const large = '中文🌄'.repeat(40000);
    await page.locator('#source').fill(large); await action('base64-encode');
    assert.equal(Buffer.from(await value('#result'), 'base64').toString('utf8'), large);
  });
  await test('时间戳秒与毫秒、UTC/上海时区、负值、边界及无效输入', async () => {
    await page.goto(`${base}/tools/timestamp.html`);
    await page.locator('#timestamp').fill('0'); await action('to-date');
    assert.match(await value('#result'), /1970-01-01T00:00:00.000Z/);
    assert.equal(await value('#datetime'), '1970-01-01T08:00');
    await page.locator('#unit').selectOption('milliseconds'); await page.locator('#timestamp').fill('1234'); await action('to-date');
    assert.match(await value('#result'), /1970-01-01T00:00:01.234Z/);
    await page.locator('#timezone').selectOption('utc'); await page.locator('#datetime').fill('2024-02-29T12:34:56.789');
    await action('to-timestamp'); assert.equal(await value('#timestamp'), String(Date.parse('2024-02-29T12:34:56.789Z')));
    await page.locator('#unit').selectOption('seconds'); await page.locator('#timestamp').fill('-1'); await action('to-date');
    assert.match(await value('#result'), /1969-12-31T23:59:59.000Z/);
    for (const invalid of ['1.5', '', '999999999999999999999999']) {
      await page.locator('#timestamp').fill(invalid); await action('to-date');
      assert.equal(await page.locator('#tool-status').getAttribute('data-error'), 'true');
    }
    const invalidDate = await page.evaluate(async () => {
      const { parseDateInput } = await import('/assets/js/tool-core.js');
      try { parseDateInput('2024-02-30T12:00', 'utc'); return false; } catch { return true; }
    });
    assert(invalidDate);
    await action('now'); assert(Math.abs(Number(await value('#timestamp')) * 1000 - Date.now()) < 2000);
  });
  await test('工具无外发请求、复制成功、拒绝时手动复制 fallback', async () => {
    await page.goto(`${base}/tools/encoder.html`);
    await page.waitForLoadState('networkidle');
    const requests = [];
    const listener = request => requests.push(request.url());
    page.on('request', listener);
    await page.locator('#source').fill('绝不上传的测试输入'); await action('base64-encode');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('#copy').click(); await page.waitForFunction(() => document.querySelector('#tool-status').textContent.includes('已复制')); await hasStatus(/已复制/);
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), await value('#result'));
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('denied')) } }));
    await page.locator('#copy').click(); await page.waitForFunction(() => document.querySelector('#tool-status').textContent.includes('手动复制')); await hasStatus(/手动复制/);
    assert.deepEqual(requests, []);
    page.off('request', listener);
  });
  await test('隐私模式 localStorage 被禁用仍可加载、编辑与切换主题', async () => {
    const restricted = await context.newPage();
    await restricted.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }));
    await restricted.goto(base); await restricted.locator('.favorite-link').first().waitFor();
    await restricted.locator('#edit-favorites').click();
    await restricted.locator('#preference-list input').first().uncheck();
    assert.match(await restricted.locator('#preference-status').innerText(), /不允许保存/);
    await restricted.locator('[data-theme-toggle]').click();
    await restricted.close();
  });
  await test('移动端 375px、320px、平板、桌面五页面无水平溢出', async () => {
    for (const width of [320,375,768,1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const endpoint of ['', '/tools/crypto.html','/tools/json.html','/tools/timestamp.html','/tools/encoder.html']) {
        await page.goto(`${base}${endpoint}`);
        if (!endpoint) await page.waitForFunction(() => document.querySelector('#bookmark-count').textContent.includes('7'));
        const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert(sizes.scroll <= sizes.viewport, `${width}px ${endpoint} 溢出：${sizes.scroll}`);
      }
    }
    await page.setViewportSize({ width: 375, height: 812 }); await home();
    await page.screenshot({ path: path.join(shots, 'mobile.png'), fullPage: true });
    await page.locator('[data-category="开发技术"]').click();
    await page.locator('#category-search').fill('Vue');
    assert.equal(await page.locator('#bookmark-grid a').count(), 1);
    await page.locator('#search-open').click(); await page.locator('#global-search').fill('JSON');
    await page.locator('#global-search').press('ArrowDown'); await page.locator('#global-search').press('Enter');
    await page.waitForURL('**/tools/json.html');
    await page.locator('#source').fill('{"手机":true}'); await action('format');
    assert.match(await value('#result'), /手机/);
    await page.screenshot({ path: path.join(shots, 'mobile-tool.png'), fullPage: true });
  });
  await test('独立子目录托管时首页 JSON 与工具模块路径正确', async () => {
    const http = require('node:http');
    const root = path.resolve(__dirname, '..');
    const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.webp':'image/webp' };
    const server = http.createServer((request, response) => {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (!pathname.startsWith('/preview/')) { response.writeHead(404); response.end(); return; }
      const filename = path.resolve(root, pathname.slice('/preview/'.length) || 'index.html');
      if (!filename.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
      try { response.setHeader('Content-Type', types[path.extname(filename)] || 'application/octet-stream'); response.end(fs.readFileSync(filename)); }
      catch { response.writeHead(404); response.end(); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const nested = await context.newPage();
    try {
      const url = `http://127.0.0.1:${server.address().port}/preview/`;
      await nested.goto(url);
      await nested.waitForFunction(() => document.querySelector('#bookmark-count').textContent.includes('7'));
      await nested.goto(url + 'tools/encoder.html');
      await nested.locator('#source').fill('子路径');
      await nested.locator('[data-action=base64-encode]').click();
      assert.equal(await nested.locator('#result').inputValue(), Buffer.from('子路径').toString('base64'));
    } finally { await nested.close(); await new Promise(resolve => server.close(resolve)); }
  });
  await test('夏令时跳变拒绝不存在的本地日期', async () => {
    const dst = await browser.newContext({ timezoneId:'America/New_York' });
    const dstPage = await dst.newPage();
    try {
      await dstPage.goto(`${base}/tools/timestamp.html`);
      await dstPage.locator('#datetime').fill('2026-03-08T02:30');
      await dstPage.locator('[data-action=to-timestamp]').click();
      assert.match(await dstPage.locator('#tool-status').innerText(), /夏令时/);
    } finally { await dst.close(); }
  });
  await test('所有页面无未捕获 JavaScript 错误', async () => { assert.deepEqual(errors, []); });
  await browser.close();
  const success = results.filter(item => item.ok).length;
  console.log(`\n${success}/${results.length} 组测试通过`);
  fs.writeFileSync(path.join(__dirname, '../docs/自动化测试结果.md'), `# 自动化测试结果\n\n运行日期：2026-10-22\n\n环境：Chromium，Asia/Shanghai 时区，静态 HTTP 服务。\n\n结果：${success}/${results.length} 组通过。\n\n` + results.map(item => `- [${item.ok ? 'x' : ' '}] ${item.name}${item.error ? `：${item.error}` : ''}`).join('\n') + '\n');
  if (success !== results.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
