export const SUBDOMAIN_LABEL_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

export function normalizeDomainList(domains?: string | null): string[] {
  return (domains ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
}

export function normalizeSubdomain(subdomain?: string | null): string {
  return (subdomain ?? "").trim().toLowerCase()
}

export function isValidSubdomainLabel(subdomain: string): boolean {
  return SUBDOMAIN_LABEL_REGEX.test(normalizeSubdomain(subdomain))
}

export function buildMailboxAddress(
  localPart: string,
  domain: string,
  subdomain?: string | null
): string {
  const normalizedSubdomain = normalizeSubdomain(subdomain)
  const hostname = normalizedSubdomain ? `${normalizedSubdomain}.${domain}` : domain

  return `${localPart}@${hostname}`
}
