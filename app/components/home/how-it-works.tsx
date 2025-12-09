"use client"

import { useTranslations } from "next-intl"
import { MousePointerClick, RefreshCw, ArchiveX, Network, FileCode, Share2 } from "lucide-react"

export function HowItWorks() {
    const t = useTranslations("home.howItWorks")

    return (
        <section className="py-16">
            <div className="container mx-auto px-4 max-w-5xl">
                <h2 className="text-3xl font-bold text-center mb-12">{t("title")}</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl border border-border bg-card/50 hover:border-primary/50 transition-colors">
                        <div className="p-4 bg-primary/10 rounded-full text-primary">
                            <MousePointerClick className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold">{t("step1.title")}</h3>
                        <p className="text-muted-foreground">{t("step1.description")}</p>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl border border-border bg-card/50 hover:border-primary/50 transition-colors">
                        <div className="p-4 bg-primary/10 rounded-full text-primary">
                            <RefreshCw className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold">{t("step2.title")}</h3>
                        <p className="text-muted-foreground">{t("step2.description")}</p>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl border border-border bg-card/50 hover:border-primary/50 transition-colors">
                        <div className="p-4 bg-primary/10 rounded-full text-primary">
                            <ArchiveX className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold">{t("step3.title")}</h3>
                        <p className="text-muted-foreground">{t("step3.description")}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                    <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl border border-border bg-card/50 hover:border-primary/50 transition-colors">
                        <div className="p-4 bg-primary/10 rounded-full text-primary">
                            <Network className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold">{t("advStep1.title")}</h3>
                        <p className="text-muted-foreground">{t("advStep1.description")}</p>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl border border-border bg-card/50 hover:border-primary/50 transition-colors">
                        <div className="p-4 bg-primary/10 rounded-full text-primary">
                            <FileCode className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold">{t("advStep2.title")}</h3>
                        <p className="text-muted-foreground">{t("advStep2.description")}</p>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl border border-border bg-card/50 hover:border-primary/50 transition-colors">
                        <div className="p-4 bg-primary/10 rounded-full text-primary">
                            <Share2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold">{t("advStep3.title")}</h3>
                        <p className="text-muted-foreground">{t("advStep3.description")}</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
