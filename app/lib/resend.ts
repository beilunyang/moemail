import { getEmailDomain, parseEmailDomains } from "@/lib/catch-all"

export interface ResendDomainConfig {
  enabled: boolean
  apiKey: string
}

export type ResendConfig = Record<string, ResendDomainConfig>

export interface EmailRoleLimits {
  duke?: number
  knight?: number
}

export const RESEND_CONFIG_KEY = "RESEND_CONFIG"

export const parseEmailRoleLimits = (value: string | null): EmailRoleLimits => {
  if (!value?.trim()) return {}

  try {
    const parsed = JSON.parse(value) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}

    const rawLimits = parsed as Record<string, unknown>
    return (["duke", "knight"] as const).reduce<EmailRoleLimits>((limits, role) => {
      const limit = rawLimits[role]
      if (typeof limit === "number" && Number.isInteger(limit) && limit >= -1) {
        limits[role] = limit
      }
      return limits
    }, {})
  } catch {
    return {}
  }
}

export const parseResendConfig = (value: string | null): ResendConfig => {
  if (!value?.trim()) return {}

  try {
    const parsed = JSON.parse(value) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}

    return Object.entries(parsed).reduce<ResendConfig>((config, [rawDomain, rawConfig]) => {
      if (!rawConfig || typeof rawConfig !== "object" || Array.isArray(rawConfig)) return config

      const domain = rawDomain.trim().toLowerCase()
      const domainConfig = rawConfig as Record<string, unknown>
      if (!domain || typeof domainConfig.apiKey !== "string") return config

      config[domain] = {
        enabled: domainConfig.enabled === true,
        apiKey: domainConfig.apiKey.trim(),
      }
      return config
    }, {})
  } catch {
    return {}
  }
}

export const resolveResendConfig = ({
  value,
  domains,
  legacyEnabled,
  legacyApiKey,
}: {
  value: string | null
  domains: string | null
  legacyEnabled: string | null
  legacyApiKey: string | null
}): ResendConfig => {
  if (value !== null) return parseResendConfig(value)

  const apiKey = legacyApiKey?.trim() ?? ""
  return parseEmailDomains(domains).reduce<ResendConfig>((config, domain) => {
    config[domain] = {
      enabled: legacyEnabled === "true" && Boolean(apiKey),
      apiKey,
    }
    return config
  }, {})
}

export const getResendConfigForAddress = (config: ResendConfig, address: string) => {
  const domain = getEmailDomain(address)
  return domain ? config[domain] ?? null : null
}

export const getEnabledResendDomains = (config: ResendConfig) => (
  Object.entries(config)
    .filter(([, domainConfig]) => domainConfig.enabled && Boolean(domainConfig.apiKey))
    .map(([domain]) => domain)
)

export const loadResendConfig = async (siteConfig: {
  get: (key: string) => Promise<string | null>
}) => {
  const [domainsValue, configValue, legacyEnabled, legacyApiKey] = await Promise.all([
    siteConfig.get("EMAIL_DOMAINS"),
    siteConfig.get(RESEND_CONFIG_KEY),
    siteConfig.get("EMAIL_SERVICE_ENABLED"),
    siteConfig.get("RESEND_API_KEY"),
  ])

  return {
    configuredDomains: parseEmailDomains(domainsValue),
    config: resolveResendConfig({
      value: configValue,
      domains: domainsValue,
      legacyEnabled,
      legacyApiKey,
    }),
  }
}
