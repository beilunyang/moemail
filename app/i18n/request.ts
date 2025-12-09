import { getRequestConfig } from 'next-intl/server'
import { i18n } from '@/i18n/config'

export default getRequestConfig(async ({ locale }) => {
  const safeLocale = (i18n.locales.includes(locale as any) ? locale : i18n.defaultLocale) as string
  try {
    const common = (await import(`@/i18n/messages/${safeLocale}/common.json`)).default
    const home = (await import(`@/i18n/messages/${safeLocale}/home.json`)).default
    const auth = (await import(`@/i18n/messages/${safeLocale}/auth.json`)).default
    const metadata = (await import(`@/i18n/messages/${safeLocale}/metadata.json`)).default
    const emails = (await import(`@/i18n/messages/${safeLocale}/emails.json`)).default
    const profile = (await import(`@/i18n/messages/${safeLocale}/profile.json`)).default
    const privacy = (await import(`@/i18n/messages/${safeLocale}/privacy.json`)).default
    const terms = (await import(`@/i18n/messages/${safeLocale}/terms.json`)).default
    const about = (await import(`@/i18n/messages/${safeLocale}/about.json`)).default
    const blog = (await import(`@/i18n/messages/${safeLocale}/blog.json`)).default
    return { locale: safeLocale, messages: { common, home, auth, metadata, emails, profile, privacy, terms, about, blog } }
  } catch {
    return { locale: safeLocale, messages: { common: {}, home: {}, auth: {}, metadata: {}, emails: {}, profile: {}, privacy: {}, terms: {}, about: {}, blog: {} } }
  }
})
