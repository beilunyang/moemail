import { ThemeProvider } from "@/components/theme/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import type { Metadata, Viewport } from "next"
import { zpix } from "./fonts"
import "./globals.css"
import { Providers } from "./providers"
import { FloatMenu } from "@/components/float-menu"

export const metadata: Metadata = {
  title: "Yellow的电子邮局",
  description: "仅仅是Yellow的电子邮局而已",
  keywords: [
    "临时邮箱",
    "一次性邮箱",
    "匿名邮箱",
    "隐私保护",
    "垃圾邮件过滤",
    "即时收件",
    "自动过期",
    "安全邮箱",
    "注册验证",
    "临时账号",
    "萌系邮箱",
    "电子邮件",
    "隐私安全",
    "邮件服务",
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
    title: "Yellow的电子邮局",
    description: "仅仅是Yellow的电子邮局而已",
    siteName: "MoeMail",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yellow的电子邮局",
    description: "仅仅是Yellow的电子邮局而已",
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
