# Forward Email 接入方案

## 概述

Forward Email 是一个开源的邮件转发服务，可以为您的临时邮箱系统提供邮件接收和发送功能。

## 接入方案

### 方案一：邮件接收服务（推荐）

#### 1. DNS 配置

在您的域名 DNS 中添加以下记录：

```
# MX 记录
@ MX 10 mx1.forwardemail.net
@ MX 20 mx2.forwardemail.net

# TXT 记录（用于验证和转发规则）
@ TXT "forward-email=https://yourdomain.com/api/webhooks/forward-email"
```

#### 2. 创建 Webhook 接收端点

```typescript
// app/api/webhooks/forward-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { messages, emails } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // 验证 Webhook 签名（可选，增强安全性）
    const signature = request.headers.get('x-forward-email-signature');
    if (!verifySignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { to, from, subject, text, html, attachments } = payload;
    
    // 查找对应的邮箱记录
    const db = createDb();
    const email = await db.query.emails.findFirst({
      where: eq(emails.address, to),
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // 存储邮件到数据库
    await db.insert(messages).values({
      emailId: email.id,
      from,
      to,
      subject,
      text,
      html,
      attachments: JSON.stringify(attachments || []),
      receivedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forward Email webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function verifySignature(payload: any, signature: string | null): boolean {
  // 实现签名验证逻辑
  // 使用您的 Forward Email API 密钥验证请求
  return true; // 简化示例
}
```

#### 3. 动态别名管理

```typescript
// lib/forward-email.ts
export class ForwardEmailService {
  private apiToken: string;
  private baseUrl = 'https://api.forwardemail.net/v1';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  async createAlias(domain: string, name: string, recipients: string[]) {
    const response = await fetch(`${this.baseUrl}/domains/${domain}/aliases`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        recipients,
        is_enabled: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create alias: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteAlias(domain: string, aliasId: string) {
    const response = await fetch(`${this.baseUrl}/domains/${domain}/aliases/${aliasId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete alias: ${response.statusText}`);
    }

    return response.json();
  }
}
```

#### 4. 集成到卡密激活流程

```typescript
// 在 activateCardKey 函数中添加
import { ForwardEmailService } from '@/lib/forward-email';

export async function activateCardKey(code: string) {
  // ... 现有逻辑 ...

  // 创建 Forward Email 别名
  const forwardEmailService = new ForwardEmailService(process.env.FORWARD_EMAIL_API_TOKEN!);
  
  try {
    await forwardEmailService.createAlias(
      'yourdomain.com',
      cardKey.emailAddress.split('@')[0],
      [`https://yourdomain.com/api/webhooks/forward-email`]
    );
  } catch (error) {
    console.error('Failed to create Forward Email alias:', error);
    // 可以选择是否要回滚整个操作
  }

  // ... 其余逻辑 ...
}
```

### 方案二：邮件发送服务

#### SMTP 配置

```typescript
// lib/email-sender.ts
import nodemailer from 'nodemailer';

export const createForwardEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: 'smtp.forwardemail.net',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.FORWARD_EMAIL_USERNAME,
      pass: process.env.FORWARD_EMAIL_PASSWORD,
    },
  });
};

export async function sendEmail(from: string, to: string, subject: string, content: string) {
  const transporter = createForwardEmailTransporter();
  
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html: content,
  });

  return info;
}
```

## 环境变量配置

在 `.env.local` 中添加：

```env
FORWARD_EMAIL_API_TOKEN=your_api_token_here
FORWARD_EMAIL_USERNAME=your_username
FORWARD_EMAIL_PASSWORD=your_password
FORWARD_EMAIL_DOMAIN=yourdomain.com
```

## 优势

1. **开源免费**：Forward Email 是开源项目，基础功能免费
2. **隐私保护**：注重隐私，不存储邮件内容
3. **API 丰富**：提供完整的 REST API 用于管理
4. **可靠性高**：专业的邮件基础设施
5. **易于集成**：与现有系统集成简单

## 注意事项

1. **域名验证**：需要验证域名所有权
2. **发送限制**：免费版可能有发送限制
3. **监控日志**：建议监控 Webhook 接收状态
4. **错误处理**：实现完善的错误处理和重试机制
