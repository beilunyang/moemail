import { Header } from "@/components/layout/header"
import { PrivacyContent } from "@/components/legal/privacy-content"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "common" })
    return {
        title: `${t("nav.privacy")} - ${t("app.name")} `
    }
}

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-24">
                <div className="max-w-3xl mx-auto">
                    <PrivacyContent />
                </div>
            </main>
        </div>
    )
}
