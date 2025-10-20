"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { useConfig } from "@/hooks/use-config"

export function NoPermissionDialog() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("emails.noPermission")
  const { config } = useConfig()

  return (
    <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50">
      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90%] max-w-md">
        <div className="bg-background border-2 border-primary/20 rounded-lg p-6 md:p-12 shadow-lg">
          <div className="text-center space-y-4">
            <h1 className="text-xl md:text-2xl font-bold">{t("title")}</h1>
            {/* 修复：将 description 拆分为两个 p 标签，并使用新的 i18n 键 */}
            <p className="text-sm md:text-base text-muted-foreground">{t("needPermission")}</p>
            <p className="text-sm md:text-base text-muted-foreground">{t("contactAdmin")}</p>
            {
              config?.adminContact && (
                <p className="text-sm md:text-base text-muted-foreground">{t("adminContact")}：{config.adminContact}</p>
              )
            }
            <Button 
              onClick={() => router.push(`/${locale}`)}
              className="mt-4 w-full md:w-auto"
            >
              {t("backToHome")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 