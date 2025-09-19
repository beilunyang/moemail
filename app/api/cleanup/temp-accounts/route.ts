import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import {
  cleanupExpiredTempAccounts,
  cleanupExpiredCardKeys,
  cleanupExpiredEmails,
} from "@/lib/card-keys";

export const runtime = "edge";

export async function POST() {
  try {
    const env = getRequestContext().env;
    const [flagUsedExpired, flagEmails, flagExpiredUnused] = await Promise.all([
      env.SITE_CONFIG?.get?.("CLEANUP_DELETE_USED_EXPIRED_CARD_KEYS"),
      env.SITE_CONFIG?.get?.("CLEANUP_DELETE_EXPIRED_EMAILS"),
      env.SITE_CONFIG?.get?.("CLEANUP_DELETE_EXPIRED_UNUSED_CARD_KEYS"),
    ]);

    // 安全开关（默认开启，可在 KV(SITE_CONFIG) 设置为 "false" 关闭）
    const includeUsedExpired =
      (flagUsedExpired ?? "true").toLowerCase() === "true";
    const deleteExpiredEmails = (flagEmails ?? "true").toLowerCase() === "true";
    const deleteExpiredUnused =
      (flagExpiredUnused ?? "true").toLowerCase() === "true";

    const cleanedTempAccounts = await cleanupExpiredTempAccounts();
    const cleanedExpiredCardKeys = await cleanupExpiredCardKeys({
      includeUsedExpired,
      deleteExpiredUnused,
    });
    const cleanedExpiredEmails = deleteExpiredEmails
      ? await cleanupExpiredEmails()
      : 0;

    return NextResponse.json({
      success: true,
      message: `清理了 ${cleanedTempAccounts} 个过期临时账号，删除了 ${cleanedExpiredCardKeys} 个过期卡密（含已使用=${includeUsedExpired}，含未使用=${deleteExpiredUnused}），清理了 ${cleanedExpiredEmails} 个过期邮箱`,
      cleanedTempAccounts,
      cleanedExpiredCardKeys,
      cleanedExpiredEmails,
      includeUsedExpired,
      deleteExpiredEmails,
      deleteExpiredUnused,
    });
  } catch (error) {
    console.error("清理过期资源失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "清理失败",
      },
      { status: 500 }
    );
  }
}

// 支持定时任务调用
export async function GET() {
  return POST();
}
