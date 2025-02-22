### 视频版部署教程
https://www.bilibili.com/video/BV19wrXY2ESM/

## 准备

在开始部署之前，需要在 Cloudflare 控制台完成以下准备工作：

1. **创建 D1 数据库**
   - 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
   - 选择 “存储与数据库” -> “D1 SQL 数据库”
   - 创建一个数据库（例如：moemail）
   - 记录下数据库名称和数据库 ID，后续配置需要用到

2. **创建 KV 命名空间**
   - 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
   - 选择 “存储与数据库” -> “KV”
   - 创建一个 KV 命名空间（例如：moemail）
   - 记录下命名空间 ID，后续配置需要用到

3. **创建 Pages 项目**
   - 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
   - 选择 “Workers 和 Pages”
   - 点击 “创建” 并选择 “Pages” 标签
   - 选择 “使用直接上传创建”
   - 点击 “上传资产”
   - 输入项目名称
      ::: warning
      注意：项目名称必须为 moemail，否则无法正常部署
      :::
   - 输入项目名称后，点击 “创建项目” 即可，不需要上传任何文件以及点击“部署站点”，之后我们会通过 本地运行Wrangler 或者通过 Github Actions 自动部署
4. **为 Pages 项目添加 AUTH 认证相关的 SECRETS**
   - 在 Overview 中选择刚刚创建的 Pages 项目
   - 在 Settings 中选择变量和机密
   - 添加 AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, AUTH_SECRET

## Github Actions 部署

本项目可使用 GitHub Actions 实现自动化部署。支持以下触发方式：

1. **自动触发**：推送新的 tag 时自动触发部署流程
2. **手动触发**：在 GitHub Actions 页面手动触发，可选择以下部署选项：
   - Run database migrations：执行数据库迁移
   - Deploy email Worker：重新部署邮件 Worker
   - Deploy cleanup Worker：重新部署清理 Worker

#### 部署步骤

1. 在 GitHub 仓库设置中添加以下 Secrets：

| 环境变量 | 说明 |
|----------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 令牌 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID |
| `DATABASE_NAME` | D1 数据库名称 |
| `DATABASE_ID` | D1 数据库 ID |
| `KV_NAMESPACE_ID` | Cloudflare KV namespace ID，用于存储网站配置 |

2. 选择触发方式：

   **方式一：推送 tag 触发**
   ```bash
   # 创建新的 tag
   git tag v1.0.0
   ```

   ```bash
   # 推送 tag 到远程仓库
   git push origin v1.0.0
   ```

   **方式二：手动触发**
   - 进入仓库的 Actions 页面
   - 选择 "Deploy" workflow
   - 点击 "Run workflow"
   - 选择需要执行的部署选项
   - 点击 "Run workflow" 开始部署

3. GitHub Actions 会自动执行以下任务：
   - 构建并部署主应用到 Cloudflare Pages
   - 根据选项或文件变更执行数据库迁移
   - 根据选项或文件变更部署 Email Worker
   - 根据选项或文件变更部署 Cleanup Worker

4. 部署进度可以在仓库的 Actions 标签页查看

::: warning
- 使用 tag 触发时，tag 必须以 `v` 开头（例如：v1.0.0）
- 使用 tag 触发时，只有文件发生变更的部分会被部署
- 手动触发时，可以选择性地执行特定的部署任务
- 每次部署都会重新部署主应用
:::

## 环境变量

本项目使用以下环境变量：

### 认证相关

| 环境变量 | 说明 |
|----------|------|
| `AUTH_GITHUB_ID` | GitHub OAuth App ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Secret |
| `AUTH_SECRET` | NextAuth Secret，用来加密 session，请设置一个随机字符串 |

### Cloudflare 配置

| 环境变量 | 说明 |
|----------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `DATABASE_NAME` | D1 数据库名称 |
| `DATABASE_ID` | D1 数据库 ID |
| `KV_NAMESPACE_ID` | Cloudflare KV namespace ID，用于存储网站配置 |


## Github OAuth App 配置

- 登录 [Github Developer](https://github.com/settings/developers) 创建一个新的 OAuth App
- 生成一个新的 `Client ID` 和 `Client Secret`
- 设置 `Application name` 为 `<your-app-name>`
- 设置 `Homepage URL` 为 `https://<your-domain>`
- 设置 `Authorization callback URL` 为 `https://<your-domain>/api/auth/callback/github`

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/beilunyang/moemail)

## Cloudflare 邮件路由配置

为了使邮箱域名生效，还需要在 Cloudflare 控制台配置邮件路由，将收到的邮件转发给 Email Worker 处理。

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
2. 选择您的域名
3. 点击左侧菜单的 "电子邮件" -> "电子邮件路由"
4. 如果显示 “电子邮件路由当前被禁用，没有在路由电子邮件”，请点击 "启用电子邮件路由"
![启用电子邮件路由](https://pic.otaku.ren/20241223/AQADNcQxG_K0SVd-.jpg "启用电子邮件路由")
5. 点击后，会提示你添加电子邮件路由 DNS 记录，点击 “添加记录并启用” 即可
![添加电子邮件路由 DNS 记录](https://pic.otaku.ren/20241223/AQADN8QxG_K0SVd-.jpg "添加电子邮件路由 DNS 记录")
6. 配置路由规则：

   ![配置路由规则](https://pic.otaku.ren/20241223/AQADNsQxG_K0SVd-.jpg "配置路由规则")
   - Catch-all 地址: 启用 "Catch-all"
   ::: warning
   如果Catch-All 状态不可用，请在点击`路由规则`旁边的`目标地址`进去绑定一个邮箱
   :::
   - 编辑 Catch-all 地址,选择 "发送到 Worker"
   - 目标位置: 选择刚刚部署的 "email-receiver-worker"