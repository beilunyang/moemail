import { NextResponse } from "next/server" // * 修复：从 'next/server' 导入，而不是 'next-server' *
import { getRequestContext } from "@cloudflare/next-on-pages"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { EMAIL_CONFIG } from "@/config"

export const runtime = "edge"

interface EmailServiceConfig {
  enabled: boolean
  // * 移除了 apiKey *
  roleLimits: {
    duke?: number
    knight?: number
  }
}

export async function GET() {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)

  if (!canAccess) {
    return NextResponse.json({
      error: "权限不足"
    }, { status: 403 })
  }

  try {
    const env = getRequestContext().env
    // * 移除了 env.SITE_CONFIG.get("RESEND_API_KEY") *
    const [enabled, roleLimits] = await Promise.all([
      env.SITE_CONFIG.get("EMAIL_SERVICE_ENABLED"),
      env.SITE_CONFIG.get("EMAIL_ROLE_LIMITS")
    ])

    const customLimits = roleLimits ? JSON.parse(roleLimits) : {}

    const finalLimits = {
      duke: customLimits.duke !== undefined ? customLimits.duke : EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS.duke,
      knight: customLimits.knight !== undefined ? customLimits.knight : EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS.knight,
    }

    // * 移除了 apiKey *
    // * API Key 现在通过 /api/config/email-domains 接口按域名管理 *
    return NextResponse.json({
      enabled: enabled === "true",
      roleLimits: finalLimits
    })
  } catch (error) {
    console.error("Failed to get email service config:", error)
    return NextResponse.json(
      { error: "获取 Resend 发件服务配置失败" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)

  if (!canAccess) {
    return NextResponse.json({
      error: "权限不足"
    }, { status: 403 })
  }

  try {
    const config = await request.json() as EmailServiceConfig

    // * 移除了 apiKey 的校验 *
    // if (config.enabled && !config.apiKey) {
    //   return NextResponse.json(
    //     { error: "启用 Resend 时，API Key 为必填项" },
    //     { status: 400 }
    //   )
    // }

    const env = getRequestContext().env

    const customLimits: { duke?: number; knight?: number } = {}
    if (config.roleLimits?.duke !== undefined) {
      customLimits.duke = config.roleLimits.duke
    }
    if (config.roleLimits?.knight !== undefined) {
      customLimits.knight = config.roleLimits.knight
    }

    // * 移除了 env.SITE_CONFIG.put("RESEND_API_KEY", config.apiKey) *
    await Promise.all([
      env.SITE_CONFIG.put("EMAIL_SERVICE_ENABLED", config.enabled.toString()),
      env.SITE_CONFIG.put("EMAIL_ROLE_LIMITS", JSON.stringify(customLimits))
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save email service config:", error)
    return NextResponse.json(
      { error: "保存 Resend 发件服务配置失败" },
      { status: 500 }
    )
  }
}