import { NextResponse } from "next/server"
import { getUserId } from "@/lib/apiKey"
import { createDb } from "@/lib/db"
import { emails, messages } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { checkSendPermission } from "@/lib/send-permissions"
import {
  CATCHALL_EMAIL_KEY,
  getEmailDomain,
  isValidMailboxName,
  normalizeEmailAddress,
  normalizeMailboxName,
  parseCatchAllEmailConfig,
} from "@/lib/catch-all"
import { getUserRole } from "@/lib/auth"
import { ROLES } from "@/lib/permissions"
import { getResendConfigForAddress, loadResendConfig } from "@/lib/resend"

export const runtime = "edge"

interface SendEmailRequest {
  to: string
  subject: string
  content: string
  fromLocalPart?: string
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
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      )
    }

    const { id } = await params
    const db = createDb()

    const { to, subject, content, fromLocalPart } = await request.json() as SendEmailRequest

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

    if (email.userId !== userId) {
      return NextResponse.json(
        { error: "无权访问此邮箱" },
        { status: 403 }
      )
    }

    const env = getRequestContext().env
    const [{ config: resendConfig }, catchAllConfigValue] = await Promise.all([
      loadResendConfig(env.SITE_CONFIG),
      env.SITE_CONFIG.get(CATCHALL_EMAIL_KEY),
    ])
    const domainResendConfig = getResendConfigForAddress(resendConfig, email.address)

    if (!domainResendConfig?.enabled || !domainResendConfig.apiKey) {
      return NextResponse.json(
        { error: "该邮箱域名未启用 Resend 发件服务" },
        { status: 403 }
      )
    }

    const permissionResult = await checkSendPermission(userId)
    if (!permissionResult.canSend) {
      return NextResponse.json(
        { error: permissionResult.error },
        { status: 403 }
      )
    }

    const remainingEmails = permissionResult.remainingEmails
    let fromAddress = normalizeEmailAddress(email.address)

    if (fromLocalPart !== undefined) {
      const catchAllConfig = parseCatchAllEmailConfig(catchAllConfigValue)
      const isConfiguredCatchAll = Object.values(catchAllConfig).some(
        ({ address }) => normalizeEmailAddress(address) === fromAddress,
      )
      const userRole = await getUserRole(userId)

      if (!isConfiguredCatchAll || userRole !== ROLES.EMPEROR) {
        return NextResponse.json(
          { error: "只有皇帝可以修改 Catch-all 发件邮箱前缀" },
          { status: 403 },
        )
      }

      const normalizedLocalPart = normalizeMailboxName(fromLocalPart)
      const domain = getEmailDomain(fromAddress)
      if (!domain || !isValidMailboxName(normalizedLocalPart)) {
        return NextResponse.json(
          { error: "发件邮箱前缀格式无效" },
          { status: 400 },
        )
      }

      fromAddress = `${normalizedLocalPart}@${domain}`
    }

    await sendWithResend(to.trim(), subject.trim(), content, fromAddress, { apiKey: domainResendConfig.apiKey })

    await db.insert(messages).values({
      emailId: email.id,
      fromAddress,
      toAddress: to.trim(),
      subject: subject.trim(),
      content: '',
      type: "sent",
      html: content,
      isRead: true,
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
