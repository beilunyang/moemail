"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { CreateDialog } from "./create-dialog"
import { ShareDialog } from "./share-dialog"
import { Mail, RefreshCw, ShieldCheck, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useThrottle } from "@/hooks/use-throttle"
import { EMAIL_CONFIG } from "@/config"
import { useToast } from "@/components/ui/use-toast"
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
import { ROLES } from "@/lib/permissions"
import { useUserRole } from "@/hooks/use-user-role"
import { useConfig } from "@/hooks/use-config"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MailboxListItem } from "@/types/email"
import { useEmailStats } from "@/hooks/use-email-stats"

interface EmailListProps {
  onEmailSelect: (email: MailboxListItem | null) => void
  selectedEmailId?: string
}

interface EmailResponse {
  emails: MailboxListItem[]
  nextCursor: string | null
  total?: number
  domains: string[]
}

const ALL_DOMAINS = "__all__"

export function EmailList({ onEmailSelect, selectedEmailId }: EmailListProps) {
  const { data: session } = useSession()
  const { config } = useConfig()
  const { role } = useUserRole()
  const t = useTranslations("emails.list")
  const tCommon = useTranslations("common.actions")
  const [emails, setEmails] = useState<MailboxListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [emailToDelete, setEmailToDelete] = useState<MailboxListItem | null>(null)
  const [activeDomain, setActiveDomain] = useState(ALL_DOMAINS)
  const [ownedDomains, setOwnedDomains] = useState<string[]>([])
  const requestIdRef = useRef(0)
  const { stats, setStats, removeStats } = useEmailStats()
  const { toast } = useToast()

  const domainTabs = useMemo(() => [...new Set([
    ...(config?.emailDomainsArray ?? []),
    ...ownedDomains,
  ].filter(Boolean))].sort(), [config?.emailDomainsArray, ownedDomains])

  const fetchEmails = useCallback(async (cursor?: string) => {
    const requestId = ++requestIdRef.current
    try {
      const url = new URL("/api/emails", window.location.origin)
      if (cursor) {
        url.searchParams.set('cursor', cursor)
      }
      if (activeDomain !== ALL_DOMAINS) {
        url.searchParams.set('domain', activeDomain)
      }
      const response = await fetch(url)
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          if (!cursor && requestId === requestIdRef.current) {
            setEmails([])
            setNextCursor(null)
            setTotal(0)
            setOwnedDomains([])
          }
          return
        }

        toast({
          title: t("error"),
          description: t("loadFailed"),
          variant: "destructive",
        })
        return
      }
      const data = await response.json() as EmailResponse
      if (requestId !== requestIdRef.current) return
      
      if (!cursor) {
        setEmails(data.emails)
        setStats(data.emails)
        setNextCursor(data.nextCursor)
        setTotal(data.total ?? 0)
        setOwnedDomains(data.domains ?? [])
        return
      }
      setEmails(prev => [
        ...prev,
        ...data.emails.filter((email) => !prev.some(({ id }) => id === email.id)),
      ])
      setStats(data.emails)
      setNextCursor(data.nextCursor)
    } catch {
      toast({
        title: t("error"),
        description: t("loadFailed"),
        variant: "destructive",
      })
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
        setRefreshing(false)
        setLoadingMore(false)
      }
    }
  }, [activeDomain, setStats, t, toast])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchEmails()
  }

  const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
    if (loadingMore) return

    const { scrollHeight, scrollTop, clientHeight } = e.currentTarget
    const threshold = clientHeight * 1.5
    const remainingScroll = scrollHeight - scrollTop

    if (remainingScroll <= threshold && nextCursor) {
      setLoadingMore(true)
      fetchEmails(nextCursor)
    }
  }, 200)

  useEffect(() => {
    if (session) fetchEmails()
  }, [session, fetchEmails])

  const handleDelete = async (email: MailboxListItem) => {
    try {
      const response = await fetch(`/api/emails/${email.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const data = await response.json()
        toast({
          title: t("error"),
          description: (data as { error: string }).error,
          variant: "destructive"
        })
        return
      }

      setEmails(prev => prev.filter(e => e.id !== email.id))
      removeStats(email.id)
      setTotal(prev => prev - 1)

      toast({
        title: t("success"),
        description: t("deleteSuccess")
      })
      
      if (selectedEmailId === email.id) {
        onEmailSelect(null)
      }
    } catch {
      toast({
        title: t("error"),
        description: t("deleteFailed"),
        variant: "destructive"
      })
    } finally {
      setEmailToDelete(null)
    }
  }

  if (!session) return null

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between border-b border-primary/20 px-2 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className={cn("h-8 w-8", refreshing && "animate-spin")}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-500">
              {role === ROLES.EMPEROR ? (
                t("emailCountUnlimited", { count: total })
              ) : (
                t("emailCount", { count: total, max: config?.maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS })
              )}
            </span>
          </div>
          <CreateDialog onEmailCreated={handleRefresh} />
        </div>

        <div className="overflow-x-auto border-b border-primary/20 px-2 py-1.5">
          <Tabs
            value={activeDomain}
            onValueChange={(domain) => {
              setActiveDomain(domain)
              setEmails([])
              setNextCursor(null)
              setLoading(true)
              onEmailSelect(null)
            }}
          >
            <TabsList className="h-9 w-max min-w-full justify-start">
              <TabsTrigger value={ALL_DOMAINS} className="h-7 px-3 text-xs">
                {t("allDomains")}
              </TabsTrigger>
              {domainTabs.map((domain) => (
                <TabsTrigger key={domain} value={domain} className="h-7 px-3 text-xs">
                  {domain}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex-1 overflow-auto p-2" onScroll={handleScroll}>
          {loading ? (
            <div className="text-center text-sm text-gray-500">{t("loading")}</div>
          ) : emails.length > 0 ? (
            <div className="flex flex-col gap-1">
              {emails.map((email, index) => {
                const emailStats = stats[email.id] ?? {
                  unreadCount: email.unreadCount,
                  messageCount: email.messageCount,
                }
                return (
                  <Fragment key={email.id}>
                    {index > 0 && !email.isCatchAll && emails[index - 1]?.isCatchAll && (
                      <div className="-mx-2 my-1 border-t border-primary/20" />
                    )}
                    <div
                      className={cn("flex items-center gap-2 p-2 rounded cursor-pointer text-sm group",
                        "hover:bg-primary/5",
                        email.isCatchAll && selectedEmailId !== email.id && "bg-primary/[0.04]",
                        selectedEmailId === email.id && "bg-primary/10"
                      )}
                      onClick={() => onEmailSelect(email)}
                    >
                      {email.isCatchAll ? (
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Mail className="h-4 w-4 text-primary/60" />
                      )}
                      <div className="truncate flex-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="truncate">{email.address}</span>
                          <span className={cn(
                            "ml-auto max-w-28 shrink-0 truncate text-right text-[10px] tabular-nums",
                            emailStats.unreadCount > 0 ? "font-bold text-primary" : "text-muted-foreground",
                          )}>
                            {emailStats.unreadCount}/{emailStats.messageCount}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {email.isCatchAll ? (
                            email.isCatchAllEnabled ? t("catchAllEnabled") : t("catchAllDisabled")
                          ) : new Date(email.expiresAt).getFullYear() === 9999 ? (
                            t("permanent")
                          ) : (
                            `${t("expiresAt")}: ${new Date(email.expiresAt).toLocaleString()}`
                          )}
                        </div>
                      </div>
                      <div
                        className="flex w-[4.25rem] shrink-0 gap-1 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ShareDialog emailId={email.id} emailAddress={email.address} />
                        {!email.isCatchAll && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEmailToDelete(email)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Fragment>
                )
              })}
              {loadingMore && (
                <div className="text-center text-sm text-gray-500 py-2">
                  {t("loadingMore")}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500">
              {t("noEmails")}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!emailToDelete} onOpenChange={() => setEmailToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription", { email: emailToDelete?.address || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => emailToDelete && handleDelete(emailToDelete)}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
