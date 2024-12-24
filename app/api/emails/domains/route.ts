import { EMAIL_CONFIG } from "@/config"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET() {
  try {
    const domains = EMAIL_CONFIG.DOMAINS

    if (domains.length === 0) {
      return NextResponse.json(
        { error: "无效的域名列表" },
        { status: 400 }
      )
    }

    return NextResponse.json({ domains })
  } catch (error) {
    console.error('Failed to fetch domains:', error)
    return NextResponse.json(
      { error: "获取域名列表失败" },
      { status: 500 }
    )
  }
} 