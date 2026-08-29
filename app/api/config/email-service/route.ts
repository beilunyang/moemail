import { NextResponse } from "next/server"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { EMAIL_CONFIG } from "@/config"
import {
  RESEND_CONFIG_KEY,
  loadResendConfig,
  parseEmailRoleLimits,
  type ResendConfig,
} from "@/lib/resend"

export const runtime = "edge"

interface EmailServiceConfig {
  domains: Record<string, {
    enabled: boolean
    apiKey?: string
  }>
  roleLimits: {
    duke?: number
    knight?: number
  }
}

const isEmailServiceConfig = (value: unknown): value is EmailServiceConfig => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false

  const config = value as Record<string, unknown>
  if (!config.domains || typeof config.domains !== "object" || Array.isArray(config.domains)) {
    return false
  }
  if (!config.roleLimits || typeof config.roleLimits !== "object" || Array.isArray(config.roleLimits)) {
    return false
  }

  const roleLimits = config.roleLimits as Record<string, unknown>
  if (![roleLimits.duke, roleLimits.knight].every((limit) => (
    typeof limit === "number" && Number.isInteger(limit) && limit >= -1
  ))) {
    return false
  }

  return Object.values(config.domains).every((domainConfig) => {
    if (!domainConfig || typeof domainConfig !== "object" || Array.isArray(domainConfig)) return false
    const entry = domainConfig as Record<string, unknown>
    return typeof entry.enabled === "boolean"
      && (entry.apiKey === undefined || typeof entry.apiKey === "string")
  })
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
    const [{ configuredDomains, config: resendConfig }, roleLimits] = await Promise.all([
      loadResendConfig(env.SITE_CONFIG),
      env.SITE_CONFIG.get("EMAIL_ROLE_LIMITS")
    ])

    const customLimits = parseEmailRoleLimits(roleLimits)

    const finalLimits = {
      duke: customLimits.duke !== undefined ? customLimits.duke : EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS.duke,
      knight: customLimits.knight !== undefined ? customLimits.knight : EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS.knight,
    }

    const configuredDomainSet = new Set(configuredDomains)
    const visibleDomains = [
      ...configuredDomains,
      ...Object.keys(resendConfig).filter((domain) => !configuredDomainSet.has(domain)),
    ]

    return NextResponse.json({
      domains: visibleDomains.reduce<Record<string, {
        enabled: boolean
        apiKey: string
        configured: boolean
      }>>((domains, domain) => {
        domains[domain] = {
          enabled: resendConfig[domain]?.enabled === true,
          apiKey: resendConfig[domain]?.apiKey ?? "",
          configured: configuredDomainSet.has(domain),
        }
        return domains
      }, {}),
      roleLimits: finalLimits
    }, {
      headers: { "Cache-Control": "no-store" },
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
    const body = await request.json().catch(() => null)
    if (!isEmailServiceConfig(body)) {
      return NextResponse.json({ error: "无效的 Resend 发件服务配置" }, { status: 400 })
    }
    const config = body

    const env = getRequestContext().env
    const { configuredDomains, config: currentConfig } = await loadResendConfig(env.SITE_CONFIG)
    const nextConfig: ResendConfig = {}

    for (const domain of configuredDomains) {
      const submittedDomainConfig = config.domains?.[domain]
      const enabled = submittedDomainConfig?.enabled === true
      const submittedApiKey = submittedDomainConfig?.apiKey?.trim() ?? ""
      const apiKey = submittedApiKey || currentConfig[domain]?.apiKey || ""

      if (enabled && !apiKey) {
        return NextResponse.json(
          { error: `启用 ${domain} 的 Resend 时，API Key 为必填项` },
          { status: 400 }
        )
      }

      nextConfig[domain] = { enabled, apiKey }
    }

    const customLimits: { duke?: number; knight?: number } = {}
    if (config.roleLimits?.duke !== undefined) {
      customLimits.duke = config.roleLimits.duke
    }
    if (config.roleLimits?.knight !== undefined) {
      customLimits.knight = config.roleLimits.knight
    }

    await Promise.all([
      env.SITE_CONFIG.put(RESEND_CONFIG_KEY, JSON.stringify(nextConfig)),
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
