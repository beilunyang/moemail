import { Header } from "@/components/layout/header"
import { TermsContent } from "@/components/legal/terms-content"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "common" })
    return {
        title: `${t("nav.terms")} - ${t("app.name")} `
    }
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-24">
                <div className="max-w-3xl mx-auto">
                    <TermsContent />
                </div>
            </main>
        </div>
    )
}
