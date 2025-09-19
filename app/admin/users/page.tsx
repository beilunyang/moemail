"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  ArrowLeft,
  Users,
  Crown,
  Shield,
  Sword,
  User,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useRolePermission } from "@/hooks/use-role-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  image?: string;
  role: string;
  roleName: string;
  createdAt?: string;
  tempExpiresAt?: string | null;
}

const roleIcons = {
  emperor: Crown,
  duke: Shield,
  knight: Sword,
  civilian: User,
  temp_user: User,
};

const roleColors = {
  emperor: "bg-yellow-500",
  duke: "bg-purple-500",
  knight: "bg-blue-500",
  civilian: "bg-green-500",
  temp_user: "bg-gray-500",
};

const roleOptions = [
  { value: "emperor", label: "皇帝", description: "网站所有者" },
  { value: "duke", label: "公爵", description: "超级用户" },
  { value: "knight", label: "骑士", description: "高级用户" },
  { value: "civilian", label: "平民", description: "普通用户" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const { toast } = useToast();
  const { checkPermission } = useRolePermission();
  const router = useRouter();

  const canManageUsers = checkPermission(PERMISSIONS.PROMOTE_USER);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "获取用户列表失败");
      }

      const data = (await response.json()) as { users: User[] };
      setUsers(data.users);
      setFilteredUsers(data.users);
    } catch (error) {
      toast({
        title: "错误",
        description:
          error instanceof Error ? error.message : "获取用户列表失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers, fetchUsers]);

  // 搜索 + 角色筛选组合逻辑
  useEffect(() => {
    let result =
      selectedRole === "all"
        ? users
        : users.filter((u) => u.role === selectedRole);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.username || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
      );
    }
    setFilteredUsers(result);
    setCurrentPage(1);
  }, [users, selectedRole, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(
    () =>
      filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredUsers, currentPage, pageSize]
  );

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdating(userId);
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          newRole,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "更新用户角色失败");
      }

      const data = (await response.json()) as { message: string };
      toast({
        title: "成功",
        description: data.message,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: "错误",
        description:
          error instanceof Error ? error.message : "更新用户角色失败",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setUpdating(userId);
      const response = await fetch(
        `/api/admin/users?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      const data = (await response.json().catch(() => null)) as any;
      if (!response.ok) {
        throw new Error(data?.error || "删除用户失败");
      }
      toast({ title: "成功", description: data?.message || "用户已删除" });
      fetchUsers();
    } catch (error) {
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "删除用户失败",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  if (!canManageUsers) {
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            用户管理
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>用户列表</CardTitle>
            <div className="text-sm text-muted-foreground">
              共 {filteredUsers.length} 个用户
            </div>
          </div>
          <Tabs
            value={selectedRole}
            onValueChange={setSelectedRole}
            className="mt-4"
          >
            <TabsList className="grid grid-cols-6 gap-2 w-auto">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                全部
              </TabsTrigger>
              <TabsTrigger value="emperor" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                皇帝
              </TabsTrigger>
              <TabsTrigger value="duke" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                公爵
              </TabsTrigger>
              <TabsTrigger value="knight" className="flex items-center gap-2">
                <Sword className="h-4 w-4" />
                骑士
              </TabsTrigger>
              <TabsTrigger value="civilian" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                平民
              </TabsTrigger>
              <TabsTrigger
                value="temp_user"
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                临时用户
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <div className="flex items-center gap-3">
              <Input
                placeholder="搜索用户名/邮箱"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[240px]"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                显示{" "}
                {Math.min(
                  filteredUsers.length,
                  (currentPage - 1) * pageSize + 1
                )}
                -{Math.min(currentPage * pageSize, filteredUsers.length)} /{" "}
                {filteredUsers.length}
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[22%]">用户</TableHead>
                    <TableHead className="w-[26%]">邮箱</TableHead>
                    <TableHead className="w-[16%]">当前角色</TableHead>
                    <TableHead className="w-[18%]">到期时间</TableHead>
                    <TableHead className="w-[12%] min-w-[180px]">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const RoleIcon =
                      roleIcons[user.role as keyof typeof roleIcons] || User;
                    const roleColor =
                      roleColors[user.role as keyof typeof roleColors] ||
                      "bg-gray-500";

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name || user.username}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">
                                {user.name || user.username}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="truncate">
                          <span className="truncate block max-w-[200px]">
                            {user.email}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${roleColor} text-white`}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {user.roleName}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {user.role === "temp_user" && user.tempExpiresAt
                            ? new Date(user.tempExpiresAt).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap overflow-visible pr-4">
                          <div className="flex items-center gap-2 flex-nowrap">
                            <Select
                              value={user.role}
                              onValueChange={(newRole) =>
                                updateUserRole(user.id, newRole)
                              }
                              disabled={updating === user.id}
                            >
                              <SelectTrigger className="w-20 min-w-[88px] whitespace-nowrap">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {roleOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="ml-2"
                              disabled={
                                updating === user.id || user.role === "emperor"
                              }
                              onClick={() => deleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
