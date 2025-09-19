"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, Loader2, KeyRound, User2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cardKey, setCardKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showRegClosed, setShowRegClosed] = useState(false);
  const [adminContact, setAdminContact] = useState("");
  const [showCardKeyHelp, setShowCardKeyHelp] = useState(false);
  const [cardKeyHelpMsg, setCardKeyHelpMsg] = useState("");

  const { toast } = useToast();

  const validateLoginForm = () => {
    const newErrors: FormErrors = {};
    if (!username) newErrors.username = "请输入用户名";
    if (!password) newErrors.password = "请输入密码";
    if (username.includes("@")) newErrors.username = "用户名不能包含 @ 符号";
    if (password && password.length < 8)
      newErrors.password = "密码长度必须大于等于8位";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = () => {
    const newErrors: FormErrors = {};
    if (!username) newErrors.username = "请输入用户名";
    if (!password) newErrors.password = "请输入密码";
    if (username.includes("@")) newErrors.username = "用户名不能包含 @ 符号";
    if (password && password.length < 8)
      newErrors.password = "密码长度必须大于等于8位";
    if (!confirmPassword) newErrors.confirmPassword = "请确认密码";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "两次输入的密码不一致";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLoginForm()) return;

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "登录失败",
          description: "用户名或密码错误",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      window.location.href = "/";
    } catch (error) {
      toast({
        title: "登录失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateRegisterForm()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as { error?: string };
      if (response.status === 403) {
        setShowRegClosed(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        if (response.status === 403) {
          setShowRegClosed(true);
          // 懒加载管理员联系方式，避免登录页无谓请求
          try {
            const cfgRes = await fetch("/api/config");
            if (cfgRes.ok) {
              const d: any = await cfgRes.json();
              setAdminContact(d?.adminContact || "");
            }
          } catch {}
          setLoading(false);
          return;
        }

        toast({
          title: "注册失败",
          description: data.error || "请稍后重试",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 注册成功后自动登录
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "登录失败",
          description: "自动登录失败，请手动登录",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      window.location.href = "/";
    } catch (error) {
      toast({
        title: "注册失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleCardKeyLogin = async () => {
    if (!cardKey.trim()) {
      setCardKeyHelpMsg("请输入有效的卡密；如您没有卡密，请联系管理员获取。");
      setShowCardKeyHelp(true);
      try {
        if (!adminContact) {
          const cfgRes = await fetch("/api/config");
          if (cfgRes.ok) {
            const d: any = await cfgRes.json();
            setAdminContact(d?.adminContact || "");
          }
        }
      } catch {}
      return;
    }

    console.log("[LOGIN] 开始卡密登录", { cardKey: "***" + cardKey.slice(-4) });
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        cardKey,
        redirect: false,
        callbackUrl: "/",
      });

      console.log("[LOGIN] NextAuth登录结果", {
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
        url: result?.url,
      });

      if (result?.error) {
        console.log("[LOGIN] 卡密登录失败", { error: result.error });
        setCardKeyHelpMsg(
          result.error || "卡密无效或已使用，请联系管理员获取新的卡密。"
        );
        setShowCardKeyHelp(true);
        try {
          if (!adminContact) {
            const cfgRes = await fetch("/api/config");
            if (cfgRes.ok) {
              const d: any = await cfgRes.json();
              setAdminContact(d?.adminContact || "");
            }
          }
        } catch {}
        setLoading(false);
        return;
      }

      toast({
        title: "登录成功",
        description: "欢迎使用临时邮箱服务",
      });
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "卡密登录失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleGithubLogin = () => {
    signIn("github", { callbackUrl: "/" });
  };

  const clearForm = () => {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setCardKey("");
    setErrors({});
  };

  return (
    <Card className="w-[95%] max-w-lg border-2 border-primary/20">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          欢迎使用 XiYang Mail ✨
        </CardTitle>
        <CardDescription className="text-center">
          夕阳邮箱服务 (｡◕‿◕｡) ♡
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <Tabs defaultValue="login" className="w-full" onValueChange={clearForm}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="login">登录</TabsTrigger>
            <TabsTrigger value="register">注册</TabsTrigger>
            <TabsTrigger value="cardkey">卡密</TabsTrigger>
          </TabsList>
          <div className="min-h-[220px]">
            <TabsContent value="login" className="space-y-4 mt-0">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="relative">
                    <div className="absolute left-2.5 top-2 text-muted-foreground">
                      <User2 className="h-5 w-5" />
                    </div>
                    <Input
                      className={cn(
                        "h-9 pl-9 pr-3",
                        errors.username &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder="用户名"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setErrors({});
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-destructive">
                      {errors.username}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="relative">
                    <div className="absolute left-2.5 top-2 text-muted-foreground">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <Input
                      className={cn(
                        "h-9 pl-9 pr-3",
                        errors.password &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                      type="password"
                      placeholder="密码"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors({});
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <Button
                  className="w-full"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  登录
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      或者
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGithubLogin}
                >
                  <Github className="mr-2 h-4 w-4" />
                  使用 GitHub 账号登录
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="register" className="space-y-4 mt-0">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="relative">
                    <div className="absolute left-2.5 top-2 text-muted-foreground">
                      <User2 className="h-5 w-5" />
                    </div>
                    <Input
                      className={cn(
                        "h-9 pl-9 pr-3",
                        errors.username &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder="用户名"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setErrors({});
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-destructive">
                      {errors.username}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="relative">
                    <div className="absolute left-2.5 top-2 text-muted-foreground">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <Input
                      className={cn(
                        "h-9 pl-9 pr-3",
                        errors.password &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                      type="password"
                      placeholder="密码"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors({});
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="relative">
                    <div className="absolute left-2.5 top-2 text-muted-foreground">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <Input
                      className={cn(
                        "h-9 pl-9 pr-3",
                        errors.confirmPassword &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                      type="password"
                      placeholder="确认密码"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors({});
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <Button
                  className="w-full"
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  注册
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="cardkey" className="space-y-4 mt-0">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="relative">
                    <div className="absolute left-2.5 top-2 text-muted-foreground">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <Input
                      className="h-9 pl-9 pr-3"
                      placeholder="请输入卡密 (格式: XYMAIL-XXXX-XXXX-XXXX)"
                      value={cardKey}
                      onChange={(e) => {
                        setCardKey(e.target.value);
                        setErrors({});
                      }}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <Button
                  className="w-full"
                  onClick={handleCardKeyLogin}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  使用卡密登录
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>

      {showRegClosed && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50">
          <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90%] max-w-md">
            <div className="bg-background border-2 border-primary/20 rounded-lg p-6 md:p-10 shadow-lg">
              <div className="text-center space-y-4">
                <h1 className="text-xl md:text-2xl font-bold">注册已关闭</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  当前站点已暂停新用户注册
                </p>
                <p className="text-sm md:text-base text-muted-foreground">
                  管理员联系方式：{adminContact || "2121875689@qq.com"}
                </p>
                <Button
                  onClick={() => setShowRegClosed(false)}
                  className="mt-4 w-full md:w-auto"
                >
                  知道了
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCardKeyHelp && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50">
          <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90%] max-w-md">
            <div className="bg-background border-2 border-primary/20 rounded-lg p-6 md:p-10 shadow-lg">
              <div className="text-center space-y-4">
                <h1 className="text-xl md:text-2xl font-bold">卡密登录提示</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  {cardKeyHelpMsg || "卡密无效或为空"}
                </p>
                <p className="text-sm md:text-base text-muted-foreground">
                  管理员联系方式：{adminContact || "2121875689@qq.com"}
                </p>
                <Button
                  onClick={() => setShowCardKeyHelp(false)}
                  className="mt-4 w-full md:w-auto"
                >
                  知道了
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
