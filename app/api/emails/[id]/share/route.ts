import { createDb } from "@/lib/db"
import { emailShares, emails } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getUserId } from "@/lib/apiKey"
import { nanoid } from "nanoid"


// 获取邮箱的所有分享链接
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: emailId } = await params
  const db = createDb()

  try {
    // 验证邮箱所有权
    const email = await db.query.emails.findFirst({
      where: and(eq(emails.id, emailId), eq(emails.userId, userId))
    })

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    // 获取该邮箱的所有分享链接
    const shares = await db.query.emailShares.findMany({
      where: eq(emailShares.emailId, emailId),
      orderBy: (emailShares, { desc }) => [desc(emailShares.createdAt)]
    })

    return NextResponse.json({ shares, total: shares.length })
  } catch (error) {
    console.error("Failed to fetch email shares:", error)
    return NextResponse.json(
      { error: "Failed to fetch shares" },
      { status: 500 }
    )
  }
}

// 创建新的分享链接
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: emailId } = await params
  const db = createDb()

  try {
    // 验证邮箱所有权
    const email = await db.query.emails.findFirst({
      where: and(eq(emails.id, emailId), eq(emails.userId, userId))
    })

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
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
    const [share] = await db.insert(emailShares).values({
      emailId,
      token,
      expiresAt
    }).returning()

    return NextResponse.json(share, { status: 201 })
  } catch (error) {
    console.error("Failed to create email share:", error)
    return NextResponse.json(
      { error: "Failed to create share" },
      { status: 500 }
    )
  }
}

