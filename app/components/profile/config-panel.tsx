"use client"

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

export function ConfigPanel() {
  const [defaultRole, setDefaultRole] = useState<string>("")
  const [emailDomains, setEmailDomains] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    const res = await fetch("/api/config")
    if (res.ok) {
      const data = await res.json() as { 
        defaultRole: Exclude<Role, typeof ROLES.EMPEROR>,
        emailDomains: string
      }
      setDefaultRole(data.defaultRole)
      setEmailDomains(data.emailDomains)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultRole, emailDomains }),
      })

      if (!res.ok) throw new Error("保存失败")

      toast({
        title: "保存成功",
        description: "网站设置已更新",
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
        <Settings className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">网站设置</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm">新用户默认角色:</span>
          <Select value={defaultRole} onValueChange={setDefaultRole}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ROLES.KNIGHT}>骑士</SelectItem>
              <SelectItem value={ROLES.CIVILIAN}>平民</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm">邮箱域名:</span>
          <div className="flex-1">
            <Input 
              value={emailDomains}
              onChange={(e) => setEmailDomains(e.target.value)}
              placeholder="多个域名用逗号分隔，如: bravexist.eu.org,bitibiti.com"
            />
          </div>
        </div>

        <Button 
          onClick={handleSave}
          disabled={loading}
          className="w-full"
        >
          保存
        </Button>
      </div>
    </div>
  )
} 