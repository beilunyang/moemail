// 文件名: app/api/users/route.ts
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
 * GET /api/users
 * 获取所有用户列表（供管理员使用）
 */
export async function GET() {
  // 权限检查
  const canManage = await checkPermission(PERMISSIONS.PROMOTE_USER)
  if (!canManage) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const db = createDb()
    const allUsers = await db.query.users.findMany({
      with: {
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    })

    // 格式化数据
    const formattedUsers = allUsers.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.userRoles[0]?.role.name || ROLES.CIVILIAN, // 默认平民
      status: user.status, // 包含用户状态
    }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 })
  }
}

/**
 * POST /api/users
 * 管理员手动添加新用户
 */
export async function POST(request: NextRequest) {
  // 权限检查
  const canManage = await checkPermission(PERMISSIONS.PROMOTE_USER)
  if (!canManage) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const { username, password, role } = await request.json() as {
      username: string
      password?: string
      role: Role // 修复：确保类型为 Role
    }

    if (!username || !role) {
      return NextResponse.json({ error: "用户名和角色是必需的" }, { status: 400 })
    }

    if (role === ROLES.EMPEROR) {
      return NextResponse.json({ error: "不能创建皇帝" }, { status: 400 })
    }

    const db = createDb()

    // 检查用户名是否已存在
    const existing = await db.query.users.findFirst({
      where: eq(users.username, username)
    })
    if (existing) {
      return NextResponse.json({ error: "用户名已存在" }, { status: 409 }) // 409 Conflict
    }
    
    // 处理密码
    let hashedPassword = null
    if (password) {
      hashedPassword = await hashPassword(password)
    }

    // 创建用户
    const [newUser] = await db.insert(users)
      .values({
        username,
        password: hashedPassword,
        status: true, // 默认激活
      })
      .returning()

    // 分配角色
    const roleRecord = await findOrCreateRole(db, role)
    await assignRoleToUser(db, newUser.id, roleRecord.id)

    return NextResponse.json({
      id: newUser.id,
      username: newUser.username,
      role: role,
      status: newUser.status
    }, { status: 201 }) // 201 Created

  } catch (error) {
    console.error("Failed to create user:", error)
    return NextResponse.json({ error: "创建用户失败" }, { status: 500 })
  }
}