"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Calendar, Mail, RefreshCw, Share2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useThrottle } from "@/hooks/use-throttle"
import { EMAIL_CONFIG } from "@/config"
import { useToast } from "@/components/ui/use-toast"
import { useEmailStats } from "@/hooks/use-email-stats"
import { ShareMessageDialog } from "./share-message-dialog"
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

interface Message {
  id: string
  from_address?: string
  to_address?: string
  subject: string
  received_at?: number
  sent_at?: number
  is_read: boolean
}

interface MessageListProps {
  email: { id: string; address: string }
  messageType: 'received' | 'sent'
  onMessageSelect: (messageId: string | null, messageType?: 'received' | 'sent') => void
  selectedMessageId?: string | null
  refreshTrigger?: number
  readMessageIds?: Set<string>
}

interface MessageResponse {
  messages: Message[]
  nextCursor: string | null
  nextAfterCursor: string | null
  latestCursor: string
  total?: number
}

export function MessageList({
  email,
  messageType,
  onMessageSelect,
  selectedMessageId,
  refreshTrigger,
  readMessageIds,
}: MessageListProps) {
  const t = useTranslations("emails.messages")
  const tList = useTranslations("emails.list")
  const tCommon = useTranslations("common.actions")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null)
  const messagesRef = useRef<Message[]>([])
  const latestCursorRef = useRef<string | null>(null)
  const pollingRef = useRef(false)
  const { toast } = useToast()
  const { adjustStats } = useEmailStats()

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const buildUrl = ({ cursor, after }: { cursor?: string; after?: string }) => {
    const url = new URL(`/api/emails/${email.id}`, window.location.origin)
    if (messageType === 'sent') url.searchParams.set('type', 'sent')
    if (cursor) url.searchParams.set('cursor', cursor)
    if (after) url.searchParams.set('after', after)
    return url
  }

  const requestMessages = async (options: { cursor?: string; after?: string } = {}) => {
    const response = await fetch(buildUrl(options))
    if (!response.ok) throw new Error("Failed to fetch messages")
    return response.json() as Promise<MessageResponse>
  }

  const loadInitial = async () => {
    const data = await requestMessages()
    setMessages(data.messages)
    setNextCursor(data.nextCursor)
    setTotal(data.total ?? data.messages.length)
    latestCursorRef.current = data.latestCursor
  }

  const loadOlder = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await requestMessages({ cursor: nextCursor })
      setMessages((current) => [
        ...current,
        ...data.messages.filter((message) => !current.some(({ id }) => id === message.id)),
      ])
      setNextCursor(data.nextCursor)
    } catch (error) {
      console.error("Failed to load older messages:", error)
    } finally {
      setLoadingMore(false)
    }
  }

  const pollNewMessages = async () => {
    if (pollingRef.current || document.visibilityState !== "visible" || !latestCursorRef.current) return
    pollingRef.current = true

    try {
      let after = latestCursorRef.current
      let hasMore = true
      let iterations = 0

      while (hasMore && iterations < 5) {
        const data = await requestMessages({ after })
        const knownIds = new Set(messagesRef.current.map(({ id }) => id))
        const uniqueMessages = data.messages.filter(({ id }) => !knownIds.has(id))

        if (uniqueMessages.length > 0) {
          setMessages((current) => [
            ...[...uniqueMessages].reverse(),
            ...current,
          ])
          setTotal((current) => current + uniqueMessages.length)

          if (messageType === "received") {
            adjustStats(email.id, {
              messageDelta: uniqueMessages.length,
              unreadDelta: uniqueMessages.filter((message) => !message.is_read).length,
            })
          }
        }

        latestCursorRef.current = data.latestCursor
        after = data.nextAfterCursor ?? data.latestCursor
        hasMore = Boolean(data.nextAfterCursor)
        iterations += 1
      }
    } catch (error) {
      console.error("Failed to poll messages:", error)
    } finally {
      pollingRef.current = false
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadInitial()
    } catch (error) {
      console.error("Failed to refresh messages:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleScroll = useThrottle((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollHeight, scrollTop, clientHeight } = event.currentTarget
    if (scrollHeight - scrollTop <= clientHeight * 1.5) loadOlder()
  }, 200)

  const handleDelete = async (message: Message) => {
    try {
      const response = await fetch(
        `/api/emails/${email.id}/${message.id}${messageType === 'sent' ? '?type=sent' : ''}`,
        { method: "DELETE" },
      )
      if (!response.ok) {
        const data = await response.json() as { error: string }
        toast({ title: tList("error"), description: data.error, variant: "destructive" })
        return
      }

      setMessages((current) => current.filter(({ id }) => id !== message.id))
      setTotal((current) => Math.max(0, current - 1))
      if (messageType === "received") {
        const isRead = message.is_read || readMessageIds?.has(message.id)
        adjustStats(email.id, {
          messageDelta: -1,
          unreadDelta: isRead ? 0 : -1,
        })
      }
      toast({ title: tList("success"), description: tList("deleteSuccess") })
      if (selectedMessageId === message.id) onMessageSelect(null)
    } catch {
      toast({ title: tList("error"), description: tList("deleteFailed"), variant: "destructive" })
    } finally {
      setMessageToDelete(null)
    }
  }

  useEffect(() => {
    if (!email.id) return
    setLoading(true)
    setMessages([])
    setNextCursor(null)
    loadInitial()
      .catch((error) => console.error("Failed to fetch messages:", error))
      .finally(() => setLoading(false))

    const interval = window.setInterval(pollNewMessages, EMAIL_CONFIG.POLL_INTERVAL)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email.id, messageType])

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) handleRefresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="p-2 flex justify-between items-center border-b border-primary/20">
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
            {total > 0 ? `${total} ${t("messageCount")}` : t("noMessages")}
          </span>
        </div>

        <div className="flex-1 overflow-auto" onScroll={handleScroll}>
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">{t("loading")}</div>
          ) : messages.length > 0 ? (
            <div className="divide-y divide-primary/10">
              {messages.map((message) => {
                const isRead = message.is_read || readMessageIds?.has(message.id) || messageType === "sent"
                return (
                  <div
                    key={message.id}
                    onClick={() => onMessageSelect(message.id, messageType)}
                    className={cn(
                      "p-3 hover:bg-primary/5 cursor-pointer group",
                      selectedMessageId === message.id && "bg-primary/10",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-primary/60 mt-1" />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm truncate", isRead ? "font-medium" : "font-bold")}>
                          {message.subject}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <span className="truncate">{message.from_address || message.to_address || ''}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(message.received_at || message.sent_at || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1" onClick={(event) => event.stopPropagation()}>
                        <ShareMessageDialog
                          emailId={email.id}
                          messageId={message.id}
                          messageSubject={message.subject}
                          trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Share2 className="h-4 w-4" /></Button>}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(event) => {
                            event.stopPropagation()
                            setMessageToDelete(message)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {loadingMore && <div className="text-center text-sm text-gray-500 py-2">{t("loadingMore")}</div>}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">{t("noMessages")}</div>
          )}
        </div>
      </div>

      <AlertDialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tList("deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tList("deleteDescription", { email: messageToDelete?.subject || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => messageToDelete && handleDelete(messageToDelete)}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
