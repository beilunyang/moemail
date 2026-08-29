export interface CatchAllDomainConfig {
  address: string
  enabled: boolean
  showAlways: boolean
}

export type CatchAllEmailConfig = Record<string, CatchAllDomainConfig>

export const CATCHALL_EMAIL_KEY = "CATCHALL_EMAIL"

export const normalizeEmailAddress = (address: string) => address.trim().toLowerCase()

export const normalizeMailboxName = (name: string) => name.trim().toLowerCase()

export const isValidMailboxName = (name: string) => (
  /^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/.test(name)
)

export const getEmailDomain = (address: string) => {
  const normalizedAddress = normalizeEmailAddress(address)
  const separatorIndex = normalizedAddress.lastIndexOf("@")

  if (separatorIndex <= 0 || separatorIndex === normalizedAddress.length - 1) {
    return null
  }

  return normalizedAddress.slice(separatorIndex + 1)
}

export const getEmailLocalPart = (address: string) => {
  const normalizedAddress = normalizeEmailAddress(address)
  const separatorIndex = normalizedAddress.lastIndexOf("@")

  if (separatorIndex <= 0) return null
  return normalizedAddress.slice(0, separatorIndex)
}

export const parseEmailDomains = (value: string | null | undefined) => {
  const domains = (value ?? "moemail.app")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)

  return [...new Set(domains)]
}

export const parseCatchAllEmailConfig = (value: string | null): CatchAllEmailConfig => {
  if (!value?.trim()) return {}

  try {
    const parsed = JSON.parse(value) as unknown

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}

    return Object.entries(parsed).reduce<CatchAllEmailConfig>((config, [domain, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return config

      const domainConfig = value as Record<string, unknown>
      if (typeof domainConfig.address !== "string") return config

      const normalizedDomain = domain.trim().toLowerCase()
      const normalizedAddress = normalizeEmailAddress(domainConfig.address)
      if (normalizedDomain && getEmailDomain(normalizedAddress) === normalizedDomain) {
        config[normalizedDomain] = {
          address: normalizedAddress,
          enabled: domainConfig.enabled === true,
          showAlways: domainConfig.showAlways !== false,
        }
      }

      return config
    }, {})
  } catch {
    return {}
  }
}

export const getCatchAllConfigForRecipient = (
  config: CatchAllEmailConfig,
  recipient: string,
) => {
  const domain = getEmailDomain(recipient)
  if (!domain) return null

  return config[domain] || null
}
