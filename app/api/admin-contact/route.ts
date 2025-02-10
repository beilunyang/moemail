import { getRequestContext } from "@cloudflare/next-on-pages"

export const runtime = "edge"

export async function GET() {
  const env = getRequestContext().env
  const adminContact = await env.SITE_CONFIG.get("ADMIN_CONTACT")

  return Response.json({
    adminContact: adminContact || ""
  })
} 