"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Zap, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface EmailServiceConfig {
  enabled: boolean
  apiKey: string
  roleLimits: {
    duke: number
    knight: number
  }
}

export function EmailServiceConfig() {
  const [config, setConfig] = useState<EmailServiceConfig>({
    enabled: false,
    apiKey: "",
    roleLimits: {
      duke: -1,
      knight: -1,
    }
  })
  const [loading, setLoading] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config/email-service")
      if (res.ok) {
        const data = await res.json() as EmailServiceConfig
        setConfig(data)
      }
    } catch (error) {
      console.error("Failed to fetch email service config:", error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const saveData = {
        enabled: config.enabled,
        apiKey: config.apiKey,
        roleLimits: config.roleLimits
      }

      const res = await fetch("/api/config/email-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      })

      if (!res.ok) {
        const error = await res.json() as { error: string }
        throw new Error(error.error || "保存失败")
      }

      toast({
        title: "保存成功",
        description: "Resend 发件服务配置已更新",
      })
    } catch (error) {
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后重试",
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
        <h2 className="text-lg font-semibold">Resend 发件服务配置</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled" className="text-sm font-medium">
              启用 Resend 发件服务
            </Label>
            <p className="text-xs text-muted-foreground">
              开启后将使用 Resend 发送邮件
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
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-sm font-medium">
                Resend API Key
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showToken ? "text" : "password"}
                  value={config.apiKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig((prev: EmailServiceConfig) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="输入 Resend API Key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                允许使用发件功能的角色
              </Label>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-sm">
                  <p className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    固定权限规则
                  </p>
                  <div className="space-y-2 text-blue-800">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span><strong>Emperor (皇帝)</strong> - 可以无限发件，不受任何限制</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <span><strong>Civilian (平民)</strong> - 永远不能发件</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <p className="text-sm font-medium text-gray-900">可配置的角色权限</p>
                  </div>
                  {[
                    { value: "duke", label: "Duke (公爵)", key: "duke" as const },
                    { value: "knight", label: "Knight (骑士)", key: "knight" as const }
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
                                {isEnabled ? '已启用发件权限' : '未启用发件权限'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <Label className="text-xs font-medium text-gray-600 block mb-1">每日限制</Label>
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
                                <span className="text-xs text-muted-foreground whitespace-nowrap">封/天</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">0 = 无限制</p>
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
          {loading ? "保存中..." : "保存配置"}
        </Button>
      </div>
    </div>
  )
} 