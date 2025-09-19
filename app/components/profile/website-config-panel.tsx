"use client";

import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { Role, ROLES } from "@/lib/permissions";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMAIL_CONFIG } from "@/config";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";

export function WebsiteConfigPanel() {
  const [defaultRole, setDefaultRole] = useState<string>("");
  const [emailDomains, setEmailDomains] = useState<string>("");
  const [adminContact, setAdminContact] = useState<string>("");
  const [maxEmails, setMaxEmails] = useState<string>(
    EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString()
  );
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean>(true);

  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  // 读取本地展开状态
  useEffect(() => {
    try {
      const v = localStorage.getItem("profile:website:expanded");
      if (v === "1") setExpanded(true);
    } catch {}
  }, []);

  useEffect(() => {
    // 写入本地展开状态
    try {
      localStorage.setItem("profile:website:expanded", expanded ? "1" : "0");
    } catch {}
  }, [expanded]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const res = await fetch("/api/config");
    if (res.ok) {
      const data = (await res.json()) as {
        defaultRole: Exclude<Role, typeof ROLES.EMPEROR>;
        emailDomains: string;
        adminContact: string;
        maxEmails: string;
        registrationEnabled?: string;
      };
      setDefaultRole(data.defaultRole);
      setEmailDomains(data.emailDomains);
      setAdminContact(data.adminContact);
      setMaxEmails(data.maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString());
      setRegistrationEnabled(
        (data.registrationEnabled ?? "true").toLowerCase() === "true"
      );
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultRole,
          emailDomains,
          adminContact,
          maxEmails: maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString(),
          registrationEnabled,
        }),
      });

      if (!res.ok) throw new Error("保存失败");

      toast({
        title: "保存成功",
        description: "网站设置已更新",
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-background rounded-lg border-2 border-primary/20 ${
        expanded ? "p-6" : "p-3"
      }`}
    >
      <div
        className={`flex items-center justify-between ${
          expanded ? "mb-6" : "mb-2"
        }`}
      >
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? "收起" : "展开"}
        >
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">网站设置</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/settings/cleanup")}
          >
            清理与到期策略
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm">新用户默认角色:</span>
            <Select value={defaultRole} onValueChange={setDefaultRole}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROLES.DUKE}>公爵</SelectItem>
                <SelectItem value={ROLES.KNIGHT}>骑士</SelectItem>
                <SelectItem value={ROLES.CIVILIAN}>平民</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm">邮箱域名:</span>
            <div className="flex-1">
              <Input
                value={emailDomains}
                onChange={(e) => setEmailDomains(e.target.value)}
                placeholder="多个域名用逗号分隔，如: moemail.app,bitibiti.com"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm">管理员联系方式:</span>
            <div className="flex-1">
              <Input
                value={adminContact}
                onChange={(e) => setAdminContact(e.target.value)}
                placeholder="如: 微信号、邮箱等"
              />
            </div>
          </div>

          {/* 最大邮箱数量（单行） */}
          <div className="flex items-center gap-4">
            <span className="text-sm">最大邮箱数量:</span>
            <div className="flex-1">
              <Input
                type="number"
                min="1"
                max="100"
                value={maxEmails}
                onChange={(e) => setMaxEmails(e.target.value)}
                placeholder={`默认为 ${EMAIL_CONFIG.MAX_ACTIVE_EMAILS}`}
              />
            </div>
          </div>

          {/* 允许新用户注册（独立一行） */}
          <div className="flex items-center justify-between border rounded p-3 mt-4">
            <div className="space-y-0.5">
              <Label>允许新用户注册</Label>
              <div className="text-sm text-muted-foreground">
                关闭后，/api/auth/register 将拒绝新注册
              </div>
            </div>
            <Switch
              checked={registrationEnabled}
              onCheckedChange={setRegistrationEnabled}
            />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            保存
          </Button>
        </div>
      )}
    </div>
  );
}
