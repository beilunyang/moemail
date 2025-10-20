import { createDb } from "@/lib/db"
import { and, eq, gt, lt, or, sql, inArray } from "drizzle-orm" // 导入 inArray
import { NextResponse } from "next/server"
import { emails, emailDomains } from "@/lib/schema" // 导入 emailDomains
import { encodeCursor, decodeCursor } from "@/lib/cursor"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

const PAGE_SIZE = 20

export async function GET(request: Request) {
  const userId = await getUserId()

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  
  const db = createDb()

  try {
    const baseConditions = and(
      eq(emails.userId, userId!),
      gt(emails.expiresAt, new Date())
    )

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

    // --- 新增逻辑：获取并附加域名的是否启用 Resend 状态 ---
    // 1. 从结果中提取所有唯一的域名
    const domains = [...new Set(results.map(e => e.address.split('@')[1]).filter(Boolean))]

    let domainMap = new Map<string, boolean>()

    // 2. 如果有域名，则查询
    if (domains.length > 0) {
      const domainConfigs = await db.query.emailDomains.findMany({
        where: inArray(emailDomains.domain, domains),
        columns: {
          domain: true,
          resendEnabled: true
        }
      })
      // 3. 创建一个 域名 -> resendEnabled 的映射
      domainMap = new Map(domainConfigs.map(d => [d.domain, d.resendEnabled || false]))
    }

    // 4. 将 resendEnabled 状态附加到每个 email 对象
    const emailsWithStatus = results.map(email => ({
      ...email,
      // 从映射中获取状态，如果域名不存在于表中，则默认为 false
      resendEnabled: domainMap.get(email.address.split('@')[1]) || false
    }))
    // --- 结束新增逻辑 ---
    
    const hasMore = results.length > PAGE_SIZE // 保持原始的 hasMore 逻辑
    
    // 注意：nextCursor 应该使用原始的 results 列表来获取正确的 createdAt 和 id
    const nextCursor = hasMore 
      ? encodeCursor(
          results[PAGE_SIZE - 1].createdAt.getTime(), // 使用原始 results
          results[PAGE_SIZE - 1].id // 使用原始 results
        )
      : null
    
    // emailList 应该使用附加了状态的列表
    const emailList = hasMore ? emailsWithStatus.slice(0, PAGE_SIZE) : emailsWithStatus

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