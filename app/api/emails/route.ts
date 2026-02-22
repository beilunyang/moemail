import { createDb } from "@/lib/db"
import { and, eq, gt, lt, or, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { emails, messages } from "@/lib/schema"
import { encodeCursor, decodeCursor } from "@/lib/cursor"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

const PAGE_SIZE = 20

export async function GET(request: Request) {
  const userId = await getUserId()

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const search = searchParams.get('search')?.trim() || ''

  const db = createDb()

  try {
    const baseConditions = and(
      eq(emails.userId, userId!),
      gt(emails.expiresAt, new Date())
    )

    // When search is active, use JOIN to search across emails + messages
    if (search) {
      const escaped = search.toLowerCase().replace(/[%_]/g, '\\$&')
      const searchPattern = `%${escaped}%`
      const searchCondition = or(
        sql`LOWER(${emails.address}) LIKE ${searchPattern}`,
        sql`LOWER(${messages.subject}) LIKE ${searchPattern}`,
        sql`LOWER(${messages.fromAddress}) LIKE ${searchPattern}`,
        sql`LOWER(${messages.toAddress}) LIKE ${searchPattern}`
      )

      // Count matching emails
      const totalResult = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${emails.id})` })
        .from(emails)
        .leftJoin(messages, eq(messages.emailId, emails.id))
        .where(and(baseConditions, searchCondition))
      const totalCount = Number(totalResult[0].count)

      // Build cursor condition
      const cursorConditions = []
      if (cursor) {
        const { timestamp, id } = decodeCursor(cursor)
        cursorConditions.push(
          or(
            lt(emails.createdAt, new Date(timestamp)),
            and(
              eq(emails.createdAt, new Date(timestamp)),
              lt(emails.id, id)
            )
          )
        )
      }

      const results = await db
        .selectDistinct({
          id: emails.id,
          address: emails.address,
          userId: emails.userId,
          createdAt: emails.createdAt,
          expiresAt: emails.expiresAt,
        })
        .from(emails)
        .leftJoin(messages, eq(messages.emailId, emails.id))
        .where(and(baseConditions, searchCondition, ...cursorConditions))
        .orderBy(sql`${emails.createdAt} DESC`, sql`${emails.id} DESC`)
        .limit(PAGE_SIZE + 1)

      const hasMore = results.length > PAGE_SIZE
      const nextCursor = hasMore
        ? encodeCursor(
            results[PAGE_SIZE - 1].createdAt.getTime(),
            results[PAGE_SIZE - 1].id
          )
        : null
      const emailList = hasMore ? results.slice(0, PAGE_SIZE) : results

      return NextResponse.json({
        emails: emailList,
        nextCursor,
        total: totalCount
      })
    }

    // No search — original logic
    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(baseConditions)
    const totalCount = Number(totalResult[0].count)

    const conditions = [baseConditions]

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

    const hasMore = results.length > PAGE_SIZE
    const nextCursor = hasMore
      ? encodeCursor(
          results[PAGE_SIZE - 1].createdAt.getTime(),
          results[PAGE_SIZE - 1].id
        )
      : null
    const emailList = hasMore ? results.slice(0, PAGE_SIZE) : results

    return NextResponse.json({
      emails: emailList,
      nextCursor,
      total: totalCount
    })
  } catch (error) {
    console.error('Failed to fetch user emails:', error)
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    )
  }
}
