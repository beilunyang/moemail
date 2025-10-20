import { NextResponse } from "next/server"
import { register } from "@/lib/auth"
import { authSchema, AuthSchema } from "@/lib/validation"
import { getRequestContext } from "@cloudflare/next-on-pages"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    // 新增：检查是否允许新用户注册
    const env = getRequestContext().env
    const allowRegistration = await env.SITE_CONFIG.get("ALLOW_REGISTRATION")
    // 默认允许注册 (true)，除非显式设置为 "false"
    if (allowRegistration === "false") {
      return NextResponse.json(
        { error: "管理员已关闭新用户注册" },
        { status: 403 } // 403 Forbidden
      )
    }

    const json = await request.json() as AuthSchema
    
    try {
      authSchema.parse(json)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "输入格式不正确" },
        { status: 400 }
      )
    }

    const { username, password } = json
    const user = await register(username, password)

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "注册失败" },
      { status: 500 }
    )
  }
} 