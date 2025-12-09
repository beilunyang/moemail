"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { useLocale } from "next-intl"

export function Footer() {
    const t = useTranslations("common")
    const locale = useLocale()
    const year = new Date().getFullYear()

    // Helper to generate localized path
    // If we had a centralized navigation config with createSharedPathnamesNavigation, we would use that Link.
    // Since we are using next/link manually:
    const getPath = (path: string) => {
        // Ideally we should check if default locale needs prefix or not based on middleware config
        // But safely: if locale is strictly part of the URL structure in this app...
        // The Logo uses "/" which might reset locale.
        // Let's try to preserve it.
        return `/${locale}${path}`
    }

    return (
        <footer className="border-t bg-background/50 backdrop-blur-sm mt-auto">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg">{t("app.name")}</h3>
                        <p className="text-sm text-muted-foreground">
                            {t("footer.copyright", { year })}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium">{t("nav.home")}</h4>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <Link href={getPath("/about")} className="hover:text-foreground transition-colors">
                                {t("nav.about")}
                            </Link>
                            <Link href={getPath("/blog")} className="hover:text-foreground transition-colors">
                                {t("nav.blog")}
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium text-foreground">{t("nav.privacy")} & {t("nav.terms")}</h4>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <Link href={getPath("/privacy")} className="hover:text-foreground transition-colors">
                                {t("nav.privacy")}
                            </Link>
                            <Link href={getPath("/terms")} className="hover:text-foreground transition-colors">
                                {t("nav.terms")}
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium">{t("footer.contact")}</h4>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <a
                                href="https://github.com/beilunyang/moemail"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-foreground transition-colors"
                            >
                                {t("footer.github")}
                            </a>
                            <a
                                href="https://t.me/moecloudflare"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-foreground transition-colors"
                            >
                                {t("footer.telegram")}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
