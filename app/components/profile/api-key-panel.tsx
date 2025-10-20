"use client"

import { useState, useEffect, useCallback } from "react" // 新增 useCallback
import { useTranslations } from "next-intl"
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
  // DialogClose, // 修复：移除了未使用的导入
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
  const t = useTranslations("profile.apiKey")
  const tCommon = useTranslations("common.actions")
  const tNoPermission = useTranslations("emails.noPermission")
  const tMessages = useTranslations("emails.messages")
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

  // 修复：使用 useCallback 包装
  const fetchApiKeys = useCallback(async () => {
    try {
      setIsLoading(true) // 开始加载时设置 loading
      const res = await fetch("/api/api-keys")
      if (!res.ok) throw new Error(t("createFailed")) // 使用正确的翻译键
      const data = await res.json() as { apiKeys: ApiKey[] }
      setApiKeys(data.apiKeys)
    } catch (error) {
      console.error("Failed to fetch API keys:", error) // 添加 console.error
      toast({
        title: t("createFailed"), // 使用正确的翻译键
        description: error instanceof Error ? error.message : t("createFailed"), // 显示具体错误信息
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [t, toast]) // 修复：添加 t 和 toast 依赖

  useEffect(() => {
    if (canManageApiKey) {
      fetchApiKeys()
    } else {
      setIsLoading(false) // 如果没有权限，也需要结束 loading 状态
    }
  }, [canManageApiKey, fetchApiKeys]) // 修复：添加 fetchApiKeys 依赖

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

      if (!res.ok) {
        // 修复：将 errorData 从 'unknown' 断言为 { error?: string }
        const errorData = await res.json() as { error?: string } 
        // 修复：使用 errorData?.error 
        throw new Error(errorData?.error || t("createFailed"))
      }

      const data = await res.json() as { key: string }
      setNewKey(data.key)
      await fetchApiKeys() // 重新获取列表
    } catch (error) {
      toast({
        title: t("createFailed"),
        description: error instanceof Error ? error.message : t("createFailed"),
        variant: "destructive"
      })
      // 不关闭对话框，让用户可以看到错误
      // setCreateDialogOpen(false)
    } finally {
      setLoading(false)
    }
  }

  // 修复：此函数用于关闭 Dialog 并重置内部状态
  const handleDialogClose = () => {
    setCreateDialogOpen(false)
    setNewKeyName("")
    setNewKey(null)
  }

  // 修复：添加一个新的 onOpenChange 处理函数，以正确处理 Dialog 的打开和关闭
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // 打开 Dialog
      setCreateDialogOpen(true)
    } else {
      // 关闭 Dialog（例如点击遮罩层或按 ESC）
      // 调用原始的关闭函数来重置状态
      handleDialogClose()
    }
  }

  const toggleApiKey = async (id: string, enabled: boolean) => {
    // 乐观更新 UI
    const originalKeys = [...apiKeys]
    setApiKeys(keys =>
      keys.map(key =>
        key.id === id ? { ...key, enabled } : key
      )
    )

    try {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      })

      if (!res.ok) {
        // 修复：将 errorData 从 'unknown' 断言为 { error?: string }
        const errorData = await res.json() as { error?: string }
        // 修复：使用 errorData?.error 
        throw new Error(errorData?.error || t("createFailed")) 
      }

      // 可选：成功后可以加一个轻提示，但通常切换状态不需要强提示
      // toast({ title: "状态更新成功" })

    } catch (error) {
      console.error("Failed to toggle API key:", error)
      toast({
        title: t("createFailed"), // 使用正确的翻译键
        description: error instanceof Error ? error.message : t("createFailed"),
        variant: "destructive"
      })
      // 更新失败，回滚 UI
      setApiKeys(originalKeys)
    }
  }

  const deleteApiKey = async (id: string) => {
    const keyToDelete = apiKeys.find(key => key.id === id)
    if (!keyToDelete) return

    // 可选：添加确认对话框
    // if (!confirm(`确定要删除 API Key "${keyToDelete.name}" 吗？`)) {
    //   return
    // }

    // 乐观更新 UI
    const originalKeys = [...apiKeys]
    setApiKeys(keys => keys.filter(key => key.id !== id))

    try {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE"
      })

      if (!res.ok) {
        // 修复：将 errorData 从 'unknown' 断言为 { error?: string }
        const errorData = await res.json() as { error?: string }
        // 修复：使用 errorData?.error 
        throw new Error(errorData?.error || t("deleteFailed"))
      }

      toast({
        title: t("deleteSuccess"),
        // description: t("deleteSuccess") // description 通常可选
      })
    } catch (error) {
      console.error("Failed to delete API key:", error)
      toast({
        title: t("deleteFailed"),
        description: error instanceof Error ? error.message : t("deleteFailed"),
        variant: "destructive"
      })
      // 删除失败，回滚 UI
      setApiKeys(originalKeys)
    }
  }

  return (
    <div className="bg-background rounded-lg border-2 border-primary/20 p-6 space-y-6">
      <div className="flex items-center justify-between"> {/* 移除了 mb-6 */}
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">{t("title")}</h2>
        </div>
        {
          canManageApiKey && (
            // 修复：将 onOpenChange 指向新创建的 handleOpenChange 函数
            <Dialog open={createDialogOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                {/* 修复：移除了 Button 上的 onClick 事件。
                  当 DialogTrigger 使用 'asChild' 属性时，它会自动处理点击事件来触发 onOpenChange(true)。
                  之前 Button 上的 onClick={() => setCreateDialogOpen(true)} 会导致状态冲突，
                  使得 Dialog 刚打开（true）就立即被 onOpenChange={handleDialogClose}（false）关闭。
                */}
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t("create")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {newKey ? t("createSuccess") : t("create")}
                  </DialogTitle>
                  {newKey && (
                    <DialogDescription className="text-destructive text-sm pt-2"> {/* 调整样式 */}
                      {/* 更清晰的提示 */}
                      请立即复制并妥善保存您的新 API Key。关闭此窗口后将无法再次查看。
                    </DialogDescription>
                  )}
                </DialogHeader>

                {!newKey ? (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-key-name">{t("name")}</Label> {/* 添加 htmlFor */}
                      <Input
                        id="new-key-name" // 添加 id
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder={t("namePlaceholder")}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-key-value">{t("key")}</Label> {/* 添加 htmlFor */}
                      <div className="flex gap-2">
                        <Input
                          id="new-key-value" // 添加 id
                          value={newKey}
                          readOnly
                          className="font-mono text-sm flex-1" // 让输入框填充空间
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
                  <Button
                    variant="outline"
                    onClick={handleDialogClose} // 修复：点击关闭/取消按钮明确调用 handleDialogClose
                    disabled={loading && !newKey} // 只有在创建中且未生成key时才禁用取消
                  >
                    {newKey ? tCommon("close") : tCommon("cancel")} {/* 按钮文本根据状态变化 */}
                  </Button>
                  {!newKey && (
                    <Button
                      onClick={createApiKey}
                      disabled={loading || !newKeyName.trim()}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t("create")
                      )}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      </div>

      {/* 条件渲染 API Key 列表或提示信息 */}
      {
        !canManageApiKey ? (
          <div className="text-center text-muted-foreground py-8">
            <p>{tNoPermission("needPermission")}</p>
            <p className="mt-2">{tNoPermission("contactAdmin")}</p>
            {
              config?.adminContact && (
                <p className="mt-2">{tNoPermission("adminContact")}: {config.adminContact}</p>
              )
            }
          </div>
        ) : isLoading ? ( // 优先显示 Loading
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tMessages("loading")}</p>
            </div>
          </div>
        ) : apiKeys.length === 0 ? ( // 然后显示无 Key 提示
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium">{t("noKeys")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("description")}
              </p>
            </div>
          </div>
        ) : ( // 最后显示列表
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border bg-card gap-3 sm:gap-4" // 调整间距和布局
              >
                <div className="space-y-1 flex-1 min-w-0"> {/* 允许内容收缩 */}
                  <div className="font-medium truncate">{key.name}</div> {/* 允许截断 */}
                  <div className="text-xs sm:text-sm text-muted-foreground"> {/* 调整字体大小 */}
                    {t("createdAt")}: {new Date(key.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center"> {/* 对齐方式调整 */}
                  <Switch
                    checked={key.enabled}
                    onCheckedChange={(checked) => toggleApiKey(key.id, checked)}
                    aria-label={`Toggle API key ${key.name}`} // 增加可访问性
                  />
                  {/* 可选：添加 Tooltip 提示 */}
                  {/* <Tooltip content={t("delete")}> */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10" // 增加危险提示
                    onClick={() => deleteApiKey(key.id)}
                    aria-label={`Delete API key ${key.name}`} // 增加可访问性
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {/* </Tooltip> */}
                </div>
              </div>
            ))}

            {/* API 文档部分 */}
            <div className="pt-4 space-y-4"> {/* 增加上边距 */}
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowExamples(!showExamples)}
                aria-expanded={showExamples} // 增加可访问性
              >
                {showExamples ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {t("viewDocs")}
              </button>

              {showExamples && (
                <div className="rounded-lg border bg-card p-4 space-y-4 animate-in fade-in"> {/* 添加动画 */}
                  {/* getConfig */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{t("docs.getConfig")}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7" // 调小按钮
                        onClick={() => copyToClipboard(
                          `curl ${window.location.protocol}//${window.location.host}/api/config \\\n  -H "X-API-Key: YOUR_API_KEY"`
                        )}
                        aria-label="Copy getConfig command" // 增加可访问性
                      >
                        <Copy className="w-3 h-3" /> {/* 调小图标 */}
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto"> {/* 调整内边距 */}
                      {`curl ${window.location.protocol}//${window.location.host}/api/config \\\n  -H "X-API-Key: YOUR_API_KEY"`}
                    </pre>
                  </div>

                  {/* generateEmail */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{t("docs.generateEmail")}</div>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => copyToClipboard(
                          `curl -X POST ${window.location.protocol}//${window.location.host}/api/emails/generate \\\n` +
                          `  -H "X-API-Key: YOUR_API_KEY" \\\n` +
                          `  -H "Content-Type: application/json" \\\n` +
                          `  -d '{\n    "name": "test",\n    "expiryTime": 3600000,\n    "domain": "example.com"\n  }'`
                        )}
                        aria-label="Copy generateEmail command"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto">
                      {`curl -X POST ${window.location.protocol}//${window.location.host}/api/emails/generate \\\n` +
                       `  -H "X-API-Key: YOUR_API_KEY" \\\n` +
                       `  -H "Content-Type: application/json" \\\n` +
                       `  -d '{\n    "name": "test",\n    "expiryTime": 3600000,\n    "domain": "example.com"\n  }'`}
                    </pre>
                  </div>

                  {/* getEmails */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{t("docs.getEmails")}</div>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => copyToClipboard(
                          `curl ${window.location.protocol}//${window.location.host}/api/emails?cursor=CURSOR \\\n  -H "X-API-Key: YOUR_API_KEY"`
                        )}
                         aria-label="Copy getEmails command"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto">
                      {`curl ${window.location.protocol}//${window.location.host}/api/emails?cursor=CURSOR \\\n  -H "X-API-Key: YOUR_API_KEY"`}
                    </pre>
                  </div>

                  {/* getMessages */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{t("docs.getMessages")}</div>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => copyToClipboard(
                          `curl ${window.location.protocol}//${window.location.host}/api/emails/{emailId}?cursor=CURSOR \\\n  -H "X-API-Key: YOUR_API_KEY"`
                        )}
                        aria-label="Copy getMessages command"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto">
                      {`curl ${window.location.protocol}//${window.location.host}/api/emails/{emailId}?cursor=CURSOR \\\n  -H "X-API-Key: YOUR_API_KEY"`}
                    </pre>
                  </div>

                  {/* getMessage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{t("docs.getMessage")}</div>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => copyToClipboard(
                          `curl ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/{messageId} \\\n  -H "X-API-Key: YOUR_API_KEY"`
                        )}
                        aria-label="Copy getMessage command"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto">
                      {`curl ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/{messageId} \\\n  -H "X-API-Key: YOUR_API_KEY"`}
                    </pre>
                  </div>

                  {/* createEmailShare */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{t("docs.createEmailShare")}</div>
                       <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => copyToClipboard(
                          `curl -X POST ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/share \\\n` +
                          `  -H "X-API-Key: YOUR_API_KEY" \\\n` +
                          `  -H "Content-Type: application/json" \\\n` +
                          `  -d '{"expiresIn": 86400000}'` // 1 day example
                        )}
                        aria-label="Copy createEmailShare command"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto">
                      {`curl -X POST ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/share \\\n` +
                       `  -H "X-API-Key: YOUR_API_KEY" \\\n` +
                       `  -H "Content-Type: application/json" \\\n` +
                       `  -d '{"expiresIn": 86400000}'`}
                    </pre>
                  </div>

                   {/* getEmailShares */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{t("docs.getEmailShares")}</div>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => copyToClipboard(
                          `curl ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/share \\\n  -H "X-API-Key: YOUR_API_KEY"`
                        )}
                        aria-label="Copy getEmailShares command"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto">
                      {`curl ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/share \\\n  -H "X-API-Key: YOUR_API_KEY"`}
                    </pre>
                  </div>

                  {/* deleteEmailShare */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{t("docs.deleteEmailShare")}</div>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => copyToClipboard(
                          `curl -X DELETE ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/share/{shareId} \\\n  -H "X-API-Key: YOUR_API_KEY"`
                        )}
                        aria-label="Copy deleteEmailShare command"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto">
                      {`curl -X DELETE ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/share/{shareId} \\\n  -H "X-API-Key: YOUR_API_KEY"`}
                    </pre>
                  </div>

                  {/* createMessageShare */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{t("docs.createMessageShare")}</div>
                       <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => copyToClipboard(
                          `curl -X POST ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/messages/{messageId}/share \\\n` +
                          `  -H "X-API-Key: YOUR_API_KEY" \\\n` +
                          `  -H "Content-Type: application/json" \\\n` +
                          `  -d '{"expiresIn": 0}'` // Permanent link example
                        )}
                         aria-label="Copy createMessageShare command"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto">
                      {`curl -X POST ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/messages/{messageId}/share \\\n` +
                       `  -H "X-API-Key: YOUR_API_KEY" \\\n` +
                       `  -H "Content-Type: application/json" \\\n` +
                       `  -d '{"expiresIn": 0}'`}
                    </pre>
                  </div>

                  {/* getMessageShares */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{t("docs.getMessageShares")}</div>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => copyToClipboard(
                          `curl ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/messages/{messageId}/share \\\n  -H "X-API-Key: YOUR_API_KEY"`
                        )}
                         aria-label="Copy getMessageShares command"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto">
                      {`curl ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/messages/{messageId}/share \\\n  -H "X-API-Key: YOUR_API_KEY"`}
                    </pre>
                  </div>

                  {/* deleteMessageShare */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{t("docs.deleteMessageShare")}</div>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => copyToClipboard(
                          `curl -X DELETE ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/messages/{messageId}/share/{shareId} \\\n  -H "X-API-Key: YOUR_API_KEY"`
                        )}
                        aria-label="Copy deleteMessageShare command"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto">
                      {`curl -X DELETE ${window.location.protocol}//${window.location.host}/api/emails/{emailId}/messages/{messageId}/share/{shareId} \\\n  -H "X-API-Key: YOUR_API_KEY"`}
                    </pre>
                  </div>

                  {/* Notes */}
                  <div className="text-xs text-muted-foreground pt-2"> {/* 增加上边距 */}
                    <p className="font-medium mb-1">{t("docs.notes")}</p> {/* 加粗标题 */}
                    <ul className="list-disc list-inside space-y-1">
                      <li>{t("docs.note1")}</li>
                      <li>{t("docs.note2")}</li>
                      <li>{t("docs.note3")}</li>
                      <li>{t("docs.note4")}</li>
                      <li>{t("docs.note5")}</li>
                      <li>{t("docs.note6")}</li>
                      <li>{t("docs.note7")}</li>
                      <li>{t("docs.note8")}</li>
                      <li>{t("docs.note9")}</li>
                      <li>{t("docs.note10")}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  )
}