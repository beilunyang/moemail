import { NextResponse } from "next/server";
import { activateCardKey, validateCardKey } from "@/lib/card-keys";
import { z } from "zod";

export const runtime = "edge";

const cardKeyLoginSchema = z.object({
  cardKey: z.string().min(1, "请输入卡密"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = cardKeyLoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { cardKey } = validation.data;

    // 验证卡密
    const cardKeyValidation = await validateCardKey(cardKey);
    if (!cardKeyValidation.valid) {
      return NextResponse.json(
        { error: cardKeyValidation.error },
        { status: 400 }
      );
    }

    // 使用卡密创建临时账号
    const result = await activateCardKey(cardKey);

    return NextResponse.json({
      success: true,
      message: "卡密验证成功，临时账号已创建",
      data: {
        userId: result.userId,
        emailAddress: result.emailAddress,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    console.error("卡密登录失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "卡密登录失败" },
      { status: 500 }
    );
  }
}
