import { PERMISSIONS, Role, ROLES } from "@/lib/permissions"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { EMAIL_CONFIG } from "@/config"
import { checkPermission } from "@/lib/auth"

export const runtime = "edge"

export async function GET() {
  const env = getRequestContext().env
  // * 移除了 env.SITE_CONFIG.get("EMAIL_DOMAINS") *
  const [defaultRole, adminContact, maxEmails] = await Promise.all([
    env.SITE_CONFIG.get("DEFAULT_ROLE"),
    env.SITE_CONFIG.get("ADMIN_CONTACT"),
    env.SITE_CONFIG.get("MAX_EMAILS")
  ])

  // * 移除了 emailDomains *
  // * emailDomains 现在通过 /api/config/email-domains 接口获取 *
  return Response.json({
    defaultRole: defaultRole || ROLES.CIVILIAN,
    adminContact: adminContact || "",
    maxEmails: maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString()
  })
}

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)

  if (!canAccess) {
    return Response.json({
      error: "权限不足"
    }, { status: 403 })
  }

  // * 移除了 emailDomains *
  const { defaultRole, adminContact, maxEmails } = await request.json() as {
    defaultRole: Exclude<Role, typeof ROLES.EMPEROR>,
    adminContact: string,
    maxEmails: string
  }

  if (![ROLES.DUKE, ROLES.KNIGHT, ROLES.CIVILIAN].includes(defaultRole)) {
    return Response.json({ error: "无效的角色" }, { status: 400 })
  }

  const env = getRequestContext().env
  // * 移除了 env.SITE_CONFIG.put("EMAIL_DOMAINS", emailDomains) *
  await Promise.all([
    env.SITE_CONFIG.put("DEFAULT_ROLE", defaultRole),
    env.SITE_CONFIG.put("ADMIN_CONTACT", adminContact),
    env.SITE_CONFIG.put("MAX_EMAILS", maxEmails)
  ])

  return Response.json({ success: true })
}