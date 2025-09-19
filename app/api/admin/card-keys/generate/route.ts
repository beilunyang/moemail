import { NextResponse } from "next/server";
import { auth, checkPermission } from "@/lib/auth";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import { generateBatchCardKeys } from "@/lib/card-keys";
import { z } from "zod";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/lib/db";
import { emails, users, userRoles } from "@/lib/schema";
import { inArray } from "drizzle-orm";

export const runtime = "edge";

const generateCardKeysSchema = z.object({
  emailAddresses: z
    .array(z.string().email("无效的邮箱地址"))
    .min(1, "至少需要一个邮箱地址"),
  expiryDays: z
    .number()
    .min(1, "过期天数必须大于0")
    .max(365, "过期天数不能超过365天")
    .optional(),
  autoReleaseEmperorOwned: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 检查权限 - 只有皇帝可以生成卡密
    const hasPermission = await checkPermission(PERMISSIONS.MANAGE_CARD_KEYS);
    if (!hasPermission) {
      return NextResponse.json(
        { error: "权限不足，只有皇帝可以生成卡密" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = generateCardKeysSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { emailAddresses, expiryDays, autoReleaseEmperorOwned } =
      validation.data as any;

    // 先检查邮箱是否已被占用（皇帝占用允许通过，其它用户占用直接阻止生成），并提供详细占用信息
    const db = createDb();
    const existingEmails = await db.query.emails.findMany({
      where: inArray(emails.address, emailAddresses),
    });

    let warnings: Array<{
      address: string;
      userId: string;
      username?: string;
      role: string;
      action?: string;
    }> = [];

    if (existingEmails.length > 0) {
      const ownerIds = Array.from(
        new Set(existingEmails.map((e) => e.userId).filter(Boolean))
      ) as string[];

      // 查询拥有者信息与角色
      const usersById = new Map<string, { id: string; username?: string }>();
      if (ownerIds.length > 0) {
        const ownerUsers = await db.query.users.findMany({
          where: inArray(users.id, ownerIds),
        });
        for (const u of ownerUsers)
          usersById.set(u.id, { id: u.id, username: (u as any).username });
      }

      const ownerRoles =
        ownerIds.length > 0
          ? await db.query.userRoles.findMany({
              where: inArray(userRoles.userId, ownerIds),
              with: { role: true },
            })
          : [];
      const emperorOwnerIds = new Set(
        ownerRoles
          .filter((or) => or.role?.name === ROLES.EMPEROR)
          .map((or) => or.userId)
      );

      const occupiedByOthers = existingEmails.filter(
        (e) => !emperorOwnerIds.has(e.userId!)
      );
      const occupiedByEmperor = existingEmails.filter((e) =>
        emperorOwnerIds.has(e.userId!)
      );

      if (occupiedByOthers.length > 0) {
        // 返回更详细的占用信息，便于提示“被谁占用”
        const occupiedBy = occupiedByOthers.map((e) => ({
          address: e.address,
          userId: e.userId!,
          username: usersById.get(e.userId!)?.username,
          role: "OTHER",
        }));
        return NextResponse.json(
          {
            error:
              "以下邮箱已被其他用户占用，无法生成对应卡密。请先删除这些邮箱后再重试。",
            occupiedBy,
          },
          { status: 400 }
        );
      }

      if (occupiedByEmperor.length > 0) {
        // 邮箱是全局唯一：若被皇帝占用且未启用自动释放，则阻止生成并提示
        const autoRelease = (autoReleaseEmperorOwned ?? true) === true;
        if (!autoRelease) {
          const occupiedBy = occupiedByEmperor.map((e) => ({
            address: e.address,
            userId: e.userId!,
            username: usersById.get(e.userId!)?.username,
            role: "EMPEROR",
          }));
          return NextResponse.json(
            {
              error:
                "以下邮箱已被皇帝账户占用。为保证唯一性，请先释放（删除邮箱）或开启自动释放后再生成卡密。",
              occupiedBy,
            },
            { status: 400 }
          );
        }
        // 启用自动释放：先删除皇帝占用的邮箱记录，再继续生成
        await db.delete(emails).where(
          inArray(
            emails.address,
            occupiedByEmperor.map((e) => e.address)
          )
        );
        warnings = occupiedByEmperor.map((e) => ({
          address: e.address,
          userId: e.userId!,
          username: usersById.get(e.userId!)?.username,
          role: "EMPEROR",
          action: "已自动释放（删除邮箱记录）",
        }));
      }
    }

    // 若未显式传入，使用 KV 中的默认天数（CARD_KEY_DEFAULT_DAYS，默认 7）
    const env = getRequestContext().env;
    const cfgDefaultDays = await env.SITE_CONFIG.get("CARD_KEY_DEFAULT_DAYS");
    const finalExpiryDays = Number(expiryDays ?? cfgDefaultDays ?? 7);

    // 生成卡密
    const cardKeys = await generateBatchCardKeys(
      emailAddresses,
      finalExpiryDays
    );

    return NextResponse.json({
      success: true,
      cardKeys,
      warnings, // 可能为空数组：返回皇帝占用的邮箱提示或已自动释放的记录
      message: `成功生成 ${cardKeys.length} 个卡密`,
    });
  } catch (error) {
    console.error("生成卡密失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成卡密失败" },
      { status: 500 }
    );
  }
}
