# YangYang.fun 部署说明

更新日期：2026-10-23。生产源码为 `site/`，服务器目录 `/www/wwwroot/yangyang.fun/`，由宝塔 Nginx 托管。根目录旧站模板和旧 Node 导航构建器不参与生产部署，已清理。

## 现有工作流

| 文件 | 触发与范围 |
| --- | --- |
| `homepage-staging-test.yml` | 仅手动运行。支持 main/feat/homepage-v1；staging、inspect、promote 三种操作 |
| `bookmarks-production-sync.yml` | main 的书签 JSON 或该工作流变更时，以及手动触发；只更新正式书签 JSON，不发布页面 |
| `bookmarks-staging-sync.yml` | 指定工作流变更及手动触发；从 feat/homepage-v1 同步隔离目录书签 |
| `ssh-smoke.yml` | 手动 SSH 连接检查 |

不存在页面变更自动全站发布流程。旧 build.yml 的 update-navigation/定时旧导航构建已移除，未修改当前 n8n 数据发布或其他工作流。

## 全站发布

1. 提交完整源码并确定 40 位提交 SHA。
2. 在允许的分支运行 homepage-staging-test.yml，operation=staging，expected_source_sha=该 SHA。
3. 验收 __deploy-test/ 下的版本标记、文件哈希、页面与工具。
4. 仅经用户明确授权，operation=promote 使用同一个 SHA；流程独立重建清单核对，再备份、替换正式目录并验收，失败恢复。

部署排除 Markdown、测试、截图、原始大图与系统缓存，仅保留必要运行文件及 CryptoJS 许可证。保护 .well-known、.user.ini、.htaccess、404.html 和 __deploy-test/。不要手动 rsync 整个仓库，也不要使用已撤下的旧 deploy.yml。

## 凭据与服务器

工作流使用已有 DEPLOY_HOST、DEPLOY_USER、DEPLOY_SSH_KEY、DEPLOY_KNOWN_HOSTS；私钥/令牌不得写入代码或文档。部署账号应为仅可写站点目录的专用账号，严格验证主机密钥。

www 绑定、含两个域名的证书及 www→主域名 301 由维护者在宝塔配置，收尾不修改这些配置。当前运行版本以公网 deployment-version.txt 和实际文件清单为准；书签 JSON 可由独立工作流更新，版本标记不代表数据从未变化。
