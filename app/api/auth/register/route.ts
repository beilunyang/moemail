import { NextResponse } from "next/server"
import { register } from "@/lib/auth"
import { authSchema, AuthSchema } from "@/lib/validation"
import { verifyTurnstileToken } from "@/lib/turnstile"


export async function POST(request: Request) {
  try {
    const json = await request.json() as AuthSchema
    
    try {
      authSchema.parse(json)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "输入格式不正确" },
        { status: 400 }
      )
    }

    const { username, password, turnstileToken } = json

    const verification = await verifyTurnstileToken(turnstileToken)
    if (!verification.success) {
      const message = verification.reason === "missing-token"
        ? "请先完成安全验证"
        : "安全验证未通过"
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const user = await register(username, password)

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "注册失败" },
      { status: 500 }
    )
  }
} 
