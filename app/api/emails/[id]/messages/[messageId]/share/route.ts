import { createDb } from "@/lib/db"
import { messageShares, messages, emails } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getUserId } from "@/lib/apiKey"
import { nanoid } from "nanoid"


// 获取消息的所有分享链接
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: emailId, messageId } = await params
  const db = createDb()

  try {
    // 验证邮箱所有权
    const email = await db.query.emails.findFirst({
      where: and(eq(emails.id, emailId), eq(emails.userId, userId))
    })

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // 获取消息
    const message = await db.query.messages.findFirst({
      where: and(eq(messages.id, messageId), eq(messages.emailId, emailId))
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // 获取该消息的所有分享链接
    const shares = await db.query.messageShares.findMany({
      where: eq(messageShares.messageId, messageId),
      orderBy: (messageShares, { desc }) => [desc(messageShares.createdAt)]
    })

    return NextResponse.json({ shares, total: shares.length })
  } catch (error) {
    console.error("Failed to fetch message shares:", error)
    return NextResponse.json(
      { error: "Failed to fetch shares" },
      { status: 500 }
    )
  }
}

// 创建新的消息分享链接
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: emailId, messageId } = await params
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

    // 解析请求体
    const body = await request.json() as { expiresIn: number }
    const { expiresIn } = body // expiresIn 单位为毫秒，0表示永久

    // 生成简短的分享token (16个字符)
    const token = nanoid(16)

    // 计算过期时间
    let expiresAt = null
    if (expiresIn && expiresIn > 0) {
      expiresAt = new Date(Date.now() + expiresIn)
    }

    // 创建分享记录
    const [share] = await db.insert(messageShares).values({
      messageId,
      token,
      expiresAt
    }).returning()

    return NextResponse.json(share, { status: 201 })
  } catch (error) {
    console.error("Failed to create message share:", error)
    return NextResponse.json(
      { error: "Failed to create share" },
      { status: 500 }
    )
  }
}

