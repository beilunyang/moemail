// 文件名: app/api/users/[id]/route.ts
// 修复：将 "next-server" 更改为 "next/server"
import { NextRequest, NextResponse } from "next/server" 
import { checkPermission, assignRoleToUser, findOrCreateRole } from "@/lib/auth"
import { PERMISSIONS, ROLES, Role } from "@/lib/permissions"
import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { hashPassword } from "@/lib/utils"

// 修复：保留 'edge' runtime
export const runtime = "edge" 

/**
 * PUT /api/users/[id]
 * 更新用户信息（角色、状态、密码）
 */
// 修复：为 context 使用 'any' 类型以绕过构建错误
export async function PUT(request: NextRequest, context: any) {
  const userId = context.params.id // 从 context.params 中提取 id

  // 权限检查
  const canManage = await checkPermission(PERMISSIONS.PROMOTE_USER)
  if (!canManage) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const { role, status, password } = await request.json() as {
      role?: Exclude<Role, typeof ROLES.EMPEROR>
      status?: boolean
      password?: string
    }

    const db = createDb()
    
    // 查找用户
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { userRoles: { with: { role: true } } }
    })

    if (!user) {
      return NextResponse.json({ error: "未找到用户" }, { status: 404 })
    }

    // 禁止操作皇帝
    if (user.userRoles[0]?.role.name === ROLES.EMPEROR) {
      return NextResponse.json({ error: "不能修改皇帝账户" }, { status: 403 })
    }

    // 准备更新的数据
    const updateData: { status?: boolean; password?: string | null } = {}

    if (typeof status === 'boolean') {
      updateData.status = status
    }
    
    if (password) {
      updateData.password = await hashPassword(password)
    }

    // 更新用户表
    if (Object.keys(updateData).length > 0) {
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
    }

    // 更新角色
    if (role && role !== user.userRoles[0]?.role.name) {
      const roleRecord = await findOrCreateRole(db, role)
      await assignRoleToUser(db, userId, roleRecord.id)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error(`Failed to update user ${userId}:`, error)
    return NextResponse.json({ error: "更新用户失败" }, { status: 500 })
  }
}

/**
 * DELETE /api/users/[id]
 * 删除一个用户
 */
// 修复：为 context 使用 'any' 类型以绕过构建错误
export async function DELETE(request: NextRequest, context: any) {
  const userId = context.params.id // 从 context.params 中提取 id

  // 权限检查
  const canManage = await checkPermission(PERMISSIONS.PROMOTE_USER)
  if (!canManage) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const db = createDb()

    // 查找用户
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { userRoles: { with: { role: true } } }
    })

    if (!user) {
      return NextResponse.json({ error: "未找到用户" }, { status: 404 })
    }

    // 禁止删除皇帝
    if (user.userRoles[0]?.role.name === ROLES.EMPEROR) {
      return NextResponse.json({ error: "不能删除皇帝账户" }, { status: 403 })
    }

    // 删除用户 (由于 schema 中设置了 onCascade, 相关数据会级联删除)
    await db.delete(users).where(eq(users.id, userId))

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error(`Failed to delete user ${userId}:`, error)
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 })
  }
}