# YangYang.fun 个人主页

原生 HTML / CSS / JavaScript 静态站点。唯一生产源码目录为 `site/`，无需 npm 安装或构建。

## 目录

| 路径 | 用途 |
| --- | --- |
| `site/` | 首页、四款工具、运行图标与公共 JSON |
| `.github/workflows/` | 书签同步、连接检查和手动站点发布 |
| `.github/scripts/` | 带备份与回滚的发布脚本 |
| `docs/design/` | 设计参考、生成原图、提示词和素材来源 |
| `docs/archive/` | 旧需求、清理证据及已停止尝试 |
| `site/docs/` | 开发验收和历次发布记录 |

## 本地预览

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory site
```

打开 `http://127.0.0.1:4173/`。网页运行不依赖根目录 Node 构建链路；浏览器回归另需外部 Playwright，见 [站点说明](site/README.md)。根目录 index.html/nav.html 只是源码预览跳转页，生产部署仍只取 site/。

## 维护入口

- [当前交接与待办](docs/CODEX_HANDOFF.md)
- [部署说明](DEPLOYMENT.md)
- [设计资料入口](docs/design/README.md)
- [收尾与归档记录](docs/项目收尾与归档.md)

动态项目功能位于独立 PR #4，尚未合并；当前项目展示仍使用静态配置。手机 Safari 收藏图标问题已按用户要求搁置，不等于已修复。收尾分支不合并 main、不执行部署。
