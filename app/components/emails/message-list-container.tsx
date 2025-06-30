"use client"

import { useState } from "react"
import { Send, Inbox } from "lucide-react"
import { Tabs, SlidingTabsList, SlidingTabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MessageList } from "./message-list"
import { useSendPermission } from "@/hooks/use-send-permission"

interface MessageListContainerProps {
  email: {
    id: string
    address: string
  }
  onMessageSelect: (messageId: string | null, messageType?: 'received' | 'sent') => void
  selectedMessageId?: string | null
  refreshTrigger?: number
}

export function MessageListContainer({ email, onMessageSelect, selectedMessageId, refreshTrigger }: MessageListContainerProps) {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const { canSend: canSendEmails } = useSendPermission()

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'received' | 'sent')
    onMessageSelect(null)
  }

  return (
    <div className="h-full flex flex-col">
      {canSendEmails ? (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <div className="p-2 border-b border-primary/20">
            <SlidingTabsList>
              <SlidingTabsTrigger value="received">
                <Inbox className="h-4 w-4" />
                收件箱
              </SlidingTabsTrigger>
              <SlidingTabsTrigger value="sent">
                <Send className="h-4 w-4" />
                已发送
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