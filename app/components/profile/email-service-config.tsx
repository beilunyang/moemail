"use client"

import React, { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { CircleAlert, Eye, EyeOff, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"

interface EmailServiceConfig {
  domains: Record<string, {
    enabled: boolean
    apiKey: string
    configured: boolean
  }>
  roleLimits: {
    duke: number
    knight: number
  }
}

export function EmailServiceConfig() {
  const t = useTranslations("profile.emailService")
  const tCard = useTranslations("profile.card")
  const tSend = useTranslations("emails.send")
  const [config, setConfig] = useState<EmailServiceConfig>({
    domains: {},
    roleLimits: { duke: -1, knight: -1 },
  })
  const [loading, setLoading] = useState(false)
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/config/email-service")
        if (!res.ok) return

        const data = await res.json() as EmailServiceConfig
        setConfig(data)
      } catch (error) {
        console.error("Failed to fetch email service config:", error)
      }
    }

    fetchConfig()
  }, [])

  const updateDomain = (
    domain: string,
    updates: Partial<EmailServiceConfig["domains"][string]>,
  ) => {
    setConfig((current) => ({
      ...current,
      domains: {
        ...current.domains,
        [domain]: { ...current.domains[domain], ...updates },
      },
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/config/email-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domains: Object.fromEntries(
            Object.entries(config.domains).map(([domain, domainConfig]) => [
              domain,
              { enabled: domainConfig.enabled, apiKey: domainConfig.apiKey },
            ]),
          ),
          roleLimits: config.roleLimits,
        }),
      })

      if (!res.ok) {
        const error = await res.json() as { error: string }
        throw new Error(error.error || t("saveFailed"))
      }

      setConfig((current) => ({
        ...current,
        domains: Object.fromEntries(
          Object.entries(current.domains).filter(([, domainConfig]) => domainConfig.configured),
        ),
      }))
      toast({ title: t("saveSuccess"), description: t("saveSuccess") })
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
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-3 rounded-lg border border-dashed border-primary/40 p-4">
          <div>
            <Label className="text-sm font-medium">{t("domainConfig")}</Label>
            <p className="text-xs text-muted-foreground">{t("domainConfigDescription")}</p>
          </div>
          <div className="space-y-2">
            <div className="hidden grid-cols-[5rem_minmax(8rem,0.8fr)_minmax(0,1.2fr)] gap-3 px-2 text-xs font-medium text-muted-foreground sm:grid">
              <span>{t("enabledColumn")}</span>
              <span>{t("domainColumn")}</span>
              <span>{t("apiKey")}</span>
            </div>
            {Object.entries(config.domains).map(([domain, domainConfig]) => {
              const tokenVisible = visibleTokens.has(domain)
              return (
                  <div
                    key={domain}
                    className="grid min-w-0 grid-cols-1 items-center gap-3 rounded-md border border-primary/20 p-2 sm:grid-cols-[5rem_minmax(8rem,0.8fr)_minmax(0,1.2fr)]"
                  >
                    <Switch
                      checked={domainConfig.enabled}
                      onCheckedChange={(enabled) => updateDomain(domain, { enabled })}
                      aria-label={t("enableDomain", { domain })}
                    />
                    <div className="flex min-w-0 items-center gap-1.5">
                      {!domainConfig.configured && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="inline-flex h-5 shrink-0 translate-y-px cursor-help items-center justify-center text-destructive"
                                aria-label={t("removedDomainWarning")}
                              >
                                <CircleAlert className="h-4 w-4" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs bg-destructive text-destructive-foreground">
                              {t("removedDomainWarning")}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <span className="truncate text-sm font-medium">{domain}</span>
                    </div>
                    <div className="relative min-w-0">
                      <Input
                        type={tokenVisible ? "text" : "password"}
                        value={domainConfig.apiKey}
                        onChange={(event) => updateDomain(domain, { apiKey: event.target.value })}
                        placeholder={t("apiKeyPlaceholder")}
                        className="w-full min-w-0 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setVisibleTokens((current) => {
                          const next = new Set(current)
                          if (next.has(domain)) next.delete(domain)
                          else next.add(domain)
                          return next
                        })}
                      >
                        {tokenVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("roleLimits")}</Label>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                {t("fixedRoleLimits")}
              </p>
              <div className="space-y-2 text-blue-800">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <span><strong>{tCard("roles.EMPEROR")}</strong> - {t("emperorLimit")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  <span><strong>{tCard("roles.CIVILIAN")}</strong> - {t("civilianLimit")}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                <p className="text-sm font-medium text-gray-900">{t("configRoleLabel")}</p>
              </div>
              {[
                { value: "duke", label: tCard("roles.DUKE"), key: "duke" as const },
                { value: "knight", label: tCard("roles.KNIGHT"), key: "knight" as const },
              ].map((role) => {
                const isDisabled = config.roleLimits[role.key] === -1
                const isEnabled = !isDisabled

                return (
                  <div
                    key={role.value}
                    className={`group relative p-4 border-2 rounded-xl transition-all duration-200 ${
                      isEnabled
                        ? "border-primary/30 bg-primary/5 shadow-sm"
                        : "border-gray-200 hover:border-primary/20 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Checkbox
                          id={`role-${role.value}`}
                          checked={isEnabled}
                          onChange={(checked: boolean) => setConfig((current) => ({
                            ...current,
                            roleLimits: {
                              ...current.roleLimits,
                              [role.key]: checked ? 0 : -1,
                            },
                          }))}
                        />
                        <div>
                          <Label
                            htmlFor={`role-${role.value}`}
                            className="text-base font-semibold cursor-pointer select-none flex items-center gap-2"
                          >
                            <span className="text-2xl">
                              {role.value === "duke" ? "🏰" : "⚔️"}
                            </span>
                            {role.label}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {isEnabled ? t("enabled") : t("disabled")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Label className="text-xs font-medium text-gray-600 block mb-1">
                          {t("dailyLimit")}
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="-1"
                            value={config.roleLimits[role.key]}
                            onChange={(event) => setConfig((current) => ({
                              ...current,
                              roleLimits: {
                                ...current.roleLimits,
                                [role.key]: Number.parseInt(event.target.value, 10) || 0,
                              },
                            }))}
                            className="w-20 h-9 text-center text-sm font-medium"
                            placeholder="0"
                            disabled={isDisabled}
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {tSend("dailyLimitUnit")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">0 = {t("unlimited")}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  )
}
