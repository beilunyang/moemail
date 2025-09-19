import { NextResponse } from "next/server";
import { register } from "@/lib/auth";
import { authSchema, AuthSchema } from "@/lib/validation";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    // 注册开关：从 KV 读取，若关闭则直接拒绝
    try {
      const env = getRequestContext().env;
      const enabled = await env.SITE_CONFIG.get("REGISTRATION_ENABLED");
      if ((enabled ?? "true").toString().toLowerCase() !== "true") {
        return NextResponse.json(
          { error: "当前已暂停注册，请联系网站管理员" },
          { status: 403 }
        );
      }
    } catch {
      // 读取失败时不拦截，继续后续流程
    }

    const json = (await request.json()) as AuthSchema;

    try {
      authSchema.parse(json);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "输入格式不正确" },
        { status: 400 }
      );
    }

    const { username, password } = json;
    const user = await register(username, password);

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "注册失败" },
      { status: 500 }
    );
  }
}
