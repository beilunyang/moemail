import { createDb } from "@/lib/db"
import { emailShares } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"


// 通过分享token获取邮箱信息
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const db = createDb()

  try {
    // 查找分享记录
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

    return NextResponse.json({
      email: {
        id: share.email.id,
        address: share.email.address,
        createdAt: share.email.createdAt,
        expiresAt: share.email.expiresAt
      }
    })
  } catch (error) {
    console.error("Failed to fetch shared email:", error)
    return NextResponse.json(
      { error: "Failed to fetch shared email" },
      { status: 500 }
    )
  }
}

