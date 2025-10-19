"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"
import { Role, ROLES } from "@/lib/permissions"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EMAIL_CONFIG } from "@/config"
// * --- 新增：导入域名管理模态框 --- *
import { DomainManagementModal } from "./domain-management-modal"

export function WebsiteConfigPanel() {
  const t = useTranslations("profile.website")
  const tCard = useTranslations("profile.card")
  const tCommon = useTranslations("common.actions") // * 新增 *
  const [defaultRole, setDefaultRole] = useState<string>("")
  // * --- 移除了 emailDomains 状态 --- *
  // const [emailDomains, setEmailDomains] = useState<string>("")
  const [adminContact, setAdminContact] = useState<string>("")
  const [maxEmails, setMaxEmails] = useState<string>(EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString())
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // * --- 新增：域名管理模态框的打开状态 --- *
  const [domainModalOpen, setDomainModalOpen] = useState(false)


  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    const res = await fetch("/api/config")
    if (res.ok) {
      // * --- 移除了 emailDomains --- *
      const data = await res.json() as {
        defaultRole: Exclude<Role, typeof ROLES.EMPEROR>,
        adminContact: string,
        maxEmails: string
      }
      setDefaultRole(data.defaultRole)
      // * --- 移除了 emailDomains --- *
      // setEmailDomains(data.emailDomains) 
      setAdminContact(data.adminContact)
      setMaxEmails(data.maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString())
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // * --- 移除了 emailDomains --- *
        body: JSON.stringify({
          defaultRole,
          adminContact,
          maxEmails: maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString()
        }),
      })

      // * 使用 i18n *
      if (!res.ok) throw new Error(t("saveFailed"))

      toast({
        title: t("saveSuccess"),
        description: t("saveSuccess"), // * description 也使用 saveSuccess *
      })
    } catch (error) {
      toast({
        title: t("saveFailed"),
        description: error instanceof Error ? error.message : t("saveFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <> {/* * --- 新增 Fragment --- * */}
      <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">{t("title")}</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm">{t("defaultRole")}:</span>
            <Select value={defaultRole} onValueChange={setDefaultRole}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROLES.DUKE}>{tCard("roles.DUKE")}</SelectItem>
                <SelectItem value={ROLES.KNIGHT}>{tCard("roles.KNIGHT")}</SelectItem>
                <SelectItem value={ROLES.CIVILIAN}>{tCard("roles.CIVILIAN")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* * --- 修改：邮箱域名输入框改为管理按钮 --- * */}
          <div className="flex items-center gap-4">
            <span className="text-sm">{t("domainManagement")}:</span>
            <div className="flex-1">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => setDomainModalOpen(true)}
              >
                {tCommon("manage")}
              </Button>
            </div>
          </div>
          {/* * --- 修改结束 --- * */}

          <div className="flex items-center gap-4">
            <span className="text-sm">{t("adminContact")}:</span>
            <div className="flex-1">
              <Input
                value={adminContact}
                onChange={(e) => setAdminContact(e.target.value)}
                placeholder={t("adminContactPlaceholder")}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm">{t("maxEmails")}:</span>
            <div className="flex-1">
              <Input
                type="number"
                min="1"
                max="100"
                value={maxEmails}
                onChange={(e) => setMaxEmails(e.target.value)}
                placeholder={`${EMAIL_CONFIG.MAX_ACTIVE_EMAILS}`}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full"
          >
            {loading ? t("saving") : t("save")} {/* * 使用 i18n * */}
          </Button>
        </div>
      </div>

      {/* * --- 新增：渲染域名管理模态框 --- * */}
      <DomainManagementModal
        open={domainModalOpen}
        onOpenChange={setDomainModalOpen}
      />
    </>
  )
}