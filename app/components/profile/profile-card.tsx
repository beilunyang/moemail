"use client"

import { User } from "next-auth"
import { useTranslations, useLocale } from "next-intl"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { Github, Settings, Crown, Sword, User2, Gem, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { WebhookConfig } from "./webhook-config"
import { PromotePanel } from "./promote-panel"
import { EmailServiceConfig } from "./email-service-config"
import { useRolePermission } from "@/hooks/use-role-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { WebsiteConfigPanel } from "./website-config-panel"
import { ApiKeyPanel } from "./api-key-panel"

interface ProfileCardProps {
  user: User
}

const roleConfigs = {
  emperor: { key: 'EMPEROR', icon: Crown },
  duke: { key: 'DUKE', icon: Gem },
  knight: { key: 'KNIGHT', icon: Sword },
  civilian: { key: 'CIVILIAN', icon: User2 },
} as const

export function ProfileCard({ user }: ProfileCardProps) {
  const t = useTranslations("profile.card")
  const tAuth = useTranslations("auth.signButton")
  const tWebhook = useTranslations("profile.webhook")
  const tNav = useTranslations("common.nav")
  const locale = useLocale()
  const router = useRouter()
  const { checkPermission } = useRolePermission()
  const canManageWebhook = checkPermission(PERMISSIONS.MANAGE_WEBHOOK)
  const canPromote = checkPermission(PERMISSIONS.PROMOTE_USER)
  const canManageConfig = checkPermission(PERMISSIONS.MANAGE_CONFIG)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name || tAuth("userAvatar")}
                width={80}
                height={80}
                className="rounded-full ring-2 ring-primary/20"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold truncate">{user.name}</h2>
              {
                user.email && (
                  // 先简单实现，后续再完善
                  <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    <Github className="w-3 h-3" />
                    {tAuth("linked")}
                  </div>
                )
              }
            </div>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {
                user.email ? user.email : `${t("name")}: ${user.username}`
              }
            </p>
            {user.roles && (
              <div className="flex gap-2 mt-2">
                {user.roles.map(({ name }) => {
                  const roleConfig = roleConfigs[name as keyof typeof roleConfigs]
                  const Icon = roleConfig.icon
                  const roleName = t(`roles.${roleConfig.key}` as any)
                  return (
                    <div 
                      key={name}
                      className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                      title={roleName}
                    >
                      <Icon className="w-3 h-3" />
                      {roleName}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {canManageWebhook && (
        <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">{tWebhook("title")}</h2>
          </div>
          <WebhookConfig />
        </div>
      )}

      {canManageConfig && <WebsiteConfigPanel />}
      {canManageConfig && <EmailServiceConfig />}
      {canPromote && <PromotePanel />}
      {canManageWebhook && <ApiKeyPanel />}

      <div className="flex flex-col sm:flex-row gap-4 px-1">
        <Button 
          onClick={() => router.push(`/${locale}/moe`)}
          className="gap-2 flex-1"
        >
          <Mail className="w-4 h-4" />
          {tNav("backToMailbox")}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
          className="flex-1"
        >
          {tAuth("logout")}
        </Button>
      </div>
    </div>
  )
} 