import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { emails, messages, emailDomains } from "@/lib/schema" // 导入 emailDomains
import { eq } from "drizzle-orm"
// import { getRequestContext } from "@cloudflare/next-on-pages" // 移除了，因为不再从 env 获取全局 KEY
import { checkSendPermission } from "@/lib/send-permissions"

export const runtime = "edge"

interface SendEmailRequest {
  to: string
  subject: string
  content: string
}

async function sendWithResend(
  to: string,
  subject: string,
  content: string,
  fromEmail: string,
  config: { apiKey: string }
) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: content,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json() as { message?: string }
    console.error('Resend API error:', errorData)
    throw new Error(errorData.message || "Resend发送失败，请稍后重试")
  }

  return { success: true }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      )
    }

    const { id } = await params
    const db = createDb()

    // 检查全局发送权限
    const permissionResult = await checkSendPermission(session.user.id)
    if (!permissionResult.canSend) {
      return NextResponse.json(
        { error: permissionResult.error },
        { status: 403 }
      )
    }
    
    const remainingEmails = permissionResult.remainingEmails

    const { to, subject, content } = await request.json() as SendEmailRequest

    if (!to || !subject || !content) {
      return NextResponse.json(
        { error: "收件人、主题和内容都是必填项" },
        { status: 400 }
      )
    }

    const email = await db.query.emails.findFirst({
      where: eq(emails.id, id)
    })

    if (!email) {
      return NextResponse.json(
        { error: "邮箱不存在" },
        { status: 404 }
      )
    }

    if (email.userId !== session.user.id) {
      return NextResponse.json(
        { error: "无权访问此邮箱" },
        { status: 403 }
      )
    }

    // --- 新增逻辑：检查域名的 Resend 配置 ---
    const domain = email.address.split('@')[1]
    if (!domain) {
      return NextResponse.json(
        { error: "无效的邮箱地址" },
        { status: 400 }
      )
    }

    const emailDomain = await db.query.emailDomains.findFirst({
      where: eq(emailDomains.domain, domain)
    })

    // 1. 检查域名是否存在或是否启用了 Resend
    if (!emailDomain || !emailDomain.resendEnabled) {
      return NextResponse.json(
        { error: "此邮箱域名的发件功能未启用" },
        { status: 403 }
      )
    }

    // 2. 获取该域名专用的 API Key
    const apiKey = emailDomain.resendApiKey
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "此邮箱域名的 Resend 发件服务未配置 API Key，请联系管理员" },
        { status: 500 }
      )
    }
    // --- 结束新增逻辑 ---

    // 移除旧的全局 API Key 逻辑
    // const env = getRequestContext().env
    // const apiKey = await env.SITE_CONFIG.get("RESEND_API_KEY")

    // 使用从 emailDomain 获取的 apiKey
    await sendWithResend(to, subject, content, email.address, { apiKey })

    await db.insert(messages).values({
      emailId: email.id,
      fromAddress: email.address,
      toAddress: to,
      subject,
      content: '',
      type: "sent",
      html: content
    })

    return NextResponse.json({ 
      success: true,
      message: "邮件发送成功",
      remainingEmails
    })
  } catch (error) {
    console.error('Failed to send email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "发送邮件失败" },
      { status: 500 }
    )
  }
} 