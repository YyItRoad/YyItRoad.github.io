import { setAssetIcon } from './asset-icons.js?v=section-icons-v2';
import { encodeBase64, decodeBase64, timestampToDate, parseDateInput, describeDate, toDateInput } from './tool-core.js';
const $ = selector => document.querySelector(selector);
for (const node of document.querySelectorAll('[data-asset-icon]')) setAssetIcon(node, node.dataset.assetIcon);
const kind = document.body.dataset.tool, result = $('#result'), status = $('#tool-status');
function message(text, error = false) { status.textContent = text; status.dataset.error = String(error); }
const nonempty = text => { if (!text.trim()) throw new Error('请先输入需要处理的内容。'); return text; };
if ($('#timezone-name')) $('#timezone-name').textContent = `本地：${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
$('#toggle-passphrase')?.addEventListener('click', () => {
  const show = $('#passphrase').type === 'password';
  $('#passphrase').type = show ? 'text' : 'password';
  $('#toggle-passphrase').textContent = show ? '隐藏口令' : '显示口令';
  $('#toggle-passphrase').setAttribute('aria-pressed', String(show));
});
function crypto(action, source) {
  if (!globalThis.CryptoJS) throw new Error('本地加密库未加载，请刷新页面重试。');
  nonempty(source);
  const key = $('#passphrase').value;
  if (!key) throw new Error('请输入口令。');
  if (action === 'encrypt') return CryptoJS.AES.encrypt(source, key).toString();
  try {
    const clean = source.trim();
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(clean) || clean.length % 4 !== 0) throw new Error();
    const bytes = atob(clean);
    if (!bytes.startsWith('Salted__') || bytes.length < 32 || bytes.length % 16 !== 0) throw new Error();
    const words = CryptoJS.AES.decrypt(clean, key);
    if (words.sigBytes <= 0) throw new Error();
    const plaintext = words.toString(CryptoJS.enc.Utf8);
    if (!plaintext) throw new Error();
    return plaintext;
  } catch { throw new Error('解密失败：请检查口令和完整的旧版 CryptoJS 密文。此模式无法验证密文完整性。'); }
}
for (const button of document.querySelectorAll('[data-action]')) button.addEventListener('click', () => {
  const action = button.dataset.action;
  result.value = '';
  try {
    const source = $('#source')?.value ?? '';
    let output;
    if (kind === 'crypto') output = crypto(action, source);
    else if (kind === 'json') {
      let parsed;
      try { parsed = JSON.parse(nonempty(source)); }
      catch (error) { throw new Error(`JSON 语法错误：${error.message}`); }
      if (action === 'validate') { message('JSON 语法有效。校验未修改输入。'); return; }
      output = JSON.stringify(parsed, null, action === 'format' ? 2 : 0);
    } else if (kind === 'encoder') {
      if (action === 'base64-encode') output = encodeBase64(source);
      else if (action === 'base64-decode') output = decodeBase64(source);
      else if (action === 'url-encode') output = encodeURIComponent(source);
      else {
        try { output = decodeURIComponent(source); }
        catch { throw new Error('无效的 URL 编码，请检查 % 后的十六进制值与 UTF-8 字节。'); }
      }
    } else if (kind === 'timestamp') {
      const unit = $('#unit').value, timezone = $('#timezone').value;
      if (action === 'now') {
        const now = new Date();
        $('#timestamp').value = String(unit === 'seconds' ? Math.floor(now.getTime() / 1000) : now.getTime());
        $('#datetime').value = toDateInput(now, timezone);
        output = describeDate(now);
      } else if (action === 'to-date') {
        const date = timestampToDate($('#timestamp').value, unit);
        // datetime-local 只支持有限年份；极端时间戳仍可在结果区查看。
        if (date.getUTCFullYear() >= 1 && date.getUTCFullYear() <= 9999) $('#datetime').value = toDateInput(date, timezone);
        output = describeDate(date);
      } else {
        const date = parseDateInput($('#datetime').value, timezone);
        $('#timestamp').value = String(unit === 'seconds' ? Math.floor(date.getTime() / 1000) : date.getTime());
        output = describeDate(date);
      }
    }
    result.value = output;
    message('处理完成。结果已在下方显示。');
  } catch (error) { message(error.message || '处理失败，请检查输入。', true); }
});
$('#clear').addEventListener('click', () => {
  for (const input of document.querySelectorAll('textarea, input')) input.value = '';
  if ($('#passphrase')) { $('#passphrase').type = 'password'; $('#toggle-passphrase').textContent = '显示口令'; $('#toggle-passphrase').setAttribute('aria-pressed', 'false'); }
  message('已清空输入、口令与处理结果。');
  ($('#source') || $('#timestamp')).focus();
});
$('#copy').addEventListener('click', async () => {
  if (!result.value) { message('还没有可复制的结果。'); return; }
  try {
    await navigator.clipboard.writeText(result.value);
    message('结果已复制。');
  } catch {
    result.focus(); result.select();
    message('浏览器未允许自动复制，已选中结果，请手动复制。');
  }
});
