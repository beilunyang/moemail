import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { apiKeys } from "@/lib/schema"
import { NextResponse } from "next/server"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { eq, and } from "drizzle-orm"

export const runtime = "edge"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hasPermission = await checkPermission(PERMISSIONS.MANAGE_API_KEY)
  if (!hasPermission) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }
  try {
    const db = createDb()
    const session = await auth()
    const { id } = await params
    
    const result = await db.delete(apiKeys)
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.userId, session!.user.id!)
        )
      )
      .returning()

    if (!result.length) {
      return NextResponse.json(
        { error: "API Key 不存在或无权删除" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete API key:", error)
    return NextResponse.json(
      { error: "删除 API Key 失败" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hasPermission = await checkPermission(PERMISSIONS.MANAGE_API_KEY)
  if (!hasPermission) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const session = await auth()
    const { id } = await params

    const { enabled } = await request.json() as { enabled: boolean }
    const db = createDb()
    
    const result = await db.update(apiKeys)
      .set({ enabled })
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.userId, session!.user.id!)
        )
      )
      .returning()

    if (!result.length) {
      return NextResponse.json(
        { error: "API Key 不存在或无权更新" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update API key:", error)
    return NextResponse.json(
      { error: "更新 API Key 失败" },
      { status: 500 }
    )
  }
} 