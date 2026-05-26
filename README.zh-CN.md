<p align="center">
  <img src="public/icons/icon-192x192.png" alt="MoeMail Logo" width="100" height="100">
  <h1 align="center">MoeMail</h1>
</p>

<p align="center">
  一个基于 NextJS + Cloudflare 技术栈构建的可爱临时邮箱服务🎉
</p>

<p align="center">
  <span>简体中文</span> | 
  <a href="./README.md">English</a> 
</p>

<p align="center">
  <a href="https://www.producthunt.com/products/moemail?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-moemail" target="_blank" rel="noopener noreferrer"><img alt="MoeMail - OpenAPI‑first temp email, hosted &amp; ready | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1078475&amp;theme=light&amp;t=1770964043604"></a>
</p>

<p align="center">
  <a href="#在线演示">在线演示</a> •
  <a href="#文档">文档</a> •
  <a href="#特性">特性</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#本地运行">本地运行</a> •
  <a href="#部署">部署</a> •
  <a href="#邮箱域名配置">邮箱域名配置</a> •
  <a href="#权限系统">权限系统</a> •
  <a href="#系统设置">系统设置</a> •
  <a href="#发件功能">发件功能</a> •
  <a href="#Webhook 集成">Webhook 集成</a> •
  <a href="#OpenAPI">OpenAPI</a> •
  <a href="#cli-工具">CLI 工具</a> •
  <a href="#环境变量">环境变量</a> •
  <a href="#Github OAuth App 配置">Github OAuth App 配置</a> •
  <a href="#Google OAuth App 配置">Google OAuth App 配置</a> •
  <a href="#贡献">贡献</a> •
  <a href="#许可证">许可证</a> •
  <a href="#交流群">交流群</a> •
  <a href="#支持">支持</a>
</p>

## 在线演示
[https://moemail.app](https://moemail.app)

![首页](https://pic.otaku.ren/20241209/AQADwsUxG9k1uVZ-.jpg "首页")


![邮箱](https://pic.otaku.ren/20241209/AQADw8UxG9k1uVZ-.jpg "邮箱")

![个人中心](https://pic.otaku.ren/20241227/AQADVsIxG7OzcFd-.jpg "个人中心")

## 文档
**完整文档**: [https://docs.moemail.app](https://docs.moemail.app)

文档站点包含详细的使用指南、API 文档、部署教程等完整信息。

## 特性

- 🔒 **隐私保护**：保护您的真实邮箱地址，远离垃圾邮件和不必要的订阅
- ⚡ **实时收件**：自动轮询，即时接收邮件通知
- ⏱️ **灵活有效期**：支持 1 小时、24 小时、3 天或永久有效
- 🎨 **主题切换**：支持亮色和暗色模式
- 📱 **响应式设计**：完美适配桌面和移动设备
- 🔄 **自动清理**：自动清理过期的邮箱和邮件
- 📱 **PWA 支持**：支持 PWA 安装
- 💸 **免费自部署**：基于 Cloudflare 构建, 可实现免费自部署，无需任何费用
- 🎉 **可爱的 UI**：简洁可爱萌萌哒 UI 界面
- 📤 **发件功能**：支持使用临时邮箱发送邮件，基于 Resend 服务
- 🔔 **Webhook 通知**：支持通过 webhook 接收新邮件通知
- 🛡️ **权限系统**：支持基于角色的权限控制系统
- 🔑 **OpenAPI**：支持通过 API Key 访问 OpenAPI
- 🤖 **Agent CLI**：专为 AI Agent 设计的命令行工具，自动化邮箱工作流
- 🌍 **多语言支持**：支持中文和英文界面，可自由切换

## 技术栈

- **框架**: [Next.js](https://nextjs.org/) (App Router)
- **平台**: [Cloudflare Pages](https://pages.cloudflare.com/)
- **数据库**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
- **认证**: [NextAuth](https://authjs.dev/getting-started/installation?framework=Next.js) 配合 GitHub 登录
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **UI 组件**: 基于 [Radix UI](https://www.radix-ui.com/) 的自定义组件
- **邮件处理**: [Cloudflare Email Workers](https://developers.cloudflare.com/email-routing/)
- **类型安全**: [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **国际化**: [next-intl](https://next-intl-docs.vercel.app/) 支持多语言

## 本地运行

### 前置要求

- Node.js 18+
- Pnpm
- Wrangler CLI
- Cloudflare 账号

### 安装

1. 克隆仓库：
```bash
git clone https://github.com/beilunyang/moemail.git
cd moemail
```

2. 安装依赖：
```bash
pnpm install
```

3. 设置 wrangler：
```bash
cp wrangler.example.json wrangler.json
cp wrangler.email.example.json wrangler.email.json
cp wrangler.cleanup.example.json wrangler.cleanup.json
```
设置 Cloudflare D1 数据库名以及数据库 ID

4. 设置环境变量：
```bash
cp .env.example .env.local
```
设置 AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, AUTH_SECRET

5. 创建本地数据库表结构
```bash
pnpm db:migrate-local
```

### 开发

1. 启动开发服务器：
```bash
pnpm dev
```

2. 测试邮件 worker：
目前无法本地运行并测试，请使用 wrangler 部署邮件 worker 并测试
```bash
pnpm deploy:email
```

3. 测试清理 worker：
```bash
pnpm dev:cleanup
pnpm test:cleanup
```

4. 生成 Mock 数据（邮箱以及邮件消息）
```bash
pnpm generate-test-data
```
## 部署

### 视频版保姆级部署教程
https://www.bilibili.com/video/BV19wrXY2ESM/

### 本地 Wrangler 部署
1. 创建 .env 文件
```bash
cp .env.example .env
```
2. 在 .env 文件中设置[环境变量](#环境变量)

3. 运行部署脚本
```bash
pnpm dlx tsx ./scripts/deploy/index.ts
```

### Github Actions 部署

本项目可使用 GitHub Actions 实现自动化部署。支持以下触发方式：

1. **自动触发**：推送新的 tag 时自动触发部署流程
2. **手动触发**：在 GitHub Actions 页面手动触发

#### 部署步骤

1. 在 GitHub 仓库设置中添加以下 Secrets：
   - `CLOUDFLARE_API_TOKEN`: Cloudflare API 令牌
   - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 账户 ID
   - `AUTH_GITHUB_ID`: GitHub OAuth App ID
   - `AUTH_GITHUB_SECRET`: GitHub OAuth App Secret
   - `AUTH_SECRET`: NextAuth Secret，用来加密 session，请设置一个随机字符串
   - `CUSTOM_DOMAIN`: 网站自定义域名，用于访问 MoeMail (可选， 如果不填, 则会使用 Cloudflare Pages 默认域名)
   - `PROJECT_NAME`: Pages 项目名 （可选，如果不填，则为 moemail） 
   - `DATABASE_NAME`: D1 数据库名称 (可选，如果不填，则为 moemail-db)
   - `KV_NAMESPACE_NAME`: Cloudflare KV namespace 名称，用于存储网站配置 （可选，如果不填，则为 moemail-kv）

2. 选择触发方式：

   **方式一：推送 tag 触发**
   ```bash
   # 创建新的 tag
   git tag v1.0.0
   
   # 推送 tag 到远程仓库
   git push origin v1.0.0
   ```

   **方式二：手动触发**
   - 进入仓库的 Actions 页面
   - 选择 "Deploy" workflow
   - 点击 "Run workflow"

3. 部署进度可以在仓库的 Actions 标签页查看

#### 注意事项
- 确保所有 Secrets 都已正确设置
- 使用 tag 触发时，tag 必须以 `v` 开头（例如：v1.0.0）

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/beilunyang/moemail)


## 邮箱域名配置

在 MoeMail 个人中心页面，可以配置网站的邮箱域名，支持多域名配置，多个域名用逗号分隔
![邮箱域名配置](https://pic.otaku.ren/20241227/AQAD88AxG67zeVd-.jpg "邮箱域名配置")

### 支持子域名后的变化

- `EMAIL_DOMAINS` / 站点配置中仍然只保存**基础域名**，例如：`example.com,moemail.app`
- 创建邮箱时，`domain` 用来选择基础域名，`subdomain` 为可选项，最终地址会变成 `user@team.example.com`
- 除非你希望 `team.example.com` 作为一个独立可选域名直接展示，否则不需要把它单独写进 `EMAIL_DOMAINS`

### Cloudflare 邮件路由配置

为了使邮箱域名生效，还需要在 Cloudflare 控制台配置邮件路由，将收到的邮件转发给 Email Worker 处理。

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
2. 选择您的域名
3. 点击左侧菜单的 "电子邮件" -> "电子邮件路由"
4. 如果显示 “电子邮件路由当前被禁用，没有在路由电子邮件”，请点击 "启用电子邮件路由"
![启用电子邮件路由](https://pic.otaku.ren/20241223/AQADNcQxG_K0SVd-.jpg "启用电子邮件路由")
5. 点击后，会提示你添加电子邮件路由 DNS 记录，点击 “添加记录并启用” 即可
![添加电子邮件路由 DNS 记录](https://pic.otaku.ren/20241223/AQADN8QxG_K0SVd-.jpg "添加电子邮件路由 DNS 记录")
6. 配置路由规则：
   - Catch-all 地址: 启用 "Catch-all"
   - 编辑 Catch-all 地址
    - 操作: 选择 "发送到 Worker"
    - 目标位置: 选择刚刚部署的 "email-receiver-worker"
    - 保存
  ![配置路由规则](https://pic.otaku.ren/20241223/AQADNsQxG_K0SVd-.jpg "配置路由规则")

### 注意事项
- 确保域名的 DNS 托管在 Cloudflare
- Email Worker 必须已经部署成功
- 如果启用了子域名邮箱（例如 `user@team.example.com`），请确认 Cloudflare 的邮件路由规则已经覆盖这些子域名地址；如果现有 Catch-all 只覆盖修改前的基础域名场景，需要为对应子域名补充接收规则，但目标仍然指向同一个 Email Worker
- 如果 Catch-All 状态不可用(一直 loading)，请点击`路由规则`旁边的`目标地址`, 进去绑定一个邮箱

### 子域名部署清单

启用邮箱子域名后，建议按下面清单逐项确认与修改前部署的差异：

1. **基础域名配置**
   - `EMAIL_DOMAINS` 里仍然填写基础域名，例如 `example.com`
   - 除非你希望 `team.example.com` 作为独立可选域名展示，否则不要直接把它替换成子域名
2. **Cloudflare 邮件路由**
   - 确认收件规则也能匹配 `*@team.example.com` 这类子域名地址
   - 子域名邮件仍然转发到原来的同一个 Email Worker
3. **DNS / 域名托管**
   - 确认父域名及目标子域名在当前路由方案下都已由 Cloudflare 正确托管
4. **发件域验证**
   - 如果需要从子域名地址发信，确认发件服务（例如 Resend）是否要求对子域名单独做验证
5. **手动冒烟验证**
   - 创建一个 `user@team.example.com`
   - 向该地址发送一封测试邮件，确认 MoeMail 能正常收到
   - 如果启用了发信能力，再从该地址发送一封测试邮件，确认能成功投递

## 权限系统

本项目采用基于角色的权限控制系统（RBAC）。

### 角色配置

新用户默认角色由皇帝在个人中心的网站设置中配置：
- 公爵：新用户将获得临时邮箱、Webhook 配置权限以及 API Key 管理权限
- 骑士：新用户将获得临时邮箱和 Webhook 配置权限
- 平民：新用户无任何权限，需要等待皇帝册封为骑士或公爵

### 角色等级

系统包含四个角色等级：

1. **皇帝（Emperor）**
   - 网站所有者
   - 拥有所有权限
   - 每个站点只能有一个皇帝

2. **公爵（Duke）**  
   - 超级用户
   - 可以使用临时邮箱功能
   - 可以配置 Webhook
   - 可以使用创建 API Key 调用 OpenAPI
   - 可以被皇帝贬为骑士或平民

3. **骑士（Knight）**
   - 高级用户
   - 可以使用临时邮箱功能
   - 可以配置 Webhook
   - 可以被皇帝贬为平民或册封为公爵

3. **平民（Civilian）**
   - 普通用户
   - 无任何权限
   - 可以被皇帝册封为骑士或者公爵

### 角色升级

1. **成为皇帝**
   - 第一个访问 `/api/roles/init-emperor` 接口的用户将成为皇帝，即网站所有者
   - 站点已有皇帝后，无法再提升其他用户为皇帝

2. **角色变更**
   - 皇帝可以在个人中心页面将其他用户设为公爵、骑士或平民

### 权限说明

- **邮箱管理**：创建和管理临时邮箱
- **Webhook 管理**：配置邮件通知的 Webhook
- **API Key 管理**：创建和管理 API 访问密钥
- **用户管理**：升降用户角色
- **系统设置**：管理系统全局设置

## 系统设置

系统设置存储在 Cloudflare KV 中，包括以下内容：

- `DEFAULT_ROLE`: 新注册用户默认角色，可选值为 `CIVILIAN`、`KNIGHT`、`DUKE`
- `EMAIL_DOMAINS`: 支持的邮箱域名，多个域名用逗号分隔
- `ADMIN_CONTACT`: 管理员联系方式
- `MAX_EMAILS`: 每个用户可创建的最大邮箱数量

**皇帝**角色可以在个人中心页面设置

## 发件功能

MoeMail 支持使用临时邮箱发送邮件，基于 [Resend](https://resend.com/) 服务。

### 功能特性

- 📨 **临时邮箱发件**：可以使用创建的临时邮箱作为发件人发送邮件
- 🎯 **角色权限控制**：不同角色有不同的每日发件限制
- 💌 **支持 HTML**：支持发送富文本格式邮件

### 角色发件权限

| 角色 | 每日发件限制 | 说明 |
|------|-------------|------|
| 皇帝 (Emperor) | 无限制 | 网站管理员，无发件限制 |
| 公爵 (Duke) | 5封/天 | 默认每日可发送5封邮件 |
| 骑士 (Knight) | 2封/天 | 默认每日可发送2封邮件 |
| 平民 (Civilian) | 禁止发件 | 无发件权限 |

> 💡 **提示**：皇帝可以在个人中心的邮件服务配置中自定义公爵和骑士的每日发件限制。

### 配置发件服务

1. **获取 Resend API Key**
   - 访问 [Resend 官网](https://resend.com/) 注册账号
   - 在控制台中创建 API Key
   - 复制 API Key 供后续配置使用

2. **配置发件服务**
   - 皇帝角色登录 MoeMail
   - 进入个人中心页面
   - 在"Resend 发件服务配置"部分：
     - 启用发件服务开关
     - 填入 Resend API Key
     - 设置公爵和骑士的每日发件限制（可选）
   - 点击保存配置

3. **验证配置**
   - 配置保存后，有权限的用户在邮箱列表页面会看到"发送邮件"按钮
   - 点击按钮可以打开发件对话框进行测试

### 使用发件功能

1. **创建临时邮箱**
   - 在邮箱页面创建一个新的临时邮箱

2. **发送邮件**
   - 在邮箱列表中找到要使用的邮箱
   - 点击邮箱旁边的"发送邮件"按钮
   - 在弹出的对话框中填写：
     - 收件人邮箱地址
     - 邮件主题
     - 邮件内容（支持 HTML 格式）
   - 点击"发送"按钮

3. **查看发送记录**
   - 发送的邮件会自动保存到对应邮箱的消息列表中
   - 可以在邮箱详情页面查看所有发送和接收的邮件

### 注意事项

- 📋 **Resend 限制**：请注意 Resend 服务的发送限制和定价政策
- 🔐 **域名验证**：使用自定义域名发件需要在 Resend 中验证域名
- 🔐 **子域名发件**：如果要从 `user@team.example.com` 发信，还需要确认当前发件服务是否允许该子域名作为发件身份；如服务商要求，请单独验证子域名
- 🚫 **反垃圾邮件**：请遵守邮件发送规范，避免发送垃圾邮件
- 📊 **配额监控**：系统会自动统计每日发件数量，达到限额后将无法继续发送
- 🔄 **配额重置**：每日发件配额在每天 00:00 自动重置

## Webhook 集成

当收到新邮件时，系统会向用户配置并且已启用的 Webhook URL 发送 POST 请求。

### 请求头
```http
Content-Type: application/json
X-Webhook-Event: new_message
```

### 请求体
```json
{
  "emailId": "email-uuid",
  "messageId": "message-uuid",
  "fromAddress": "sender@example.com",
  "subject": "邮件主题",
  "content": "邮件文本内容",
  "html": "邮件HTML内容",
  "receivedAt": "2024-01-01T12:00:00.000Z",
  "toAddress": "your-email@moemail.app"
}
```

### 配置说明
1. 点击个人头像，进入个人中心
2. 在个人中心启用 Webhook
3. 设置接收通知的 URL
4. 点击测试按钮验证配置
5. 保存配置后即可接收新邮件通知

### 测试

项目提供了一个简单的测试服务器, 可以通过如下命令运行:

```bash
pnpm webhook-test-server
```

测试服务器会在本地启动一个 HTTP 服务器，监听 3001 端口（http://localhost:3001）, 并打印收到的 Webhook 消息详情。

如果需要进行外网测试，可以通过 Cloudflare Tunnel 将服务暴露到外网：
```bash
pnpx cloudflared tunnel --url http://localhost:3001
```

### 注意事项
- Webhook 接口应在 10 秒内响应
- 非 2xx 响应码会触发重试

## OpenAPI

本项目提供了 OpenAPI 接口，支持通过 API Key 进行访问。API Key 可以在个人中心页面创建（需要是公爵或皇帝角色）。

### 使用 API Key

在请求头中添加 API Key：
```http
X-API-Key: YOUR_API_KEY
```

### API 接口

#### 获取系统配置
```http
GET /api/config
```
返回响应：
```json
{
  "defaultRole": "CIVILIAN",
  "emailDomains": "moemail.app,example.com",
  "adminContact": "admin@example.com",
  "maxEmails": "10"
}
```
响应字段说明：
- `defaultRole`: 新用户默认角色，可选值：`CIVILIAN`（平民）、`KNIGHT`（骑士）、`DUKE`（公爵）
- `emailDomains`: 支持的邮箱域名，多个域名用逗号分隔
- `adminContact`: 管理员联系方式
- `maxEmails`: 每个用户可创建的最大邮箱数量

#### 创建临时邮箱
```http
POST /api/emails/generate
Content-Type: application/json

{
  "name": "test",
  "expiryTime": 3600000,
  "domain": "moemail.app",
  "subdomain": "team"
}
```
参数说明：
- `name`: 邮箱前缀，可选
- `expiryTime`: 有效期（毫秒），可选值：3600000（1小时）、86400000（1天）、604800000（7天）、0（永久）
- `domain`: 基础域名，可通过 `/api/config` 接口获取
- `subdomain`: 可选的单段子域名，最终地址格式为 `name@subdomain.domain`

返回响应：
```json
{
  "id": "email-uuid-123",
  "email": "test@team.moemail.app"
}
```
响应字段说明：
- `id`: 邮箱的唯一标识符
- `email`: 创建的邮箱地址

#### 获取邮箱列表
```http
GET /api/emails?cursor=xxx
```
参数说明：
- `cursor`: 分页游标，可选

返回响应：
```json
{
  "emails": [
    {
      "id": "email-uuid-123",
      "address": "test@moemail.app",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "expiresAt": "2024-01-02T12:00:00.000Z",
      "userId": "user-uuid-456"
    }
  ],
  "nextCursor": "encoded-cursor-string",
  "total": 5
}
```
响应字段说明：
- `emails`: 邮箱列表数组
- `nextCursor`: 下一页游标，用于分页请求
- `total`: 邮箱总数量

#### 获取指定邮箱邮件列表
```http
GET /api/emails/{emailId}?cursor=xxx
```
参数说明：
- `emailId`: 邮箱的唯一标识符，必填
- `cursor`: 分页游标，可选

返回响应：
```json
{
  "messages": [
    {
      "id": "message-uuid-789",
      "from_address": "sender@example.com",
      "subject": "邮件主题",
      "received_at": 1704110400000
    }
  ],
  "nextCursor": "encoded-cursor-string",
  "total": 3
}
```
响应字段说明：
- `messages`: 邮件列表数组
- `nextCursor`: 下一页游标，用于分页请求
- `total`: 邮件总数量

#### 删除邮箱
```http
DELETE /api/emails/{emailId}
```
参数说明：
- `emailId`: 邮箱的唯一标识符，必填

返回响应：
```json
{
  "success": true
}
```
响应字段说明：
- `success`: 删除操作是否成功

#### 获取单封邮件内容
```http
GET /api/emails/{emailId}/{messageId}
```
参数说明：
- `emailId`: 邮箱的唯一标识符，必填
- `messageId`: 邮件的唯一标识符，必填

返回响应：
```json
{
  "message": {
    "id": "message-uuid-789",
    "from_address": "sender@example.com",
    "subject": "邮件主题",
    "content": "邮件文本内容",
    "html": "<p>邮件HTML内容</p>",
    "received_at": 1704110400000
  }
}
```
响应字段说明：
- `message`: 邮件详细信息对象
- `id`: 邮件的唯一标识符
- `from_address`: 发件人邮箱地址
- `subject`: 邮件主题
- `content`: 邮件纯文本内容
- `html`: 邮件HTML内容
- `received_at`: 接收时间（时间戳）

#### 创建邮箱分享链接
```http
POST /api/emails/{emailId}/share
Content-Type: application/json

{
  "expiresIn": 86400000
}
```
参数说明：
- `emailId`: 邮箱的唯一标识符，必填
- `expiresIn`: 分享链接有效期（毫秒），0 表示永久有效，可选

返回响应：
```json
{
  "id": "share-uuid-123",
  "emailId": "email-uuid-123",
  "token": "abc123def456",
  "expiresAt": "2024-01-02T12:00:00.000Z",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```
响应字段说明：
- `id`: 分享记录的唯一标识符
- `emailId`: 关联的邮箱 ID
- `token`: 分享链接的访问令牌
- `expiresAt`: 分享链接过期时间，null 表示永久有效
- `createdAt`: 创建时间

分享链接访问地址：`https://your-domain.com/shared/{token}`

#### 获取邮箱的所有分享链接
```http
GET /api/emails/{emailId}/share
```
参数说明：
- `emailId`: 邮箱的唯一标识符，必填

返回响应：
```json
{
  "shares": [
    {
      "id": "share-uuid-123",
      "emailId": "email-uuid-123",
      "token": "abc123def456",
      "expiresAt": "2024-01-02T12:00:00.000Z",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "total": 1
}
```
响应字段说明：
- `shares`: 分享链接列表数组
- `total`: 分享链接总数

#### 删除邮箱分享链接
```http
DELETE /api/emails/{emailId}/share/{shareId}
```
参数说明：
- `emailId`: 邮箱的唯一标识符，必填
- `shareId`: 分享记录的唯一标识符，必填

返回响应：
```json
{
  "success": true
}
```
响应字段说明：
- `success`: 删除操作是否成功

#### 创建邮件分享链接
```http
POST /api/emails/{emailId}/messages/{messageId}/share
Content-Type: application/json

{
  "expiresIn": 86400000
}
```
参数说明：
- `emailId`: 邮箱的唯一标识符，必填
- `messageId`: 邮件的唯一标识符，必填
- `expiresIn`: 分享链接有效期（毫秒），0 表示永久有效，可选

返回响应：
```json
{
  "id": "share-uuid-456",
  "messageId": "message-uuid-789",
  "token": "xyz789ghi012",
  "expiresAt": "2024-01-02T12:00:00.000Z",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```
响应字段说明：
- `id`: 分享记录的唯一标识符
- `messageId`: 关联的邮件 ID
- `token`: 分享链接的访问令牌
- `expiresAt`: 分享链接过期时间，null 表示永久有效
- `createdAt`: 创建时间

分享链接访问地址：`https://your-domain.com/shared/message/{token}`

#### 获取邮件的所有分享链接
```http
GET /api/emails/{emailId}/messages/{messageId}/share
```
参数说明：
- `emailId`: 邮箱的唯一标识符，必填
- `messageId`: 邮件的唯一标识符，必填

返回响应：
```json
{
  "shares": [
    {
      "id": "share-uuid-456",
      "messageId": "message-uuid-789",
      "token": "xyz789ghi012",
      "expiresAt": "2024-01-02T12:00:00.000Z",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "total": 1
}
```
响应字段说明：
- `shares`: 分享链接列表数组
- `total`: 分享链接总数

#### 删除邮件分享链接
```http
DELETE /api/emails/{emailId}/messages/{messageId}/share/{shareId}
```
参数说明：
- `emailId`: 邮箱的唯一标识符，必填
- `messageId`: 邮件的唯一标识符，必填
- `shareId`: 分享记录的唯一标识符，必填

返回响应：
```json
{
  "success": true
}
```
响应字段说明：
- `success`: 删除操作是否成功

### 使用示例

使用 curl 创建临时邮箱：
```bash
curl -X POST https://your-domain.com/api/emails/generate \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test",
    "expiryTime": 3600000,
    "domain": "moemail.app",
    "subdomain": "team"
  }'
```

使用 JavaScript 获取邮件列表：
```javascript
const res = await fetch('https://your-domain.com/api/emails/your-email-id', {
  headers: {
    'X-API-Key': 'YOUR_API_KEY'
  }
});
const data = await res.json();
```

使用 curl 创建邮箱分享链接：
```bash
curl -X POST https://your-domain.com/api/emails/your-email-id/share \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "expiresIn": 86400000
  }'
```

使用 JavaScript 创建邮件分享链接：
```javascript
const res = await fetch('https://your-domain.com/api/emails/your-email-id/messages/your-message-id/share', {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    expiresIn: 0  // 永久有效
  })
});
const data = await res.json();
console.log('分享链接:', `https://your-domain.com/shared/message/${data.token}`);
```

## CLI 工具

MoeMail 提供了专为 AI Agent 设计的命令行工具，用于自动化邮箱工作流。

### 安装

```bash
npm i -g @moemail/cli
```

### 快速上手

```bash
# 配置 API 地址和密钥
moemail config set api-url https://moemail.app
moemail config set api-key YOUR_API_KEY

# 创建临时邮箱
moemail create --domain moemail.app --subdomain team --expiry 1h --json

# 等待新邮件（轮询）
moemail wait --email-id <id> --timeout 120 --json

# 读取邮件内容
moemail read --email-id <id> --message-id <id> --json

# 删除邮箱
moemail delete --email-id <id>
```

### Agent 工作流

AI Agent 仅需 3 次调用即可完成验证流程：

```bash
# 1. 创建邮箱
EMAIL=$(moemail create --domain moemail.app --subdomain team --expiry 1h --json)
EMAIL_ID=$(echo $EMAIL | jq -r '.id')
ADDRESS=$(echo $EMAIL | jq -r '.address')

# 2. 等待验证邮件
MSG=$(moemail wait --email-id $EMAIL_ID --timeout 120 --json)
MSG_ID=$(echo $MSG | jq -r '.messageId')

# 3. 读取内容，提取验证码
CONTENT=$(moemail read --email-id $EMAIL_ID --message-id $MSG_ID --json)
```

详细文档见 [packages/cli/README.md](packages/cli/README.md)。

## 环境变量

本项目使用以下环境变量：

### 认证相关
- `AUTH_GITHUB_ID`: GitHub OAuth App ID
- `AUTH_GITHUB_SECRET`: GitHub OAuth App Secret
- `AUTH_GOOGLE_ID`: Google OAuth App ID
- `AUTH_GOOGLE_SECRET`: Google OAuth App Secret
- `AUTH_SECRET`: NextAuth Secret，用来加密 session，请设置一个随机字符串

### Cloudflare 配置
- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID
- `DATABASE_NAME`: D1 数据库名称
- `DATABASE_ID`: D1 数据库 ID (可选, 如果不填, 则会自动通过 Cloudflare API 获取)
- `KV_NAMESPACE_NAME`: Cloudflare KV namespace 名称，用于存储网站配置
- `KV_NAMESPACE_ID`: Cloudflare KV namespace ID，用于存储网站配置 （可选， 如果不填, 则会自动通过 Cloudflare API 获取）
- `CUSTOM_DOMAIN`: 网站自定义域名, 如：moemail.app (可选， 如果不填, 则会使用 Cloudflare Pages 默认域名)
- `PROJECT_NAME`: Pages 项目名 （可选，如果不填，则为 moemail） 

## Github OAuth App 配置

1. 登录 [Github Developer](https://github.com/settings/developers) 创建一个新的 OAuth App
2. 生成一个新的 `Client ID` 和 `Client Secret`
3. 配置参数：
   - `Application name`: `<your-app-name>`
   - `Homepage URL`: `https://<your-domain>`
   - `Authorization callback URL`: `https://<your-domain>/api/auth/callback/github`

## Google OAuth App 配置

1. 访问 [Google Cloud Console](https://console.cloud.google.com/) 创建项目
2. 配置 OAuth 同意屏幕
3. 创建 OAuth 客户端 ID
   - 应用类型：Web 应用
   - 已获授权的 Javascript 来源：`https://<your-domain>`
   - 已获授权的重定向 URI：`https://<your-domain>/api/auth/callback/google`
4. 获取 `Client ID` 和 `Client Secret`
5. 配置环境变量 `AUTH_GOOGLE_ID` 和 `AUTH_GOOGLE_SECRET`



## 贡献

欢迎提交 Pull Request 或者 Issue 来帮助改进这个项目

## 许可证

本项目采用 [MIT](LICENSE) 许可证

## 交流
<table>
  <tr style="max-width: 360px">
    <td>
      <img src="https://pic.otaku.ren/20250309/AQADAcQxGxQjaVZ-.jpg" />
    </td>
    <td>
      <img src="https://pic.otaku.ren/20250309/AQADCMQxGxQjaVZ-.jpg" />
    </td>
  </tr>
  <tr style="max-width: 360px">
    <td>
      关注公众号，了解更多项目进展以及AI，区块链，独立开发资讯
    </td>
    <td>
      添加微信，备注 "MoeMail" 拉你进微信交流群
    </td>
  </tr>
</table>

## 支持

如果你喜欢这个项目，欢迎给它一个 Star ⭐️
或者进行赞助
<br />
<br />
<img src="https://pic.otaku.ren/20240212/AQADPrgxGwoIWFZ-.jpg" style="width: 400px;"/>
<br />
<br />
<a href="https://www.buymeacoffee.com/beilunyang" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" style="width: 400px;" ></a>

## Star History

<a href="https://www.star-history.com/#beilunyang/moemail&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=beilunyang/moemail&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=beilunyang/moemail&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=beilunyang/moemail&type=Date" />
 </picture>
</a>
