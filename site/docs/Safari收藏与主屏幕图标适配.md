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

## 2026-10-23 收藏图标继续适配

用户确认主屏幕图标正确，但收藏仍不正确。再次检查正式站：Apple PNG 正常返回；普通 favicon 只声明 SVG，根目录 `/favicon.ico` 返回 404。当前尚未取得用户系统版本与错误图标样式，不能确定是旧缓存、SVG 兼容还是图标选择差异。

参考 [Safari 26.0 官方 SVG 图标支持说明](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/#svg-icons)，补齐普通图标兼容回退：

- 从用户已确认正确的 Apple PNG 等比派生根目录 `favicon.png`（64px）。
- 根目录 `favicon.ico` 包含 16、32、48px 图像，ICO 目录与每项嵌入 PNG 均经解析验证。
- 六页声明 ICO、保留 SVG、声明 PNG，并添加各自内容指纹。
- 主屏幕 Apple PNG、原山形 SVG、首页品牌和其他内容图标均保持原字节不变。
- 六页在根路径和独立子目录下的所有图标引用均返回正常，Apple PNG 仍为同一文件。

本次补充旨在消除普通 PNG/ICO 缺失，不能代替 iPhone 收藏界面的实际确认；未要求清除全部 Safari 数据。
