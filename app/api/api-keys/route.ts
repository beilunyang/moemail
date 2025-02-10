import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { apiKeys } from "@/lib/schema"
import { nanoid } from "nanoid"
import { NextResponse } from "next/server"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { desc, eq } from "drizzle-orm"

export const runtime = "edge"

export async function GET() {
  const hasPermission = await checkPermission(PERMISSIONS.MANAGE_API_KEY)
  if (!hasPermission) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  const session = await auth()
  try {
    const db = createDb()
    const keys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, session!.user.id!),
      orderBy: desc(apiKeys.createdAt),
    })

    return NextResponse.json({
      apiKeys: keys.map(key => ({
        ...key,
        key: undefined
      }))
    })
  } catch (error) {
    console.error("Failed to fetch API keys:", error)
    return NextResponse.json(
      { error: "获取 API Keys 失败" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const hasPermission = await checkPermission(PERMISSIONS.MANAGE_API_KEY)
  if (!hasPermission) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  const session = await auth()
  try {
    const { name } = await request.json() as { name: string }
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "名称不能为空" },
        { status: 400 }
      )
    }

    const key = `mk_${nanoid(32)}`
    const db = createDb()
    
    await db.insert(apiKeys).values({
      name,
      key,
      userId: session!.user.id!,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    })

    return NextResponse.json({ key })
  } catch (error) {
    console.error("Failed to create API key:", error)
    return NextResponse.json(
      { error: "创建 API Key 失败" },
      { status: 500 }
    )
  }
} 