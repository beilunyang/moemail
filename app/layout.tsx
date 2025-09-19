import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { jetbrains } from "./fonts";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "XiYang Mail - 夕阳邮箱服务",
  description:
    "安全、快速、一次性的邮箱地址，保护您的隐私，远离垃圾邮件。支持即时收件，到期自动失效。",
  keywords: [
    "邮箱服务",
    "一次性邮箱",
    "匿名邮箱",
    "隐私保护",
    "垃圾邮件过滤",
    "即时收件",
    "自动过期",
    "安全邮箱",
    "注册验证",
    "临时账号",
    "夕阳邮箱",
    "电子邮件",
    "隐私安全",
  ].join(", "),
  authors: [{ name: "XiYang Studio" }],
  creator: "XiYang Studio",
  publisher: "XiYang Studio",
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
    url: "https://xiyang.app",
    title: "XiYang Mail - 夕阳邮箱服务",
    description:
      "安全、快速、一次性的邮箱地址，保护您的隐私，远离垃圾邮件。支持即时收件，到期自动失效。",
    siteName: "XiYang Mail",
  },
  twitter: {
    card: "summary_large_image",
    title: "XiYang Mail - 夕阳邮箱服务",
    description:
      "安全、快速、一次性的邮箱地址，保护您的隐私，远离垃圾邮件。支持即时收件，到期自动失效。",
  },
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "shortcut icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
  ],
};

export const viewport: Viewport = {
  themeColor: "#FF6B35",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="XiYang Mail" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="XiYang Mail" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={cn(
          jetbrains.variable,
          "font-jetbrains min-h-screen antialiased",
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
          <Providers>{children}</Providers>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
