import { drizzle } from 'drizzle-orm/d1'
import { emails, messages, users } from '../app/lib/schema'
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'

interface Env {
  DB: D1Database
}

const MAX_EMAIL_COUNT = 10
const MAX_MESSAGE_COUNT = 100
const BATCH_SIZE = 10 // SQLite 变量限制

async function getUserId(db: ReturnType<typeof drizzle>, identifier: string): Promise<string | null> {
  let user = await db
    .select()
    .from(users)
    .where(eq(users.email, identifier))
    .limit(1)
    .then(rows => rows[0])

  if (!user) {
    user = await db
      .select()
      .from(users)
      .where(eq(users.username, identifier))
      .limit(1)
      .then(rows => rows[0])
  }

  return user?.id || null
}

async function generateTestData(env: Env, userIdentifier: string) {
  const db = drizzle(env.DB)
  const now = new Date()

  try {
    const userId = await getUserId(db, userIdentifier)
    if (!userId) {
      throw new Error(`未找到用户: ${userIdentifier}`)
    }

    const testEmails = Array.from({ length: MAX_EMAIL_COUNT }).map(() => ({
      id: crypto.randomUUID(),
      address: `${nanoid(6)}@moemail.app`,
      userId: userId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    }))

    const emailResults = await db.insert(emails).values(testEmails).returning()
    console.log('Created test emails:', emailResults)

    for (const email of emailResults) {
      const receivedMessages = Array.from({ length: Math.floor(MAX_MESSAGE_COUNT * 0.7) }).map((_, index) => ({
        id: crypto.randomUUID(),
        emailId: email.id,
        fromAddress: `sender${index + 1}@example.com`,
        toAddress: null,
        subject: `Received Message ${index + 1} - ${nanoid(6)}`,
        content: `This is received message ${index + 1} content.\n\nBest regards,\nSender ${index + 1}`,
        html: `<div>
          <h1>Received Message ${index + 1}</h1>
          <p>This is received message ${index + 1} content.</p>
          <p>With some <strong>HTML</strong> formatting.</p>
          <br>
          <p>Best regards,<br>Sender ${index + 1}</p>
        </div>`,
        type: 'received',
        receivedAt: new Date(now.getTime() - index * 60 * 60 * 1000),
      }))

      const sentMessages = Array.from({ length: Math.floor(MAX_MESSAGE_COUNT * 0.3) }).map((_, index) => ({
        id: crypto.randomUUID(),
        emailId: email.id,
        fromAddress: null,
        toAddress: `recipient${index + 1}@example.com`,
        subject: `Sent Message ${index + 1} - ${nanoid(6)}`,
        html: `This is sent message ${index + 1} content.\n\nBest regards,\n${email.address}`,
        content: '',
        type: 'sent',
        sentAt: new Date(now.getTime() - index * 60 * 60 * 1000),
      }))

      const allMessages = [...receivedMessages, ...sentMessages]

      for (let i = 0; i < allMessages.length; i += BATCH_SIZE) {
        const batch = allMessages.slice(i, i + BATCH_SIZE)
        await db.insert(messages).values(batch)
        console.log(`Created batch of ${batch.length} messages (received + sent) for email ${email.address}`)
      }
      
      console.log(`Email ${email.address}: ${receivedMessages.length} received, ${sentMessages.length} sent messages`)
    }

    console.log('Test data generation completed successfully!')
  } catch (error) {
    console.error('Failed to generate test data:', error)
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  async fetch(request: Request, env: Env) {
    if (request.method === 'GET') {
      const url = new URL(request.url)
      const userIdentifier = url.searchParams.get('user')
      
      if (!userIdentifier) {
        return new Response('Missing user parameter', { status: 400 })
      }

      await generateTestData(env, userIdentifier)
      return new Response('Test data generated successfully', { status: 200 })
    }
    return new Response('Method not allowed', { status: 405 })
  }
} 