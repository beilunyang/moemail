"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { UserCog } from "lucide-react" // 移除了 Loader2
import { useState } from "react"
import { UserManagementModal } from "./user-management-modal" // 引入新的模态框组件

export function UserManagementPanel() {
  const t = useTranslations("profile.userManagement")
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  return (
    <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
      <div className="flex items-center gap-2 mb-4">
        <UserCog className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {t("description")}
      </p>

      <Button
        onClick={() => setIsModalOpen(true)}
        className="w-full"
      >
        <UserCog className="w-4 h-4 mr-2" />
        {t("openButton")}
      </Button>

      {/* 模态框组件
        它只在 isModalOpen 为 true 时渲染内部内容 
      */}
      <UserManagementModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  )
}