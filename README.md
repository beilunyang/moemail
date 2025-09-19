<p align="center">
  <img src="public/icons/svg/sanhuamao-logo.svg" alt="XiYang Mail Logo" width="100" height="100">
  <h1 align="center">XiYang Mail</h1>
</p>

<p align="center">
  一个基于 NextJS + Cloudflare 技术栈构建的夕阳邮箱服务🎉
</p>

<p align="center">
  <a href="#在线演示">在线演示</a> •
  <a href="#特性">特性</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#本地运行">本地运行</a> •
  <a href="#部署">部署</a> •
  <a href="#邮箱域名配置">邮箱域名配置</a> •
  <a href="#权限系统">权限系统</a> •
  <a href="#卡密系统">卡密系统</a> •
  <a href="#系统设置">系统设置</a> •
  <a href="#发件功能">发件功能</a> •
  <a href="#Webhook 集成">Webhook 集成</a> •
  <a href="#OpenAPI">OpenAPI</a> •
  <a href="#环境变量">环境变量</a> •
  <a href="#Github OAuth App 配置">Github OAuth App 配置</a> •
  <a href="#贡献">贡献</a> •
  <a href="#许可证">许可证</a> •
  <a href="#交流群">交流群</a> •
  <a href="#支持">支持</a>
</p>

## 分支说明（xiyang-card-key-system-optimize）

- 卡密系统优化：生成/管理流程与界面细节优化，分类筛选与搜索联动更顺滑
- 管理后台：新增“用户/卡密”分类查看与分页区间显示，布局宽度优化，避免按钮被裁剪或换行
- Bug 修复：个人中心 API Key 面板 JSX 与示例字符串闭合问题，已通过构建与本地运行验证

### 清理与到期策略（说明）

- 策略为自动清理：保存后立即生效，由 Cloudflare Pages/Workers 的 Scheduled Triggers 定时调用 /api/cleanup/temp-accounts 执行。
- 可选项：清理“已使用且过期”卡密、清理“过期未使用”卡密、清理“过期邮箱（含消息）”。关闭即不自动清理。
- 邮箱清理为级联删除，会同时删除该邮箱下所有消息，请谨慎开启。
- 卡密过期规则受“卡密默认有效期（天）”与生成参数共同影响。

## 在线演示

[https://xiyang.app](https://xiyang.app)

![首页](https://pic.otaku.ren/20241209/AQADwsUxG9k1uVZ-.jpg "首页")

![邮箱](https://pic.otaku.ren/20241209/AQADw8UxG9k1uVZ-.jpg "邮箱")

![个人中心](https://pic.otaku.ren/20241227/AQADVsIxG7OzcFd-.jpg "个人中心")

## 特性

- 🔒 **隐私保护**：保护您的真实邮箱地址，远离垃圾邮件和不必要的订阅
- ⚡ **实时收件**：自动轮询，即时接收邮件通知
- ⏱️ **灵活有效期**：支持 1 小时、24 小时、3 天或永久有效
- 🎨 **主题切换**：支持亮色和暗色模式
- 📱 **响应式设计**：完美适配桌面和移动设备
- 🔄 **自动清理**：自动清理过期的邮箱、邮件、卡密与临时账号（可定时触发、可配置）
- 📱 **PWA 支持**：支持 PWA 安装
- 💸 **免费自部署**：基于 Cloudflare 构建, 可实现免费自部署，无需任何费用
- 🎉 **优雅的 UI**：简洁优雅的夕阳主题 UI 界面
- 📤 **发件功能**：支持使用临时邮箱发送邮件，基于 Resend 服务
- 🔔 **Webhook 通知**：支持通过 webhook 接收新邮件通知
- 🛡️ **权限系统**：支持基于角色的权限控制系统
- 🔑 **OpenAPI**：支持通过 API Key 访问 OpenAPI
- 🎫 **卡密系统**：支持通过卡密快速创建临时账号，跳过注册流程

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

## 本地运行

### 前置要求

- Node.js 18+
- Pnpm
- Wrangler CLI
- Cloudflare 账号

### 安装

1. 克隆仓库：

```bash
git clone https://github.com/xiyangone/xymail.git
cd xymail
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
   - `CUSTOM_DOMAIN`: 网站自定义域名，用于访问 XiYang Mail (可选， 如果不填, 则会使用 Cloudflare Pages 默认域名)
   - `PROJECT_NAME`: Pages 项目名 （可选，如果不填，则为 xymail）
   - `DATABASE_NAME`: D1 数据库名称 (可选，如果不填，则为 xymail-db)
   - `KV_NAMESPACE_NAME`: Cloudflare KV namespace 名称，用于存储网站配置 （可选，如果不填，则为 xymail-kv）

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

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/xiyangone/xymail)

## 邮箱域名配置

在 XiYang Mail 个人中心页面，可以配置网站的邮箱域名，支持多域名配置，多个域名用逗号分隔
![邮箱域名配置](https://pic.otaku.ren/20241227/AQAD88AxG67zeVd-.jpg "邮箱域名配置")

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
- 如果 Catch-All 状态不可用(一直 loading)，请点击`路由规则`旁边的`目标地址`, 进去绑定一个邮箱

## 权限系统

本项目采用基于角色的权限控制系统（RBAC）。

### 角色配置

新用户默认角色由皇帝在个人中心的网站设置中配置：

- 公爵：新用户将获得临时邮箱、Webhook 配置权限以及 API Key 管理权限
- 骑士：新用户将获得临时邮箱和 Webhook 配置权限
- 平民：新用户无任何权限，需要等待皇帝册封为骑士或公爵

### 角色等级

系统包含五个角色等级：

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

4. **平民（Civilian）**

   - 普通用户
   - 无任何权限
   - 可以被皇帝册封为骑士或者公爵

5. **临时用户（Temp User）**
   - 通过卡密创建的临时账号
   - 只能接收邮件，无法发送邮件
   - 无法删除或修改绑定的邮箱地址
   - 账号有效期默认 7 天（在“清理与到期策略”页面配置），到期自动删除

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

- ⚠️ 仅皇帝可用的管理操作：用户管理、卡密管理、网站设置（基础信息）、清理与到期策略（清理开关与默认天数）、邮箱域名配置

## 卡密系统

XiYang Mail 支持通过卡密快速创建临时账号，用户可以跳过注册流程直接获得临时邮箱访问权限。

### 功能特性

- 🎫 **快速入门**：通过卡密跳过注册，直接获得临时账号
- 📧 **邮箱绑定**：每个卡密绑定特定邮箱地址，无法更改
- ⏰ **自动过期**：临时账号默认 7 天（可配置），到期自动删除
- 🔒 **权限限制**：只能接收邮件，无法发送邮件或删除邮箱
- 📅 到期对齐：激活卡密时创建的邮箱到期与该卡密一致

- 🛡️ **安全管控**：管理员可以生成、查看和删除卡密

### 卡密格式

卡密采用统一格式：`XYMAIL-XXXX-XXXX-XXXX`

### 管理员功能

**皇帝**角色可以在 `/admin/card-keys` 页面管理卡密：

1. **生成卡密**

   - 输入绑定的邮箱地址
   - 设置过期天数（默认 7 天，可在“清理与到期策略”中修改默认值）
   - 支持批量生成
   - 自动下载生成的卡密列表
   - 邮箱唯一策略：邮箱为全局唯一；若目标邮箱已被占用将禁止生成；若被皇帝占用可选择“自动释放后生成”（默认开启，可在对话框中关闭）
   - 接口参数：`autoReleaseEmperorOwned`（可选，默认 `true`）
   - 成功返回：`{ success, message, cardKeys, warnings? }`（warnings 为皇帝占用时的提示，可能为空数组）
   - 失败返回：`{ error, occupiedBy? }`（当被其他用户占用时，附上 `occupiedBy[{ address, username? }]` 便于清理）

2. **卡密管理**

   - 查看所有卡密列表
   - 显示卡密状态（未使用/已使用/已过期）
   - 一键复制卡密到剪贴板
   - 删除卡密：支持删除未使用及已使用的卡密（已使用会二次确认，并级联清理关联的临时账户/用户）

3. **自动清理**
   - 系统会自动清理过期的临时账号
   - 支持手动触发清理操作
   - 可配置定时清理任务

### 用户使用流程

1. **获取卡密**

   - 从管理员处获得卡密

2. **卡密登录**

   - 访问登录页面
   - 切换到"卡密登录"标签
   - 输入卡密并登录

3. **使用临时账号**
   - 自动创建临时账号并绑定邮箱
   - 只能接收邮件到绑定的邮箱地址
   - 无法创建新邮箱或发送邮件
   - 到期后账号自动删除（默认 7 天，可配置）

### 权限限制

临时用户的权限受到严格限制：

- ✅ **可以做的**：

  - 接收邮件到绑定的邮箱地址
  - 查看收到的邮件内容
  - 查看邮箱列表（仅显示绑定邮箱）

- ❌ **不能做的**：
  - 创建新的邮箱地址
  - 删除或修改绑定的邮箱
  - 发送邮件
  - 配置 Webhook
  - 创建 API Key
  - 访问管理功能

### 自动清理机制

系统提供自动清理过期临时账号的功能：

1. **API 清理**

   - 提供 `/api/cleanup/temp-accounts` 接口（GET/POST 均可）
   - 支持手动调用，一次性清理过期临时账号、卡密与邮箱

   - 示例：

     ```bash
     curl -X GET https://<你的域名>/api/cleanup/temp-accounts
     ```

     响应示例：

     ```json
     {
       "success": true,
       "cleanedTempAccounts": 2,
       "cleanedExpiredCardKeys": 5,
       "cleanedExpiredEmails": 3,
       "includeUsedExpired": true,
       "deleteExpiredUnused": true,
       "deleteExpiredEmails": true
     }
     ```

2. **定时清理**

   - 可配置 Cloudflare Worker 或 Cloudflare Pages Scheduled Triggers 定时任务
   - 周期性自动清理过期的临时账号、卡密与邮箱
   - 清理时会级联删除相关用户数据与消息

   **定时规则说明与绑定差异**

   - Cron 表达式 `*/30 * * * *` 表示每小时的 `00` 与 `30` 分触发（按 UTC），不是“自部署开始每隔 30 分钟”
   - 如需整点触发用 `0 * * * *`
   - temp-account-cleanup Worker 仅通过 HTTP 调用 `SITE_URL + /api/cleanup/temp-accounts`，不直接访问数据库，因此“无需”绑定 D1
   - 直连 D1 的清理 Worker（如邮箱直连清理方案）才需要在 Worker 绑定 D1 数据库
   - SITE_URL 建议指向站点根域（例如 `https://xiyangone.online`），接口路径固定为 `/api/cleanup/temp-accounts`

3. **配置定时任务**

   ```bash
   # 复制配置文件
   cp wrangler.temp-cleanup.example.json wrangler.temp-cleanup.json

   # 修改配置中的 SITE_URL
   # 部署定时清理 Worker
   wrangler deploy --config wrangler.temp-cleanup.json
   ```

   **或使用 Cloudflare Pages 的 Scheduled Triggers（推荐）**

   1. 进入 Cloudflare Dashboard → Pages → 你的项目 → Triggers → Scheduled Triggers
   2. 新建 Cron 规则（示例：每小时 `0 * * * *`，或每 30 分钟 `*/30 * * * *`）
   3. 请求地址：`https://你的域名/api/cleanup/temp-accounts`（GET 即可）
   4. 保存后生效。建议在非高峰时段运行。

   可选安全加固：

   - 使用 Cloudflare Access 保护该路径，仅允许服务账户访问
   - 或在 WAF/防火墙中限制来源 IP（Pages 触发为平台内部流量通常安全）

### 注意事项

- 🔐 **安全性**：卡密一次性使用，使用后无法重复使用
- ⏰ **有效期**：临时账号默认 7 天，可在“清理与到期策略”中配置
- 📧 **邮箱绑定**：每个卡密只能绑定一个邮箱地址
- 🗑️ **自动清理**：过期账号会被自动删除，无法恢复
- 👑 **管理权限**：只有皇帝角色可以生成和管理卡密
- ❗ 卡密登录错误或未填写时：前端会弹出提示弹窗，并展示“管理员联系方式”（来源：个人中心 → 网站设置 → 管理员联系方式），便于联系获取卡密。

### 卡密登录（Credentials）调试指南（Cloudflare）

> 适用于 Cloudflare Pages/Workers（Edge 运行时）+ NextAuth.js。若登录后 `/api/auth/session` 返回 `null` 或回调提示 `Configuration`，请按以下步骤排查。

1. 环境与域名一致性

- 确保用于访问的域名（推荐主域，如 `https://xiyangone.online`）对应的部署“Functions 运行时”中已设置：`AUTH_SECRET`（或 `NEXTAUTH_SECRET`）。
- 若你有多个域（如 dpdns.org），每个域的对应部署都要分别配置 `AUTH_SECRET`，Cookie 不能跨域共享。
- 可选但推荐：设置 `NEXTAUTH_URL=https://你的主域`，并在 NextAuth 配置启用 `trustHost: true`（本项目已启用）。

2. 清理/隔离 Cookie 干扰

- 使用隐身窗口或清理这两个 Cookie：`__Secure-authjs.callback-url`、`__Host-authjs.csrf-token`。
- 先访问 `https://你的主域/api/auth/csrf`，确认返回 `{ csrfToken: "..." }`，并在“该域”出现 csrf Cookie。

3. 执行卡密登录并检查回调

- 登录页选择“卡密登录”，输入卡密提交。
- 打开浏览器 Network 面板，检查 `/api/auth/callback/credentials`：
  - `:authority` 必须是你的主域（例如 xiyangone.online），不是其它域。
  - 响应应为 `200`，并且响应头应包含 `Set-Cookie`（例如 `__Host-authjs.session-token=...; Path=/; Secure;`）。
  - 若无 `Set-Cookie`，通常表示未签发会话（多为 `AUTH_SECRET` 缺失/不可读导致的 `Configuration`）。

4. 查看 session

- 打开 `https://你的主域/api/auth/session`，应返回包含 `user.id / user.username / roles` 等字段的 JSON。
- 若仍为 `null`：
  - 回到上一步确认回调是否带了 `Set-Cookie`；
  - 确认浏览器是否保存了 Cookie（Application → Cookies）。

5. 启用服务端日志（已内置）

- 本项目在 `app/lib/auth.ts` 中已临时加入 NextAuth `logger`：会在 Cloudflare Functions 日志打印 `[auth.error] / [auth.warn] / [auth.debug]`；
- 观察 `/api/auth/callback/credentials` 调用时的函数日志，定位是否出现 `Configuration` 或签发失败的堆栈；稳定后可移除或降级日志级别。

6. 常见问题

- `Configuration`：90% 为 `AUTH_SECRET` 未在“当前域的 Functions 运行时”可用；确保是在 Production 环境而非仅 Preview；并重新部署。
- 多域混淆：浏览器保存了指向其他域的 `__Secure-authjs.callback-url`，导致回调写到别的域，主域读不到会话 → 用隐身窗口或清理上述 Cookie。
- `net::ERR_BLOCKED_BY_CLIENT`：多为浏览器扩展拦截（如广告/统计脚本，Cloudflare Insights）。与登录无关，可忽略或在浏览器禁用该扩展；若在 Cloudflare 后台启用了 Web Analytics，可临时关闭以避免噪声。

7. 实现细节（本项目）

- 卡密登录合并在 `Credentials` Provider 的 `authorize` 分支中，前端使用：

  ```tsx
  await signIn("credentials", { cardKey, redirect: false, callbackUrl: "/" });
  ```

- 服务端环境变量读取：优先 `process.env`，其次 `getRequestContext().env`，确保 Edge 运行时可读密钥。
- Session 策略：`jwt`，并在 `jwt/session` 回调中将 `token.id/username/image` 等绑定到本地用户并附加角色。

## 系统设置

系统设置存储在 Cloudflare KV 中，包括以下内容：

- `DEFAULT_ROLE`: 新注册用户默认角色，可选值为 `CIVILIAN`、`KNIGHT`、`DUKE`
- `EMAIL_DOMAINS`: 支持的邮箱域名，多个域名用逗号分隔
- `ADMIN_CONTACT`: 管理员联系方式
- `MAX_EMAILS`: 每个用户可创建的最大邮箱数量
- `CLEANUP_DELETE_USED_EXPIRED_CARD_KEYS`: 是否在自动清理中删除“已使用且已过期”的卡密，`true/false`，默认 `true`
- `CLEANUP_DELETE_EXPIRED_EMAILS`: 是否自动清理“已过期邮箱”（会级联删除其消息），`true/false`，默认 `true`
- `CLEANUP_DELETE_EXPIRED_UNUSED_CARD_KEYS`: 是否删除“过期未使用”的卡密，`true/false`，默认 `true`
- `CARD_KEY_DEFAULT_DAYS`: 卡密默认有效期（天），数值，默认 `7`

- 注释实践（可选）：Cloudflare KV 不支持原生注释，如需备注某键的含义/使用范围，可额外维护一条以 `COMMENT__` 为前缀的键，例如：
  - `COMMENT__CLEANUP_DELETE_USED_EXPIRED_CARD_KEYS`
  - `COMMENT__CLEANUP_DELETE_EXPIRED_UNUSED_CARD_KEYS`
  - `COMMENT__CLEANUP_DELETE_EXPIRED_EMAILS`
    这些注释键的值仅作为说明文本，无业务逻辑影响。

**皇帝**角色可以在个人中心页面设置

### 配置界面：独立折叠 + 状态记忆

- 个人中心的配置模块（网站设置、Resend 发件服务、角色管理、API Keys、Webhook）均支持“独立折叠/展开”，互不影响。
- 展开状态通过浏览器 localStorage 记忆（按模块分别记录），下次进入将沿用上次的展开/收起状态。
- 网站设置卡片头部提供“清理与到期策略”直达按钮，进入 `/admin/settings/cleanup` 管理清理策略开关与默认到期天数。

## 管理后台：分类查看功能

为提升管理效率，管理后台新增“分类查看/状态筛选”能力：

### 用户管理分类查看（/admin/users）

- 分类维度：按用户角色筛选（皇帝、公爵、骑士、平民、临时用户）
- 交互方式：顶部 Tabs 切换，实时过滤用户列表
- 辅助信息：展示当前分类的用户数量
- 适用场景：快速查找特定权限等级的用户，便于批量巡检与授权
- 搜索 + 筛选：在角色筛选基础上，支持按用户名/username/邮箱关键字模糊搜索，任一条件变化自动回到第 1 页
- 分页：支持 10/20/50 每页切换与上一页/下一页；底部展示“第 X / Y 页”和“显示 a-b / total”
- 布局优化：采用 table-fixed 与列宽约束，邮箱列自动截断，到期时间列紧凑，避免右侧空白过大

快速验证：

- 切换角色：进入“用户管理”页面 → 点击不同角色标签（含“全部”）→ 列表与数量应随之变化
- 搜索联动：在“搜索用户名/邮箱”输入关键词，列表应实时过滤；随后切换角色，搜索条件仍生效
- 分页：将“每页”调整为 10/20/50 并点击“上一页/下一页”，统计与页码正确，显示区间 a-b / total 正确

### 卡密管理分类查看（/admin/card-keys）

- 分类维度：按卡密状态筛选（全部、未使用、已使用、已过期）
- 交互方式：顶部 Tabs 切换
- 搜索 + 筛选：在状态筛选基础上，支持按“卡密码/绑定邮箱/使用者（姓名或用户名）”模糊搜索；任一条件变化自动回到第 1 页
- 分页：支持 10/20/50 每页切换与上一页/下一页；顶部展示“显示 a-b / total”，底部展示“第 X / Y 页”
- 状态标识：
  - 未使用：默认样式
  - 已使用：次要样式
  - 已过期：红色“已过期”标识
- 适用场景：快速定位未使用卡密进行分发，或筛选已使用/已过期卡密进行清理

快速验证：

- 切换状态：进入“卡密管理”页面 → 切换“未使用/已使用/已过期/全部”，卡片与数量随之变化
- 搜索联动：在“搜索卡密/邮箱/使用者”输入关键字，列表应实时过滤；随后切换状态，搜索条件仍生效
- 分页：调整“每页”到 10/20/50 并点击“上一页/下一页”，区间 a-b 与页码正确

- 布局优化：通过重新分配列宽比例（用户 22% / 邮箱 26% / 角色 16% / 到期时间 18% / 操作 12%）并控制单元格最大宽度（邮箱 200px），无需横向滚动；操作列最小宽度 180px，选择器触发宽度收窄，避免删除按钮被裁剪或换行。

> 说明：该功能仅涉及前端筛选与展示逻辑，不改变后端接口与数据结构，安全、可回滚。

## 发件功能

XiYang Mail 支持使用临时邮箱发送邮件，基于 [Resend](https://resend.com/) 服务。

### 功能特性

- 📨 **临时邮箱发件**：可以使用创建的临时邮箱作为发件人发送邮件
- 🎯 **角色权限控制**：不同角色有不同的每日发件限制
- 💌 **支持 HTML**：支持发送富文本格式邮件

### 角色发件权限

| 角色                 | 每日发件限制 | 说明                    |
| -------------------- | ------------ | ----------------------- |
| 皇帝 (Emperor)       | 无限制       | 网站管理员，无发件限制  |
| 公爵 (Duke)          | 5 封/天      | 默认每日可发送 5 封邮件 |
| 骑士 (Knight)        | 2 封/天      | 默认每日可发送 2 封邮件 |
| 平民 (Civilian)      | 禁止发件     | 无发件权限              |
| 临时用户 (Temp User) | 禁止发件     | 卡密用户无发件权限      |

> 💡 **提示**：皇帝可以在个人中心的邮件服务配置中自定义公爵和骑士的每日发件限制。

### 配置发件服务

1. **获取 Resend API Key**

   - 访问 [Resend 官网](https://resend.com/) 注册账号
   - 在控制台创建 API Key，并复制一个以 `re_` 开头的 Key
   - 复制 Key 备用（稍后粘贴到系统中）

2. **验证并启用发件域名（必做）**

   - 打开 https://resend.com/domains 添加你的发件域名（如 `xiyangone.online`）
   - 按指引在 DNS（Cloudflare）添加/校验 SPF 与 DKIM 记录
   - 等待状态变为 Verified；未验证将导致错误：`The domain is not verified`

3. **配置发件服务**

   - 皇帝角色登录 XiYang Mail
   - 进入个人中心页面
   - 在"Resend 发件服务配置"部分：
     - 启用发件服务开关
     - 粘贴以 `re_` 开头的 Resend API Key
     - 设置公爵和骑士的每日发件限制（可选）
   - 点击保存配置

4. **验证配置**
   - 点击“验证 API Key”按钮，看到成功提示即表示 Key 可用
   - 邮箱列表页会出现“发送邮件”按钮；若仍提示 `The domain is not verified`，回到步骤 2 完成域名验证

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
  "toAddress": "your-email@xiyang.app"
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
  "emailDomains": "xiyang.app,example.com",
  "adminContact": "admin@example.com",
  "maxEmails": "10",
  "cleanupDeleteUsedExpiredCardKeys": "true",
  "cleanupDeleteExpiredEmails": "true",
  "cardKeyDefaultDays": "7"
}
```

响应字段说明：

- `defaultRole`: 新用户默认角色，可选值：`CIVILIAN`（平民）、`KNIGHT`（骑士）、`DUKE`（公爵）
- `emailDomains`: 支持的邮箱域名，多个域名用逗号分隔

#### 

```http
GET /api/cleanup/temp-accounts
```



```json
{
  "success": true,
  "message": "清理了 2 个过期临时账号，删除了 5 个过期卡密（含已使用=true），清理了 3 个过期邮箱",
  "cleanedTempAccounts": 2,
  "cleanedExpiredCardKeys": 5,
  "cleanedExpiredEmails": 3,
  "includeUsedExpired": true,
  "deleteExpiredEmails": true
}
```



- `includeUsedExpired` 
- `deleteExpiredEmails` 

- `adminContact`: 管理员联系方式
- `maxEmails`: 每个用户可创建的最大邮箱数量
- `cleanupDeleteUsedExpiredCardKeys`: 是否清理“已使用且过期”的卡密（字符串 "true"/"false"）
- `cleanupDeleteExpiredEmails`: 是否清理“已过期邮箱”（字符串 "true"/"false"）
- `cardKeyDefaultDays`: 卡密默认有效期（天），用于未显式传入 expiryDays 时的默认值（字符串数字）

#### 创建临时邮箱

```http
POST /api/emails/generate
Content-Type: application/json

{
  "name": "test",
  "expiryTime": 3600000,
  "domain": "moemail.app"
}
```

参数说明：

- `name`: 邮箱前缀，可选
- `expiryTime`: 有效期（毫秒），可选值：3600000（1 小时）、86400000（1 天）、604800000（7 天）、0（永久）
- `domain`: 邮箱域名，可通过 `/api/config` 接口获取

返回响应：

```json
{
  "id": "email-uuid-123",
  "email": "test@xiyang.app"
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
      "address": "test@xiyang.app",
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
- `html`: 邮件 HTML 内容
- `received_at`: 接收时间（时间戳）

### 使用示例

使用 curl 创建临时邮箱：

```bash
curl -X POST https://your-domain.com/api/emails/generate \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test",
    "expiryTime": 3600000,
    "domain": "xiyang.app"
  }'
```

使用 JavaScript 获取邮件列表：

```javascript
const res = await fetch("https://your-domain.com/api/emails/your-email-id", {
  headers: {
    "X-API-Key": "YOUR_API_KEY",
  },
});
const data = await res.json();
```

## 环境变量

本项目使用以下环境变量：

### 认证相关

- `AUTH_GITHUB_ID`: GitHub OAuth App ID
- `AUTH_GITHUB_SECRET`: GitHub OAuth App Secret
- `AUTH_SECRET`: NextAuth Secret，用来加密 session，请设置一个随机字符串

### Cloudflare 配置

- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID
- `DATABASE_NAME`: D1 数据库名称
- `DATABASE_ID`: D1 数据库 ID (可选, 如果不填, 则会自动通过 Cloudflare API 获取)
- `KV_NAMESPACE_NAME`: Cloudflare KV namespace 名称，用于存储网站配置
- `KV_NAMESPACE_ID`: Cloudflare KV namespace ID，用于存储网站配置 （可选， 如果不填, 则会自动通过 Cloudflare API 获取）
- `CUSTOM_DOMAIN`: 网站自定义域名, 如：xiyang.app (可选， 如果不填, 则会使用 Cloudflare Pages 默认域名)
- `PROJECT_NAME`: Pages 项目名 （可选，如果不填，则为 xymail）

## Github OAuth App 配置

- 登录 [Github Developer](https://github.com/settings/developers) 创建一个新的 OAuth App
- 生成一个新的 `Client ID` 和 `Client Secret`
- 设置 `Application name` 为 `<your-app-name>`
- 设置 `Homepage URL` 为 `https://<your-domain>`
- 设置 `Authorization callback URL` 为 `https://<your-domain>/api/auth/callback/github`

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
      添加微信，备注 "XiYang Mail" 拉你进微信交流群
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
