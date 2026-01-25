import { createDb } from "@/lib/db"
import { messageShares, messages, emails } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getUserId } from "@/lib/apiKey"


// 删除消息分享链接
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string; shareId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: emailId, messageId, shareId } = await params
  const db = createDb()

  try {
    // 验证邮箱所有权
    const email = await db.query.emails.findFirst({
      where: and(eq(emails.id, emailId), eq(emails.userId, userId))
    })

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // 获取消息并验证
    const message = await db.query.messages.findFirst({
      where: and(eq(messages.id, messageId), eq(messages.emailId, emailId))
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // 删除分享记录
    await db.delete(messageShares).where(
      and(eq(messageShares.id, shareId), eq(messageShares.messageId, messageId))
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete message share:", error)
    return NextResponse.json(
      { error: "Failed to delete share" },
      { status: 500 }
    )
  }
}

