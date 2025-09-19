"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CreateDialog } from "./create-dialog";
import { Mail, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useThrottle } from "@/hooks/use-throttle";
import { EMAIL_CONFIG } from "@/config";
import { useToast } from "@/components/ui/use-toast";
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
import { ROLES } from "@/lib/permissions";
import { useUserRole } from "@/hooks/use-user-role";
import { useConfig } from "@/hooks/use-config";

interface Email {
  id: string;
  address: string;
  createdAt: number;
  expiresAt: number;
}

interface EmailListProps {
  onEmailSelect: (email: Email | null) => void;
  selectedEmailId?: string;
}

interface EmailResponse {
  emails: Email[];
  nextCursor: string | null;
  total: number;
}

export function EmailList({ onEmailSelect, selectedEmailId }: EmailListProps) {
  const { data: session } = useSession();
  const { config } = useConfig();
  const { role } = useUserRole();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [emailToDelete, setEmailToDelete] = useState<Email | null>(null);
  const { toast } = useToast();

  const fetchEmails = useCallback(async (cursor?: string) => {
    try {
      const url = new URL("/api/emails", window.location.origin);
      if (cursor) {
        url.searchParams.set("cursor", cursor);
      }
      const response = await fetch(url);
      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as any;
        throw new Error(err?.error || `请求失败(${response.status})`);
      }
      const data = (await response.json()) as EmailResponse;

      if (!cursor) {
        setEmails((prev) => {
          const newEmails = data.emails;
          const oldEmails = prev;
          const lastDuplicateIndex = newEmails.findIndex((newEmail) =>
            oldEmails.some((oldEmail) => oldEmail.id === newEmail.id)
          );
          if (lastDuplicateIndex === -1) {
            return newEmails;
          }
          const uniqueNewEmails = newEmails.slice(0, lastDuplicateIndex);
          return [...uniqueNewEmails, ...oldEmails];
        });
        setNextCursor(data.nextCursor);
        setTotal(data.total);
        return;
      }
      setEmails((prev) => [...prev, ...data.emails]);
      setNextCursor(data.nextCursor);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmails();
  };

  const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
    if (loadingMore) return;

    const { scrollHeight, scrollTop, clientHeight } = e.currentTarget;
    const threshold = clientHeight * 1.5;
    const remainingScroll = scrollHeight - scrollTop;

    if (remainingScroll <= threshold && nextCursor) {
      setLoadingMore(true);
      fetchEmails(nextCursor);
    }
  }, 200);

  useEffect(() => {
    if (session) fetchEmails();
  }, [session, fetchEmails]);

  const handleDelete = async (email: Email) => {
    try {
      const response = await fetch(`/api/emails/${email.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        toast({
          title: "错误",
          description: (data as { error: string }).error,
          variant: "destructive",
        });
        return;
      }

      setEmails((prev) => prev.filter((e) => e.id !== email.id));
      setTotal((prev) => prev - 1);

      toast({
        title: "成功",
        description: "邮箱已删除",
      });

      if (selectedEmailId === email.id) {
        onEmailSelect(null);
      }
    } catch {
      toast({
        title: "错误",
        description: "删除邮箱失败",
        variant: "destructive",
      });
    } finally {
      setEmailToDelete(null);
    }
  };

  if (!session) return null;

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-2 flex justify-between items-center border-b border-primary/20">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className={cn("h-8 w-8", refreshing && "animate-spin")}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-500">
              {role === ROLES.EMPEROR
                ? `${total}/∞ 个邮箱`
                : `${total}/${
                    config?.maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS
                  } 个邮箱`}
            </span>
          </div>
          {role !== ROLES.TEMP_USER && (
            <CreateDialog onEmailCreated={handleRefresh} />
          )}
        </div>

        <div className="flex-1 overflow-auto p-2" onScroll={handleScroll}>
          {loading ? (
            <div className="text-center text-sm text-gray-500">加载中...</div>
          ) : emails.length > 0 ? (
            <div className="space-y-1">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded cursor-pointer text-sm group",
                    "hover:bg-primary/5",
                    selectedEmailId === email.id && "bg-primary/10"
                  )}
                  onClick={() => onEmailSelect(email)}
                >
                  <Mail className="h-4 w-4 text-primary/60" />
                  <div className="truncate flex-1">
                    <div className="font-medium truncate">{email.address}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(email.expiresAt).getFullYear() === 9999
                        ? "永久有效"
                        : `过期时间: ${new Date(
                            email.expiresAt
                          ).toLocaleString()}`}
                    </div>
                  </div>
                  {role !== ROLES.TEMP_USER && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEmailToDelete(email);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              {loadingMore && (
                <div className="text-center text-sm text-gray-500 py-2">
                  加载更多...
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500">
              还没有邮箱，创建一个吧！
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={!!emailToDelete}
        onOpenChange={() => setEmailToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除邮箱 {emailToDelete?.address}{" "}
              吗？此操作将同时删除该邮箱中的所有邮件，且不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => emailToDelete && handleDelete(emailToDelete)}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
