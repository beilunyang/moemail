"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function CleanupSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // 全量配置（为满足 /api/config POST 的参数要求）
  const [defaultRole, setDefaultRole] = useState("CIVILIAN");
  const [emailDomains, setEmailDomains] = useState("");
  const [adminContact, setAdminContact] = useState("");
  const [maxEmails, setMaxEmails] = useState("10");
  const [cardKeyDefaultDays, setCardKeyDefaultDays] = useState("7");

  // 清理相关开关
  const [cleanupUsedExpired, setCleanupUsedExpired] = useState(true);
  const [cleanupExpiredEmails, setCleanupExpiredEmails] = useState(true);
  const [cleanupExpiredUnused, setCleanupExpiredUnused] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);
      try {
        const res = await fetch("/api/config", { cache: "no-store" });
        if (!res.ok) throw new Error(`获取配置失败（${res.status}）`);
        const data = (await res.json()) as any;
        setDefaultRole((data as any).defaultRole || "CIVILIAN");
        setEmailDomains(data.emailDomains || "");
        setAdminContact(data.adminContact || "");
        setMaxEmails(data.maxEmails || "10");
        setCardKeyDefaultDays(data.cardKeyDefaultDays || "7");
        setCleanupUsedExpired(
          (data.cleanupDeleteUsedExpiredCardKeys ?? "true").toLowerCase() ===
            "true"
        );
        setCleanupExpiredEmails(
          (data.cleanupDeleteExpiredEmails ?? "true").toLowerCase() === "true"
        );
        setCleanupExpiredUnused(
          (data.cleanupDeleteExpiredUnusedCardKeys ?? "true").toLowerCase() ===
            "true"
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "获取配置失败");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultRole,
          emailDomains,
          adminContact,
          maxEmails,
          cleanupDeleteUsedExpiredCardKeys: cleanupUsedExpired,
          cleanupDeleteExpiredEmails: cleanupExpiredEmails,
          cleanupDeleteExpiredUnusedCardKeys: cleanupExpiredUnused,
          cardKeyDefaultDays,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "保存失败");
      }
      setMessage("已保存");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl md:max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-semibold">清理与到期策略</h1>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          返回
        </Button>
      </div>

      {loading ? (
        <div>加载中…</div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-md bg-muted/30 border p-3 text-xs text-muted-foreground space-y-1">
            <div>自动清理说明：</div>
            <ul className="list-disc list-inside space-y-1">
              <li>
                清理任务由 Cloudflare Scheduled Triggers 定时触发（通常每 24
                小时一次），也可手动调用 /api/cleanup/temp-accounts。
              </li>
              <li>
                当前定时规则（wrangler.temp-cleanup.json）：*/30 * * * *（每 30
                分钟一次）。
              </li>

              <li>关闭某项开关后，对应资源将不再被自动清理。</li>
              <li>“清理过期邮箱”会级联删除该邮箱下的所有消息，请谨慎开启。</li>
              <li>
                卡密过期规则受“卡密默认有效期（天）”与生成时的自定义参数共同影响。
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium">卡密与邮箱清理开关</h2>
            <div className="flex items-center justify-between border rounded p-3">
              <div>
                <div className="font-medium">删除“已使用且过期”的卡密</div>
                <div className="text-xs text-muted-foreground">
                  过期且已被使用的卡密，将连带清理对应的临时账号/用户及其数据。
                </div>
              </div>
              <Switch
                checked={cleanupUsedExpired}
                onCheckedChange={setCleanupUsedExpired}
              />
            </div>

            <div className="flex items-center justify-between border rounded p-3 mt-4">
              <div>
                <div className="font-medium">删除“过期未使用”的卡密</div>
                <div className="text-xs text-muted-foreground">
                  仅删除已过期且未被使用的卡密；不涉及任何用户级联。
                </div>
              </div>
              <Switch
                checked={cleanupExpiredUnused}
                onCheckedChange={setCleanupExpiredUnused}
              />
            </div>

            <div className="flex items-center justify-between border rounded p-3 mt-4">
              <div>
                <div className="font-medium">删除“已过期邮箱（含消息）”</div>
                <div className="text-xs text-muted-foreground">
                  删除 emails 表中过期记录；会级联删除该邮箱下的消息。
                </div>
              </div>

              <Switch
                checked={cleanupExpiredEmails}
                onCheckedChange={setCleanupExpiredEmails}
              />
            </div>
          </section>

          <section className="space-y-2 mt-6">
            <h2 className="text-lg font-medium">卡密默认有效期</h2>
            <div className="flex items-center gap-3 border rounded p-3">
              <div className="min-w-[9rem] text-sm">默认有效期（天）</div>
              <div className="flex-1 max-w-[220px]">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={cardKeyDefaultDays}
                  onChange={(e) => setCardKeyDefaultDays(e.target.value)}
                  placeholder="默认 7 天"
                />
              </div>
            </div>
          </section>

          {error && <div className="text-red-600 text-sm">{error}</div>}
          {message && <div className="text-green-600 text-sm">{message}</div>}

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
            >
              {saving ? "保存中…" : "保存设置"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
