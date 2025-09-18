"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Copy, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRolePermission } from "@/hooks/use-role-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useRouter } from "next/navigation";

interface CardKey {
  id: string;
  code: string;
  emailAddress: string;
  isUsed: boolean;
  usedBy?: {
    id: string;
    name: string;
    username: string;
  };
  usedAt?: string;
  createdAt: string;
  expiresAt: string;
}

export default function CardKeysPage() {
  const [cardKeys, setCardKeys] = useState<CardKey[]>([]);
  const [filteredCardKeys, setFilteredCardKeys] = useState<CardKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [emailAddresses, setEmailAddresses] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cardKeyToDelete, setCardKeyToDelete] = useState<CardKey | null>(null);
  const [autoReleaseEmperorOwned, setAutoReleaseEmperorOwned] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { toast } = useToast();
  const { checkPermission } = useRolePermission();
  const router = useRouter();

  const canManageCardKeys = checkPermission(PERMISSIONS.MANAGE_CARD_KEYS);

  const fetchCardKeys = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/card-keys");
      if (!response.ok) {
        throw new Error("获取卡密列表失败");
      }
      const data = (await response.json()) as { cardKeys: CardKey[] };
      setCardKeys(data.cardKeys);
      setFilteredCardKeys(data.cardKeys);
    } catch (error) {
      toast({
        title: "错误",
        description:
          error instanceof Error ? error.message : "获取卡密列表失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (canManageCardKeys) {
      fetchCardKeys();
    }
  }, [canManageCardKeys, fetchCardKeys]);

  // 状态筛选逻辑
  useEffect(() => {
    const now = new Date();
    if (selectedStatus === "all") {
      setFilteredCardKeys(cardKeys);
    } else if (selectedStatus === "unused") {
      setFilteredCardKeys(
        cardKeys.filter((key) => !key.isUsed && new Date(key.expiresAt) > now)
      );
    } else if (selectedStatus === "used") {
      setFilteredCardKeys(cardKeys.filter((key) => key.isUsed));
    } else if (selectedStatus === "expired") {
      setFilteredCardKeys(
        cardKeys.filter((key) => new Date(key.expiresAt) <= now)
      );
    }
  }, [cardKeys, selectedStatus]);

  const generateCardKeys = async () => {
    const addresses = emailAddresses
      .split("\n")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);

    if (addresses.length === 0) {
      toast({
        title: "错误",
        description: "请输入至少一个邮箱地址",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/admin/card-keys/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailAddresses: addresses,
          expiryDays: parseInt(expiryDays),
          autoReleaseEmperorOwned,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as {
          error: string;
          occupiedBy?: { address: string; username?: string }[];
        };
        const detail = data.occupiedBy?.length
          ? `\n冲突邮箱：` +
            data.occupiedBy
              .map(
                (o) => `${o.address}${o.username ? `（${o.username}）` : ""}`
              )
              .join(", ")
          : "";
        throw new Error((data.error || "生成卡密失败") + detail);
      }

      const data = (await response.json()) as {
        message: string;
        cardKeys: { code: string; emailAddress: string }[];
        warnings?: { address: string; action?: string }[];
      };
      toast({ title: "成功", description: data.message });

      if (data.warnings && data.warnings.length > 0) {
        const preview = data.warnings
          .slice(0, 5)
          .map((w) => `${w.address}${w.action ? `：${w.action}` : ""}`)
          .join("\n");
        toast({
          title: "注意",
          description: `${data.warnings.length} 个邮箱由皇帝占用。${
            autoReleaseEmperorOwned ? "已自动释放。" : "激活前需先释放。"
          }\n${preview}`,
        });
      }

      // 注意：不再自动下载 TXT，避免浏览器自动下载文件造成干扰
      // 如需导出，请在列表中手动复制

      setDialogOpen(false);
      setEmailAddresses("");
      fetchCardKeys();
    } catch (error) {
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "生成卡密失败",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "已复制",
      description: "卡密已复制到剪贴板",
    });
  };

  const deleteCardKey = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/card-keys?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error: string };
        throw new Error(data.error);
      }

      toast({
        title: "成功",
        description: "卡密删除成功",
      });
      setCardKeyToDelete(null);
      fetchCardKeys();
    } catch (error) {
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "删除卡密失败",
        variant: "destructive",
      });
    }
  };

  if (!canManageCardKeys) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              您没有权限访问此页面
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <h1 className="text-3xl font-bold">卡密管理</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              生成卡密
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>生成卡密</DialogTitle>
              <DialogDescription>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoRelease">
                    若被皇帝占用，自动释放并生成
                  </Label>
                  <Switch
                    id="autoRelease"
                    checked={autoReleaseEmperorOwned}
                    onCheckedChange={setAutoReleaseEmperorOwned}
                  />
                </div>
                为指定的邮箱地址生成卡密，每行一个邮箱地址
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="emails">邮箱地址</Label>
                <Textarea
                  id="emails"
                  placeholder="user1@example.com&#10;user2@example.com"
                  value={emailAddresses}
                  onChange={(e) => setEmailAddresses(e.target.value)}
                  rows={5}
                />
              </div>
              <div>
                <Label htmlFor="expiry">有效期（天）</Label>
                <Input
                  id="expiry"
                  type="number"
                  min="1"
                  max="365"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                />
              </div>
              <Button
                onClick={generateCardKeys}
                disabled={generating}
                className="w-full"
              >
                {generating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                生成卡密
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">全部 ({cardKeys.length})</TabsTrigger>
                <TabsTrigger value="unused">
                  未使用 (
                  {
                    cardKeys.filter(
                      (key) =>
                        !key.isUsed && new Date(key.expiresAt) > new Date()
                    ).length
                  }
                  )
                </TabsTrigger>
                <TabsTrigger value="used">
                  已使用 ({cardKeys.filter((key) => key.isUsed).length})
                </TabsTrigger>
                <TabsTrigger value="expired">
                  已过期 (
                  {
                    cardKeys.filter(
                      (key) => new Date(key.expiresAt) <= new Date()
                    ).length
                  }
                  )
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="text-sm text-muted-foreground">
              显示 {filteredCardKeys.length} 个卡密
            </div>
          </div>
          <div className="grid gap-4">
            {filteredCardKeys.map((cardKey) => (
              <Card key={cardKey.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {cardKey.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(cardKey.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        邮箱: {cardKey.emailAddress}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        创建时间: {new Date(cardKey.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        过期时间: {new Date(cardKey.expiresAt).toLocaleString()}
                      </p>
                      {cardKey.isUsed && cardKey.usedBy && (
                        <p className="text-sm text-muted-foreground">
                          使用者:{" "}
                          {cardKey.usedBy.name || cardKey.usedBy.username}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const now = new Date();
                        const isExpired = new Date(cardKey.expiresAt) <= now;

                        if (isExpired) {
                          return <Badge variant="destructive">已过期</Badge>;
                        } else if (cardKey.isUsed) {
                          return <Badge variant="secondary">已使用</Badge>;
                        } else {
                          return <Badge variant="default">未使用</Badge>;
                        }
                      })()}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCardKeyToDelete(cardKey)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      {/* 删除确认对话框 */}
      <AlertDialog
        open={!!cardKeyToDelete}
        onOpenChange={() => setCardKeyToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {cardKeyToDelete?.isUsed
                ? "该卡密已被使用，确认删除将同步删除关联的临时账户及其数据，且不可恢复。确定继续？"
                : "确定要删除该卡密吗？此操作不可恢复。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() =>
                cardKeyToDelete && deleteCardKey(cardKeyToDelete.id)
              }
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
