"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"

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
          const errorMessage = (errorData as { error?: string }).error || '获取邮件详情失败'
          setError(errorMessage)
          toast({
            title: "错误",
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
        const errorMessage = "网络错误，请稍后重试"
        setError(errorMessage)
        toast({
          title: "错误", 
          description: errorMessage,
          variant: "destructive"
        })
        console.error("Failed to fetch message:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessage()
  }, [emailId, messageId, messageType, toast])

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
        <span className="ml-2 text-sm text-gray-500">加载邮件详情...</span>
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
          点击重试
        </button>
      </div>
    )
  }

  if (!message) return null

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-3 border-b border-primary/20">
        <h3 className="text-base font-bold">{message.subject}</h3>
        <div className="text-xs text-gray-500 space-y-1">
          {message.from_address && (
            <p>发件人：{message.from_address}</p>
          )}
          {message.to_address && (
            <p>收件人：{message.to_address}</p>
          )}
          <p>时间：{new Date(message.sent_at || message.received_at || 0).toLocaleString()}</p>
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
                HTML 格式
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" />
              <Label 
                htmlFor="text" 
                className="text-xs cursor-pointer"
              >
                纯文本格式
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