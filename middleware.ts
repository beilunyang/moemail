import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { PERMISSIONS } from "@/lib/permissions"
import { checkPermission } from "@/lib/auth"
import { Permission } from "@/lib/permissions"
import { handleApiKeyAuth } from "@/lib/apiKey"

const API_PERMISSIONS: Record<string, Permission> = {
  '/api/emails': PERMISSIONS.MANAGE_EMAIL,
  '/api/webhook': PERMISSIONS.MANAGE_WEBHOOK,
  '/api/roles/promote': PERMISSIONS.PROMOTE_USER,
  '/api/config': PERMISSIONS.MANAGE_CONFIG,
  '/api/api-keys': PERMISSIONS.MANAGE_API_KEY,
}

export async function middleware(request: Request) {
  const pathname = new URL(request.url).pathname

  // API Key 认证
  request.headers.delete("X-User-Id")
  const apiKey = request.headers.get("X-API-Key")
  if (apiKey) {
    return handleApiKeyAuth(apiKey, pathname)
  }

  // Session 认证
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { error: "未授权" },
      { status: 401 }
    )
  }

  for (const [route, permission] of Object.entries(API_PERMISSIONS)) {
    if (pathname.startsWith(route)) {
      const hasAccess = await checkPermission(permission)

      if (!hasAccess) {
        return NextResponse.json(
          { error: "权限不足" },
          { status: 403 }
        )
      }
      break
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/emails/:path*',
    '/api/webhook/:path*',
    '/api/roles/:path*',
    '/api/config/:path*',
    '/api/api-keys/:path*',
    '/api/admin-contact',
  ]
} 