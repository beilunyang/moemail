import { NextResponse } from "next/server"
// * 修复：移除了未被使用的 getRequestContext *
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { createDb } from "@/lib/db" // * 修复：导入 createDb *
import { emailDomains } from "@/lib/schema"

export const runtime = "edge"

/**
 * GET /api/config/email-domains
 * 获取所有邮箱域名配置
 */
export async function GET() {
  // 权限检查
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const db = createDb() // * 修复：调用 createDb() *
    // 从数据库查询所有域名
    const domains = await db.select().from(emailDomains).orderBy(emailDomains.createdAt)

    return NextResponse.json(domains)
  } catch (error) {
    console.error("Failed to get email domains:", error)
    return NextResponse.json(
      { error: "获取邮箱域名配置失败" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/config/email-domains
 * 添加一个新的邮箱域名配置
 */
export async function POST(request: Request) {
  // 权限检查
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const { domain, resendApiKey, resendEnabled } = await request.json() as {
      domain: string,
      resendApiKey: string,
      resendEnabled: boolean
    }

    // 简单校验
    if (!domain) {
      return NextResponse.json({ error: "域名不能为空" }, { status: 400 })
    }

    const db = createDb() // * 修复：调用 createDb() *
    
    // 插入新域名到数据库
    const newDomain = await db.insert(emailDomains).values({
      domain,
      resendApiKey: resendApiKey || null,
      resendEnabled: resendEnabled || false
    }).returning()

    return NextResponse.json(newDomain[0])
  } catch (error: any) {
    console.error("Failed to add email domain:", error)
    // 处理唯一约束冲突
    if (error.message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { error: "该域名已存在" },
        { status: 409 } // 409 Conflict
      )
    }
    return NextResponse.json(
      { error: "添加邮箱域名失败" },
      { status: 500 }
    )
  }
}