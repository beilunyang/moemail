import { NextResponse } from "next/server"
import { register } from "@/lib/auth"
import { authSchema, AuthSchema } from "@/lib/validation"

export const runtime = "edge"

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