import { NextResponse } from "next/server";
import { auth, checkPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createDb } from "@/lib/db";
import { cardKeys, tempAccounts, users } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 检查权限
    const hasPermission = await checkPermission(PERMISSIONS.MANAGE_CARD_KEYS);
    if (!hasPermission) {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const db = createDb();

    // 获取卡密列表
    const cardKeysList = await db.query.cardKeys.findMany({
      orderBy: [desc(cardKeys.createdAt)],
      limit,
      offset,
      with: {
        usedByUser: {
          columns: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    // 获取总数
    const totalResult = await db.select({ count: cardKeys.id }).from(cardKeys);
    const total = totalResult.length;

    return NextResponse.json({
      cardKeys: cardKeysList.map((key) => ({
        id: key.id,
        code: key.code,
        emailAddress: key.emailAddress,
        isUsed: key.isUsed,
        usedBy: key.usedByUser
          ? {
              id: key.usedByUser.id,
              name: key.usedByUser.name,
              username: key.usedByUser.username,
            }
          : null,
        usedAt: key.usedAt,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取卡密列表失败:", error);
    return NextResponse.json({ error: "获取卡密列表失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 检查权限
    const hasPermission = await checkPermission(PERMISSIONS.MANAGE_CARD_KEYS);
    if (!hasPermission) {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cardKeyId = searchParams.get("id");

    if (!cardKeyId) {
      return NextResponse.json({ error: "缺少卡密ID" }, { status: 400 });
    }

    const db = createDb();

    // 检查卡密是否存在
    const cardKey = await db.query.cardKeys.findFirst({
      where: eq(cardKeys.id, cardKeyId),
    });

    if (!cardKey) {
      return NextResponse.json({ error: "卡密不存在" }, { status: 404 });
    }

    // 若已使用，级联删除其关联的临时账号与用户数据
    if (cardKey.isUsed) {
      const ta = await db.query.tempAccounts.findFirst({
        where: eq(tempAccounts.cardKeyId, cardKey.id),
      });
      if (ta?.userId) {
        // 删除用户将级联删除 emails/messages/user_roles 等（schema 已配置 onDelete: cascade）
        await db.delete(users).where(eq(users.id, ta.userId));
      }
    }

    // 删除卡密本身
    await db.delete(cardKeys).where(eq(cardKeys.id, cardKeyId));

    return NextResponse.json({
      success: true,
      message: "卡密删除成功",
    });
  } catch (error) {
    console.error("删除卡密失败:", error);
    return NextResponse.json({ error: "删除卡密失败" }, { status: 500 });
  }
}
