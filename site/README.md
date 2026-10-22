# YangYang.fun 个人主页 v1

原生 HTML / CSS / JavaScript 静态站点，无构建步骤、后台服务和账户系统。开发基线为 `feature/homepage-pipeline-test`，开发分支为 `feat/homepage-v1`。

## 本地启动

在仓库根目录执行：

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory site
```

打开 `http://127.0.0.1:4173/`。请使用 HTTP 服务，不能直接通过 `file://` 打开 ES 模块与 JSON。支持域名根路径和 `/预览目录/` 子路径，页面和数据地址都相对站点目录解析。

## 页面和数据

- 首页顺序：山湖夕阳 Banner → 常用入口 → 我的工具 → 网站导航 → 我的项目 → 关于我。头部没有头像或身份标签。
- 书签从 `data/bookmarks.json` 读取，12 秒超时，支持失败重试。原有 7 条数据和生成时间保持原样，前端不写回公共数据。
- 读取 `id/title/url/description/category/favorite/sort_order/tags`，按 `sort_order` 排序。`AI 资源` 和 `AI资源` 统一显示，未知分类自动加入入口。无效网址、带凭据网址、非 HTTP(S) 网址被忽略；空字段使用默认值。
- 常用入口来自 `favorite: true`。顺序与隐藏记录在当前浏览器的 `yy-favorites`；`yy-theme` 保存主题。隐私模式禁用存储时仍可使用，偏好只在当前页面生效。
- 默认展开开发技术（缺少该分类时展开首个真实分类）；点击分类在同一板块切换，入口收缩为可横向浏览的一行，不重复分类大标题。收起后恢复分类卡片。当前分类支持标题、描述和标签搜索。
- 全局搜索支持标题、描述与标签，分为常用入口、网站导航、工具、项目。按 Ctrl / ⌘ K 或头部搜索按钮定位输入框，↑ / ↓ 选择，Enter 打开，Esc 关闭，移开焦点或点击外部关闭。没有公开链接的项目定位到当前页面卡片。
- 项目配置与工具索引位于 `assets/js/data.js`。项目可触屏滑动、鼠标滚动条／按钮浏览，或聚焦列表后使用左右方向键。未确认公开链接的方向只展示说明。
- 动态书签用 `textContent` 和文本节点渲染；外链使用 `noopener noreferrer`。GitHub、ChatGPT、TradingView 和 Vue 使用从官网保存的本地图标，见 `assets/images/brands/来源.md`；其余 favicon 向对应网站的 `/favicon.ico` 请求，使用 `no-referrer`，失败显示首字母。不依赖第三方 favicon 聚合服务。

## 四款工具

| 页面 | 功能 | 关键边界 |
| --- | --- | --- |
| `tools/crypto.html` | AES 加密、解密、口令显示／隐藏 | CryptoJS 4.2.0 本地托管，兼容旧 `CryptoJS.AES.encrypt(raw, key)` / `decrypt` 的口令模式；旧 `/m.html` 自动跳转 |
| `tools/json.html` | 格式化、压缩、语法校验 | 原生 JSON.parse / stringify；重复键最后值生效，大整数应使用字符串 |
| `tools/timestamp.html` | 秒／毫秒、日期双向转换、填入当前时间 | 明确选择单位与 UTC／浏览器本地时区；支持负值，拒绝无效日期与越界时间戳 |
| `tools/encoder.html` | UTF-8 Base64、URL 参数编码／解码 | 支持中文与 emoji，校验非法 Base64、UTF-8 与百分号编码；Base64 不是加密 |

输入、口令和结果不存储、不上传。工具页面不包含分析脚本、远程字体或远程库。复制依赖浏览器剪贴板权限和安全上下文，失败会选中结果供手动复制。错误会清除旧结果，清空会同时清除口令并恢复隐藏状态。

AES 兼容模式是 OpenSSL `Salted__` 格式、AES-256-CBC 与旧式 MD5 EVP 口令派生，无认证标签。它不能可靠检测所有错误口令或密文篡改；不得视为现代高保证加密。页面已展示兼容性和安全限制。CryptoJS 原始授权保存在 `assets/vendor/许可证.md`，版本与校验记录见素材记录。

## 素材与视觉

已按本地确认首页 UI 和搜索态参考实现浅蓝色、柔和玻璃面板、紧凑图标卡片和独立纵向分区；搜索态旧稿的并排区域与身份标签未采用。

用户明确授权根据 UI 生成缺失素材。本轮用内置 image_gen 生成独立 Banner 与关于我人物，**不把效果图截图或裁切当作网页实现**：

- `assets/images/source/hero-sunset-v1.png`：2172 × 724 原图；`hero-sunset-v1.webp`：网页版本约 272 KiB。
- `assets/images/source/about-explorer-v1.png`：1254 × 1254 原图；`about-explorer-v1.webp`：480 × 480 网页版本约 64 KiB。
- 人物是生成的虚构插画角色，并非站点所有者照片。完整提示词见 [AI 素材生成记录](docs/AI素材生成记录.md)，来源和哈希见 [网页素材说明](assets/images/素材说明.md)。
- 小图标与山形标识使用本地 SVG / DOM 线条，路径集中在 `assets/js/icons.js`，不需要生成栅格图标。
- 原始 PNG、截图、旧 `hero-landscape.svg` 和未使用的原版 ChatGPT 图标只保留在本地归档，由 `site/.gitignore` 排除，不进入当前 GitHub 交付；运行只依赖 WebP 与实际引用的图标。

替换 Banner 时保留原始文件，以新版本文件名放入 `source/`，再导出 WebP 并更新 `assets/css/main.css` 的 `.hero-art`。桌面居中裁切，手机靠右裁切保留人物；替换后需复查 320 / 375 / 768 / 1440 宽度、文案对比度与人物完整性。更换关于我图片时保留中央圆形安全区，更新首页图片引用及此记录。新图不能覆盖原始来源文件。

## 测试

浏览器端到端脚本为 `tests/browser.cjs`，需要本机可用的 Node.js、Playwright 和 Chrome / Chromium；这不是网页运行依赖，不需要在 `site/` 安装包。

启动上述静态服务后，如果 Playwright 已在 Node 的模块搜索路径中：

```sh
node site/tests/browser.cjs
```

也可指定外部依赖和已有浏览器：

```sh
NODE_PATH=/你的依赖目录/node_modules \
BROWSER_EXECUTABLE='/你的Chrome可执行文件路径' \
node site/tests/browser.cjs
```

`BASE_URL` 可覆盖默认的 `http://127.0.0.1:4173`。测试独立创建浏览器上下文，使用上海时区，不读取用户登录态；远程 favicon 在自动化中被阻断以消除外部不稳定因素，本地已归档的官网图标正常加载；远程真实加载与失败占位另做视觉检查。

测试覆盖数据接入、分类、收藏、搜索键盘操作、动态新增与 XSS 输入、数据加载／失败／重试、四款工具正常与异常输入、剪贴板成功与拒绝、禁用存储、子目录托管与夏令时跳变，以及 320 / 375 / 768 / 1440 四个视口的首页和四个工具页面。AES 使用 Node.js 独立实现的 EVP 派生与 AES-CBC 向量双向验证。

[自动化测试结果](docs/自动化测试结果.md)。截图由测试在本地 `site/docs/screenshots/` 生成，不再提交到 GitHub。

自动化验证使用桌面 Chrome 的视口模拟，尚未验证真实 iOS Safari / Android 设备。最终视觉与文案仍需要维护者验收。

## 当前正式发布状态

用户验收后明确要求替换正式根目录，已于 2026-10-22 发布到 [yangyang.fun](https://yangyang.fun/)，运行版本为 `a7a900a5c03900ac6a7d0170c321b6d13a958967`。保留 n8n 并发同步的 19 条书签、4 个收藏；增加 HTML 中 CSS/JS 内容指纹，避免旧站 12 小时缓存造成错配。

正式域名 29 个文件逐一通过 SHA-256 验收，17/17 组浏览器端到端通过。旧站已保存到部署账户私有的 `$HOME/yangyang-fun-backups/39766572772-1/content/`。详见 [正式根目录发布记录](docs/正式根目录发布记录.md)。未合并到 `main`，未改 Nginx、n8n 或 Secrets。

## 手动发布流程

开发分支 `.github/workflows/homepage-staging-test.yml` 支持三种手动操作，均限定 `feat/homepage-v1` 分支，不自动触发正式部署：

- `inspect`：只读检查正式目录、磁盘占用与备份空间。
- `staging`：将明确 `expected_source_sha` 对应的运行资源同步到既有 `__deploy-test/`。未指定源码时采用触发任务的 SHA；版本与文件哈希由公网验收，生产首页哈希保持不变。
- `promote`：必须给出明确 40 位 `expected_source_sha`，从该源码独立重建清单并比对隔离站，再备份并发布正式根目录。发布及公网验收失败会从本次备份恢复。

部署包排除文档、测试、截图、原始大图、忽略文件与 `.DS_Store`，保留 CryptoJS 许可证。正式发布保留 `.well-known/`、`.user.ini`、`.htaccess`、`404.html` 和 `__deploy-test/`，发布前后核对这些保护项的内容与权限。只会修改固定站点目录，检查路径不被符号链接重定向。

[最初隔离部署验收](docs/隔离部署测试结果.md) 保留为历史证据；当前线上状态以正式发布记录和公网 `deployment-version.txt` 为准。
