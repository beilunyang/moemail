import { createDb } from "@/lib/db"
import { and, asc, eq, gt, inArray, lt, notInArray, or, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { emails } from "@/lib/schema"
import { encodeCursor, decodeCursor } from "@/lib/cursor"
import { getUserId } from "@/lib/apiKey"
import { getRequestContext } from "@cloudflare/next-on-pages"
import {
  CATCHALL_EMAIL_KEY,
  normalizeEmailAddress,
  parseCatchAllEmailConfig,
} from "@/lib/catch-all"

export const runtime = "edge"

const PAGE_SIZE = 20

export async function GET(request: Request) {
  const userId = await getUserId()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  
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

    const baseConditions = and(
      eq(emails.userId, userId),
      gt(emails.expiresAt, new Date())
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
    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(visibleEmailConditions)
    const totalCount = Number(totalResult[0].count)
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
    
    const hasMore = results.length > PAGE_SIZE
    const nextCursor = hasMore 
      ? encodeCursor(
          results[PAGE_SIZE - 1].createdAt.getTime(),
          results[PAGE_SIZE - 1].id
        )
      : null
    const regularEmailList = hasMore ? results.slice(0, PAGE_SIZE) : results
    const emailList = [
      ...pinnedCatchAllEmails.map((email) => ({
        ...email,
        isCatchAll: true,
        isCatchAllEnabled: catchAllConfigByAddress.get(normalizeEmailAddress(email.address))?.enabled === true,
      })),
      ...regularEmailList.map((email) => ({ ...email, isCatchAll: false })),
    ]

    return NextResponse.json({ 
      emails: emailList,
      nextCursor,
      total: totalCount,
    })
  } catch (error) {
    console.error('Failed to fetch user emails:', error)
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    )
  }
}
