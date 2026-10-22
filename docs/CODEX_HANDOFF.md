# Codex 开发交接任务：YangYang.fun 个人主页 v1

> 状态：需求已确认；数据生成、GitHub 写入、SSH 连接、隔离路径公网部署已实际验证。正式主页尚未开发。**本任务只负责前端实现与测试，不要修改线上配置或进行生产部署。**
>
> 仓库：`YyItRoad/YyItRoad.github.io`
> 工作基线：`feature/homepage-pipeline-test`
> 网站源码目录：`site/`
> 线上域名：`https://yangyang.fun`；当前由云服务器 `47.109.74.220` 上的 Nginx 提供服务；服务器目录 `/www/wwwroot/yangyang.fun`。

## 0. 工作方式

1. 先检查仓库结构、当前测试分支、`site/index.html`、`site/data/bookmarks.json`、`.github/workflows/deploy.yml`、`DEPLOYMENT.md`。
2. 从 `feature/homepage-pipeline-test` 创建独立开发分支，例如 `feat/homepage-v1`。**不直接提交到 `main`，不合并，不触发生产部署。**
3. 实现完整可用的网站，自己运行语法、交互和响应式检查，提交代码并建立 PR（以测试分支为 base）供审阅。
4. 不访问、不打印、不提交 SSH 私钥、GitHub PAT、n8n Secret 或其他凭据；不改 Nginx/DNS/n8n 工作流，除非另行明确委托。
5. 当前旧版首页、旧 `m.html` 和旧资源可重新设计，**但只修改仓库的 `site/`**；请不要在云服务器执行删除或覆盖。

## 1. 产品定位及整体风格（已由用户确认）

YangYang.fun 是个人门户／导航工作台，突出鲜明的视觉氛围、生活感和个人表达；不是空白极简 landing page，也不是纯商务 SaaS 导航后台。移动端、桌面端均须好用。

**整个首页从上到下为独立的全宽板块，竖向滚动。不要把「我的项目」和「关于我」放在同一行。**

设计取向：柔和明亮色彩、丰富插画氛围、精致动效、舒适留白、卡片图标和漂亮的交互；不要把所有板块都做成相同重复卡片。统一设计变量（字号、颜色、间距、圆角、响应式、深色模式）。

头部：`首页 / 导航 / 工具 / 项目 / 关于`，站内锚点滚动、搜索入口、主题切换。**头部右上角不放头像。**

### 1.1 Hero / Banner

- 大幅沉浸式山峦、湖面、夕阳景观；**背包青年坐在右侧岩石**；左侧主文案「**知行合一**」。留有安全对比度、不同视口裁切方案。
- **不添加**「开发者 / 量化交易 / AI 探索 / 生活记录」等身份标签条。
- Banner 内提供一体化全局搜索入口；可通过图标／快捷键唤起。
- 暂无已上传到仓库的最终 Banner 原图：优先检查仓库中现有可合法复用素材；如没有，建立明确 `assets` 素材占位约定与替换指南。**不要声称找到了原插画，也不要使用不明版权图片。**

### 1.2 常用入口

- 显示 favicon、名称，首批例如 GitHub、ChatGPT、n8n、TradingView。
- 默认从 `bookmarks.json` 中 `favorite: true` 派生。
- 支持轻度前端自定义（顺序、显示/隐藏），可使用 localStorage 保存浏览器偏好，绝不改动服务端 JSON。

### 1.3 我的工具

- 这是首页独立全宽板块，显示工具入口。
- 初始四个工具：AES 加密/解密、JSON 格式化与校验、日期时间戳转换、Base64/URL 编解码。
- 将原 `m.html` 功能纳入统一工具页设计；推荐 `site/tools/crypto.html`，其他工具同目录。
- AES 必须使用与旧 `m.html` 一致的 CryptoJS 口令加解密行为，避免旧密文无法解码。旧行为为 `CryptoJS.AES.encrypt(raw, key)` / `CryptoJS.AES.decrypt(raw, key).toString(CryptoJS.enc.Utf8)`。需要注明其兼容性和安全限制，不能误称现代高保证密码方案。
- Base64 是编码，不是加密；表单、密钥隐藏显示、复制结果、清空、错误提示；禁止在前端请求中上传输入的密文或密钥。
- JSON 工具至少含格式化、压缩、语法校验和错误提示；日期/时间戳工具需要秒/毫秒区分；Base64/URL 支持中文文本和错误反馈。

### 1.4 网站导航

- 独立全宽板块；分类卡片建议：`开发技术`、`AI资源`、`交易研究`、`内容创作`、`生活兴趣`、`效率办公`。
- 单击分类：当前分类列表在**同一个板块下面展开**，分类卡片区同时缩小为紧凑布局，**不要跳到新页面**。
- 展开列表时**不要再次重复打印已选分类标题**。
- 分类下提供专属搜索；链接 favicon、名称、描述/标签。
- 实际 JSON 类别可能是 `AI 资源`（带空格）、`未分类`；做统一别名归一化，并保留未知类别的可访问入口；不能仅硬编码演示数据。
- 提供加载中、无结果、JSON 读取失败等状态。

### 1.5 我的项目

- 独立全宽横向滑动板块，带触屏/鼠标滚动体验及可访问键盘操作，**不要传统分页数字**。
- 可展示 QuantDinger、孩子日记相关工具、n8n 工作流、视频内容流水线等真实项目方向；不虚构项目成效或未经确认的链接。
- 第一版项目条目用独立静态配置，便于后续维护。

### 1.6 关于我

- 位于我的项目**下方**，独立全宽板块。
- 介绍技术方向：Spring Boot + Vue 的 CMS、数据治理、Kettle/Flink；个人对交易研究和 AI 自动化的探索可以适度呈现，但不应夸大经验。
- 可以有个人风格插画；**不要把头像放进顶部导航**。

### 1.7 全局搜索

- 搜索输入时在输入框下方展开悬浮结果面板（不是整页跳转），按「常用入口 / 网站导航 / 工具 / 项目」分组。
- 匹配标题、描述、标签，突出关键词；支持键盘 ↑ ↓ Enter、Esc、点击跳转或在页面内定位；支持中文关键词（例如“量化”）。
- 注意焦点管理、移动端键盘和无障碍语义。

## 2. 技术架构（已定）

- **前端：原生 HTML/CSS/JavaScript**，不新增 Spring Boot、Vue 服务、数据库、独立管理后台。
- 静态文件由 Nginx 托管；所有数据读取均走相对路径（例如 `/data/bookmarks.json`）。
- 后台书签主数据位于 n8n Data Tables `nav_link`，n8n 通过 MCP 管理并生成 JSON 后提交 GitHub。**浏览器不调用 n8n 管理接口，也不存放 Token**。
- GitHub Actions + SSH + rsync 把仓库 `site/` 同步到服务器目录。
- 请不要在第一版加入需要账户登录、后端写 API、实时数据库访问或复杂构建系统的架构。

### 数据 JSON（当前已验证）

文件路径：`site/data/bookmarks.json`。

```json
{
  "version": 1,
  "generatedAt": "ISO timestamp",
  "bookmarks": [
    {
      "id": "4",
      "title": "GitHub",
      "url": "https://github.com",
      "description": "代码托管与开源项目",
      "category": "开发技术",
      "favorite": true,
      "sort_order": 10,
      "tags": ["代码", "开源"]
    }
  ],
  "summary": { "count": 7, "categories": ["未分类", "开发技术", "AI 资源", "交易研究"] }
}
```

解析字段：`id`、`title`、`url`、`description`、`category`、`favorite`、`sort_order`、`tags`。对缺失字段容错；仅允许 http(s) 导航；对动态渲染的内容使用 DOM textContent，避免 XSS。导航列表按 `sort_order` 排序。应尊重新增分类和增量数据。

注意：某条旧数据原始网址／描述曾含百度网盘提取码。**部署中的公开 JSON 已经过清洗，前端不得从 n8n 未清洗接口直接拉取或重新泄露提取码。**

## 3. 已完成的部署验证与限制

- 测试分支：`feature/homepage-pipeline-test`。
- n8n 工作流「个人主页 - 发布导航 JSON（测试分支）」：`https://n8n.yangyang.fun/workflow/UB6ZR7qTyu5Y0XKq`；已验证 `nav_link → site/data/bookmarks.json` 的 GitHub 文件更新成功。
- GitHub SSH 烟雾测试：`https://github.com/YyItRoad/YyItRoad.github.io/actions/runs/39736926308`，成功。
- GitHub 独立路径部署测试：`https://github.com/YyItRoad/YyItRoad.github.io/actions/runs/39737143045`，成功，验证 Nginx 公网 HTML 与 JSON。
- 当前预览：`https://yangyang.fun/__deploy-test/`；数据 `https://yangyang.fun/__deploy-test/data/bookmarks.json`。
- 工作流：`.github/workflows/deploy.yml` 在**测试分支**，`.github/workflows/homepage-staging-test.yml` 在 `main`。首次生产部署**尚未完成**。
- 当前 `main` 分支的老主页和服务器的旧主页可废弃，但应等正式视觉、功能验收后再切换。
- 当前 `site/index.html` 仅为部署联调占位，**需要完全改造成正式首页**。
- 生产部署工作流使用 `rsync --delete`，可能清除旧目录文件。不要在 Codex 开发任务中触发生产部署，不要直接合并尚未审查的 `site/`。

## 4. 代码结构建议

```text
site/
├── index.html
├── assets/
│   ├── css/
│   │   ├── tokens.css
│   │   └── main.css
│   ├── js/
│   │   ├── data.js
│   │   ├── navigation.js
│   │   ├── search.js
│   │   └── main.js
│   └── images/
├── data/
│   └── bookmarks.json      # n8n 生成；避免手工覆盖数据
├── tools/
│   ├── crypto.html
│   ├── json.html
│   ├── timestamp.html
│   └── encoder.html
└── README.md
```

结构可按实际开发优化；保持无框架、可直接通过本地 HTTP server 预览，不依赖服务器的绝对路径。

## 5. 验收标准

- [ ] 桌面/移动端布局完整；首页六大区域都存在，顺序正确，且各自独立全宽。
- [ ] Hero 主文案「知行合一」、无身份标签、无顶部右侧头像；明确管理背景插画素材。
- [ ] 页面正确通过 `fetch('/data/bookmarks.json')` 读取真实 JSON，7 条测试记录可呈现；更改 JSON 后 UI 无需手工改代码。
- [ ] 收藏入口来自 `favorite`，排序/隐藏仅存于本地。
- [ ] 分类卡片收缩＋同区展开；没有重复的已选分类标题；分类搜索生效。
- [ ] 全局搜索跨四个资源类别，包含中文匹配、分组、高亮和键盘操作。
- [ ] 项目横向滑动；关于我独立置于项目下方。
- [ ] 四个工具都可实际使用，AES 与旧版 CryptoJS 口令模式兼容；Base64/JSON/时间戳/URL 编解码有正常与异常测试。
- [ ] 外链 `target=_blank` 时设置 `rel=noopener noreferrer`；所有动态书签文本安全渲染。
- [ ] 无私钥、Token、SSH 配置、n8n 管理入口凭据被打包到 `site/`。
- [ ] 本地静态服务下不存在致命 JS 错误；首次加载及深色模式、移动端均可操作。
- [ ] 在 README 中写清楚启动、测试、素材替换和后续部署方法。
- [ ] 提交开发分支并创建面向 `feature/homepage-pipeline-test` 的 PR；**不擅自上线**。

## 6. 实施优先级

1. 首页整体结构、设计系统、响应式骨架。
2. JSON 数据接入、导航分类交互、收藏入口。
3. 全局搜索与键盘操作。
4. 工具页面、复用旧版 AES 逻辑。
5. 视觉优化、项目区、关于我。
6. 检测并提交 PR，附上截图或详细验证证据。

## 7. 参考资源与注意事项

- 本仓库 `site/index.html`：当前烟雾测试页，可作为数据调用范例，但不是正式设计。
- 线上旧工具：`https://yangyang.fun/m.html`，需要兼容其 AES 加解密行为。
- 当前新版 crypto 独立视觉草稿不在 GitHub 仓库中，不要假设可以直接读取它。
- 项目既有 UI 讨论已确定：插画氛围，分类同屏折叠展开，横向项目区，关于我另起一整行。
- 任何数据与技术能力若没有源码和实际测试支撑，按「待验证」处理。

## 8. Codex 交付说明

产出：代码、测试结果、README、PR 链接、设计与交互要点说明、剩余风险列表。只改前端网站；数据发布工作流与 GitHub Actions 部署由维护者另行合并、启用和执行。
