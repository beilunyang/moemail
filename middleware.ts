import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { i18n } from "@/i18n/config"
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
  const url = new URL(request.url)
  const pathname = url.pathname

  if (pathname.startsWith('/api')) {
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next()
    }

    request.headers.delete("X-User-Id")
    const apiKey = request.headers.get("X-API-Key")
    if (apiKey) {
      return handleApiKeyAuth(apiKey, pathname)
    }

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      )
    }

    if (pathname === '/api/config' && request.method === 'GET') {
      return NextResponse.next()
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

  // Pages: 语言前缀
  const segments = pathname.split('/')
  const maybeLocale = segments[1]
  const hasLocalePrefix = i18n.locales.includes(maybeLocale as any)
  if (!hasLocalePrefix) {
    const cookieLocale = request.headers.get('Cookie')?.match(/NEXT_LOCALE=([^;]+)/)?.[1]
    const targetLocale = (cookieLocale && i18n.locales.includes(cookieLocale as any)) ? cookieLocale : i18n.defaultLocale
    const redirectURL = new URL(`/${targetLocale}${pathname}${url.search}`, request.url)
    return NextResponse.redirect(redirectURL)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)', // all pages excluding static assets
    '/api/emails/:path*',
    '/api/webhook/:path*',
    '/api/roles/:path*',
    '/api/config/:path*',
    '/api/api-keys/:path*',
  ]
} 