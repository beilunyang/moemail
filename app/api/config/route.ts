import { PERMISSIONS, ROLES } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { EMAIL_CONFIG } from "@/config"
import { checkPermission } from "@/lib/auth"
import { getUserId } from "@/lib/apiKey"
import { createDb } from "@/lib/db"
import { emails } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import {
  CATCHALL_EMAIL_KEY,
  getEmailLocalPart,
  isValidMailboxName,
  normalizeMailboxName,
  parseCatchAllEmailConfig,
  parseEmailDomains,
} from "@/lib/catch-all"
import type { CatchAllEmailConfig } from "@/lib/catch-all"

export const runtime = "edge"

export async function GET() {
  const env = getRequestContext().env
  const canManageConfig = await checkPermission(PERMISSIONS.MANAGE_CONFIG)

  const [defaultRole, emailDomains, adminContact, maxEmails] = await Promise.all([
    env.SITE_CONFIG.get("DEFAULT_ROLE"),
    env.SITE_CONFIG.get("EMAIL_DOMAINS"),
    env.SITE_CONFIG.get("ADMIN_CONTACT"),
    env.SITE_CONFIG.get("MAX_EMAILS"),
  ])

  const resolvedEmailDomains = emailDomains || "moemail.app"
  const response: Record<string, unknown> = {
    defaultRole: defaultRole || ROLES.CIVILIAN,
    emailDomains: resolvedEmailDomains,
    adminContact: adminContact || "",
    maxEmails: maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString(),
  }

  if (!canManageConfig) {
    return Response.json(response)
  }

  const userId = await getUserId()
  if (!userId) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const [turnstileEnabled, turnstileSiteKey, turnstileSecretKey, catchAllEmail] = await Promise.all([
    env.SITE_CONFIG.get("TURNSTILE_ENABLED"),
    env.SITE_CONFIG.get("TURNSTILE_SITE_KEY"),
    env.SITE_CONFIG.get("TURNSTILE_SECRET_KEY"),
    env.SITE_CONFIG.get(CATCHALL_EMAIL_KEY),
  ])

  const configuredDomains = parseEmailDomains(resolvedEmailDomains)
  const parsedCatchAllConfig = parseCatchAllEmailConfig(catchAllEmail)
  const catchAllDomains = configuredDomains.reduce<Record<string, {
    enabled: boolean
    showAlways: boolean
    mailboxName: string
  }>>((config, domain) => {
    const domainConfig = parsedCatchAllConfig[domain]
    config[domain] = {
      enabled: domainConfig?.enabled ?? false,
      showAlways: domainConfig?.showAlways ?? true,
      mailboxName: domainConfig ? getEmailLocalPart(domainConfig.address) ?? "" : "",
    }
    return config
  }, {})

  return Response.json({
    ...response,
    turnstile: {
      enabled: turnstileEnabled === "true",
      siteKey: turnstileSiteKey || "",
      secretKey: turnstileSecretKey || "",
    },
    catchAll: {
      domains: catchAllDomains,
    },
  })
}

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)

  if (!canAccess) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  const userId = await getUserId()
  if (!userId) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  let body: {
    defaultRole: Exclude<Role, typeof ROLES.EMPEROR>
    emailDomains: string
    adminContact: string
    maxEmails: string
    catchAll?: {
      domains?: unknown
    }
    turnstile?: {
      enabled: boolean
      siteKey: string
      secretKey: string
    }
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "无效的请求数据" }, { status: 400 })
  }

  const {
    defaultRole,
    emailDomains,
    adminContact,
    maxEmails,
    catchAll,
    turnstile,
  } = body

  if (![ROLES.DUKE, ROLES.KNIGHT, ROLES.CIVILIAN].includes(defaultRole)) {
    return Response.json({ error: "无效的角色" }, { status: 400 })
  }

  const normalizedDomains = parseEmailDomains(emailDomains)
  if (normalizedDomains.length === 0) {
    return Response.json({ error: "至少需要配置一个邮箱域名" }, { status: 400 })
  }

  const turnstileConfig = turnstile ?? {
    enabled: false,
    siteKey: "",
    secretKey: "",
  }

  if (turnstileConfig.enabled && (!turnstileConfig.siteKey || !turnstileConfig.secretKey)) {
    return Response.json({ error: "Turnstile 启用时需要提供 Site Key 和 Secret Key" }, { status: 400 })
  }

  const env = getRequestContext().env
  let normalizedCatchAllConfig: CatchAllEmailConfig | undefined

  if (catchAll !== undefined) {
    if (!catchAll.domains || typeof catchAll.domains !== "object" || Array.isArray(catchAll.domains)) {
      return Response.json({ error: "无效的 Catch-all 邮箱配置" }, { status: 400 })
    }

    const currentCatchAllConfig = parseCatchAllEmailConfig(
      await env.SITE_CONFIG.get(CATCHALL_EMAIL_KEY),
    )
    normalizedCatchAllConfig = {}

    const db = createDb()
    const mailboxPlans: Array<{
      address: string
      currentEmail: typeof emails.$inferSelect | undefined
    }> = []

    for (const domain of normalizedDomains) {
      const rawDomainConfig = (catchAll.domains as Record<string, unknown>)[domain]
      if (!rawDomainConfig || typeof rawDomainConfig !== "object" || Array.isArray(rawDomainConfig)) {
        return Response.json({ error: `无效的 Catch-all 域名配置: ${domain}` }, { status: 400 })
      }

      const domainConfig = rawDomainConfig as Record<string, unknown>
      const enabled = domainConfig.enabled === true
      const showAlways = domainConfig.showAlways !== false
      const rawName = domainConfig.mailboxName
      const currentDomainConfig = currentCatchAllConfig[domain]

      if (typeof rawName !== "string") {
        return Response.json({ error: `无效的 Catch-all 邮箱名: ${domain}` }, { status: 400 })
      }

      const mailboxName = normalizeMailboxName(rawName)
      if (!mailboxName) {
        if (enabled || currentDomainConfig) {
          return Response.json({ error: `请为 ${domain} 配置 Catch-all 邮箱名` }, { status: 400 })
        }
        continue
      }

      if (!isValidMailboxName(mailboxName)) {
        return Response.json({ error: `Catch-all 邮箱名格式无效: ${rawName}` }, { status: 400 })
      }

      const address = `${mailboxName}@${domain}`
      const currentAddress = currentDomainConfig?.address
      const currentEmail = currentAddress
        ? await db.query.emails.findFirst({
          where: eq(sql`LOWER(TRIM(${emails.address}))`, currentAddress),
        })
        : undefined
      const ownedCurrentEmail = currentEmail?.userId === userId ? currentEmail : undefined
      const emailAtDesiredAddress = currentAddress === address
        ? currentEmail
        : await db.query.emails.findFirst({
          where: eq(sql`LOWER(TRIM(${emails.address}))`, address),
        })

      if (emailAtDesiredAddress && emailAtDesiredAddress.id !== ownedCurrentEmail?.id) {
        return Response.json({ error: `邮箱地址已被占用: ${address}` }, { status: 409 })
      }

      normalizedCatchAllConfig[domain] = { address, enabled, showAlways }
      mailboxPlans.push({
        address,
        currentEmail: ownedCurrentEmail,
      })
    }

    const noExpiry = new Date("9999-01-01T00:00:00.000Z")
    try {
      for (const plan of mailboxPlans) {
        if (plan.currentEmail) {
          const needsUpdate = plan.currentEmail.address !== plan.address
            || plan.currentEmail.expiresAt.getTime() !== noExpiry.getTime()

          if (needsUpdate) {
            await db.update(emails)
              .set({
                address: plan.address,
                expiresAt: noExpiry,
              })
              .where(eq(emails.id, plan.currentEmail.id))
          }
        } else {
          await db.insert(emails).values({
            address: plan.address,
            userId,
            expiresAt: noExpiry,
          })
        }
      }
    } catch (error) {
      console.error("Failed to save Catch-all mailbox:", error)
      return Response.json({ error: "保存 Catch-all 邮箱失败，邮箱名可能已被占用" }, { status: 409 })
    }
  }

  const writes: Promise<void>[] = [
    env.SITE_CONFIG.put("DEFAULT_ROLE", defaultRole),
    env.SITE_CONFIG.put("EMAIL_DOMAINS", normalizedDomains.join(",")),
    env.SITE_CONFIG.put("ADMIN_CONTACT", adminContact),
    env.SITE_CONFIG.put("MAX_EMAILS", maxEmails),
    env.SITE_CONFIG.put("TURNSTILE_ENABLED", turnstileConfig.enabled.toString()),
    env.SITE_CONFIG.put("TURNSTILE_SITE_KEY", turnstileConfig.siteKey),
    env.SITE_CONFIG.put("TURNSTILE_SECRET_KEY", turnstileConfig.secretKey),
  ]

  if (normalizedCatchAllConfig) {
    writes.push(
      Object.keys(normalizedCatchAllConfig).length > 0
        ? env.SITE_CONFIG.put(CATCHALL_EMAIL_KEY, JSON.stringify(normalizedCatchAllConfig))
        : env.SITE_CONFIG.delete(CATCHALL_EMAIL_KEY),
    )
  }

  await Promise.all(writes)

  return Response.json({ success: true })
}
