import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/permissions";
import { checkPermission } from "@/lib/auth";
import { Permission } from "@/lib/permissions";
import { handleApiKeyAuth } from "@/lib/apiKey";

const API_PERMISSIONS: Record<string, Permission> = {
  "/api/webhook": PERMISSIONS.MANAGE_WEBHOOK,
  "/api/roles/promote": PERMISSIONS.PROMOTE_USER,
  "/api/config": PERMISSIONS.MANAGE_CONFIG,
  "/api/api-keys": PERMISSIONS.MANAGE_API_KEY,
};

export async function middleware(request: Request) {
  const pathname = new URL(request.url).pathname;

  // API Key 认证
  request.headers.delete("X-User-Id");
  const apiKey = request.headers.get("X-API-Key");
  if (apiKey) {
    return handleApiKeyAuth(apiKey, pathname);
  }

  // Session 认证
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  if (pathname === "/api/config" && request.method === "GET") {
    return NextResponse.next();
  }
  // 邮件接口权限细化
  // - send-permission 检查接口：直接放行（内部做细分）
  if (pathname.startsWith("/api/emails/send-permission")) {
    return NextResponse.next();
  }
  // - /api/emails：GET 允许拥有 MANAGE_EMAIL 或 VIEW_TEMP_EMAIL；其它方法需 MANAGE_EMAIL
  if (pathname.startsWith("/api/emails")) {
    if (request.method === "GET") {
      const canManage = await checkPermission(PERMISSIONS.MANAGE_EMAIL);
      if (canManage) return NextResponse.next();
      const canViewTemp = await checkPermission(PERMISSIONS.VIEW_TEMP_EMAIL);
      if (canViewTemp) return NextResponse.next();
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    } else {
      const canManage = await checkPermission(PERMISSIONS.MANAGE_EMAIL);
      if (!canManage) {
        return NextResponse.json({ error: "权限不足" }, { status: 403 });
      }
      return NextResponse.next();
    }
  }

  for (const [route, permission] of Object.entries(API_PERMISSIONS)) {
    if (pathname.startsWith(route)) {
      const hasAccess = await checkPermission(permission);

      if (!hasAccess) {
        return NextResponse.json({ error: "权限不足" }, { status: 403 });
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/emails/:path*",
    "/api/webhook/:path*",
    "/api/roles/:path*",
    "/api/config/:path*",
    "/api/api-keys/:path*",
  ],
};
