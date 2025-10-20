"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"

interface MessageDetail {
  id: string
  from_address?: string
  to_address?: string
  subject: string
  content?: string
  html?: string
  received_at?: number
  sent_at?: number
}

interface SharedMessageDetailProps {
  message: MessageDetail | null
  loading?: boolean
  t: {
    messageContent: string
    selectMessage: string
    loading: string
    from: string
    to: string
    subject: string
    time: string
    htmlFormat: string
    textFormat: string
  }
}

type ViewMode = "html" | "text"

export function SharedMessageDetail({
  message,
  loading = false,
  t,
}: SharedMessageDetailProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("html")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { theme } = useTheme()

  // 如果没有HTML内容，默认显示文本
  useEffect(() => {
    if (message) {
      if (!message.html && message.content) {
        setViewMode("text")
      } else if (message.html) {
        setViewMode("html")
      }
    }
  }, [message])

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
                  color: ${theme === "dark" ? "#fff" : "#000"};
                  background: ${theme === "dark" ? "#1a1a1a" : "#fff"};
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
                ::-webkit-scrollbar {
                  width: 6px;
                  height: 6px;
                }
                ::-webkit-scrollbar-track {
                  background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                  background: ${
                    theme === "dark"
                      ? "rgba(130, 109, 217, 0.3)"
                      : "rgba(130, 109, 217, 0.2)"
                  };
                  border-radius: 9999px;
                  transition: background-color 0.2s;
                }
                ::-webkit-scrollbar-thumb:hover {
                  background: ${
                    theme === "dark"
                      ? "rgba(130, 109, 217, 0.5)"
                      : "rgba(130, 109, 217, 0.4)"
                  };
                }
                * {
                  scrollbar-width: thin;
                  scrollbar-color: ${
                    theme === "dark"
                      ? "rgba(130, 109, 217, 0.3) transparent"
                      : "rgba(130, 109, 217, 0.2) transparent"
                  };
                }
              </style>
            </head>
            <body>${message.html}</body>
          </html>
        `)
        doc.close()

        const updateHeight = () => {
          const container = iframe.parentElement
          if (container) {
            iframe.style.height = `${container.clientHeight}px`
          }
        }

        updateHeight()
        window.addEventListener("resize", updateHeight)

        const resizeObserver = new ResizeObserver(updateHeight)
        resizeObserver.observe(doc.body)

        doc.querySelectorAll("img").forEach((img: HTMLImageElement) => {
          img.onload = updateHeight
        })

        return () => {
          window.removeEventListener("resize", updateHeight)
          resizeObserver.disconnect()
        }
      }
    }
  }

  useEffect(() => {
    updateIframeContent()
  }, [message?.html, viewMode, theme])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
        <span className="ml-2 text-sm text-gray-500">{t.loading}</span>
      </div>
    )
  }

  if (!message) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        {t.selectMessage}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-3 border-b border-primary/20">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold flex-1">{message.subject}</h3>
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          {message.from_address && (
            <p>
              {t.from}: {message.from_address}
            </p>
          )}
          {message.to_address && (
            <p>
              {t.to}: {message.to_address}
            </p>
          )}
          <p>
            {t.time}:{" "}
            {new Date(
              message.sent_at || message.received_at || 0
            ).toLocaleString()}
          </p>
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
              <Label htmlFor="html" className="text-xs cursor-pointer">
                {t.htmlFormat}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" />
              <Label htmlFor="text" className="text-xs cursor-pointer">
                {t.textFormat}
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
        ) : message.content ? (
          <div className="p-4 text-sm whitespace-pre-wrap">
            {message.content}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            {t.selectMessage}
          </div>
        )}
      </div>
    </div>
  )
}
