"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Send, Inbox } from "lucide-react"
import { Tabs, SlidingTabsList, SlidingTabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MessageList } from "./message-list"
import { useSendPermission } from "@/hooks/use-send-permission"

interface MessageListContainerProps {
  email: {
    id: string
    address: string
    resendEnabled?: boolean // 新增：添加 resendEnabled 属性
  }
  onMessageSelect: (messageId: string | null, messageType?: 'received' | 'sent') => void
  selectedMessageId?: string | null
  refreshTrigger?: number
}

export function MessageListContainer({ email, onMessageSelect, selectedMessageId, refreshTrigger }: MessageListContainerProps) {
  const t = useTranslations("emails.messages")
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const { canSend: canSendEmails } = useSendPermission() // 这是全局的发送权限

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'received' | 'sent')
    onMessageSelect(null)
  }

  // 新增：决定是否显示“已发送” Tab 的变量
  // 需要全局权限(canSendEmails) 和 该邮箱域名的权限(email.resendEnabled) 都为 true
  const showSentTab = canSendEmails && email.resendEnabled

  return (
    <div className="h-full flex flex-col">
      {/* 修改：使用 showSentTab 变量 */}
      {showSentTab ? (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <div className="p-2 border-b border-primary/20">
            <SlidingTabsList>
              <SlidingTabsTrigger value="received">
                <Inbox className="h-4 w-4" />
                {t("received")}
              </SlidingTabsTrigger>
              <SlidingTabsTrigger value="sent">
                <Send className="h-4 w-4" />
                {t("sent")}
              </SlidingTabsTrigger>
            </SlidingTabsList>
          </div>
          
          <TabsContent value="received" className="flex-1 overflow-hidden m-0">
            <MessageList
              email={email}
              messageType="received"
              onMessageSelect={onMessageSelect}
              selectedMessageId={selectedMessageId}
            />
          </TabsContent>
          
          <TabsContent value="sent" className="flex-1 overflow-hidden m-0">
            <MessageList
              email={email}
              messageType="sent"
              onMessageSelect={onMessageSelect}
              selectedMessageId={selectedMessageId}
              refreshTrigger={refreshTrigger}
            />
          </TabsContent>
        </Tabs>
      ) : (
        // 当 showSentTab 为 false 时，只显示收件箱
        <div className="flex-1 overflow-hidden">
          <MessageList
            email={email}
            messageType="received"
            onMessageSelect={onMessageSelect}
            selectedMessageId={selectedMessageId}
          />
        </div>
      )}
    </div>
  )
} 