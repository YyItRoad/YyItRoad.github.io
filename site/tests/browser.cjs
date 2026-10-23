/* 本地端到端测试。依赖外部可用的 playwright，不进入生产运行路径。 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const payload = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/bookmarks.json'), 'utf8'));
const projectPayload = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/projects.json'), 'utf8'));
const visibleProjects = projectPayload.projects.filter(item => item.visible !== false).sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
const categoryName = value => (value || '未分类').replace(/\s+/g, '');
const favoriteItems = payload.bookmarks.filter(item => item.favorite === true).sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
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
  async function home() { await page.goto(base); await page.waitForFunction(() => !document.querySelector('#projects-status').textContent.includes('正在加载')); await page.waitForFunction(expected => document.querySelector('#bookmark-count').textContent.includes(String(expected)), payload.bookmarks.length); }
  async function action(name) { await page.locator(`[data-action="${name}"]`).click(); }
  async function value(selector) { return page.locator(selector).inputValue(); }
  async function hasStatus(text) { assert.match(await page.locator('#tool-status').innerText(), text); }
  await test('真实 JSON、六板块顺序、收藏派生与外链安全', async () => {
    await home();
    assert.deepEqual(await page.locator('main > section').evaluateAll(nodes => nodes.map(node => node.id)), ['home','favorites','tools','navigation','projects','about']);
    assert.equal(await page.locator('.favorite-link').count(), payload.bookmarks.filter(item => item.favorite).length);
    assert.equal(await page.locator('.tool-card').count(), 4);
    assert.equal(await page.locator('.category').count(), new Set(['开发技术','AI资源','交易研究','内容创作','生活兴趣','效率办公', ...payload.bookmarks.map(item => categoryName(item.category))]).size);
    assert.equal(await page.locator('.site-header img').count(), 0);
    assert.deepEqual(await page.locator('.site-header nav a').allTextContents(), ['首页','工具','导航','项目','关于']);
    assert(await page.locator('a[target="_blank"]').evaluateAll(nodes => nodes.every(node => node.rel.includes('noopener') && node.rel.includes('noreferrer'))));
  });
  await test('同区分类收缩、别名、未分类与专属搜索、空态', async () => {
    if (await page.locator('[data-category="开发技术"]').getAttribute('aria-pressed') !== 'true') await page.locator('[data-category="开发技术"]').click();
    assert(await page.locator('#category-grid').evaluate(node => node.classList.contains('compact')));
    assert.equal(await page.locator('#bookmark-grid a').count(), payload.bookmarks.filter(item => categoryName(item.category) === '开发技术').length);
    assert.equal(await page.locator('#navigation-panel h2, #navigation-panel h3').count(), 0);
    await page.locator('#category-search').fill('前端');
    assert(await page.locator('#bookmark-grid a').count() >= 1);
    assert.match(await page.locator('#bookmark-grid').innerText(), /Vue/);
    await page.locator('#category-search').fill('不存在的词');
    assert.match(await page.locator('#bookmark-grid').innerText(), /没有匹配/);
    await page.locator('[data-category="AI资源"]').click();
    assert.match(await page.locator('#bookmark-grid').innerText(), /ChatGPT/);
    await page.locator('[data-category="未分类"]').click();
    assert.equal(await page.locator('#bookmark-grid a').count(), payload.bookmarks.filter(item => categoryName(item.category) === '未分类').length);
    await page.locator('#collapse-navigation').click();
    assert(await page.locator('#navigation-panel').isHidden());
  });
  await test('收藏隐藏、顺序调整、刷新持久化与恢复默认', async () => {
    await page.locator('#edit-favorites').click();
    await page.getByRole('button', { name: `下移 ${favoriteItems[0].title}`, exact: true }).click();
    assert.equal(await page.locator('.favorite-link > span:last-child').first().innerText(), favoriteItems[1].title);
    await page.locator('#preference-list label').filter({ hasText: favoriteItems[0].title }).locator('input').uncheck();
    assert.equal(await page.locator('.favorite-link').count(), payload.bookmarks.filter(item => item.favorite).length - 1);
    await home();
    assert.equal(await page.locator('.favorite-link > span:last-child').first().innerText(), favoriteItems[1].title);
    assert.equal(await page.locator('.favorite-link').count(), payload.bookmarks.filter(item => item.favorite).length - 1);
    await page.locator('#edit-favorites').click();
    await page.locator('#reset-favorites').click();
    assert.equal(await page.locator('.favorite-link > span:last-child').first().innerText(), favoriteItems[0].title);
    await page.locator('#edit-favorites').click();
  });
  await test('全局分组、中文和标签、高亮、上下回车 Escape 及快捷键', async () => {
    const search = page.locator('#global-search');
    await search.fill('GitHub');
    assert(await page.locator('#global-results [role=group][aria-label="常用入口"]').count() === 1);
    assert(await page.locator('#global-results [role=group][aria-label="网站导航"]').count() === 1);
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
    await page.setViewportSize({ width:1024, height:1000 });
    await page.locator('#projects-next').click();
    assert(await page.locator('#project-track').evaluate(node => node.scrollLeft > 0));
    await page.locator('#project-track').focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#project-track').evaluate(node => node.scrollLeft), 0);
    const project = await page.locator('#projects').boundingBox(), about = await page.locator('#about').boundingBox();
    assert(about.y >= project.y + project.height);
    await page.setViewportSize({ width:1440, height:1000 });
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
    await page.reload(); await page.waitForFunction(expected => document.querySelector('#bookmark-count').textContent.includes(String(expected)), payload.bookmarks.length + 2);
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
    await page.locator('#retry-data').click(); await page.waitForFunction(expected => document.querySelector('#bookmark-count').textContent.includes(String(expected)), payload.bookmarks.length);
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/data/bookmarks.json', async route => { await gate; await route.continue(); });
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.match(await page.locator('#navigation-status').innerText(), /正在加载/);
    release();
    await page.waitForFunction(expected => document.querySelector('#bookmark-count').textContent.includes(String(expected)), payload.bookmarks.length);
    await page.unroute('**/data/bookmarks.json');
  });
  await test('项目慢速加载不阻塞书签，完成后立即更新已打开搜索', async () => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/data/projects.json', async route => { await gate; await route.fulfill({json:{projects:[{title:'延迟项目', tags:['异步检索']}]}}); });
    try {
      await page.goto(base, {waitUntil:'domcontentloaded'});
      await page.waitForFunction(expected => document.querySelector('#bookmark-count').textContent.includes(String(expected)), payload.bookmarks.length);
      assert.match(await page.locator('#projects-status').innerText(), /正在加载/);
      await page.locator('#global-search').fill('异步检索');
      assert.match(await page.locator('#global-results').innerText(), /没有找到/);
      release();
      await page.waitForFunction(() => document.querySelector('#global-results').textContent.includes('延迟项目'));
      assert.equal(await page.locator('.project-card').count(), 1);
    } finally { release(); await page.unroute('**/data/projects.json'); }
  });
  await test('项目真实 JSON、排序、缺失文件默认图标、GitHub 回退与搜索', async () => {
    await home();
    assert.deepEqual(await page.locator('.project-body h3').allTextContents(), visibleProjects.map(item => item.title));
    await page.waitForFunction(() => [...document.querySelectorAll('.project-visual')].every(node => node.querySelector('svg') || node.querySelector('img')?.naturalWidth));
    await page.waitForFunction(() => [...document.querySelectorAll('.project-visual img')].every(img => img.complete && img.naturalWidth > 0));
    const quant = page.locator('.project-card').filter({ hasText: 'QuantDinger' });
    assert.equal(await quant.locator('.project-link').getAttribute('href'), visibleProjects.find(item => item.title === 'QuantDinger').github_url);
    assert((await quant.locator('.project-visual img').getAttribute('src')).endsWith('/icons-v2/quant-v2.webp'));
    await page.locator('#global-search').fill('量化');
    const projectResult = page.getByRole('group', { name:'项目', exact:true });
    assert((await projectResult.locator('.search-result-icon img').first().getAttribute('src')).endsWith('/icons-v2/quant-v2.webp'));
  });
  await test('项目文件名安全校验及所有约定后缀', async () => {
    const result = await page.evaluate(async () => {
      const { projectIconURL } = await import(new URL('assets/js/data.js', location.href));
      const valid = ['quant','diary.svg','test_1-2.webp','a.png','b.jpg','c.jpeg'];
      const invalid = ['',null,{},'../a.svg','a/b.svg','a\\b.svg','https://evil.test/a.svg','//evil.test/a.svg','data:image/svg+xml,x','%2e%2e%2fa.svg','a.svg?x=1','a.svg#x','<img src=x onerror=alert(1)>','a.SVG','a.gif','a.svg\n',' a'];
      return { valid: valid.map(value => projectIconURL(value)), invalid: invalid.map(value => projectIconURL(value)) };
    });
    assert(result.valid.every(url => url.startsWith(`${base}/assets/images/projects/`)));
    assert(result.valid[0].endsWith('/quant.svg'));
    assert(result.invalid.every(url => url === null));
  });
  await test('新增项目、SVG/WebP 成功、恶意值与缺失图标、链接和状态安全渲染', async () => {
    const malicious = '<img src=x onerror=window.projectXSS=1>';
    const items = [
      { id:'new', title:'后台新增项目', description:'新增说明', tags:['独立标签'], status:'开发中', icon:'test.svg', url:'https://example.org', github_url:'https://github.com/example/demo', sort_order:-10 },
      { id:'webp', title:'WebP 项目', icon:'test.webp', sort_order:-5 },
      { id:'missing', title:'缺失图标', icon:'missing.svg', sort_order:1 },
      { id:'hidden', title:'不应被搜索的项目', visible:false },
      ...['../escape.svg','https://evil.test/icon.svg','a.svg" onerror="alert(1)','',null].map((icon,index) => ({ id:'bad'+index, title:malicious, description:malicious, tags:[malicious], status:malicious, icon, url:'javascript:alert(1)', github_url:'data:text/html,x', sort_order:2+index })),
      { id:'new', title:'重复 ID 无链接项目', sort_order:20 },
      { id:'bad id#', title:'缺省字段项目' }, null
    ];
    await page.route('**/data/projects.json', route => route.fulfill({ json:{ projects:items } }));
    const iconRequests = [];
    await page.route('**/assets/images/projects/**', route => {
      const url = route.request().url(); iconRequests.push(url);
      if (url.endsWith('/test.svg')) return route.fulfill({ contentType:'image/svg+xml', body:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="blue"/></svg>' });
      if (url.endsWith('/test.webp')) return route.fulfill({ contentType:'image/webp', body:fs.readFileSync(path.join(__dirname, '../assets/images/about-explorer-v1.webp')) });
      return route.fulfill({ status:404, body:'missing' });
    });
    try {
      await home();
      assert.equal(await page.locator('.project-card').count(), items.filter(item => item && item.visible !== false).length);
      assert.equal(await page.locator('.project-body h3').first().innerText(), '后台新增项目');
      await page.waitForFunction(() => document.querySelectorAll('.project-icon').length === 2);
      assert(await page.locator('.project-icon').evaluateAll(nodes => nodes.every(node => node.naturalWidth > 0)));
      assert.equal(await page.locator('.project-visual .asset-icon:not(.project-icon)').count(), items.filter(item => item && item.visible !== false).length - 2);
      await page.waitForFunction(() => [...document.querySelectorAll('.project-visual img')].every(img => img.complete && img.naturalWidth > 0));
      assert(iconRequests.every(url => /\/(?:test\.svg|test\.webp|missing\.svg)$/.test(url)), iconRequests.join(', '));
      const card = page.locator('.project-card').first();
      assert.match(await card.innerText(), /新增说明|独立标签/);
      assert.equal(await card.locator('.project-status').innerText(), '开发中');
      assert.equal(await card.locator('.project-link').getAttribute('href'), 'https://example.org/');
      assert.equal(await card.locator('.project-github').getAttribute('href'), 'https://github.com/example/demo');
      assert.equal(await page.locator('[onerror], a[href^="javascript:"], a[href^="data:"]').count(), 0);
      assert.equal(await page.evaluate(() => window.projectXSS), undefined);
      const ids = await page.locator('.project-card').evaluateAll(nodes => nodes.map(node => node.id));
      assert.equal(new Set(ids).size, ids.length);
      const search = page.locator('#global-search');
      await search.fill('独立标签');
      assert.match(await page.locator('#global-results').innerText(), /后台新增项目/);
      await search.fill('不应被搜索');
      assert.match(await page.locator('#global-results').innerText(), /没有找到/);
      await search.fill('重复 ID 无链接'); await search.press('Enter');
      assert.match(await page.evaluate(() => document.activeElement.textContent), /重复 ID 无链接/);
      await page.setViewportSize({ width:375, height:900 });
      await page.locator('#projects').scrollIntoViewIfNeeded();
      await page.screenshot({ path:path.join(shots, 'projects-mobile.png') });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    } finally {
      await page.unroute('**/data/projects.json'); await page.unroute('**/assets/images/projects/**');
      await page.setViewportSize({ width:1440, height:1000 });
    }
  });
  await test('项目 HTTP/JSON/格式失败备用提示、重试更新已打开搜索与空列表', async () => {
    for (const response of [{status:503,body:'unavailable'}, {body:'{broken',contentType:'application/json'}, {json:{wrong:[]}}]) {
      await page.route('**/data/projects.json', route => route.fulfill(response));
      await home();
      assert.match(await page.locator('#projects-status').innerText(), /内置备用列表/);
      assert(await page.locator('.project-card').count() > 0);
      await page.unroute('**/data/projects.json');
    }
    await page.locator('#global-search').fill('重试新增');
    assert.match(await page.locator('#global-results').innerText(), /没有找到/);
    await page.route('**/data/projects.json', route => route.fulfill({json:{projects:[{title:'重试新增'}]}}));
    await page.evaluate(() => document.querySelector('#retry-projects').click());
    await page.waitForFunction(() => document.querySelector('#global-results').textContent.includes('重试新增'));
    assert.equal(await page.locator('.project-card').count(), 1);
    await page.unroute('**/data/projects.json');
    await page.route('**/data/projects.json', route => route.fulfill({json:{projects:[]}}));
    await home();
    assert.equal(await page.locator('.project-card').count(), 0);
    assert.match(await page.locator('#projects-status').innerText(), /还没有公开项目/);
    assert(await page.locator('#projects-next').isDisabled());
    await page.unroute('**/data/projects.json');
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
      const { parseDateInput } = await import(new URL('../assets/js/tool-core.js', location.href).href);
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
        if (!endpoint) await page.waitForFunction(expected => document.querySelector('#bookmark-count').textContent.includes(String(expected)), payload.bookmarks.length);
        const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert(sizes.scroll <= sizes.viewport, `${width}px ${endpoint} 溢出：${sizes.scroll}`);
      }
    }
    await page.setViewportSize({ width: 375, height: 812 }); await home();
    await page.screenshot({ path: path.join(shots, 'mobile.png'), fullPage: true });
    if (await page.locator('[data-category="开发技术"]').getAttribute('aria-pressed') !== 'true') await page.locator('[data-category="开发技术"]').click();
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
      const projectRequest = nested.waitForRequest(url + 'data/projects.json');
      await nested.goto(url); await projectRequest;
      await nested.waitForFunction(() => !document.querySelector('#projects-status').textContent.includes('正在加载'));
      assert.deepEqual(await nested.locator('.project-body h3').allTextContents(), visibleProjects.map(item => item.title));
      await nested.waitForFunction(expected => document.querySelector('#bookmark-count').textContent.includes(String(expected)), payload.bookmarks.length);
      await nested.goto(url + 'tools/encoder.html');
      await nested.locator('#source').fill('子路径');
      await nested.locator('[data-action=base64-encode]').click();
      assert.equal(await nested.locator('#result').inputValue(), Buffer.from('子路径').toString('base64'));
    } finally {
      await nested.close();
      await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    }
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
  await test('新增工具同步首页、搜索和详情导航，当前页与子路径链接正确', async () => {
    const growth = await context.newPage();
    const source = fs.readFileSync(path.join(__dirname, '../assets/js/data.js'), 'utf8');
    const extra = [
      { id:'sample5', title:'新增工具甲', description:'扩展测试', tags:['扩展'], url:'tools/sample5.html' },
      { id:'sample6', title:'新增工具乙', description:'扩展测试', tags:['扩展'], url:'tools/sample6.html' }
    ];
    await growth.route(/\/assets\/js\/data\.js(?:\?.*)?$/,  route => route.fulfill({
      contentType:'text/javascript', body:source.replace('\n];', ',\n' + extra.map(item => JSON.stringify(item)).join(',\n') + '\n];')
    }));
    try {
      await growth.goto(base);
      await growth.waitForFunction(() => document.querySelectorAll('#tool-grid .tool-card').length === 6);
      await growth.locator('#global-search').fill('新增工具');
      assert.equal(await growth.locator('#global-results [role=option]').count(), 2);
      await growth.setViewportSize({ width:320, height:900 });
      for (const tool of ['crypto','json','timestamp','encoder']) {
        await growth.goto(`${base}/tools/${tool}.html`);
        await growth.waitForFunction(() => document.querySelectorAll('.tool-nav a').length === 6);
        const current = growth.locator('.tool-nav [aria-current=page]');
        assert.equal(await current.count(), 1);
        assert.equal(await current.getAttribute('href'), new URL(`tools/${tool}.html`, base.replace(/\/?$/, '/')).href);
        const added = growth.locator('.tool-nav a').filter({ hasText:'新增工具甲' });
        assert.equal(await added.getAttribute('href'), new URL('tools/sample5.html', base.replace(/\/?$/, '/')).href);
        assert.equal(await added.locator('svg').count(), 1);
        assert(await growth.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
      await growth.locator('.tool-nav').screenshot({ path:path.join(shots, 'tool-nav-extra.png') });
    } finally { await growth.close(); }
  });
  await test('所有页面无未捕获 JavaScript 错误', async () => { assert.deepEqual(errors, []); });
  await browser.close();
  const success = results.filter(item => item.ok).length;
  console.log(`\n${success}/${results.length} 组测试通过`);
  fs.writeFileSync(path.join(__dirname, '../docs/自动化测试结果.md'), `# 自动化测试结果\n\n运行日期：${new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })}\n\n环境：Playwright + ${browser.browserType().name()} ${browser.version()}，Asia/Shanghai 时区，静态 HTTP 服务。\n\n基线：${payload.bookmarks.length} 条书签、${projectPayload.projects.length} 个项目；视口 320 / 375 / 768 / 1440。\n\n启动：\`python3 -m http.server 4173 --bind 127.0.0.1 --directory site\`；测试：\`BASE_URL=http://127.0.0.1:4173 node site/tests/browser.cjs\`。外部 Playwright 和已有 Chrome 路径可分别通过 NODE_PATH、BROWSER_EXECUTABLE 设置，见 README。\n\n测试图像只通过请求拦截提供，项目图标目录没有新增图片；真实 iOS / Android 尚未实机验证。\n\n结果：${success}/${results.length} 组通过。\n\n` + results.map(item => `- [${item.ok ? 'x' : ' '}] ${item.name}${item.error ? `：${item.error}` : ''}`).join('\n') + '\n');
  if (success !== results.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
