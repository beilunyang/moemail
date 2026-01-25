import { createDb } from "@/lib/db"
import { emailShares, emails } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getUserId } from "@/lib/apiKey"


// 删除分享链接
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: emailId, shareId } = await params
  const db = createDb()

  try {
    // 验证邮箱所有权
    const email = await db.query.emails.findFirst({
      where: and(eq(emails.id, emailId), eq(emails.userId, userId))
    })

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    // 删除分享记录
    await db.delete(emailShares).where(
      and(eq(emailShares.id, shareId), eq(emailShares.emailId, emailId))
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete email share:", error)
    return NextResponse.json(
      { error: "Failed to delete share" },
      { status: 500 }
    )
  }
}

