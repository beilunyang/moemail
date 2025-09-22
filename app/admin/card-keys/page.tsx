"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
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

  // 状态 + 搜索 组合筛选
  useEffect(() => {
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    let result = cardKeys;
    if (selectedStatus === "unused") {
      result = result.filter(
        (key) => !key.isUsed && new Date(key.expiresAt) > now
      );
    } else if (selectedStatus === "used") {
      result = result.filter((key) => key.isUsed);
    } else if (selectedStatus === "expiring") {
      // 筛选24小时内即将过期的卡密（未过期但快过期）
      result = result.filter((key) => {
        const expiresAt = new Date(key.expiresAt);
        return expiresAt > now && expiresAt <= twentyFourHoursLater;
      });
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (k) =>
          k.code.toLowerCase().includes(q) ||
          (k.emailAddress || "").toLowerCase().includes(q) ||
          (k.usedBy?.name || "").toLowerCase().includes(q) ||
          (k.usedBy?.username || "").toLowerCase().includes(q)
      );
    }

    setFilteredCardKeys(result);
    setCurrentPage(1);
  }, [cardKeys, selectedStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCardKeys.length / pageSize));
  const paginatedCardKeys = useMemo(
    () =>
      filteredCardKeys.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      ),
    [filteredCardKeys, currentPage, pageSize]
  );

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
                <TabsTrigger value="expiring">
                  快过期 (
                  {
                    cardKeys.filter((key) => {
                      const now = new Date();
                      const twentyFourHoursLater = new Date(
                        now.getTime() + 24 * 60 * 60 * 1000
                      );
                      const expiresAt = new Date(key.expiresAt);
                      return (
                        expiresAt > now && expiresAt <= twentyFourHoursLater
                      );
                    }).length
                  }
                  )
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="mt-2 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="搜索卡密/邮箱/使用者"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-[260px]"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  显示{" "}
                  {Math.min(
                    filteredCardKeys.length,
                    (currentPage - 1) * pageSize + 1
                  )}
                  -{Math.min(currentPage * pageSize, filteredCardKeys.length)} /{" "}
                  {filteredCardKeys.length}
                </span>
                <span className="mx-1">·</span>
                <span>每页</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[80px]">
                    <SelectValue placeholder="每页" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            {paginatedCardKeys.map((cardKey) => (
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
                        const expiresAt = new Date(cardKey.expiresAt);
                        const twentyFourHoursLater = new Date(
                          now.getTime() + 24 * 60 * 60 * 1000
                        );
                        const isExpired = expiresAt <= now;
                        const isExpiring =
                          expiresAt > now && expiresAt <= twentyFourHoursLater;

                        if (isExpired) {
                          return <Badge variant="destructive">已过期</Badge>;
                        } else if (isExpiring) {
                          return (
                            <Badge
                              variant="outline"
                              className="border-orange-500 text-orange-600"
                            >
                              快过期
                            </Badge>
                          );
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
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              第 {currentPage} / {totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                下一页
              </Button>
            </div>
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
