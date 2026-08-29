import { getRequestContext } from "@cloudflare/next-on-pages"
import { eq } from "drizzle-orm"
import { checkPermission } from "@/lib/auth"
import { parseEmailDomains } from "@/lib/catch-all"
import { createDb } from "@/lib/db"
import {
  getEffectiveAllowedEmailDomains,
  serializeAllowedEmailDomains,
} from "@/lib/domain-access"
import { PERMISSIONS, ROLES } from "@/lib/permissions"
import { users } from "@/lib/schema"

export const runtime = "edge"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await checkPermission(PERMISSIONS.PROMOTE_USER)) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  const { id: userId } = await params
  const body = await request.json().catch(() => null) as { domains?: unknown } | null
  if (!body || !Array.isArray(body.domains) || body.domains.some((domain) => typeof domain !== "string")) {
    return Response.json({ error: "无效的域名配置" }, { status: 400 })
  }

  const env = getRequestContext().env
  const configuredDomains = parseEmailDomains(await env.SITE_CONFIG.get("EMAIL_DOMAINS"))
  const requestedDomains = parseEmailDomains((body.domains as string[]).join(","))
  const configuredDomainSet = new Set(configuredDomains)
  if (requestedDomains.some((domain) => !configuredDomainSet.has(domain))) {
    return Response.json({ error: "包含未配置的邮箱域名" }, { status: 400 })
  }

  const db = createDb()
  const targetUser = await db.query.users.findFirst({
    columns: { id: true },
    where: eq(users.id, userId),
    with: {
      userRoles: {
        with: { role: true },
      },
    },
  })
  if (!targetUser) {
    return Response.json({ error: "用户不存在" }, { status: 404 })
  }
  if (targetUser.userRoles.some(({ role }) => role.name === ROLES.EMPEROR)) {
    return Response.json({ error: "皇帝始终可以使用全部域名" }, { status: 400 })
  }

  const storedDomains = serializeAllowedEmailDomains(requestedDomains, configuredDomains)
  await db.update(users)
    .set({ allowedEmailDomains: storedDomains })
    .where(eq(users.id, userId))

  return Response.json({
    success: true,
    allowedDomains: getEffectiveAllowedEmailDomains({
      configuredDomains,
      storedDomains,
      isEmperor: false,
    }),
  })
}
