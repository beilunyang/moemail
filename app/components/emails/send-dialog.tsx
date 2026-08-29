"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getEmailDomain, getEmailLocalPart } from "@/lib/catch-all"

interface SendDialogProps {
  emailId: string
  fromAddress: string
  allowCustomFrom?: boolean
  onSendSuccess?: () => void
}

export function SendDialog({ emailId, fromAddress, allowCustomFrom = false, onSendSuccess }: SendDialogProps) {
  const t = useTranslations("emails.send")
  const tList = useTranslations("emails.list")
  const tCommon = useTranslations("common.actions")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [fromLocalPart, setFromLocalPart] = useState(getEmailLocalPart(fromAddress) ?? "")
  const { toast } = useToast()

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !content.trim() || (allowCustomFrom && !fromLocalPart.trim())) {
      toast({
        title: tList("error"),
        description: t("toPlaceholder") + ", " + t("subjectPlaceholder") + ", " + t("contentPlaceholder"),
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/emails/${emailId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          content,
          ...(allowCustomFrom ? { fromLocalPart } : {}),
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
      setOpen(false)
      setTo("")
      setSubject("")
      setContent("")

      onSendSuccess?.()

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

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) setFromLocalPart(getEmailLocalPart(fromAddress) ?? "")
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <DialogTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">{t("title")}</span>
              </Button>
            </TooltipTrigger>
          </DialogTrigger>
          <TooltipContent className="sm:hidden">
            <p>{t("title")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {allowCustomFrom ? (
            <div className="space-y-1.5">
              <div className="text-sm text-muted-foreground">{t("from")}</div>
              <div className="flex items-center rounded-md border border-input bg-background">
                <Input
                  value={fromLocalPart}
                  onChange={(event) => setFromLocalPart(event.target.value)}
                  placeholder={t("fromPrefixPlaceholder")}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <span className="shrink-0 pr-3 text-sm text-muted-foreground">
                  @{getEmailDomain(fromAddress)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t("catchAllFromDescription")}</p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {t("from")}: {fromAddress}
            </div>
          )}
          <Input
            value={to}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
            placeholder={t("toPlaceholder")}
          />
          <Input
            value={subject}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
            placeholder={t("subjectPlaceholder")}
          />
          <Textarea
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            placeholder={t("contentPlaceholder")}
            rows={6}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSend} disabled={loading}>
            {loading ? t("sending") : t("send")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
