"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Key, Plus, Loader2, Copy, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useCopy } from "@/hooks/use-copy"
import { useRolePermission } from "@/hooks/use-role-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { useConfig } from "@/hooks/use-config"

type ApiKey = {
  id: string
  name: string
  key: string
  createdAt: string
  expiresAt: string | null
  enabled: boolean
}

export function ApiKeyPanel() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKey, setNewKey] = useState<string | null>(null)
  const { toast } = useToast()
  const { copyToClipboard } = useCopy()
  const [showExamples, setShowExamples] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { checkPermission } = useRolePermission()
  const canManageApiKey = checkPermission(PERMISSIONS.MANAGE_API_KEY)

  const fetchApiKeys = async () => {
    try {
      const res = await fetch("/api/api-keys")
      if (!res.ok) throw new Error("获取 API Keys 失败")
      const data = await res.json() as { apiKeys: ApiKey[] }
      setApiKeys(data.apiKeys)
    } catch (error) {
      console.error(error)
      toast({
        title: "获取失败",
        description: "获取 API Keys 列表失败",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (canManageApiKey) {
      fetchApiKeys()
    }
  }, [canManageApiKey])

  const { config } = useConfig()

  const createApiKey = async () => {
    if (!newKeyName.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName })
      })

      if (!res.ok) throw new Error("创建 API Key 失败")

      const data = await res.json() as { key: string }
      setNewKey(data.key)
      fetchApiKeys()
    } catch (error) {
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      })
      setCreateDialogOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDialogClose = () => {
    setCreateDialogOpen(false)
    setNewKeyName("")
    setNewKey(null)
  }

  const toggleApiKey = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      })

      if (!res.ok) throw new Error("更新失败")

      setApiKeys(keys =>
        keys.map(key =>
          key.id === id ? { ...key, enabled } : key
        )
      )
    } catch (error) {
      console.error(error)
      toast({
        title: "更新失败",
        description: "更新 API Key 状态失败",
        variant: "destructive"
      })
    }
  }

  const deleteApiKey = async (id: string) => {
    try {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE"
      })

      if (!res.ok) throw new Error("删除失败")

      setApiKeys(keys => keys.filter(key => key.id !== id))
      toast({
        title: "删除成功",
        description: "API Key 已删除"
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "删除失败",
        description: "删除 API Key 失败",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="bg-background rounded-lg border-2 border-primary/20 p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">API Keys</h2>
        </div>
        {
          canManageApiKey && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4" />
                  创建 API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {newKey ? "API Key 创建成功" : "创建新的 API Key"}
                  </DialogTitle>
                  {newKey && (
                    <DialogDescription className="text-destructive">
                      请立即保存此密钥，它只会显示一次且无法恢复
                    </DialogDescription>
                  )}
                </DialogHeader>

                {!newKey ? (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>名称</Label>
                      <Input
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="为你的 API Key 起个名字"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newKey}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(newKey)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      onClick={handleDialogClose}
                      disabled={loading}
                    >
                      {newKey ? "完成" : "取消"}
                    </Button>
                  </DialogClose>
                  {!newKey && (
                    <Button
                      onClick={createApiKey}
                      disabled={loading || !newKeyName.trim()}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "创建"
                      )}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      </div>

      {
        !canManageApiKey ? (
          <div className="text-center text-muted-foreground py-8">
            <p>需要公爵或更高权限才能管理 API Key</p>
            <p className="mt-2">请联系网站管理员升级您的角色</p>
            {
              config?.adminContact && (
                <p className="mt-2">管理员联系方式：{config.adminContact}</p>
              )
            }
          </div>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">加载中...</p>
                </div>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">没有 API Keys</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    点击上方的创建 &quot;API Key&quot; 按钮来创建你的第一个 API Key
                  </p>
                </div>
              </div>
            ) : (
              <>
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{key.name}</div>
                      <div className="text-sm text-muted-foreground">
                        创建于 {new Date(key.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={key.enabled}
                        onCheckedChange={(checked) => toggleApiKey(key.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteApiKey(key.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="mt-8 space-y-4">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowExamples(!showExamples)}
                  >
                    {showExamples ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    查看使用文档
                  </button>

                  {showExamples && (
                    <div className="rounded-lg border bg-card p-4 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">获取系统配置</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(
                              `curl ${window.location.protocol}//${window.location.host}/api/config \\
  -H "X-API-Key: YOUR_API_KEY"`
                            )}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <pre className="text-xs bg-muted/50 rounded-lg p-4 overflow-x-auto">
                          {`curl ${window.location.protocol}//${window.location.host}/api/config \\
  -H "X-API-Key: YOUR_API_KEY"`}
                        </pre>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">生成临时邮箱</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(
                              `curl -X POST ${window.location.protocol}//${window.location.host}/api/emails/generate \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "test",
    "expiryTime": 3600000,
    "domain": "moemail.app"
  }'`
                            )}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <pre className="text-xs bg-muted/50 rounded-lg p-4 overflow-x-auto">
                          {`curl -X POST ${window.location.protocol}//${window.location.host}/api/emails/generate \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "test",
    "expiryTime": 3600000,
    "domain": "moemail.app"
  }'`}
                        </pre>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">获取邮箱列表</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(
                              `curl ${window.location.protocol}//${window.location.host}/api/emails?cursor=CURSOR \\
  -H "X-API-Key: YOUR_API_KEY"`
                            )}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <pre className="text-xs bg-muted/50 rounded-lg p-4 overflow-x-auto">
                          {`curl ${window.location.protocol}//${window.location.host}/api/emails?cursor=CURSOR \\
  -H "X-API-Key: YOUR_API_KEY"`}
                        </pre>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">获取邮件列表</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(
                              `curl ${window.location.protocol}//${window.location.host}/api/emails/{emailId}?cursor=CURSOR \\
  -H "X-API-Key: YOUR_API_KEY"`
                            )}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <pre className="text-xs bg-muted/50 rounded-lg p-4 overflow-x-auto">
                          {`curl ${window.location.protocol}//${window.location.host}/api/emails/{emailId}?cursor=CURSOR \\
  -H "X-API-Key: YOUR_API_KEY"`}
                        </pre>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">获取单封邮件</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(
                              `curl ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/{messageId} \\
  -H "X-API-Key: YOUR_API_KEY"`
                            )}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <pre className="text-xs bg-muted/50 rounded-lg p-4 overflow-x-auto">
                          {`curl ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/{messageId} \\
  -H "X-API-Key: YOUR_API_KEY"`}
                        </pre>
                      </div>

                      <div className="text-xs text-muted-foreground mt-4">
                        <p>注意：</p>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          <li>请将 YOUR_API_KEY 替换为你的实际 API Key</li>
                          <li>/api/config 接口可获取系统配置，包括可用的邮箱域名列表</li>
                          <li>emailId 是邮箱的唯一标识符</li>
                          <li>messageId 是邮件的唯一标识符</li>
                          <li>expiryTime 是邮箱的有效期（毫秒），可选值：3600000（1小时）、86400000（1天）、604800000（7天）、0（永久）</li>
                          <li>domain 是邮箱域名，可通过 /api/config 接口获取可用域名列表</li>
                          <li>cursor 用于分页，从上一次请求的响应中获取 nextCursor</li>
                          <li>所有请求都需要包含 X-API-Key 请求头</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )
      }
    </div>
  )
} 