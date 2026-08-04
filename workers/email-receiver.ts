import type { Env } from '../types'
import { drizzle } from 'drizzle-orm/d1'
import { messages, emails, roles, userRoles, webhooks } from '../app/lib/schema'
import { and, eq, sql } from 'drizzle-orm'
import PostalMime from 'postal-mime'
import { WEBHOOK_CONFIG } from '../app/config/webhook'
import type { EmailMessage } from '../app/lib/webhook'
import { ROLES } from '../app/lib/permissions'
import {
  CATCHALL_EMAIL_KEY,
  getCatchAllConfigForRecipient,
  normalizeEmailAddress,
  parseCatchAllEmailConfig,
} from '../app/lib/catch-all'

const handleEmail = async (message: ForwardableEmailMessage, env: Env) => {
  const db = drizzle(env.DB, { schema: { messages, emails, webhooks } })
  const originalToAddress = message.to
  const normalizedToAddress = normalizeEmailAddress(originalToAddress)

  try {
    let targetEmail = await db.query.emails.findFirst({
      where: eq(sql`LOWER(TRIM(${emails.address}))`, normalizedToAddress)
    })

    if (!targetEmail) {
      let catchAllConfigValue: string | null

      try {
        catchAllConfigValue = await env.SITE_CONFIG.get(CATCHALL_EMAIL_KEY)
      } catch (error) {
        console.error(`Failed to read catch-all config for unknown recipient ${originalToAddress}:`, error)
        return
      }

      const catchAllDomainConfig = getCatchAllConfigForRecipient(
        parseCatchAllEmailConfig(catchAllConfigValue),
        normalizedToAddress,
      )

      if (!catchAllDomainConfig) {
        console.warn(`Dropping email for unknown recipient ${originalToAddress}: no catch-all mailbox configured`)
        return
      }

      if (!catchAllDomainConfig.enabled) {
        console.warn(`Dropping email for unknown recipient ${originalToAddress}: Catch-all is disabled for this domain`)
        return
      }

      const catchAllAddress = catchAllDomainConfig.address

      const [catchAllTarget] = await db.select({ email: emails })
        .from(emails)
        .innerJoin(userRoles, eq(emails.userId, userRoles.userId))
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(
          eq(sql`LOWER(TRIM(${emails.address}))`, catchAllAddress),
          eq(roles.name, ROLES.EMPEROR),
        ))
        .limit(1)
      targetEmail = catchAllTarget?.email

      if (!targetEmail) {
        console.warn(`Dropping email for unknown recipient ${originalToAddress}: configured catch-all mailbox is missing or not owned by the Emperor`)
        return
      }

      if (!targetEmail.userId) {
        console.warn(`Dropping email for unknown recipient ${originalToAddress}: configured catch-all mailbox has no owner`)
        return
      }

      console.log(`Routing unknown recipient ${originalToAddress} to configured catch-all mailbox`)
    }

    const parsedMessage = await PostalMime.parse(message.raw)

    const savedMessage = await db.insert(messages).values({
      emailId: targetEmail.id,
      fromAddress: message.from,
      toAddress: originalToAddress,
      subject: parsedMessage.subject || '(无主题)',
      content: parsedMessage.text || '',
      html: parsedMessage.html || '',
      type: 'received',
    }).returning().get()

    const webhook = targetEmail.userId
      ? await db.query.webhooks.findFirst({
        where: eq(webhooks.userId, targetEmail.userId)
      })
      : null

    if (webhook?.enabled) {
      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': WEBHOOK_CONFIG.EVENTS.NEW_MESSAGE
          },
          body: JSON.stringify({
            emailId: targetEmail.id,
            messageId: savedMessage.id,
            fromAddress: savedMessage.fromAddress,
            subject: savedMessage.subject,
            content: savedMessage.content,
            html: savedMessage.html,
            receivedAt: savedMessage.receivedAt.toISOString(),
            toAddress: originalToAddress
          } as EmailMessage)
        })
      } catch (error) {
        console.error('Failed to send webhook:', error)
      }
    }

    console.log(`Email processed for recipient ${originalToAddress}`)
  } catch (error) {
    console.error('Failed to process email:', error)
  }
}

const worker = {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    await handleEmail(message, env)
  }
}

export default worker
