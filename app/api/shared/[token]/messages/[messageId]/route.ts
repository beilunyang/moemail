import { createDb } from "@/lib/db"
import { emailShares, messages } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { NextResponse } from "next/server"


// 通过分享token获取消息详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string; messageId: string }> }
) {
  const { token, messageId } = await params
  const db = createDb()

  try {
    // 验证分享token
    const share = await db.query.emailShares.findFirst({
      where: eq(emailShares.token, token),
      with: {
        email: true
      }
    })

    if (!share) {
      return NextResponse.json(
        { error: "Share link not found or expired" },
        { status: 404 }
      )
    }

    // 检查分享是否过期
    if (share.expiresAt && share.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Share link has expired" },
        { status: 410 }
      )
    }

    // 检查邮箱是否过期
    if (share.email.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Email has expired" },
        { status: 410 }
      )
    }

    // 获取消息详情
    const message = await db.query.messages.findFirst({
      where: and(
        eq(messages.id, messageId),
        eq(messages.emailId, share.email.id)
      )
    })

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: {
        id: message.id,
        from_address: message.fromAddress,
        to_address: message.toAddress,
        subject: message.subject,
        content: message.content,
        html: message.html,
        received_at: message.receivedAt,
        sent_at: message.sentAt
      }
    })
  } catch (error) {
    console.error("Failed to fetch shared message:", error)
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    )
  }
}

