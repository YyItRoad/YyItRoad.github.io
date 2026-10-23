---
name: yangyang-homepage-content
description: 管理 YangYang.fun 个人主页的网站书签、常用入口及项目资料；通过 n8n 更新数据、生成 JSON、GitHub 发布及上线验证。用户提出“收藏网址、调整常用入口、修改/新增/隐藏项目、发布主页内容”时使用。
---

# YangYang.fun 内容管理技能

## 目标与系统边界

维护 `https://yangyang.fun/` 的**内容**，不把每次添加网址或编辑项目升级成前端开发任务。书签、项目是独立内容类型；现有四个工具及页面样式不在本技能的修改范围。

- GitHub: `YyItRoad/YyItRoad.github.io`，正式分支 `main`，开发数据分支 `feat/homepage-v1`。
- 公网正式站根目录：`https://yangyang.fun/`；预览：`https://yangyang.fun/__deploy-test/`。
- n8n 项目：`个人主页`，项目 ID `gNxPw5aVFwHy04Lr`。
- 书签 Data Table：`nav_link` (`V0K9gHRYYeEnEt8k`)。
- 项目 Data Table：`projects` (`8IIMccRq36c6VNAz`)。
- 书签公开文件：`site/data/bookmarks.json`。
- 项目公开文件：`site/data/projects.json`。

**必须先读实际当前状态。** 任何本技能中的工作流 ID、分支、页面路径都应在操作前复核；不得将历史成功记录当作本次成功。

## 意图识别

| 用户表达 | 执行 |
| --- | --- |
| “收藏 https://... 到某分类” | 保存书签；默认为非常用 |
| “常用入口增加/移除/调序” | 调整 `favorite` / `sort_order`，核对完整常用列表 |
| “删除某网址” | 精确定位对应记录，删除前确认目标 |
| “新增、更新项目” | `projects` 保存流程，重新发布项目 JSON |
| “隐藏项目” | 更新 `visible=false`，不直接删除 |
| “只看看/列出/整理建议” | 只读查询；**不要写入或部署** |
| “发布正式站/上线” | 在明确授权的情况下执行对应正式发布，检查动作结果 |
| “修改页面结构/功能/素材代码” | 不属于内容技能；另行开展代码任务 |

用户若只说“添加网址”但没说是否上线，优先完成数据保存，说明尚未发布；不要未经确认就擅自正式部署。

## 书签操作

n8n 工作流：
- 保存：`XOJE4tjOGvbFHvnk`（登录保护表单；根据 link upsert）。
- 删除：`lHvAYttRdkLIbaz8`（根据 id，需明确 `confirm=DELETE`）。
- 生成公开 JSON：`UB6ZR7qTyu5Y0XKq`（手动发布；**目前只写 `feat/homepage-v1`**）。

读取书签表后定位目标，再更新：
`link`、`title`、`description`、`category`、`tags`（逗号分隔）、`favorite`（布尔）、`sort_order`（数值）。**保存流程不会安全保留所有省略字段，更新已有记录时必须带齐原字段并仅改变用户点名字段。**

网站导航分类示例：`开发技术`、`AI 资源`、`交易研究`、`内容创作`、`生活兴趣`、`效率办公`、`未分类`。前端可能归一化 `AI 资源` / `AI资源`；入库建议统一使用 `AI 资源`。

新增网址先验证地址格式和站点身份，不猜测不确定的官网。可能含密码/提取码/Token 的私人链接不得发布原始参数。发布流程有清洗逻辑，但不能代替人工核查。

### 常用入口

- `favorite=true` 表示常用入口；排序按 `sort_order` 升序。
- 新增常用不等于删除原站点；移出常用设置 `favorite=false`，仍保留导航条目。
- 用户已定义的正式列表基线（2026-10-23，操作前仍须查询真实数据）：
  1. GitHub
  2. ChatGPT
  3. Linux.do
  4. QuantDinger (`https://trade.yangyang.fun`)
  5. n8n 工作台 (`https://n8n.yangyang.fun`)
  6. 哔哩哔哩
  7. 语雀
  8. Discord
  9. YouTube
  10. X
- 必须在更新后读取实际表和生成的 JSON，确认没有意外重复项或排序冲突。浏览器的本地收藏排序/隐藏偏好可能覆盖默认显示，验证异常时应区分数据和 localStorage。

## 项目操作

工作流：
- 保存：`vTkL38pSVxcvIGmA`（按项目名称 upsert，字段省略可能重置；更新前读取整行）。
- 删除：`Lq4OycgbxsWvGg1c`（按 ID 且 `confirm=DELETE`）。
- 发布 JSON：`8V5Nki8PyEfq1kfL`（手动，目前写 `feat/homepage-v1`）。

`projects` 字段：`name`、`description`、`icon`、`tags`、`status`、`url`、`github_url`、`sort_order`、`visible`。

- 项目图标字段**仅存安全文件名**，例如 `quant.svg` 或 `quant`。用户自行上传到 `site/assets/images/projects/`；无后缀时前端默认按 `.svg` 解析（须验证部署版本已支持）。允许 SVG、PNG、WebP、JPEG，严禁任意 URL、斜杠、`../` 或注入字符串。不存在的图片应 fallback。
- 项目修改名称可能被按名称 upsert 当作新项目。要更名先检查当前匹配策略，并明确旧记录处理；不能产生重复项目。
- 当前表初始四个项目为 QuantDinger、孩子的日记、让流程自己运转、从灵感到画面；用户要求新增则新增，不擅自改变既有项。
- 项目是否真的从 JSON 动态读取，须以**正式站当前代码**验证，不能仅凭 GitHub 有 JSON 就宣称线上已生效。

## 发布路径（关键）

### 书签正式发布：已有并验证

1. 读取 `nav_link` 全量确认正确。
2. 手动执行 `UB6ZR7qTyu5Y0XKq`，等待执行成功。
3. 读取开发分支 `site/data/bookmarks.json` 检查数量、顺序、链接及敏感参数。
4. 用户已明确要求**正式上线**时，把经过验证的公开 JSON 从开发分支同步到 `main` 的同一路径（仅更新这一个文件，不覆盖页面或其他数据）。
5. `main` 上的 `.github/workflows/bookmarks-production-sync.yml` 在 `site/data/bookmarks.json` 发生 push 时触发：备份服务器旧 JSON，只同步该 JSON，再由 GitHub Actions 访问正式域名验证。
6. 等待运行完成成功，随后重新读取正式 `https://yangyang.fun/data/bookmarks.json` 验证预期常用入口与新增记录。

**当前生产工作流验证逻辑包含固定的“10 个常用入口”姓名与顺序，以及至少 27 条书签要求。** 如用户新增/移除/调整常用入口，CI 将可能按旧规则失败。修改正式数据前，需先检查该 CI 规则、同步更新与新要求一致的断言（或合理改为非硬编码数据校验），然后再发布。不要忽略失败或绕过验证。

### 项目正式发布：尚未完整自动化

`8V5Nki8PyEfq1kfL` 目前只提交开发分支。**没有验证过的项目专用正式部署工作流。** 要正式上线项目更改，应先查验当前 `main` 页面是否支持动态 `projects.json`，再建立或验证仅同步项目 JSON 的生产发布机制；不得误用书签工作流去部署项目，也不要直接用 rsync 覆盖整个站点。

### 安全与回滚

- 不读取、展示或提交 GitHub Actions Secrets / SSH 私钥、n8n 凭据。
- 删除和跨大量记录的修改先明确影响范围。删除项目书签优先保留可回滚快照。
- 不要把 `feat/homepage-v1` 的整站文件夹直接同步生产；此前主站与开发分支存在差异。正式内容更新原则是**最小文件变更**。
- 公网文件成功返回 200 不等于 UI 显示正确；关键更新需要在浏览器页面确认。
- 生产导航 JSON 已有 `bookmarks.json.bak` 备份策略，发生问题以核对过的历史版本回滚，并再次验证。

## 每次操作的检查表

1. 确认用户希望更新的数据、排序和是否立即发布；列出最终目标。
2. 读取现有 Data Table；找到精确记录、ID、当前字段与重复项。
3. 执行对应 n8n 保存/删除；检查 execution ID 为 success。
4. 复查 Data Table，确认只变化了预期字段。
5. 执行相应 JSON 发布，核对 GitHub JSON。
6. 如果用户要求正式站，走**对应数据类型的真实生产发布路径**，直到 Action success。
7. 检查线上 JSON 与首页，报告文件与访问链接、变更数量、运行 ID、完成状态；任何未做的步骤必须明确注明。

## 重要链接

- 正式站：https://yangyang.fun/
- 测试站：https://yangyang.fun/__deploy-test/
- GitHub：https://github.com/YyItRoad/YyItRoad.github.io
- n8n：https://n8n.yangyang.fun/
- 书签正式发布 workflow：https://github.com/YyItRoad/YyItRoad.github.io/blob/main/.github/workflows/bookmarks-production-sync.yml

## 执行示例

用户：将 YouTube 移出常用入口，但保留在内容创作分类，并直接发布正式站。

步骤：先查 YouTube 记录；使用其现有所有字段更新 `favorite=false`；复查数据库；运行公开 JSON 发布；核验开发分支；调整 `bookmarks-production-sync.yml` 中历史固定名单断言以适配 9 个常用入口；只同步 JSON + 必需的 CI 断言到 main；等待工作流成功；核验线上列表。不要因为 CI 原来写着“10 个”就擅自将 YouTube 留在常用入口。

用户：修改「孩子的日记」项目简介，图标改为 diary.webp。

步骤：完整读取现有项目记录、保留未改字段；检查 `diary.webp` 的文件名规则和用户是否已上传（未上传可以保存但需告知占位状态）；保存项目；生成项目 JSON；**如未明确要求上线则停在开发分支**；如要求上线，先确认生产动态项目加载与正式发布机制是否就绪。
