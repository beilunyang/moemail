import { MetadataRoute } from 'next'
import { i18n } from '@/i18n/config'
import { blogPosts } from '@/lib/blog-data'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://moemail.app'

    const routes: MetadataRoute.Sitemap = []

    // Static pages for each locale
    const staticPages = ['', '/about', '/blog', '/privacy', '/terms']

    for (const locale of i18n.locales) {
        for (const page of staticPages) {
            routes.push({
                url: `${baseUrl}/${locale}${page}`,
                lastModified: new Date(),
                changeFrequency: page === '' ? 'daily' : 'weekly',
                priority: page === '' ? 1.0 : 0.8,
            })
        }

        // Blog posts for each locale
        for (const post of blogPosts) {
            routes.push({
                url: `${baseUrl}/${locale}/blog/${post.slug}`,
                lastModified: new Date(post.date),
                changeFrequency: 'monthly',
                priority: 0.6,
            })
        }
    }

    return routes
}
