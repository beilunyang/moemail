import { createDb } from "./db";
import { cardKeys, tempAccounts, users, emails, roles } from "./schema";
import { eq, and, lt, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ROLES } from "./permissions";
import { assignRoleToUser } from "./auth";

/**
 * 生成卡密代码
 */
export function generateCardKeyCode(): string {
  const prefix = "XYMAIL";
  const segments = Array.from({ length: 3 }, () => nanoid(4).toUpperCase());
  return `${prefix}-${segments.join("-")}`;
}

/**
 * 验证卡密是否有效
 */
export async function validateCardKey(code: string) {
  console.log("[CARD-KEY] 开始验证卡密", { code: "***" + code.slice(-4) });

  const db = createDb();

  const cardKey = await db.query.cardKeys.findFirst({
    where: eq(cardKeys.code, code),
  });

  console.log("[CARD-KEY] 数据库查询结果", {
    found: !!cardKey,
    isUsed: cardKey?.isUsed,
    expiresAt: cardKey?.expiresAt,
    emailAddress: cardKey?.emailAddress,
  });

  if (!cardKey) {
    console.log("[CARD-KEY] 验证失败: 卡密不存在");
    return { valid: false, error: "卡密不存在" };
  }

  if (cardKey.isUsed) {
    console.log("[CARD-KEY] 验证失败: 卡密已被使用");
    return { valid: false, error: "卡密已被使用" };
  }

  if (cardKey.expiresAt < new Date()) {
    console.log("[CARD-KEY] 验证失败: 卡密已过期", {
      expiresAt: cardKey.expiresAt,
      now: new Date(),
    });
    return { valid: false, error: "卡密已过期" };
  }

  console.log("[CARD-KEY] 验证成功");
  return { valid: true, cardKey };
}

/**
 * 使用卡密创建临时账号
 */
export async function activateCardKey(code: string) {
  console.log("[CARD-KEY] 开始激活卡密", { code: "***" + code.slice(-4) });

  const db = createDb();

  const validation = await validateCardKey(code);
  if (!validation.valid) {
    console.log("[CARD-KEY] 激活失败: 验证不通过", { error: validation.error });
    throw new Error(validation.error);
  }

  const cardKey = validation.cardKey!;
  console.log("[CARD-KEY] 卡密验证通过，开始创建用户", {
    emailAddress: cardKey.emailAddress,
  });

  // 创建临时用户
  const tempUser = await db
    .insert(users)
    .values({
      name: `临时用户_${cardKey.emailAddress.split("@")[0]}`,
      email: cardKey.emailAddress,
      username: `temp_${nanoid(8)}`,
    })
    .returning();

  const userId = tempUser[0].id;
  console.log("[CARD-KEY] 用户创建成功", {
    userId,
    username: tempUser[0].username,
  });

  // 分配临时用户角色
  console.log("[CARD-KEY] 开始分配角色");
  const tempRole = await db.query.roles.findFirst({
    where: eq(roles.name, ROLES.TEMP_USER),
  });

  if (!tempRole) {
    console.log("[CARD-KEY] 临时用户角色不存在，创建新角色");
    // 如果临时用户角色不存在，创建它
    const [newRole] = await db
      .insert(roles)
      .values({
        name: ROLES.TEMP_USER,
        description: "临时用户，只能访问绑定的邮箱",
      })
      .returning();

    console.log("[CARD-KEY] 新角色创建成功", { roleId: newRole.id });
    await assignRoleToUser(db, userId, newRole.id);
  } else {
    console.log("[CARD-KEY] 使用现有临时用户角色", { roleId: tempRole.id });
    await assignRoleToUser(db, userId, tempRole.id);
  }
  console.log("[CARD-KEY] 角色分配完成");

  // 创建绑定的邮箱地址
  const now = new Date();
  const emailExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后过期

  await db.insert(emails).values({
    address: cardKey.emailAddress,
    userId: userId,
    createdAt: now,
    expiresAt: emailExpiresAt,
  });

  // 创建临时账号记录
  await db.insert(tempAccounts).values({
    userId: userId,
    cardKeyId: cardKey.id,
    emailAddress: cardKey.emailAddress,
    createdAt: now,
    expiresAt: emailExpiresAt,
  });

  // 标记卡密为已使用
  console.log("[CARD-KEY] 标记卡密为已使用");
  await db
    .update(cardKeys)
    .set({
      isUsed: true,
      usedBy: userId,
      usedAt: now,
    })
    .where(eq(cardKeys.id, cardKey.id));

  console.log("[CARD-KEY] 卡密激活完成", {
    userId,
    emailAddress: cardKey.emailAddress,
    expiresAt: emailExpiresAt,
  });

  return {
    userId,
    emailAddress: cardKey.emailAddress,
    expiresAt: emailExpiresAt,
  };
}

/**
 * 检查用户是否为临时用户
 */
export async function isTempUser(userId: string): Promise<boolean> {
  const db = createDb();

  const tempAccount = await db.query.tempAccounts.findFirst({
    where: and(
      eq(tempAccounts.userId, userId),
      eq(tempAccounts.isActive, true),
      gt(tempAccounts.expiresAt, new Date())
    ),
  });

  return !!tempAccount;
}

/**
 * 获取临时用户绑定的邮箱地址
 */
export async function getTempUserEmailAddress(
  userId: string
): Promise<string | null> {
  const db = createDb();

  const tempAccount = await db.query.tempAccounts.findFirst({
    where: and(
      eq(tempAccounts.userId, userId),
      eq(tempAccounts.isActive, true),
      gt(tempAccounts.expiresAt, new Date())
    ),
  });

  return tempAccount?.emailAddress || null;
}

/**
 * 清理过期的临时账号
 */
export async function cleanupExpiredTempAccounts() {
  const db = createDb();
  const now = new Date();

  // 查找过期的临时账号
  const expiredAccounts = await db.query.tempAccounts.findMany({
    where: and(
      eq(tempAccounts.isActive, true),
      lt(tempAccounts.expiresAt, now)
    ),
  });

  for (const account of expiredAccounts) {
    // 删除用户及相关数据（级联删除会处理邮箱和消息）
    await db.delete(users).where(eq(users.id, account.userId));

    // 标记临时账号为非活跃
    await db
      .update(tempAccounts)
      .set({ isActive: false })
      .where(eq(tempAccounts.id, account.id));
  }

  return expiredAccounts.length;
}

/**
 * 生成批量卡密
 */
export async function generateBatchCardKeys(
  emailAddresses: string[],
  expiryDays: number = 30
): Promise<{ code: string; emailAddress: string }[]> {
  const db = createDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

  const cardKeyData = emailAddresses.map((emailAddress) => ({
    code: generateCardKeyCode(),
    emailAddress,
    expiresAt,
    createdAt: now,
  }));

  await db.insert(cardKeys).values(cardKeyData);

  return cardKeyData.map(({ code, emailAddress }) => ({ code, emailAddress }));
}
