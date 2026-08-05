import { createDb } from "@/lib/db"
import { and, asc, eq, gt, inArray, isNull, lt, notInArray, or, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { emails, messages } from "@/lib/schema"
import { encodeCursor, decodeCursor } from "@/lib/cursor"
import { getUserId } from "@/lib/apiKey"
import { getRequestContext } from "@cloudflare/next-on-pages"
import {
  CATCHALL_EMAIL_KEY,
  getEmailDomain,
  normalizeEmailAddress,
  parseCatchAllEmailConfig,
} from "@/lib/catch-all"

export const runtime = "edge"

const PAGE_SIZE = 20
const COUNT_QUERY_CHUNK_SIZE = 80

const emailDomainExpression = sql<string>`LOWER(SUBSTR(${emails.address}, INSTR(${emails.address}, '@') + 1))`

export async function GET(request: Request) {
  const userId = await getUserId()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const domainParam = searchParams.get('domain')
  const selectedDomain = domainParam?.trim().toLowerCase() || null

  if (selectedDomain && !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(selectedDomain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 })
  }
  
  const db = createDb()

  try {
    const env = getRequestContext().env
    const catchAllConfig = parseCatchAllEmailConfig(
      await env.SITE_CONFIG.get(CATCHALL_EMAIL_KEY),
    )
    const catchAllDomainConfigs = Object.values(catchAllConfig)
    const catchAllAddresses = [...new Set(
      catchAllDomainConfigs.map(({ address }) => normalizeEmailAddress(address)),
    )]
    const visibleCatchAllAddresses = [...new Set(
      catchAllDomainConfigs
        .filter(({ enabled, showAlways }) => enabled || showAlways)
        .filter(({ address }) => !selectedDomain || getEmailDomain(address) === selectedDomain)
        .map(({ address }) => normalizeEmailAddress(address)),
    )]
    const hiddenCatchAllAddresses = [...new Set(
      catchAllDomainConfigs
        .filter(({ enabled, showAlways }) => !enabled && !showAlways)
        .map(({ address }) => normalizeEmailAddress(address)),
    )]
    const catchAllConfigByAddress = new Map(
      catchAllDomainConfigs.map((config) => [normalizeEmailAddress(config.address), config]),
    )

    const userActiveConditions = and(
      eq(emails.userId, userId),
      gt(emails.expiresAt, new Date())
    )
    const baseConditions = and(
      userActiveConditions,
      selectedDomain ? eq(emailDomainExpression, selectedDomain) : undefined,
    )

    const regularEmailConditions = catchAllAddresses.length > 0
      ? and(
        baseConditions,
        notInArray(sql<string>`LOWER(TRIM(${emails.address}))`, catchAllAddresses),
      )
      : baseConditions
    const visibleEmailConditions = hiddenCatchAllAddresses.length > 0
      ? and(
        baseConditions,
        notInArray(sql<string>`LOWER(TRIM(${emails.address}))`, hiddenCatchAllAddresses),
      )
      : baseConditions
    const allVisibleEmailConditions = hiddenCatchAllAddresses.length > 0
      ? and(
        userActiveConditions,
        notInArray(sql<string>`LOWER(TRIM(${emails.address}))`, hiddenCatchAllAddresses),
      )
      : userActiveConditions
    const totalCount = cursor
      ? undefined
      : Number((await db.select({ count: sql<number>`count(*)` })
        .from(emails)
        .where(visibleEmailConditions))[0].count)
    const conditions = [regularEmailConditions]

    if (cursor) {
      const { timestamp, id } = decodeCursor(cursor)
      conditions.push(
        or(
          lt(emails.createdAt, new Date(timestamp)),
          and(
            eq(emails.createdAt, new Date(timestamp)),
            lt(emails.id, id)
          )
        )
      )
    }

    const results = await db.query.emails.findMany({
      where: and(...conditions),
      orderBy: (emails, { desc }) => [
        desc(emails.createdAt),
        desc(emails.id)
      ],
      limit: PAGE_SIZE + 1
    })

    const pinnedCatchAllEmails = !cursor && visibleCatchAllAddresses.length > 0
      ? await db.query.emails.findMany({
        where: and(
          baseConditions,
          inArray(sql<string>`LOWER(TRIM(${emails.address}))`, visibleCatchAllAddresses),
        ),
        orderBy: asc(emails.address),
      })
      : []

    const ownedDomainRows = !cursor
      ? await db.select({ domain: emailDomainExpression })
        .from(emails)
        .where(allVisibleEmailConditions)
        .groupBy(emailDomainExpression)
        .orderBy(emailDomainExpression)
      : []
    
    const hasMore = results.length > PAGE_SIZE
    const nextCursor = hasMore 
      ? encodeCursor(
          results[PAGE_SIZE - 1].createdAt.getTime(),
          results[PAGE_SIZE - 1].id
        )
      : null
    const regularEmailList = hasMore ? results.slice(0, PAGE_SIZE) : results
    const emailListWithoutCounts = [
      ...pinnedCatchAllEmails.map((email) => ({
        ...email,
        isCatchAll: true,
        isCatchAllEnabled: catchAllConfigByAddress.get(normalizeEmailAddress(email.address))?.enabled === true,
      })),
      ...regularEmailList.map((email) => ({ ...email, isCatchAll: false })),
    ]
    const messageCounts = new Map<string, { unreadCount: number; messageCount: number }>()
    const emailIds = emailListWithoutCounts.map(({ id }) => id)

    for (let index = 0; index < emailIds.length; index += COUNT_QUERY_CHUNK_SIZE) {
      const emailIdChunk = emailIds.slice(index, index + COUNT_QUERY_CHUNK_SIZE)
      if (emailIdChunk.length === 0) continue

      const countRows = await db.select({
        emailId: messages.emailId,
        messageCount: sql<number>`count(*)`,
        unreadCount: sql<number>`sum(case when ${messages.isRead} = 0 then 1 else 0 end)`,
      })
        .from(messages)
        .where(and(
          inArray(messages.emailId, emailIdChunk),
          or(eq(messages.type, "received"), isNull(messages.type)),
        ))
        .groupBy(messages.emailId)

      for (const row of countRows) {
        messageCounts.set(row.emailId, {
          unreadCount: Number(row.unreadCount ?? 0),
          messageCount: Number(row.messageCount ?? 0),
        })
      }
    }

    const emailList = emailListWithoutCounts.map((email) => ({
      ...email,
      ...(messageCounts.get(email.id) ?? { unreadCount: 0, messageCount: 0 }),
    }))

    return NextResponse.json({ 
      emails: emailList,
      nextCursor,
      total: totalCount,
      domains: ownedDomainRows
        .map(({ domain }) => domain)
        .filter(Boolean),
    })
  } catch (error) {
    console.error('Failed to fetch user emails:', error)
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    )
  }
}
