import { parseEmailDomains } from "@/lib/catch-all"

export const parseAllowedEmailDomains = (value: string | null | undefined): string[] | null => {
  if (value == null) return null

  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) return null

    return [...new Set(
      parsed
        .filter((domain): domain is string => typeof domain === "string")
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean),
    )]
  } catch {
    return null
  }
}

export const serializeAllowedEmailDomains = (
  domains: string[],
  configuredDomains: string[],
) => {
  const normalizedConfiguredDomains = parseEmailDomains(configuredDomains.join(","))
  const configuredDomainSet = new Set(normalizedConfiguredDomains)
  const normalizedDomains = parseEmailDomains(domains.join(","))
    .filter((domain) => configuredDomainSet.has(domain))

  if (
    normalizedDomains.length === normalizedConfiguredDomains.length
    && normalizedConfiguredDomains.every((domain) => normalizedDomains.includes(domain))
  ) {
    return null
  }

  return JSON.stringify(normalizedDomains)
}

export const getEffectiveAllowedEmailDomains = ({
  configuredDomains,
  storedDomains,
  isEmperor,
}: {
  configuredDomains: string[]
  storedDomains: string | null | undefined
  isEmperor: boolean
}) => {
  const normalizedConfiguredDomains = parseEmailDomains(configuredDomains.join(","))
  if (isEmperor) return normalizedConfiguredDomains

  const parsedStoredDomains = parseAllowedEmailDomains(storedDomains)
  if (parsedStoredDomains === null) return normalizedConfiguredDomains

  const configuredDomainSet = new Set(normalizedConfiguredDomains)
  return parsedStoredDomains.filter((domain) => configuredDomainSet.has(domain))
}
