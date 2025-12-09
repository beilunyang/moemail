import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://moemail.app'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/moe/', '/profile/', '/api/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
