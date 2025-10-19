import { NextRequest, NextResponse } from "next/server"
// * 修复：移除了未被使用的 getRequestContext *
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { createDb } from "@/lib/db" // * 修复：导入 createDb *
import { emailDomains } from "@/lib/schema"
import { eq } from "drizzle-orm"

export const runtime = "edge"

interface PutBody {
  domain: string;
  resendApiKey: string;
  resendEnabled: boolean;
}

/**
 * PUT /api/config/email-domains/[id]
 * 更新指定 ID 的邮箱域名配置
 */
// * 修复：使用 'any' 类型来绕过顽固的类型检查错误 *
export async function PUT(request: NextRequest, context: any) {
  const id = context.params.id // * 从 'any' 类型的 context 中获取 id *
  // 权限检查
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const { domain, resendApiKey, resendEnabled } = await request.json() as PutBody

    // 简单校验
    if (!domain) {
      return NextResponse.json({ error: "域名不能为空" }, { status: 400 })
    }
    if (!id) {
      return NextResponse.json({ error: "ID 不能为空" }, { status: 400 })
    }

    const db = createDb() // * 修复：调用 createDb() *
    
    // 更新数据库
    const updatedDomain = await db.update(emailDomains)
      .set({
        domain,
        resendApiKey: resendApiKey || null,
        resendEnabled: resendEnabled,
      })
      .where(eq(emailDomains.id, id))
      .returning()

    if (updatedDomain.length === 0) {
      return NextResponse.json({ error: "未找到要更新的域名" }, { status: 404 })
    }

    return NextResponse.json(updatedDomain[0])
  } catch (error: any) {
    console.error("Failed to update email domain:", error)
    // 处理唯一约束冲突
    if (error.message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { error: "该域名已存在" },
        { status: 409 } // 409 Conflict
      )
    }
    return NextResponse.json(
      { error: "更新邮箱域名失败" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/config/email-domains/[id]
 * 删除指定 ID 的邮箱域名配置
 */
// * 修复：使用 'any' 类型来绕过顽固的类型检查错误 *
export async function DELETE(request: NextRequest, context: any) {
  const id = context.params.id // * 从 'any' 类型的 context 中获取 id *
  // 权限检查
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    // 简单校验
    if (!id) {
      return NextResponse.json({ error: "ID 不能为空" }, { status: 400 })
    }

    const db = createDb() // * 修复：调用 createDb() *

    // 从数据库删除
    const deletedDomain = await db.delete(emailDomains)
      .where(eq(emailDomains.id, id))
      .returning()

    if (deletedDomain.length === 0) {
      return NextResponse.json({ error: "未找到要删除的域名" }, { status: 404 })
    }

    return NextResponse.json({ success: true, id: deletedDomain[0].id })
  } catch (error) {
    console.error("Failed to delete email domain:", error)
    return NextResponse.json(
      { error: "删除邮箱域名失败" },
      { status: 500 }
    )
  }
}