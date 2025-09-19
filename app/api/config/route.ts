import { PERMISSIONS, Role, ROLES } from "@/lib/permissions";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { EMAIL_CONFIG } from "@/config";
import { checkPermission } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  const env = getRequestContext().env;
  const [
    defaultRole,
    emailDomains,
    adminContact,
    maxEmails,
    cleanupUsedExpired,
    cleanupExpiredEmails,
    cleanupExpiredUnused,
    cardKeyDefaultDays,
    commentUsedExpired,
    commentExpiredUnused,
    commentExpiredEmails,
    registrationEnabled,
  ] = await Promise.all([
    env.SITE_CONFIG.get("DEFAULT_ROLE"),
    env.SITE_CONFIG.get("EMAIL_DOMAINS"),
    env.SITE_CONFIG.get("ADMIN_CONTACT"),
    env.SITE_CONFIG.get("MAX_EMAILS"),
    env.SITE_CONFIG.get("CLEANUP_DELETE_USED_EXPIRED_CARD_KEYS"),
    env.SITE_CONFIG.get("CLEANUP_DELETE_EXPIRED_EMAILS"),
    env.SITE_CONFIG.get("CLEANUP_DELETE_EXPIRED_UNUSED_CARD_KEYS"),
    env.SITE_CONFIG.get("CARD_KEY_DEFAULT_DAYS"),
    env.SITE_CONFIG.get("COMMENT__CLEANUP_DELETE_USED_EXPIRED_CARD_KEYS"),
    env.SITE_CONFIG.get("COMMENT__CLEANUP_DELETE_EXPIRED_UNUSED_CARD_KEYS"),
    env.SITE_CONFIG.get("COMMENT__CLEANUP_DELETE_EXPIRED_EMAILS"),
    env.SITE_CONFIG.get("REGISTRATION_ENABLED"),
  ]);

  return Response.json({
    defaultRole: defaultRole || ROLES.CIVILIAN,
    emailDomains: emailDomains || "moemail.app",
    adminContact: adminContact || "",
    maxEmails: maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString(),
    cleanupDeleteUsedExpiredCardKeys: (cleanupUsedExpired ?? "true").toString(),
    cleanupDeleteExpiredEmails: (cleanupExpiredEmails ?? "true").toString(),
    cleanupDeleteExpiredUnusedCardKeys: (
      cleanupExpiredUnused ?? "true"
    ).toString(),
    registrationEnabled: (registrationEnabled ?? "true").toString(),

    cardKeyDefaultDays: (cardKeyDefaultDays ?? "7").toString(),
    // 可选注释（以 COMMENT__ 前缀的 KV 键存储）
    commentCleanupDeleteUsedExpiredCardKeys: commentUsedExpired || "",
    commentCleanupDeleteExpiredUnusedCardKeys: commentExpiredUnused || "",
    commentCleanupDeleteExpiredEmails: commentExpiredEmails || "",
  });
}

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG);

  if (!canAccess) {
    return Response.json(
      {
        error: "权限不足",
      },
      { status: 403 }
    );
  }

  const {
    defaultRole,
    emailDomains,
    adminContact,
    maxEmails,
    cleanupDeleteUsedExpiredCardKeys,
    cleanupDeleteExpiredEmails,
    cleanupDeleteExpiredUnusedCardKeys,
    cardKeyDefaultDays,
    registrationEnabled,
    commentCleanupDeleteUsedExpiredCardKeys,
    commentCleanupDeleteExpiredUnusedCardKeys,
    commentCleanupDeleteExpiredEmails,
  } = (await request.json()) as {
    defaultRole: Exclude<Role, typeof ROLES.EMPEROR>;
    emailDomains: string;
    adminContact: string;
    maxEmails: string;
    cleanupDeleteUsedExpiredCardKeys?: string | boolean;
    cleanupDeleteExpiredEmails?: string | boolean;
    cleanupDeleteExpiredUnusedCardKeys?: string | boolean;
    cardKeyDefaultDays?: string | number;
    registrationEnabled?: string | boolean;
    commentCleanupDeleteUsedExpiredCardKeys?: string;
    commentCleanupDeleteExpiredUnusedCardKeys?: string;
    commentCleanupDeleteExpiredEmails?: string;
  };

  if (
    ![ROLES.DUKE, ROLES.KNIGHT, ROLES.CIVILIAN].includes(
      defaultRole as
        | typeof ROLES.DUKE
        | typeof ROLES.KNIGHT
        | typeof ROLES.CIVILIAN
    )
  ) {
    return Response.json({ error: "无效的角色" }, { status: 400 });
  }

  const env = getRequestContext().env;
  await Promise.all([
    env.SITE_CONFIG.put("DEFAULT_ROLE", defaultRole),
    env.SITE_CONFIG.put("EMAIL_DOMAINS", emailDomains),
    env.SITE_CONFIG.put("ADMIN_CONTACT", adminContact),
    env.SITE_CONFIG.put("MAX_EMAILS", maxEmails),
    env.SITE_CONFIG.put(
      "CLEANUP_DELETE_USED_EXPIRED_CARD_KEYS",
      (typeof cleanupDeleteUsedExpiredCardKeys === "boolean"
        ? cleanupDeleteUsedExpiredCardKeys
        : cleanupDeleteUsedExpiredCardKeys ?? "true"
      ).toString()
    ),
    env.SITE_CONFIG.put(
      "CLEANUP_DELETE_EXPIRED_EMAILS",
      (typeof cleanupDeleteExpiredEmails === "boolean"
        ? cleanupDeleteExpiredEmails
        : cleanupDeleteExpiredEmails ?? "true"
      ).toString()
    ),
    env.SITE_CONFIG.put(
      "REGISTRATION_ENABLED",
      (typeof registrationEnabled === "boolean"
        ? registrationEnabled
        : registrationEnabled ?? "true"
      ).toString()
    ),
    env.SITE_CONFIG.put(
      "CLEANUP_DELETE_EXPIRED_UNUSED_CARD_KEYS",
      (typeof cleanupDeleteExpiredUnusedCardKeys === "boolean"
        ? cleanupDeleteExpiredUnusedCardKeys
        : cleanupDeleteExpiredUnusedCardKeys ?? "true"
      ).toString()
    ),
    // 注释键（可选）
    env.SITE_CONFIG.put(
      "COMMENT__CLEANUP_DELETE_USED_EXPIRED_CARD_KEYS",
      (commentCleanupDeleteUsedExpiredCardKeys ?? "").toString()
    ),
    env.SITE_CONFIG.put(
      "COMMENT__CLEANUP_DELETE_EXPIRED_UNUSED_CARD_KEYS",
      (commentCleanupDeleteExpiredUnusedCardKeys ?? "").toString()
    ),
    env.SITE_CONFIG.put(
      "COMMENT__CLEANUP_DELETE_EXPIRED_EMAILS",
      (commentCleanupDeleteExpiredEmails ?? "").toString()
    ),
    env.SITE_CONFIG.put(
      "CARD_KEY_DEFAULT_DAYS",
      (cardKeyDefaultDays ?? "7").toString()
    ),
  ]);

  return Response.json({ success: true });
}
