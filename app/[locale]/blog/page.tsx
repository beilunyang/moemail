import { Header } from "@/components/layout/header"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { getBlogPosts } from "@/lib/blog-data"
import { ArrowRight } from "lucide-react"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "common" })
    return {
        title: `${t("nav.blog")} - ${t("app.name")}`
    }
}

export default async function BlogIndexPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "blog" })
    const posts = getBlogPosts(locale)

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="container mx-auto px-4 py-24 flex-1">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold">{t("title")}</h1>
                        <p className="text-muted-foreground text-lg">
                            {t("subtitle")}
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        {posts.map((post) => (
                            <article key={post.slug} className="group relative flex flex-col space-y-4 rounded-lg border p-6 hover:bg-accent/50 transition-colors">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <time dateTime={post.date}>{post.date}</time>
                                </div>
                                <h2 className="text-2xl font-bold group-hover:text-primary transition-colors">
                                    {post.title}
                                </h2>
                                <p className="text-muted-foreground flex-1">
                                    {post.excerpt}
                                </p>
                                <Link
                                    href={`/${locale}/blog/${post.slug}`}
                                    className="inline-flex items-center font-medium text-primary hover:underline"
                                >
                                    {t("readMore")} <ArrowRight className="ml-1 h-4 w-4" />
                                    <span className="absolute inset-0" />
                                </Link>
                            </article>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
