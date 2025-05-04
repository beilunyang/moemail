import { ThemeProvider } from "@/components/theme/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import type { Metadata, Viewport } from "next"
import { zpix } from "./fonts"
import "./globals.css"
import { Providers } from "./providers"
import { FloatMenu } from "@/components/float-menu"

export const metadata: Metadata = {
  title: "MoeMail - 萌萌噠臨時郵箱服務",
  description: "安全、快速、一次性的臨時郵箱地址，保護您的隱私，遠離垃圾郵件。支持即時收件，到期自動失效。",
  keywords: [
    "臨時郵箱",
    "一次性郵箱",
    "匿名郵箱",
    "隱私保護",
    "垃圾郵件過濾",
    "即時收件",
    "自動過期",
    "安全郵箱",
    "注冊驗證",
    "臨時賬號",
    "萌系郵箱",
    "電子郵件",
    "隱私安全",
    "郵件服務",
    "MoeMail"
  ].join(", "),
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
    locale: "zh_CN",
    url: "https://moemail.app",
    title: "MoeMail - 萌萌噠臨時郵箱服務",
    description: "安全、快速、一次性的臨時郵箱地址，保護您的隱私，遠離垃圾郵件。支持即時收件，到期自動失效。",
    siteName: "MoeMail",
  },
  twitter: {
    card: "summary_large_image",
    title: "MoeMail - 萌萌噠臨時郵箱服務",
    description: "安全、快速、一次性的臨時郵箱地址，保護您的隱私，遠離垃圾郵件。支持即時收件，到期自動失效。",
  },
  manifest: '/manifest.json',
  icons: [
    { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png' },
  ],
}

export const viewport: Viewport = {
  themeColor: '#826DD9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
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
            {children}
          </Providers>
          <Toaster />
          <FloatMenu />
        </ThemeProvider>
      </body>
    </html>
  )
}
