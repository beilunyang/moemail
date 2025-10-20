"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Loader2, Share2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"
import { ShareMessageDialog } from "./share-message-dialog"

interface Message {
  id: string
  from_address?: string
  to_address?: string
  subject: string
  content: string
  html?: string
  received_at?: number
  sent_at?: number
}

interface MessageViewProps {
  emailId: string
  messageId: string
  messageType?: 'received' | 'sent'
  onClose: () => void
}

type ViewMode = "html" | "text"

export function MessageView({ emailId, messageId, messageType = 'received' }: MessageViewProps) {
  const t = useTranslations("emails.messageView")
  const tList = useTranslations("emails.list")
  const [message, setMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("html")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { theme } = useTheme()
  const { toast } = useToast()

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const url = `/api/emails/${emailId}/${messageId}${messageType === 'sent' ? '?type=sent' : ''}`;
        
        const response = await fetch(url)
        
        if (!response.ok) {
          const errorData = await response.json()
          const errorMessage = (errorData as { error?: string }).error || t("loadError")
          setError(errorMessage)
          toast({
            title: tList("error"),
            description: errorMessage,
            variant: "destructive"
          })
          return
        }
        
        const data = await response.json() as { message: Message }
        setMessage(data.message)
        if (!data.message.html) {
          setViewMode("text")
        }
      } catch (error) {
        const errorMessage = t("networkError")
        setError(errorMessage)
        toast({
          title: tList("error"), 
          description: errorMessage,
          variant: "destructive"
        })
        console.error("Failed to fetch message:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessage()
  }, [emailId, messageId, messageType, toast, t, tList])

  const updateIframeContent = () => {
    if (viewMode === "html" && message?.html && iframeRef.current) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document

      if (doc) {
        doc.open()
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <base target="_blank">
              <style>
                html, body {
                  margin: 0;
                  padding: 0;
                  min-height: 100%;
                  font-family: system-ui, -apple-system, sans-serif;
                  color: ${theme === 'dark' ? '#fff' : '#000'};
                  background: ${theme === 'dark' ? '#1a1a1a' : '#fff'};
                }
                body {
                  padding: 20px;
                }
                img {
                  max-width: 100%;
                  height: auto;
                }
                a {
                  color: #2563eb;
                }
                /* 滚动条样式 */
                ::-webkit-scrollbar {
                  width: 6px;
                  height: 6px;
                }
                ::-webkit-scrollbar-track {
                  background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                  background: ${theme === 'dark'
                    ? 'rgba(130, 109, 217, 0.3)'
                    : 'rgba(130, 109, 217, 0.2)'};
                  border-radius: 9999px;
                  transition: background-color 0.2s;
                }
                ::-webkit-scrollbar-thumb:hover {
                  background: ${theme === 'dark'
                    ? 'rgba(130, 109, 217, 0.5)'
                    : 'rgba(130, 109, 217, 0.4)'};
                }
                /* Firefox 滚动条 */
                * {
                  scrollbar-width: thin;
                  scrollbar-color: ${theme === 'dark'
                    ? 'rgba(130, 109, 217, 0.3) transparent'
                    : 'rgba(130, 109, 217, 0.2) transparent'};
                }
              </style>
            </head>
            <body>${message.html}</body>
          </html>
        `)
        doc.close()

        // 更新高度以填充容器
        const updateHeight = () => {
          const container = iframe.parentElement
          if (container) {
            iframe.style.height = `${container.clientHeight}px`
          }
        }

        updateHeight()
        window.addEventListener('resize', updateHeight)

        // 监听内容变化
        const resizeObserver = new ResizeObserver(updateHeight)
        resizeObserver.observe(doc.body)

        // 监听图片加载
        doc.querySelectorAll('img').forEach((img: HTMLImageElement) => {
          img.onload = updateHeight
        })

        return () => {
          window.removeEventListener('resize', updateHeight)
          resizeObserver.disconnect()
        }
      }
    }
  }

  // 监听主题变化和内容变化
  useEffect(() => {
    updateIframeContent()
  }, [message?.html, viewMode, theme])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
        <span className="ml-2 text-sm text-gray-500">{t("loading")}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <p className="text-sm text-destructive mb-2">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="text-xs text-primary hover:underline"
        >
          {t("retry")}
        </button>
      </div>
    )
  }

  if (!message) return null

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-3 border-b border-primary/20">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold flex-1">{message.subject}</h3>
          <ShareMessageDialog 
            emailId={emailId}
            messageId={message.id} 
            messageSubject={message.subject}
            trigger={
              <button className="p-1.5 hover:bg-primary/10 rounded-md transition-colors">
                <Share2 className="h-4 w-4 text-gray-500" />
              </button>
            }
          />
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          {message.from_address && (
            <p>{t("from")}: {message.from_address}</p>
          )}
          {message.to_address && (
            <p>{t("to")}: {message.to_address}</p>
          )}
          <p>{t("time")}: {new Date(message.sent_at || message.received_at || 0).toLocaleString()}</p>
        </div>
      </div>
      
      {message.html && message.content && (
        <div className="border-b border-primary/20 p-2">
          <RadioGroup
            value={viewMode}
            onValueChange={(value) => setViewMode(value as ViewMode)}
            className="flex items-center gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="html" id="html" />
              <Label 
                htmlFor="html" 
                className="text-xs cursor-pointer"
              >
                {t("htmlFormat")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" />
              <Label 
                htmlFor="text" 
                className="text-xs cursor-pointer"
              >
                {t("textFormat")}
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}
      
      <div className="flex-1 overflow-auto relative">
        {viewMode === "html" && message.html ? (
          <iframe
            ref={iframeRef}
            className="absolute inset-0 w-full h-full border-0 bg-transparent"
            sandbox="allow-same-origin allow-popups"
          />
        ) : (
          <div className="p-4 text-sm whitespace-pre-wrap">
            {message.content}
          </div>
        )}
      </div>
    </div>
  )
} 