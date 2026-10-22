# YangYang.fun 部署说明

## 目标架构

- 源码与版本管理：GitHub 仓库 `YyItRoad/YyItRoad.github.io`
- 待部署的网站文件：仓库中的 `site/`
- 部署目标：`/www/wwwroot/yangyang.fun/`
- Web 服务：现有 Nginx
- 部署方式：GitHub Actions + 专用 SSH 账号

## 当前状态

本文件和部署工作流先提交到 `feature/homepage-pipeline-test` 测试分支。
不会触发生产部署。工作流只会在 `main` 分支的 `site/**` 文件变更时自动部署；手动运行时还必须明确勾选确认项。
在正式合并前，先完成网站文件、服务器账号和 GitHub Secrets 的配置。

## GitHub Actions 所需 Secrets

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中配置：

- `DEPLOY_HOST`：服务器 SSH 地址，当前为 `47.109.74.220`
- `DEPLOY_USER`：专门用于网站部署的非 root 账号
- `DEPLOY_SSH_KEY`：对应部署账号的 SSH 私钥，完整多行内容
- `DEPLOY_KNOWN_HOSTS`：已核验过的 SSH 主机公钥行，不要留空，也不要关闭主机密钥校验

不要将私钥、Token 或其他凭据提交到仓库。

## 服务器账号要求

部署账号应当是专用的非 root 账号，只能写入网站目录，不应拥有其他站点、应用或系统目录的写权限。该账号需要：

1. 能通过 SSH 公钥认证登录；
2. 能写入和删除 `/www/wwwroot/yangyang.fun/` 内的文件；
3. 能运行 rsync（服务端通常随 rsync 包提供）；
4. 不需要 sudo 或 root 权限。

创建账号和设置目录权限前，应先确认服务器现有账号与目录权限，避免直接将整个服务器目录树改为部署账号所有。

## 发布规则

- 自动部署触发条件：`main` 分支中的 `site/**` 文件发生变更。
- 手动部署触发条件：在 `main` 分支运行工作流，并将 `confirm_deploy` 设为 true。
- 部署源仅为 `site/`，不把仓库 README、Git 元数据或工作流文件复制到网站。
- 同步会删除网站根目录中不属于 `site/` 的旧站点文件；会保留服务器的 `.well-known/` 和 `.user.ini`。
- 因此，只有在确认新版完整站点文件都已放入 `site/` 后，才允许合并到 `main` 并首次执行生产部署。

## 推荐验证顺序

1. 完成 `site/index.html` 和全部静态资源。
2. 在服务器配置专用部署账号及目录权限。
3. 添加并核验 GitHub Actions Secrets。
4. 先在测试分支审查工作流内容。
5. 将完整站点与部署工作流合并到 `main`。
6. 首次生产部署后验证首页、工具页面和 `/data/bookmarks.json`。
