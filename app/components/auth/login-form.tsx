"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Github, Loader2, KeyRound, User2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormErrors {
  username?: string
  password?: string
  confirmPassword?: string
}

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const { toast } = useToast()

  const validateLoginForm = () => {
    const newErrors: FormErrors = {}
    if (!username) newErrors.username = "請輸入用戶名"
    if (!password) newErrors.password = "請輸入密碼"
    if (username.includes('@')) newErrors.username = "用戶名不能包含 @ 符號"
    if (password && password.length < 8) newErrors.password = "密碼長度必須大於等於8位"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateRegisterForm = () => {
    const newErrors: FormErrors = {}
    if (!username) newErrors.username = "請輸入用戶名"
    if (!password) newErrors.password = "請輸入密碼"
    if (username.includes('@')) newErrors.username = "用戶名不能包含 @ 符號"
    if (password && password.length < 8) newErrors.password = "密碼長度必須大於等於8位"
    if (!confirmPassword) newErrors.confirmPassword = "請確認密碼"
    if (password !== confirmPassword) newErrors.confirmPassword = "兩次輸入的密碼不一致"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validateLoginForm()) return

    setLoading(true)
    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: "登錄失敗",
          description: "用戶名或密碼錯誤",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      window.location.href = "/"
    } catch (error) {
      toast({
        title: "登錄失敗",
        description: error instanceof Error ? error.message : "請稍後重試",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!validateRegisterForm()) return

    setLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json() as { error?: string }

      if (!response.ok) {
        toast({
          title: "注冊失敗",
          description: data.error || "請稍後重試",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // 注冊成功後自動登錄
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: "登錄失敗",
          description: "自動登錄失敗，請手動登錄",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      window.location.href = "/"
    } catch (error) {
      toast({
        title: "注冊失敗",
        description: error instanceof Error ? error.message : "請稍後重試",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleGithubLogin = () => {
    signIn("github", { callbackUrl: "/" })
  }

  const clearForm = () => {
    setUsername("")
    setPassword("")
    setConfirmPassword("")
    setErrors({})
  }

  return (
    <Card className="w-[95%] max-w-lg border-2 border-primary/20">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          歡迎使用 MoeMail
        </CardTitle>
        <CardDescription className="text-center">
          萌萌噠臨時郵箱服務 (。・∀・)ノ
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <Tabs defaultValue="login" className="w-full" onValueChange={clearForm}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">登錄</TabsTrigger>
            <TabsTrigger value="register">注冊</TabsTrigger>
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
                        errors.username && "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder="用戶名"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-destructive">{errors.username}</p>
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
                        errors.password && "border-destructive focus-visible:ring-destructive"
                      )}
                      type="password"
                      placeholder="密碼"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
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
                  登錄
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
                  使用 GitHub 賬號登錄
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
                        errors.username && "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder="用戶名"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-destructive">{errors.username}</p>
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
                        errors.password && "border-destructive focus-visible:ring-destructive"
                      )}
                      type="password"
                      placeholder="密碼"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
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
                        errors.confirmPassword && "border-destructive focus-visible:ring-destructive"
                      )}
                      type="password"
                      placeholder="確認密碼"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword}</p>
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
                  注冊
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
