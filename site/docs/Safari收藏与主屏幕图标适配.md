# Safari 收藏与主屏幕图标适配

日期：2026-10-22。用户反馈 iPhone/iPad Safari 收藏和添加到主屏幕后图标不正确。

## 原因与修改

修复前正式首页只声明 SVG favicon，`/apple-touch-icon.png`、`/apple-touch-icon-precomposed.png` 均返回 404。Apple 收藏与主屏幕入口的图标兼容配置缺失；不能仅凭桌面 Chromium 标签图标正确判断 iPhone 图标也正确。

依据 [Apple Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)，增加站点根目录 `apple-touch-icon.png`，并在首页、四个工具页和旧入口声明 `rel="apple-touch-icon"` 与 `sizes="180x180"`。

PNG 为 180 × 180、不透明深蓝底。山形直接读取 `assets/js/icons.js` 中 `mountain` 的三条原路径，保持线宽、圆角和形状，仅等比放大并换为品牌浅色描边。没有重新生成或重画山形；原 SVG favicon、首页 Logo 和其他图标不变。不引入 manifest 或改变网站启动模式。

图片 SHA-256：`c788445f035fc4304ee085bb67004b166a44b3e1213b9866ee202756dc370d78`。

## 导出依据

以下 SVG 临时输入经现有 Sharp 栅格化并移除透明通道导出 PNG；不额外向生产目录写入重复 SVG。

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" fill="#10214e"/><g transform="translate(24 10) scale(5.5)" fill="none" stroke="#e6eeff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m2 18 7-12 5 8 3-5 5 9"/><path d="m6 12 3 1 2-3"/><path d="M3 22c4-3 6 2 10 0s5-1 8-1"/></g></svg>
```

## 检查

检查 PNG 的格式、180 像素尺寸和不透明通道；六个页面在根目录与独立子目录下的 Apple 图标引用均成功请求同一 PNG、正确返回 `image/png`；浏览器实际解码成功。

没有进行 iPhone 实机收藏或主屏幕添加操作。网站文件上线后，已有入口仍可能保留旧图标；建议用 Safari 重新打开站点，删除旧桌面快捷入口后重新添加，并检查新建收藏图标。
