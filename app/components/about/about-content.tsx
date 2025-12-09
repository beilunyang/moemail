"use client"

import { Shield, Zap, Globe } from "lucide-react"
import { useTranslations } from "next-intl"

export function AboutContent() {
    const t = useTranslations("about")

    return (
        <div className="space-y-12">
            <section className="text-center space-y-4">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                    {t("title")}
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    {t("subtitle")}
                </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <Shield className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{t("features.privacy.title")}</h3>
                    <p className="text-muted-foreground">
                        {t("features.privacy.description")}
                    </p>
                </div>
                <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <Zap className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{t("features.speed.title")}</h3>
                    <p className="text-muted-foreground">
                        {t("features.speed.description")}
                    </p>
                </div>
                <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <Globe className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{t("features.openSource.title")}</h3>
                    <p className="text-muted-foreground">
                        {t("features.openSource.description")}
                    </p>
                </div>
            </section>

            <section className="prose dark:prose-invert max-w-none">
                <h2>{t("mission.title")}</h2>
                <p>
                    {t("mission.content")}
                </p>

                <h2>{t("techStack.title")}</h2>
                <p>
                    {t("techStack.content")}
                </p>

                <h2>{t("contact.title")}</h2>
                <p>
                    {t("contact.intro")}{" "}
                    <a
                        href="https://github.com/beilunyang/moemail"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        {t("contact.github")}
                    </a>
                    {t("contact.joinText")}{" "}
                    <a
                        href="https://t.me/moecloudflare"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        {t("contact.telegram")}
                    </a>
                    {" "}{t("contact.outro")}
                </p>
            </section>
        </div>
    )
}
