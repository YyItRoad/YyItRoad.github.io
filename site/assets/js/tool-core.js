// 可单独测试的纯函数；不读取存储、不发起网络请求。
export function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
export function decodeBase64(value) {
  const clean = value.replace(/\s/g, '');
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(clean)) throw new Error('无效的 Base64 文本，请检查字符与填充。');
  const binary = atob(clean);
  // 拒绝非标准填充位以及无法解析为 UTF-8 的二进制内容。
  if (btoa(binary) !== clean) throw new Error('Base64 填充位不正确。');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, character => character.charCodeAt(0))); }
  catch { throw new Error('Base64 内容不是有效的 UTF-8 文本。'); }
}
export function timestampToDate(value, unit) {
  if (!/^-?\d+$/.test(value.trim())) throw new Error('请输入整数时间戳，并选择秒或毫秒。');
  const parsed = Number(value), milliseconds = unit === 'seconds' ? parsed * 1000 : parsed;
  if (!Number.isSafeInteger(parsed) || Math.abs(milliseconds) > 8640000000000000) throw new Error('时间戳超出有效日期范围。');
  const date = new Date(milliseconds);
  if (!Number.isFinite(date.getTime())) throw new Error('无法解析这个时间戳。');
  return date;
}
export function parseDateInput(value, timezone) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
  if (!match) throw new Error('请选择完整的日期与时间。');
  const [, year, month, day, hour, minute, second = '0', fraction = '0'] = match;
  const parts = [Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), Number(fraction.padEnd(3, '0'))];
  const date = new Date(0), utc = timezone === 'utc';
  date[utc ? 'setUTCFullYear' : 'setFullYear'](parts[0], parts[1], parts[2]);
  date[utc ? 'setUTCHours' : 'setHours'](...parts.slice(3));
  const fields = ['FullYear', 'Month', 'Date', 'Hours', 'Minutes', 'Seconds', 'Milliseconds'];
  if (fields.some((field, index) => date[`get${utc ? 'UTC' : ''}${field}`]() !== parts[index])) throw new Error('无效日期，或该本地时间处于夏令时跳变区间。');
  return date;
}
export function describeDate(date) {
  return `UTC：${date.toISOString()}\n本地：${date.toLocaleString('zh-CN', { hour12: false })}（${Intl.DateTimeFormat().resolvedOptions().timeZone}）\n秒：${Math.floor(date.getTime() / 1000)}\n毫秒：${date.getTime()}`;
}
export function toDateInput(date, timezone) {
  const adjusted = timezone === 'utc' ? date : new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 23);
}
