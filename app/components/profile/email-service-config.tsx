"use client"

import React, { useState, useEffect, useCallback } from "react" // 新增 useCallback
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface EmailServiceConfig {
  enabled: boolean
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
    enabled: false,
    roleLimits: {
      duke: -1,
      knight: -1,
    }
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // 修复：使用 useCallback 包装 fetchConfig
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/config/email-service")
      if (res.ok) {
        const data = await res.json() as EmailServiceConfig
        setConfig(data)
      }
    } catch (error) {
      // * 获取配置失败的提示 *
      console.error("Failed to fetch email service config:", error)
      toast({
        title: t("saveFailed"), // * 复用保存失败的翻译 *
        description: error instanceof Error ? error.message : t("saveFailed"),
        variant: "destructive",
      })
    }
  }, [toast, t]) // 修复：添加 toast 和 t 作为依赖项

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig]) // 修复：将 fetchConfig 添加到依赖项数组

  const handleSave = async () => {
    setLoading(true)
    try {
      const saveData = {
        enabled: config.enabled,
        roleLimits: config.roleLimits
      }

      const res = await fetch("/api/config/email-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      })

      if (!res.ok) {
        const error = await res.json() as { error: string }
        throw new Error(error.error || t("saveFailed"))
      }

      toast({
        title: t("saveSuccess"),
        description: t("saveSuccess"),
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
    <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled" className="text-sm font-medium">
              {t("enable")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("enableDescription")}
            </p>
          </div>
          <Switch
            id="enabled"
            checked={config.enabled}
            onCheckedChange={(checked: boolean) =>
              setConfig((prev: EmailServiceConfig) => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        {config.enabled && (
          <>
            {/* --- 移除了 API Key 输入框 --- */}
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("roleLimits")}
              </Label>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-sm">
                  <p className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {t("fixedRoleLimits")}
                  </p>
                  <div className="space-y-2 text-blue-800">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span><strong>{tCard("roles.EMPEROR")}</strong> - {t("emperorLimit")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <span><strong>{tCard("roles.CIVILIAN")}</strong> - {t("civilianLimit")}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <p className="text-sm font-medium text-gray-900">{t("configRoleLabel")}</p>
                  </div>
                  {[
                    { value: "duke", label: tCard("roles.DUKE"), key: "duke" as const },
                    { value: "knight", label: tCard("roles.KNIGHT"), key: "knight" as const }
                  ].map((role) => {
                    const isDisabled = config.roleLimits[role.key] === -1
                    const isEnabled = !isDisabled

                    return (
                      <div
                        key={role.value}
                        className={`group relative p-4 border-2 rounded-xl transition-all duration-200 ${
                          isEnabled
                            ? 'border-primary/30 bg-primary/5 shadow-sm'
                            : 'border-gray-200 hover:border-primary/20 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <Checkbox
                                id={`role-${role.value}`}
                                checked={isEnabled}
                                onChange={(checked: boolean) => {
                                  setConfig((prev: EmailServiceConfig) => ({
                                    ...prev,
                                    roleLimits: {
                                      ...prev.roleLimits,
                                      [role.key]: checked ? 0 : -1
                                    }
                                  }))
                                }}
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor={`role-${role.value}`}
                                className="text-base font-semibold cursor-pointer select-none flex items-center gap-2"
                              >
                                <span className="text-2xl">
                                  {role.value === 'duke' ? '🏰' : '⚔️'}
                                </span>
                                {role.label}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                {isEnabled ? t("enabled") : t("disabled")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <Label className="text-xs font-medium text-gray-600 block mb-1">{t("dailyLimit")}</Label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  min="-1"
                                  value={config.roleLimits[role.key]}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setConfig((prev: EmailServiceConfig) => ({
                                      ...prev,
                                      roleLimits: {
                                        ...prev.roleLimits,
                                        [role.key]: parseInt(e.target.value) || 0
                                      }
                                    }))
                                  }
                                  className="w-20 h-9 text-center text-sm font-medium"
                                  placeholder="0"
                                  disabled={isDisabled}
                                />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">{tSend("dailyLimitUnit")}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">0 = {t("unlimited")}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full"
        >
          {loading ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  )
}