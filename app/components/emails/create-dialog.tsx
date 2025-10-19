"use client"

import { useEffect, useState, useCallback } from "react" // * 修复：导入 useCallback *
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Copy, Plus, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { nanoid } from "nanoid"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EXPIRY_OPTIONS } from "@/types/email"
import { useCopy } from "@/hooks/use-copy"
// * 修复：移除了不再使用的 useConfig *
// import { useConfig } from "@/hooks/use-config" 

// * 修复：添加 EmailDomain 接口定义，用于从 API 获取数据 *
interface EmailDomain {
  id: string
  domain: string
  resendEnabled: boolean
}

interface CreateDialogProps {
  onEmailCreated: () => void
}

export function CreateDialog({ onEmailCreated }: CreateDialogProps) {
  // * 修复：移除了 useConfig *
  // const { config } = useConfig() 
  const t = useTranslations("emails.create")
  const tList = useTranslations("emails.list")
  const tCommon = useTranslations("common.actions")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // * 修复：添加 domains 状态，用于存储从 API 获取的域名列表 *
  const [domains, setDomains] = useState<EmailDomain[]>([])
  
  const [emailName, setEmailName] = useState("")
  const [currentDomain, setCurrentDomain] = useState("")
  const [expiryTime, setExpiryTime] = useState(EXPIRY_OPTIONS[1].value.toString())
  const { toast } = useToast()
  const { copyToClipboard } = useCopy()

  const generateRandomName = () => setEmailName(nanoid(8))

  const copyEmailAddress = () => {
    copyToClipboard(`${emailName}@${currentDomain}`)
  }
  
  // * 修复：添加从 /api/config/email-domains 获取域名的函数 *
  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch("/api/config/email-domains")
      if (!res.ok) throw new Error(t("loadFailed")) // 借用一下翻译
      const data = await res.json() as EmailDomain[]
      setDomains(data)
    } catch (error) {
      toast({
        title: tList("error"),
        description: error instanceof Error ? error.message : t("loadFailed"),
        variant: "destructive",
      })
    }
  }, [t, tList, toast]) // 添加依赖

  const createEmail = async () => {
    if (!emailName.trim()) {
      toast({
        title: tList("error"),
        description: t("namePlaceholder"),
        variant: "destructive"
      })
      return
    }
    
    // * 修复：检查是否存在可用域名 *
    if (!currentDomain) {
      toast({
        title: tList("error"),
        description: t("noDomainAvailable"), // 你可能需要在翻译文件中添加 "noDomainAvailable": "没有可用的域名"
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/emails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: emailName,
          domain: currentDomain,
          expiryTime: parseInt(expiryTime)
        })
      })

      if (!response.ok) {
        const data = await response.json()
        toast({
          title: tList("error"),
          description: (data as { error: string }).error,
          variant: "destructive"
        })
        return
      }

      toast({
        title: tList("success"),
        description: t("success")
      })
      onEmailCreated()
      setOpen(false)
      setEmailName("")
    } catch {
      toast({
        title: tList("error"),
        description: t("failed"),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // * 修复：当弹窗打开时，加载域名列表 *
  useEffect(() => {
    if (open) {
      fetchDomains()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]) // * 修复：移除 fetchDomains 依赖，防止弹窗打开时无限循环请求 *

  // * 修复：当域名列表加载或变化时，设置默认域名 *
  useEffect(() => {
    if (domains.length > 0) {
      // 检查当前选中的域名是否还在列表中，如果不在了，就设置回第一个
      const currentDomainStillExists = domains.some(d => d.domain === currentDomain)
      if (!currentDomainStillExists) {
        setCurrentDomain(domains[0].domain)
      }
    } else {
      setCurrentDomain("") // 如果没有域名，则清空
    }
  }, [domains, currentDomain])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          {t("title")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              value={emailName}
              onChange={(e) => setEmailName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="flex-1"
            />
            
            {/* 修复：使用新的 domains 状态来渲染下拉框 */}
            {domains.length > 1 && (
              <Select value={currentDomain} onValueChange={setCurrentDomain}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {domains.map(d => (
                    <SelectItem key={d.id} value={d.domain}>@{d.domain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* 修复：如果只有一个域名，显示为纯文本 */}
            {domains.length === 1 && (
              <div className="flex items-center justify-center px-3 border rounded-md bg-muted text-muted-foreground text-sm">
                @{currentDomain}
              </div>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={generateRandomName}
              type="button"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Label className="shrink-0 text-muted-foreground">{t("expiryTime")}</Label>
            <RadioGroup
              value={expiryTime}
              onValueChange={setExpiryTime}
              className="flex gap-6"
            >
              {EXPIRY_OPTIONS.map((option, index) => {
                const labels = [t("oneHour"), t("oneDay"), t("threeDays"), t("permanent")]
                return (
                  <div key={option.value} className="flex items-center gap-2">
                    <RadioGroupItem value={option.value.toString()} id={option.value.toString()} />
                    <Label htmlFor={option.value.toString()} className="cursor-pointer text-sm">
                      {labels[index]}
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="shrink-0">{t("domain")}:</span>
            {/* 修复：确保 currentDomain 有值时才显示 */}
            {emailName && currentDomain ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate">{`${emailName}@${currentDomain}`}</span>
                <div
                  className="shrink-0 cursor-pointer hover:text-primary transition-colors"
                  onClick={copyEmailAddress}
                >
                  <Copy className="size-4" />
                </div>
              </div>
            ) : (
              <span className="text-gray-400">...</span>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={createEmail} disabled={loading || domains.length === 0}>
            {loading ? t("creating") : t("create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}