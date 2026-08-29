"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Check, Plus, Settings, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect, useMemo } from "react"
import { ROLES } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EMAIL_CONFIG } from "@/config"
import { normalizeMailboxName, parseEmailDomains } from "@/lib/catch-all"
import { refreshSiteConfig } from "@/hooks/use-config"

interface CatchAllDomainSettings {
  enabled: boolean
  showAlways: boolean
  mailboxName: string
}

const DEFAULT_CATCH_ALL_DOMAIN_SETTINGS: CatchAllDomainSettings = {
  enabled: false,
  showAlways: true,
  mailboxName: "",
}

interface WebsiteConfigPanelProps {
  onSaved?: () => void
}

export function WebsiteConfigPanel({ onSaved }: WebsiteConfigPanelProps) {
  const t = useTranslations("profile.website")
  const tCard = useTranslations("profile.card")
  const [defaultRole, setDefaultRole] = useState<string>("")
  const [emailDomains, setEmailDomains] = useState<string[]>([])
  const [emailDomainEditor, setEmailDomainEditor] = useState<{
    originalDomain: string | null
    value: string
  } | null>(null)
  const [adminContact, setAdminContact] = useState<string>("")
  const [maxEmails, setMaxEmails] = useState<string>(EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString())
  const [turnstileEnabled, setTurnstileEnabled] = useState(false)
  const [turnstileSiteKey, setTurnstileSiteKey] = useState("")
  const [turnstileSecretKey, setTurnstileSecretKey] = useState("")
  const [catchAllDomains, setCatchAllDomains] = useState<Record<string, CatchAllDomainSettings>>({})
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const configuredDomains = useMemo(() => (
    parseEmailDomains(emailDomains.join(","))
  ), [emailDomains])

  const confirmEmailDomain = () => {
    if (!emailDomainEditor) return

    const normalizedDomain = emailDomainEditor.value.trim().toLowerCase()
    if (!normalizedDomain) return

    const domainAlreadyExists = emailDomains.some((domain) => (
      domain !== emailDomainEditor.originalDomain && domain === normalizedDomain
    ))
    if (domainAlreadyExists) {
      toast({
        title: t("emailDomainExists"),
        description: t("emailDomainExists"),
        variant: "destructive",
      })
      return
    }

    setEmailDomains((current) => emailDomainEditor.originalDomain === null
      ? [...current, normalizedDomain]
      : current.map((domain) => (
        domain === emailDomainEditor.originalDomain ? normalizedDomain : domain
      )))
    setEmailDomainEditor(null)
  }

  const removeEditedEmailDomain = () => {
    if (!emailDomainEditor) return

    if (emailDomainEditor.originalDomain !== null) {
      setEmailDomains((current) => current.filter((domain) => (
        domain !== emailDomainEditor.originalDomain
      )))
    }
    setEmailDomainEditor(null)
  }


  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    const res = await fetch("/api/config")
    if (res.ok) {
      const data = await res.json() as { 
        defaultRole: Exclude<Role, typeof ROLES.EMPEROR>,
        emailDomains: string,
        adminContact: string,
        maxEmails: string,
        turnstile?: {
          enabled: boolean,
          siteKey: string,
          secretKey?: string
        },
        catchAll?: {
          domains: Record<string, CatchAllDomainSettings>
        }
      }
      setDefaultRole(data.defaultRole)
      setEmailDomains(parseEmailDomains(data.emailDomains))
      setAdminContact(data.adminContact)
      setMaxEmails(data.maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString())
      setTurnstileEnabled(Boolean(data.turnstile?.enabled))
      setTurnstileSiteKey(data.turnstile?.siteKey ?? "")
      setTurnstileSecretKey(data.turnstile?.secretKey ?? "")
      setCatchAllDomains(data.catchAll?.domains ?? {})
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const normalizedCatchAllDomains = configuredDomains.reduce<Record<string, CatchAllDomainSettings>>((config, domain) => {
        const domainSettings = catchAllDomains[domain] ?? DEFAULT_CATCH_ALL_DOMAIN_SETTINGS
        config[domain] = {
          ...domainSettings,
          mailboxName: normalizeMailboxName(domainSettings.mailboxName),
        }
        return config
      }, {})

      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          defaultRole, 
          emailDomains: configuredDomains.join(","),
          adminContact,
          maxEmails: maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString(),
          catchAll: {
            domains: normalizedCatchAllDomains,
          },
          turnstile: {
            enabled: turnstileEnabled,
            siteKey: turnstileSiteKey,
            secretKey: turnstileSecretKey
          }
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null
        throw new Error(data?.error || t("saveFailed"))
      }

      toast({
        title: t("saveSuccess"),
        description: t("saveSuccess"),
      })
      await refreshSiteConfig()
      onSaved?.()
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

        <div className="space-y-3">
          <span className="text-sm">{t("emailDomains")}:</span>
          <div className="flex flex-wrap items-center gap-2">
            {emailDomains.map((domain) => (
              <Button
                key={domain}
                type="button"
                variant={emailDomainEditor?.originalDomain === domain ? "secondary" : "outline"}
                size="sm"
                className="h-8 rounded-full px-3 font-normal"
                onClick={() => setEmailDomainEditor({ originalDomain: domain, value: domain })}
              >
                {domain}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setEmailDomainEditor({ originalDomain: null, value: "" })}
              title={t("addEmailDomain")}
              aria-label={t("addEmailDomain")}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {emailDomainEditor && (
            <div className="flex items-center gap-2">
              <Input
                value={emailDomainEditor.value}
                onChange={(event) => setEmailDomainEditor((current) => current && ({
                  ...current,
                  value: event.target.value,
                }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    confirmEmailDomain()
                  }
                }}
                placeholder={t("emailDomainsPlaceholder")}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={confirmEmailDomain}
                disabled={!emailDomainEditor.value.trim()}
                title={t("confirmEmailDomain")}
                aria-label={t("confirmEmailDomain")}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={removeEditedEmailDomain}
                title={t("removeEmailDomain")}
                aria-label={t("removeEmailDomain")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          {emailDomains.length === 0 && !emailDomainEditor && (
            <p className="text-xs text-muted-foreground">{t("emailDomainsPlaceholder")}</p>
          )}
        </div>

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

        <div className="space-y-4 rounded-lg border border-dashed border-primary/40 p-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium">{t("catchAll.title")}</Label>
            <p className="text-xs text-muted-foreground">{t("catchAll.description")}</p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[36rem] space-y-2">
              <div className="grid grid-cols-[6rem_minmax(16rem,1fr)_7rem] items-center gap-3 px-2 text-xs font-medium text-muted-foreground">
                <span>{t("catchAll.enabledColumn")}</span>
                <span>{t("catchAll.mailboxColumn")}</span>
                <span className="text-right">{t("catchAll.alwaysShowColumn")}</span>
              </div>

              {configuredDomains.map((domain) => {
                const domainSettings = catchAllDomains[domain] ?? DEFAULT_CATCH_ALL_DOMAIN_SETTINGS
                const updateDomainSettings = (updates: Partial<CatchAllDomainSettings>) => {
                  setCatchAllDomains((current) => ({
                    ...current,
                    [domain]: {
                      ...DEFAULT_CATCH_ALL_DOMAIN_SETTINGS,
                      ...current[domain],
                      ...updates,
                    },
                  }))
                }

                return (
                  <div
                    key={domain}
                    className="grid grid-cols-[6rem_minmax(16rem,1fr)_7rem] items-center gap-3 rounded-md border border-primary/20 p-2"
                  >
                    <Switch
                      checked={domainSettings.enabled}
                      onCheckedChange={(enabled) => updateDomainSettings({ enabled })}
                      aria-label={t("catchAll.enableDomain", { domain })}
                    />
                    <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <Input
                        value={domainSettings.mailboxName}
                        onChange={(event) => updateDomainSettings({ mailboxName: event.target.value })}
                        placeholder={t("catchAll.mailboxNamePlaceholder")}
                        aria-label={t("catchAll.mailboxName", { domain })}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <span className="shrink-0 pr-3 text-sm text-muted-foreground">@{domain}</span>
                    </div>
                    <Switch
                      checked={domainSettings.showAlways}
                      onCheckedChange={(showAlways) => updateDomainSettings({ showAlways })}
                      aria-label={t("catchAll.alwaysShowDomain", { domain })}
                      className="justify-self-end"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{t("catchAll.alwaysShowDescription")}</p>
        </div>

        <div className="space-y-4 rounded-lg border border-dashed border-primary/40 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="turnstile-enabled" className="text-sm font-medium">
                {t("turnstile.enable")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("turnstile.enableDescription")}
              </p>
            </div>
            <Switch
              id="turnstile-enabled"
              checked={turnstileEnabled}
              onCheckedChange={setTurnstileEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="turnstile-site-key" className="text-sm font-medium">
              {t("turnstile.siteKey")}
            </Label>
            <Input
              id="turnstile-site-key"
              value={turnstileSiteKey}
              onChange={(e) => setTurnstileSiteKey(e.target.value)}
              placeholder={t("turnstile.siteKeyPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="turnstile-secret-key" className="text-sm font-medium">
              {t("turnstile.secretKey")}
            </Label>
            <div className="relative">
              <Input
                id="turnstile-secret-key"
                type={showSecretKey ? "text" : "password"}
                value={turnstileSecretKey}
                onChange={(e) => setTurnstileSecretKey(e.target.value)}
                placeholder={t("turnstile.secretKeyPlaceholder")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowSecretKey((prev) => !prev)}
              >
                {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("turnstile.secretKeyDescription")}
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSave}
          disabled={loading}
          className="w-full"
        >
          {t("save")}
        </Button>
      </div>
    </div>
  )
} 
