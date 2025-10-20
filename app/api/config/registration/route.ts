import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { NextResponse } from "next/server"

export const runtime = "edge"

/**
 * GET /api/config/registration
 * 获取是否允许新用户注册的状态
 */
export async function GET() {
  // 权限检查
  const canManage = await checkPermission(PERMISSIONS.PROMOTE_USER)
  if (!canManage) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }
  
  const env = getRequestContext().env
  const allowRegistration = await env.SITE_CONFIG.get("ALLOW_REGISTRATION")
  
  // 默认值为 "true" (允许)
  const isAllowed = allowRegistration !== "false"
  
  return NextResponse.json({ allowRegistration: isAllowed })
}

/**
 * POST /api/config/registration
 * 设置是否允许新用户注册
 */
export async function POST(request: Request) {
  // 权限检查
  const canManage = await checkPermission(PERMISSIONS.PROMOTE_USER)
  if (!canManage) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }
  
  try {
    const { allowRegistration } = await request.json() as { allowRegistration: boolean }

    if (typeof allowRegistration !== 'boolean') {
      return NextResponse.json({ error: "无效的参数" }, { status: 400 })
    }

    const env = getRequestContext().env
    // 将布尔值转为字符串 "true" 或 "false" 存储
    await env.SITE_CONFIG.put("ALLOW_REGISTRATION", allowRegistration.toString())

    return NextResponse.json({ success: true })
  } catch (error) {
    // 修复：使用 error 变量
    console.error("保存设置失败:", error)
    return NextResponse.json({ error: "保存设置失败" }, { status: 500 })
  }
}