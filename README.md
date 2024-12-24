<p align="center">
  <img src="public/icons/icon-192x192.png" alt="MoeMail Logo" width="100" height="100">
  <h1 align="center">MoeMail</h1>
</p>

<p align="center">
  一个基于 NextJS + Cloudflare 技术栈构建的可爱临时邮箱服务🎉
</p>

<p align="center">
  <a href="#在线演示">在线演示</a> •
  <a href="#特性">特性</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#本地运行">本地运行</a> •
  <a href="#部署">部署</a> •
  <a href="#Webhook 集成">Webhook 集成</a> •
  <a href="#环境变量">环境变量</a> •
  <a href="#Github OAuth App 配置">Github OAuth App 配置</a> •
  <a href="#贡献">贡献</a> •
  <a href="#许可证">许可证</a> •
  <a href="#交流群">交流群</a> •
  <a href="#支持">支持</a>
</p>

# 一、在线演示
[https://moemail.app](https://moemail.app)

![首页](https://pic.otaku.ren/20241209/AQADwsUxG9k1uVZ-.jpg "首页")


![邮箱](https://pic.otaku.ren/20241209/AQADw8UxG9k1uVZ-.jpg "邮箱")

![个人中心](https://pic.otaku.ren/20241217/AQAD9sQxG0g1EVd-.jpg "个人中心")

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
- 🔔 **Webhook 通知**：支持通过 webhook 接收新邮件通知

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
# 二、变量预览
### Github Actions Secrets 配置
|变量名|获取|示例|作用|
|--|--|--|--|
|`CLOUDFLARE_ACCOUNT_ID`|[Workers Dashboard](https://dash.cloudflare.com/?to=/:account/workers)|`5eb191067edd4db3********`|供Actions部署使用|
|`CLOUDFLARE_API_TOKEN`|[API](https://dash.cloudflare.com/profile/api-tokens)|`udfsifds***`|供Actions部署使用|
|`DATABASE_NAME`|[D1 NAME](https://dash.cloudflare.com/?to=/:account/workers/d1)|`moemail`|供Actions部署使用|
|`DATABASE_ID`|[D1 ID](https://dash.cloudflare.com/?to=/:account/workers/d1/databases)|`8c0a179b-60b5-418a-a77*-**`|供Actions部署使用|
|`NEXT_PUBLIC_EMAIL_DOMAIN`|自行输入|`moemail.app`|作为邮箱后缀|
---  
### Cloudflare 环境变量配置
|变量名|获取|示例|作用
|--|--|--|--|
|`AUTH_GITHUB_ID`| [GitHub Developers](https://github.com/settings/developers)|sdfds***|必要设置|
|`AUTH_GITHUB_SECRET`|[GitHub Developers](https://github.com/settings/developers)|sadadf***|管理员必要设置|
|`AUTH_SECRET`|随意|123456|用于验证|
---
# 三、部署
## 1. Github Actions 部署

### 部署步骤
#### Github配置
1. 点赞并fork该仓库
2. 进入fork的仓库中，点击`settings`-->`secrets and variables`-->`Actions`-->`New respository secret`添加如下变量
    - **注意**：`CLOUDFLARE_API_TOKEN`设置：`创建令牌`-->`编辑 Cloudflare Workers`-->`添加更多`-->找到`D1`-->对应权限`编辑`

|变量名|获取|示例|作用|
|--|--|--|--|
|`CLOUDFLARE_ACCOUNT_ID`|[Workers Dashboard](https://dash.cloudflare.com/?to=/:account/workers)|`5eb191067edd4db3********`|供Actions部署使用|
|`CLOUDFLARE_API_TOKEN`|[API](https://dash.cloudflare.com/profile/api-tokens)|`udfsifds***`|供Actions部署使用|
|`DATABASE_NAME`|[D1 NAME](https://dash.cloudflare.com/?to=/:account/workers/d1)|`moemail`|供Actions部署使用|
|`DATABASE_ID`|[D1 ID](https://dash.cloudflare.com/?to=/:account/workers/d1/databases)|`8c0a179b-60b5-418a-a77*-**`|供Actions部署使用|
|`NEXT_PUBLIC_EMAIL_DOMAIN`|自行输入|`moemail.app`,`b.com`|作为邮箱后缀(多个添加，以逗号隔开)|


3. 设置好后，进入仓库的 Actions 页面
    - 选择 "Deploy" workflow
    - 点击 "Run workflow"
    - 选择需要执行的部署选项
    - 点击 "Run workflow" 开始部署  
4. 等待部署完成即可（部署进度可以在仓库的 Actions 标签页查看）  
#### Cloudflare变量配置                    
5. 部署完成后，进入[cloudflare Workers and pages](https://dash.cloudflare.com/) 
6. 在 Overview 中选择刚刚部署的 Cloudflare Pages（应该是`moemail`）
7. 在 Settings 中选择变量和机密，添加如下变量

     **变量获取步骤：**   

      - 登录 [Github Developer](https://github.com/settings/developers) 创建一个新的 OAuth App
      - 生成一个新的 `Client ID` 和 `Client Secret`
      - 设置 `Application name` 为 `<your-app-name>`
      - 设置 `Homepage URL` 为 `https://<your-domain>`（该域名用于访问）
      - 设置 `Authorization callback URL` 为 `https://<your-domain>/api/auth/callback/github`
---
|变量名|获取|示例|作用
|--|--|--|--|
|`AUTH_GITHUB_ID`| [GitHub Developers](https://github.com/settings/developers)|sdfds***|管理员必要设置|
|`AUTH_GITHUB_SECRET`|[GitHub Developers](https://github.com/settings/developers)|sadadf***|管理员必要设置|
|`AUTH_SECRET`|随意|123456|用于页面验证|

#### Cloudflare邮件路由配置
8. 需要在 Cloudflare 控制台配置邮件路由，将收到的邮件转发给 Email Worker 处理。

    - 选择您的域名
    - 点击左侧菜单的 "**电子邮件**" -> "**电子邮件路由**"
    - 如果显示 “电子邮件路由当前被禁用，没有在路由电子邮件”，请点击 "启用电子邮件路由"
    ![启用电子邮件路由](https://pic.otaku.ren/20241223/AQADNcQxG_K0SVd-.jpg "启用电子邮件路由")
    - 点击后，会提示你添加电子邮件路由 DNS 记录，点击 “**添加记录并启用**” 即可
    ![添加电子邮件路由 DNS 记录](https://pic.otaku.ren/20241223/AQADN8QxG_K0SVd-.jpg "添加电子邮件路由 DNS 记录")
    - 配置路由规则：
      - Catch-all 地址: 启用 "**Catch-all**"
      - 编辑 Catch-all 地址
        - 操作: 选择 "**发送到 Worker**"
        - 目标位置: 选择刚刚部署的 "**email-receiver-worker**"
        - 保存
      ![配置路由规则](https://pic.otaku.ren/20241223/AQADNsQxG_K0SVd-.jpg "配置路由规则")
9. **注意事项**
    - 确保域名的 DNS 托管在 Cloudflare
    - Email Worker 必须已经部署成功
10.  然后回到GitHub重试部署，让所有变量生效
## 2. 本地运行与Wrangler部署

### 前置要求

- Node.js 18+
- pnpm
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
cp wrangler.example.toml wrangler.toml
cp wrangler.email.example.toml wrangler.email.toml
cp wrangler.cleanup.example.toml wrangler.cleanup.toml
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

### 调试与开发
6. 启动开发服务器：
```bash
pnpm dev
```

7. 测试邮件 worker：
目前无法本地运行并测试，请使用 wrangler 部署邮件 worker 并测试
```bash
pnpm deploy:email
```

8. 测试清理 worker：
```bash
pnpm dev:cleanup
pnpm test:cleanup
```

4. 生成 Mock 数据（邮箱以及邮件消息）
```bash
pnpm generate-test-data
```


###  本地 Wrangler 部署

1. 设置 wrangler：
```bash
cp wrangler.example.toml wrangler.toml
cp wrangler.email.example.toml wrangler.email.toml
cp wrangler.cleanup.example.toml wrangler.cleanup.toml
```
设置 Cloudflare D1 数据库名以及数据库 ID

2. 创建云端 D1 数据库表结构
```bash
pnpm db:migrate-remote
```

2. 部署主应用到 Cloudflare Pages：
```bash
pnpm deploy:pages
```

3. 部署邮件 worker：
```bash
pnpm deploy:email
```

4. 部署清理 worker：
```bash
pnpm deploy:cleanup
```
5. Cloudflare的相关配置见上述的Github Actions中关于Cloudflare的描述

# 四、Webhook 集成

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

测试服务器会在本地启动一个 HTTP 服务器，监听 3001 端口（http://localhost:3001），并打印收到的 Webhook 消息详情。

如果需要进行外网测试，可以通过 Cloudflare Tunnel 将服务暴露到外网：
```bash
pnpx cloudflared tunnel --url http://localhost:3001
```

### 注意事项
- Webhook 接口应在 10 秒内响应
- 非 2xx 响应码会触发重试




## 贡献

欢迎提交 Pull Request 或者 Issue来帮助改进这个项目

## 许可证

本项目采用 [MIT](LICENSE) 许可证

## 交流群
<img src="https://pic.otaku.ren/20241224/AQADoMExG_K0WVd-.jpg" style="width: 400px;"/>
<br />
如二维码失效，请添加我的个人微信（hansenones），并备注 “MoeMail” 加入微信交流群

## 支持

如果你喜欢这个项目，欢迎给它一个 Star ⭐️
或者进行赞助
<br />
<br />
<img src="https://pic.otaku.ren/20240212/AQADPrgxGwoIWFZ-.jpg" style="width: 400px;"/>
<br />
<br />
<a href="https://www.buymeacoffee.com/beilunyang" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" style="width: 400px;" ></a>
