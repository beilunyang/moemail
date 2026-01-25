import { createDb } from "@/lib/db"
import { messageShares, messages } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"


// 通过分享token获取消息详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const db = createDb()

  try {
    // 验证分享token
    const share = await db.query.messageShares.findFirst({
      where: eq(messageShares.token, token)
    })

    if (!share) {
      return NextResponse.json(
        { error: "Share link not found or disabled" },
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

    // 获取消息详情
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, share.messageId)
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

