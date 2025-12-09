import { Header } from "@/components/layout/header"
import { auth } from "@/lib/auth"
import { Shield, Share2, Clock, Code2 } from "lucide-react"
import { ActionButton } from "@/components/home/action-button"
import { FeatureCard } from "@/components/home/feature-card"
import { FaqSection } from "@/components/home/faq-section"
import { HowItWorks } from "@/components/home/how-it-works"
import { getTranslations } from "next-intl/server"
import type { Locale } from "@/i18n/config"

export const runtime = "edge"

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const session = await auth()
  const t = await getTranslations({ locale, namespace: "home" })

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">
        <Header />
        <main className="pt-16">
          <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-2 relative overflow-hidden py-20">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10 bg-grid-primary/10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full -z-10 animate-pulse" />

            <div className="w-full max-w-4xl mx-auto space-y-8 sm:space-y-12 py-4 relative z-10">
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient">
                    {t("title")}
                  </span>
                </h1>
                <p className="text-lg sm:text-2xl text-muted-foreground tracking-wide max-w-2xl mx-auto leading-relaxed">
                  {t("subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 sm:px-0">
                <FeatureCard
                  icon={<Shield className="w-6 h-6" />}
                  title={t("features.privacy.title")}
                  description={t("features.privacy.description")}
                />
                <FeatureCard
                  icon={<Share2 className="w-6 h-6" />}
                  title={t("features.instant.title")}
                  description={t("features.instant.description")}
                />
                <FeatureCard
                  icon={<Clock className="w-6 h-6" />}
                  title={t("features.expiry.title")}
                  description={t("features.expiry.description")}
                />
                <FeatureCard
                  icon={<Code2 className="w-6 h-6" />}
                  title={t("features.openapi.title")}
                  description={t("features.openapi.description")}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2 sm:px-0">
                <ActionButton isLoggedIn={!!session} />
              </div>
            </div>
          </div>

          <HowItWorks />
          <FaqSection />
        </main>
      </div>
    </div>
  )
}

