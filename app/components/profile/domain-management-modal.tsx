"use client"

// * 修复：导入 useCallback *
import React, { useState, useEffect, useCallback } from "react" 
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, Loader2, Eye, EyeOff } from "lucide-react"

// 域名的数据库表结构定义
interface EmailDomain {
  id: string
  domain: string
  resendApiKey: string | null
  resendEnabled: boolean
  createdAt: number
}

// 表单数据状态
type DomainFormData = {
  id: string | null
  domain: string
  resendApiKey: string
  resendEnabled: boolean
}

// 模态框组件的 Props
interface DomainManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DomainManagementModal({
  open,
  onOpenChange,
}: DomainManagementModalProps) {
  const t = useTranslations("profile.domainManagement")
  const tCommon = useTranslations("common.actions")
  const { toast } = useToast()

  const [domains, setDomains] = useState<EmailDomain[]>([]) // 域名列表
  const [loading, setLoading] = useState(true) // 列表加载状态
  const [saving, setSaving] = useState(false) // 保存（增/改）状态
  
  // 编辑/新增 模态框的状态
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [formData, setFormData] = useState<DomainFormData>({
    id: null,
    domain: "",
    resendApiKey: "",
    resendEnabled: false,
  })
  
  // 删除 确认框的状态
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [domainToDelete, setDomainToDelete] = useState<EmailDomain | null>(null)
  
  // API Key 可见性
  const [showApiKey, setShowApiKey] = useState(false)

  // 获取域名列表
  // * 修复：使用 useCallback 包裹 fetchDomains，防止 useEffect 无限循环 *
  // * 这是导致 KV 读取激增和加载转圈的根本原因 *
  const fetchDomains = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/config/email-domains")
      if (!res.ok) throw new Error(t("loadFailed"))
      const data = await res.json() as EmailDomain[]
      setDomains(data)
    } catch (error) {
      toast({
        title: t("loadFailed"),
        description: error instanceof Error ? error.message : t("loadFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [t, toast]) // * 修复：添加 t 和 toast 作为 useCallback 的依赖 *

  // 当主模态框打开时，加载数据
  useEffect(() => {
    if (open) {
      fetchDomains()
    }
  }, [open, fetchDomains]) // * 修复：此处的依赖现在是安全的 *

  // 重置表单
  const resetForm = () => {
    setFormData({
      id: null,
      domain: "",
      resendApiKey: "",
      resendEnabled: false,
    })
    setShowApiKey(false)
  }

  // 处理：打开 "添加" 模态框
  const handleAdd = () => {
    resetForm()
    setEditModalOpen(true)
  }

  // 处理：打开 "编辑" 模态框
  const handleEdit = (domain: EmailDomain) => {
    setFormData({
      id: domain.id,
      domain: domain.domain,
      resendApiKey: domain.resendApiKey || "",
      resendEnabled: domain.resendEnabled,
    })
    setShowApiKey(false)
    setEditModalOpen(true)
  }

  // 处理：打开 "删除" 确认框
  const handleDelete = (domain: EmailDomain) => {
    setDomainToDelete(domain)
    setDeleteAlertOpen(true)
  }

  // 处理：确认删除
  const confirmDelete = async () => {
    if (!domainToDelete) return
    setSaving(true)
    try {
      const res = await fetch(`/api/config/email-domains/${domainToDelete.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        // * 修复：将 error 断言为 { error?: string } 类型 *
        const error = await res.json() as { error?: string }
        throw new Error(error.error || t("deleteFailed"))
      }
      toast({
        title: t("deleteSuccess"),
      })
      // 从列表中移除
      setDomains(domains.filter((d) => d.id !== domainToDelete.id))
    } catch (error) {
      toast({
        title: t("deleteFailed"),
        description: error instanceof Error ? error.message : t("deleteFailed"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
      setDeleteAlertOpen(false)
      setDomainToDelete(null)
    }
  }

  // 处理：保存（添加或更新）
  const handleSave = async () => {
    setSaving(true)
    const isEditing = !!formData.id
    const url = isEditing
      ? `/api/config/email-domains/${formData.id}`
      : "/api/config/email-domains"
    const method = isEditing ? "PUT" : "POST"

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        // * 修复：将 error 断言为 { error?: string } 类型 *
        const error = await res.json() as { error?: string }
        throw new Error(error.error || (isEditing ? t("updateFailed") : t("addFailed")))
      }

      const savedDomain = await res.json() as EmailDomain
      
      toast({
        title: isEditing ? t("updateSuccess") : t("addSuccess"),
      })

      if (isEditing) {
        // 更新列表中的项
        setDomains(
          domains.map((d) => (d.id === savedDomain.id ? savedDomain : d))
        )
      } else {
        // 添加新项到列表
        setDomains([...domains, savedDomain])
      }
      
      setEditModalOpen(false) // 关闭编辑模态框
    } catch (error) {
      toast({
        title: isEditing ? t("updateFailed") : t("addFailed"),
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* 主模态框：显示域名列表 */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : domains.length === 0 ? (
              <p className="text-center text-muted-foreground">{t("noDomains")}</p>
            ) : (
              <div className="rounded-md border">
                {/* 列表头部 */}
                <div className="flex items-center p-4 bg-muted/50 font-medium">
                  <div className="flex-[2]">{t("domain")}</div>
                  <div className="flex-1">{t("resendStatus")}</div>
                  <div className="flex-[2]">{t("resendApiKey")}</div>
                  <div className="flex-1 text-right">{t("actions")}</div>
                </div>
                {/* 列表内容 */}
                {domains.map((domain) => (
                  <div key={domain.id} className="flex items-center p-4 border-t">
                    <div className="flex-[2] break-all pr-2 font-mono">
                      {domain.domain}
                    </div>
                    <div className="flex-1">
                      {domain.resendEnabled ? (
                        <span className="text-green-600 font-medium">
                          {t("resendEnabled")}
                        </span>
                      ) : (
                        <span className="text-gray-500">
                          {t("resendDisabled")}
                        </span>
                      )}
                    </div>
                    <div className="flex-[2] break-all pr-2 font-mono text-sm text-muted-foreground">
                      {domain.resendApiKey ? "********" : "N/A"}
                    </div>
                    <div className="flex-1 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(domain)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(domain)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between flex-col-reverse sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline">{tCommon("cancel")}</Button>
            </DialogClose>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              {t("addDomain")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 嵌套模态框：用于添加或编辑 */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formData.id ? t("editDomain") : t("addDomain")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 域名输入 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="domain" className="text-right">
                {t("domain")}
              </Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) =>
                  setFormData({ ...formData, domain: e.target.value })
                }
                className="col-span-3"
                placeholder="example.com"
              />
            </div>
            {/* Resend 启用开关 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="resendEnabled" className="text-right">
                {t("enableResend")}
              </Label>
              <Switch
                id="resendEnabled"
                checked={formData.resendEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, resendEnabled: checked })
                }
                className="col-span-3"
              />
            </div>
            {/* Resend API Key 输入 */}
            {formData.resendEnabled && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="resendApiKey" className="text-right">
                  {t("resendApiKey")}
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="resendApiKey"
                    type={showApiKey ? "text" : "password"}
                    value={formData.resendApiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, resendApiKey: e.target.value })
                    }
                    placeholder={t("resendApiKeyPlaceholder")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={saving}
            >
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认框 */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription", { domain: domainToDelete?.domain || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={saving} className="bg-destructive hover:bg-destructive/90">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}