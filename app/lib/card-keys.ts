import { createDb } from "./db";
import {
  cardKeys,
  tempAccounts,
  users,
  emails,
  roles,
  userRoles,
} from "./schema";
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
  console.log("[CARD-KEY] 卡密验证通过，即将检查邮箱占用情况", {
    emailAddress: cardKey.emailAddress,
  });

  // 0) 冲突检测：邮箱是否已被占用（优先判断 emails 表，再兜底 users.email 唯一约束）
  const existingEmail = await db.query.emails.findFirst({
    where: eq(emails.address, cardKey.emailAddress),
  });
  if (existingEmail) {
    let isOwnerEmperor = false;
    if (existingEmail.userId) {
      const ownerRoles = await db.query.userRoles.findMany({
        where: eq(userRoles.userId, existingEmail.userId),
        with: { role: true },
      });
      isOwnerEmperor = ownerRoles.some((ur) => ur.role.name === ROLES.EMPEROR);
    }
    const msg = isOwnerEmperor
      ? "该邮箱地址已被皇帝账户使用，请先在管理端删除该邮箱后再使用卡密"
      : "该邮箱地址已被其他用户占用，请更换邮箱地址后再试";
    console.warn("[CARD-KEY] 邮箱占用冲突", {
      msg,
      emailAddress: cardKey.emailAddress,
    });
    throw new Error(msg);
  }

  const existingUserWithEmail = await db.query.users.findFirst({
    where: eq(users.email, cardKey.emailAddress),
  });
  if (existingUserWithEmail) {
    const ownerRoles = await db.query.userRoles.findMany({
      where: eq(userRoles.userId, existingUserWithEmail.id),
      with: { role: true },
    });
    const isOwnerEmperor = ownerRoles.some(
      (ur) => ur.role.name === ROLES.EMPEROR
    );
    const msg = isOwnerEmperor
      ? "该邮箱地址已被皇帝账户使用，请先在管理端删除该邮箱后再使用卡密"
      : "该邮箱地址已被其他用户占用，请更换邮箱地址后再试";
    console.warn("[CARD-KEY] users.email 唯一约束冲突", {
      msg,
      emailAddress: cardKey.emailAddress,
    });
    throw new Error(msg);
  }

  console.log("[CARD-KEY] 邮箱未占用，开始创建用户");
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

  // 创建绑定的邮箱地址：与卡密同一到期日，确保生命周期一致
  const now = new Date();
  const emailExpiresAt = cardKey.expiresAt;

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
 * 清理过期邮箱（删除 emails.expiresAt < now 的记录；将级联删除 messages）
 */
export async function cleanupExpiredEmails() {
  const db = createDb();
  const now = new Date();
  const expiredEmails = await db.query.emails.findMany({
    where: lt(emails.expiresAt, now),
  });
  if (expiredEmails.length > 0) {
    await db.delete(emails).where(lt(emails.expiresAt, now));
  }
  return expiredEmails.length;
}

/**
 * 清理过期卡密（支持开关：是否删除“过期未使用”的卡密；是否删除“过期且已使用”的卡密）
 */
export async function cleanupExpiredCardKeys(options?: {
  includeUsedExpired?: boolean; // 是否删除“过期且已使用”的卡密（会级联删除关联临时账号与用户）
  deleteExpiredUnused?: boolean; // 是否删除“过期且未使用”的卡密（默认 true）
}) {
  const includeUsedExpired = options?.includeUsedExpired === true;
  const deleteExpiredUnused = options?.deleteExpiredUnused !== false; // 缺省删除
  const db = createDb();
  const now = new Date();

  // 1)（可选）删除“过期且未使用”的卡密
  let expiredUnusedCount = 0;
  if (deleteExpiredUnused) {
    const expiredUnused = await db.query.cardKeys.findMany({
      where: and(lt(cardKeys.expiresAt, now), eq(cardKeys.isUsed, false)),
    });
    if (expiredUnused.length > 0) {
      await db
        .delete(cardKeys)
        .where(and(lt(cardKeys.expiresAt, now), eq(cardKeys.isUsed, false)));
    }
    expiredUnusedCount = expiredUnused.length;
  }

  // 2)（可选）删除“过期且已使用”的卡密（需级联清理其临时账号/用户）
  let expiredUsedCount = 0;
  if (includeUsedExpired) {
    const expiredUsed = await db.query.cardKeys.findMany({
      where: and(lt(cardKeys.expiresAt, now), eq(cardKeys.isUsed, true)),
    });
    for (const ck of expiredUsed) {
      const ta = await db.query.tempAccounts.findFirst({
        where: eq(tempAccounts.cardKeyId, ck.id),
      });
      if (ta?.userId) {
        await db.delete(users).where(eq(users.id, ta.userId));
      }
      await db.delete(cardKeys).where(eq(cardKeys.id, ck.id));
    }
    expiredUsedCount = expiredUsed.length;
  }

  return expiredUnusedCount + expiredUsedCount;
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
