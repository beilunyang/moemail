import { getRequestContext } from "@cloudflare/next-on-pages"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET() {
  try {
    const domainString = await getRequestContext().env.SITE_CONFIG.get("EMAIL_DOMAINS")

    return NextResponse.json({ domains: domainString ? domainString.split(',') : ["bravexist.eu.org"] })
  } catch (error) {
    console.error('Failed to fetch domains:', error)
    return NextResponse.json(
      { error: "获取域名列表失败" },
      { status: 500 }
    )
  }
} 