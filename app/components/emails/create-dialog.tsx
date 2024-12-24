"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { nanoid } from "nanoid"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EXPIRY_OPTIONS } from "@/types/email"

interface CreateDialogProps {
  onEmailCreated: () => void
}

interface DomainResponse {
  domains: string[]
}

export function CreateDialog({ onEmailCreated }: CreateDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailName, setEmailName] = useState("")
  const [domains, setDomains] = useState<string[]>([])
  const [currentDomain, setCurrentDomain] = useState("")
  const [expiryTime, setExpiryTime] = useState(EXPIRY_OPTIONS[1].value.toString())
  const { toast } = useToast()

  const generateRandomName = () => setEmailName(nanoid(8))

  const createEmail = async () => {
    if (!emailName.trim()) {
      toast({
        title: "错误",
        description: "请输入邮箱名",
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
          title: "错误",
          description: (data as { error: string }).error,
          variant: "destructive"
        })
        return
      }

      toast({
        title: "成功",
        description: "已创建新的临时邮箱"
      })
      onEmailCreated()
      setOpen(false)
      setEmailName("")
    } catch {
      toast({
        title: "错误",
        description: "创建邮箱失败",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchDomains = async () => {
    const response = await fetch("/api/emails/domains");
    const data = (await response.json()) as DomainResponse;
    setDomains(data.domains);
    setCurrentDomain(data.domains[0]);
  };

  useEffect(() => {
    fetchDomains()
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          创建新邮箱
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建新的临时邮箱</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              value={emailName}
              onChange={(e) => setEmailName(e.target.value)}
              placeholder="输入邮箱名"
              className="flex-1"
            />
            {domains.length > 1 && (
              <Select value={currentDomain} onValueChange={setCurrentDomain}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {domains.map(d => (
                    <SelectItem key={d} value={d}>@{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Label className="shrink-0 text-muted-foreground">过期时间</Label>
            <RadioGroup
              value={expiryTime}
              onValueChange={setExpiryTime}
              className="flex gap-6"
            >
              {EXPIRY_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem value={option.value.toString()} id={option.value.toString()} />
                  <Label htmlFor={option.value.toString()} className="cursor-pointer text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="text-sm text-gray-500">
            完整邮箱地址将为: {emailName ? `${emailName}@${currentDomain}` : "..."}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={createEmail} disabled={loading}>
            {loading ? "创建中..." : "创建"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 