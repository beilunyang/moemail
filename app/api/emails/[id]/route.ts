import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { emails, messages } from "@/lib/schema"
import { eq, and, asc, desc, gt, lt, or, sql, ne, isNull } from "drizzle-orm"
import { encodeCursor, decodeCursor } from "@/lib/cursor"
import { getUserId } from "@/lib/apiKey"
import { checkBasicSendPermission } from "@/lib/send-permissions"
import { getRequestContext } from "@cloudflare/next-on-pages"
import {
  CATCHALL_EMAIL_KEY,
  normalizeEmailAddress,
  parseCatchAllEmailConfig,
} from "@/lib/catch-all"

export const runtime = "edge"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()

  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  try {
    const db = createDb()
    const { id } = await params
    const email = await db.query.emails.findFirst({
      where: and(
        eq(emails.id, id),
        eq(emails.userId, userId)
      )
    })

    if (!email) {
      return NextResponse.json(
        { error: "邮箱不存在或无权限删除" },
        { status: 403 }
      )
    }

    const env = getRequestContext().env
    const catchAllEmail = await env.SITE_CONFIG.get(CATCHALL_EMAIL_KEY)
    const catchAllConfig = parseCatchAllEmailConfig(catchAllEmail)
    const catchAllAddresses = new Set(
      Object.values(catchAllConfig).map(({ address }) => normalizeEmailAddress(address)),
    )

    if (catchAllAddresses.has(normalizeEmailAddress(email.address))) {
      return NextResponse.json(
        { error: "Catch-all 邮箱不能删除，请先在网站设置中更换配置" },
        { status: 409 },
      )
    }
    await db.delete(messages)
      .where(eq(messages.emailId, id))

    await db.delete(emails)
      .where(eq(emails.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete email:', error)
    return NextResponse.json(
      { error: "删除邮箱失败" },
      { status: 500 }
    )
  }
}

const PAGE_SIZE = 20

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const pollBaselineTimestamp = Date.now()
  const { searchParams } = new URL(request.url)
  const cursorStr = searchParams.get('cursor')
  const afterStr = searchParams.get('after')
  const messageType = searchParams.get('type')
  const userId = await getUserId()

  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  if (cursorStr && afterStr) {
    return NextResponse.json({ error: "cursor and after cannot be used together" }, { status: 400 })
  }

  try {
    const db = createDb()
    const { id } = await params

    if (messageType === 'sent') {
      const permissionResult = await checkBasicSendPermission(userId)
      if (!permissionResult.canSend) {
        return NextResponse.json(
          { error: permissionResult.error || "您没有查看发送邮件的权限" },
          { status: 403 }
        )
      }
    }

    const email = await db.query.emails.findFirst({
      where: and(
        eq(emails.id, id),
        eq(emails.userId, userId)
      )
    })

    if (!email) {
      return NextResponse.json(
        { error: "无权限查看" },
        { status: 403 }
      )
    }

    const baseConditions = and(
      eq(messages.emailId, id),
      messageType === 'sent' 
        ? eq(messages.type, "sent") 
        : or(
            ne(messages.type, "sent"),
            isNull(messages.type)
          )
    )

    const totalCount = afterStr || cursorStr
      ? undefined
      : Number((await db.select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(baseConditions))[0].count)

    const conditions = [baseConditions]

    if (cursorStr) {
      const { timestamp, id } = decodeCursor(cursorStr)
      const orderByTime = messageType === 'sent' ? messages.sentAt : messages.receivedAt
      conditions.push(
        or(
          lt(orderByTime, new Date(timestamp)),
          and(
            eq(orderByTime, new Date(timestamp)),
            lt(messages.id, id)
          )
        )
      )
    }

    if (afterStr) {
      const { timestamp, id } = decodeCursor(afterStr)
      const orderByTime = messageType === 'sent' ? messages.sentAt : messages.receivedAt
      conditions.push(
        or(
          gt(orderByTime, new Date(timestamp)),
          and(
            eq(orderByTime, new Date(timestamp)),
            gt(messages.id, id)
          )
        )
      )
    }

    const orderByTime = messageType === 'sent' ? messages.sentAt : messages.receivedAt
    
    const results = await db.select({
      id: messages.id,
      fromAddress: messages.fromAddress,
      toAddress: messages.toAddress,
      subject: messages.subject,
      type: messages.type,
      isRead: messages.isRead,
      receivedAt: messages.receivedAt,
      sentAt: messages.sentAt,
    })
      .from(messages)
      .where(and(...conditions))
      .orderBy(
        afterStr ? asc(orderByTime) : desc(orderByTime),
        afterStr ? asc(messages.id) : desc(messages.id),
      )
      .limit(PAGE_SIZE + 1)
    
    const hasMore = results.length > PAGE_SIZE
    const nextCursor = hasMore && !afterStr
      ? encodeCursor(
          messageType === 'sent' 
            ? results[PAGE_SIZE - 1].sentAt!.getTime()
            : results[PAGE_SIZE - 1].receivedAt.getTime(),
          results[PAGE_SIZE - 1].id
        )
      : null
    const messageList = hasMore ? results.slice(0, PAGE_SIZE) : results
    const lastMessage = messageList.at(-1)
    const newestMessage = afterStr ? lastMessage : messageList[0]
    const cursorForMessage = (message: typeof messageList[number] | undefined) => message
      ? encodeCursor(
        messageType === 'sent'
          ? message.sentAt!.getTime()
          : message.receivedAt.getTime(),
        message.id,
      )
      : null

    return NextResponse.json({ 
      messages: messageList.map(msg => ({
        id: msg.id,
        from_address: msg?.fromAddress,
        to_address: msg?.toAddress,
        subject: msg.subject,
        is_read: msg.isRead,
        sent_at: msg.sentAt?.getTime(),
        received_at: msg.receivedAt?.getTime()
      })),
      nextCursor,
      nextAfterCursor: afterStr && hasMore ? cursorForMessage(lastMessage) : null,
      latestCursor: cursorForMessage(newestMessage) ?? afterStr ?? encodeCursor(pollBaselineTimestamp, ""),
      total: totalCount,
    })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}
