import { NextIntlClientProvider } from "next-intl"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { i18n, type Locale } from "@/i18n/config"
import type { Metadata, Viewport } from "next"
import { FloatMenu } from "@/components/float-menu"
import { ConditionalFooter } from "@/components/layout/conditional-footer"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import { zpix } from "../fonts"
import "../globals.css"
import { Providers } from "../providers"

export const runtime = "edge"

export const viewport: Viewport = {
  themeColor: '#826DD9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

async function getMessages(locale: Locale) {
  try {
    const common = (await import(`@/i18n/messages/${locale}/common.json`)).default
    const home = (await import(`@/i18n/messages/${locale}/home.json`)).default
    const auth = (await import(`@/i18n/messages/${locale}/auth.json`)).default
    const metadata = (await import(`@/i18n/messages/${locale}/metadata.json`)).default
    const emails = (await import(`@/i18n/messages/${locale}/emails.json`)).default
    const profile = (await import(`@/i18n/messages/${locale}/profile.json`)).default
    const privacy = (await import(`@/i18n/messages/${locale}/privacy.json`)).default
    const terms = (await import(`@/i18n/messages/${locale}/terms.json`)).default
    const about = (await import(`@/i18n/messages/${locale}/about.json`)).default
    const blog = (await import(`@/i18n/messages/${locale}/blog.json`)).default
    return { common, home, auth, metadata, emails, profile, privacy, terms, about, blog }
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error)
    return { common: {}, home: {}, auth: {}, metadata: {}, emails: {}, profile: {}, privacy: {}, terms: {}, about: {}, blog: {} }
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const t = await getTranslations({ locale, namespace: "metadata" })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://moemail.app"

  // Generate hreflang links for all supported locales
  const languages: Record<string, string> = {}
  i18n.locales.forEach((loc) => {
    languages[loc] = `${baseUrl}/${loc}`
  })

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    authors: [{ name: "SoftMoe Studio" }],
    creator: "SoftMoe Studio",
    publisher: "SoftMoe Studio",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "zh-CN" ? "zh_CN" : locale === "zh-TW" ? "zh_TW" : locale,
      url: `${baseUrl}/${locale}`,
      title: t("title"),
      description: t("description"),
      siteName: "MoeMail",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages,
    },
    manifest: '/manifest.json',
    icons: [
      { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png' },
    ],
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  if (!i18n.locales.includes(locale)) {
    notFound()
  }

  const messages = await getMessages(locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="application-name" content="MoeMail" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MoeMail" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={cn(
          zpix.variable,
          "font-zpix min-h-screen antialiased",
          "bg-background text-foreground",
          "transition-colors duration-300"
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="temp-mail-theme"
        >
          <Providers>
            <NextIntlClientProvider locale={locale} messages={messages}>
              {children}
              <ConditionalFooter />
              <FloatMenu />
            </NextIntlClientProvider>
          </Providers>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

