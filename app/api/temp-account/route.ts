import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createDb } from "@/lib/db";
import { tempAccounts } from "@/lib/schema";
import { and, eq, gt } from "drizzle-orm";

export const runtime = "edge";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const db = createDb();
    const row = await db.query.tempAccounts.findFirst({
      where: and(
        eq(tempAccounts.userId, session.user.id),
        eq(tempAccounts.isActive, true),
        gt(tempAccounts.expiresAt, new Date())
      ),
    });

    return NextResponse.json({
      isTemp: !!row,
      expiresAt: row?.expiresAt ?? null,
    });
  } catch (error) {
    console.error("Failed to load temp account info:", error);
    return NextResponse.json({ error: "获取临时账号信息失败" }, { status: 500 });
  }
}

