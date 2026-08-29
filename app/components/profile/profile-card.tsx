"use client"

import { useState } from "react"
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

const providerConfigs = {
  google: {
    label: "Google",
    className: "text-red-500 bg-red-500/10",
    icon: (props: any) => (
      <svg viewBox="0 0 24 24" {...props}>
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
  },
  github: {
    label: "GitHub",
    className: "text-primary bg-primary/10",
    icon: Github,
  },
} as const

export function ProfileCard({ user }: ProfileCardProps) {
  const [websiteConfigRevision, setWebsiteConfigRevision] = useState(0)
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
              {!!user?.providers?.length && (
                <div className="flex gap-2">
                  {user.providers.map((provider) => {
                    const config = providerConfigs[provider as keyof typeof providerConfigs]
                    if (!config) return null
                    const Icon = config.icon
                    return (
                      <div
                        key={provider}
                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${config.className}`}
                      >
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </div>
                    )
                  })}
                </div>
              )}
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

      {canManageConfig && (
        <WebsiteConfigPanel
          onSaved={() => setWebsiteConfigRevision((revision) => revision + 1)}
        />
      )}
      {canManageConfig && <EmailServiceConfig key={websiteConfigRevision} />}
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
