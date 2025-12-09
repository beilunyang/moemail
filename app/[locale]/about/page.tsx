import { Header } from "@/components/layout/header"
import { AboutContent } from "@/components/about/about-content"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "common" })
    return {
        title: `${t("nav.about")} - ${t("app.name")}`
    }
}

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="container mx-auto px-4 py-24 flex-1">
                <div className="max-w-4xl mx-auto">
                    <AboutContent />
                </div>
            </main>
        </div>
    )
}
