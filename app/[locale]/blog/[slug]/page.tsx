import { Header } from "@/components/layout/header"
import { getBlogPost, blogPosts } from "@/lib/blog-data"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

export function generateStaticParams() {
    return blogPosts.map((post) => ({
        slug: post.slug,
    }))
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string; slug: string }>
}) {
    const { locale, slug } = await params
    const post = getBlogPost(slug, locale)
    if (!post) return {}
    return {
        title: `${post.title} - MoeMail`
    }
}

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>
}) {
    const { locale, slug } = await params
    const post = getBlogPost(slug, locale)
    const t = await getTranslations({ locale, namespace: "blog" })

    if (!post) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="container mx-auto px-4 py-24 flex-1">
                <article className="max-w-3xl mx-auto space-y-8">
                    <Link
                        href={`/${locale}/blog`}
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t("backToBlog")}
                    </Link>

                    <header className="space-y-4">
                        <h1 className="text-4xl font-bold">{post.title}</h1>
                        <time className="text-muted-foreground block" dateTime={post.date}>
                            {post.date}
                        </time>
                    </header>

                    <div
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </article>
            </main>
        </div>
    )
}
