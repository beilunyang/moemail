import { getCloudflareContext } from "@opennextjs/cloudflare"

interface TurnstileConfig {
  enabled: boolean
  siteKey: string
  secretKey: string
}

export async function getTurnstileConfig(): Promise<TurnstileConfig> {
  const { env } = getCloudflareContext()
  const [enabled, siteKey, secretKey] = await Promise.all([
    env.SITE_CONFIG.get("TURNSTILE_ENABLED"),
    env.SITE_CONFIG.get("TURNSTILE_SITE_KEY"),
    env.SITE_CONFIG.get("TURNSTILE_SECRET_KEY"),
  ])

  return {
    enabled: enabled === "true",
    siteKey: siteKey || "",
    secretKey: secretKey || "",
  }
}

export interface TurnstileVerificationResult {
  success: boolean
  reason?: "missing-token" | "verification-failed"
}

export async function verifyTurnstileToken(token?: string | null): Promise<TurnstileVerificationResult> {
  const config = await getTurnstileConfig()

  if (!config.enabled || !config.siteKey || !config.secretKey) {
    return { success: true }
  }

  const trimmedToken = token?.trim()
  if (!trimmedToken) {
    return { success: false, reason: "missing-token" }
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${encodeURIComponent(config.secretKey)}&response=${encodeURIComponent(trimmedToken)}`,
    })

    if (!response.ok) {
      return { success: false, reason: "verification-failed" }
    }

    const data = await response.json() as { success: boolean }

    if (!data.success) {
      return { success: false, reason: "verification-failed" }
    }

    return { success: true }
  } catch (error) {
    console.error("Turnstile verification error:", error)
    return { success: false, reason: "verification-failed" }
  }
}
