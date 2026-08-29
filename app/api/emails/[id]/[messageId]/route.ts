import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { messages, emails } from "@/lib/schema"
import { and, eq } from "drizzle-orm"
import { getUserId } from "@/lib/apiKey"
export const runtime = "edge"

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const db = createDb()
    const { id, messageId } = await params
    const email = await db.query.emails.findFirst({
      where: and(
          eq(emails.id, id),
          eq(emails.userId, userId)
      )
    })

    if (!email) {
      return NextResponse.json(
          { error: "Email not found or no permission to view" },
          { status: 403 }
      )
    }

    const message = await db.query.messages.findFirst({
      where: and(
          eq(messages.emailId, id),
          eq(messages.id, messageId)
      )
    })

    if(!message) {
      return NextResponse.json(
          { error: "Message not found or already deleted" },
          { status: 404 }
      )
    }

    await db.delete(messages)
        .where(eq(messages.id, messageId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete email:', error)
    return NextResponse.json(
        { error: "Failed to delete message" },
        { status: 500 }
    )
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const { id, messageId } = await params
    const db = createDb()

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

    const message = await db.query.messages.findFirst({
      where: and(
        eq(messages.id, messageId),
        eq(messages.emailId, id)
      )
    })
    
    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: {
        id: message.id,
        from_address: message.fromAddress,
        to_address: message.toAddress,
        subject: message.subject,
        content: message.content,
        html: message.html,
        is_read: message.isRead,
        received_at: message.receivedAt.getTime(),
        sent_at: message.sentAt?.getTime(),
        type: message.type as 'received' | 'sent'
      }
    })
  } catch (error) {
    console.error('Failed to fetch message:', error)
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    )
  }
}

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  try {
    const { id, messageId } = await params
    const db = createDb()
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const email = await db.query.emails.findFirst({
      where: and(eq(emails.id, id), eq(emails.userId, userId)),
    })
    if (!email) {
      return NextResponse.json({ error: "无权限查看" }, { status: 403 })
    }

    const message = await db.query.messages.findFirst({
      where: and(eq(messages.id, messageId), eq(messages.emailId, id)),
    })
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    let wasUnread = false
    if (message.type !== "sent" && !message.isRead) {
      const updatedMessages = await db.update(messages)
        .set({ isRead: true })
        .where(and(eq(messages.id, messageId), eq(messages.isRead, false)))
        .returning({ id: messages.id })
      wasUnread = updatedMessages.length > 0
    }

    return NextResponse.json({
      wasUnread,
      message: {
        id: message.id,
        from_address: message.fromAddress,
        to_address: message.toAddress,
        subject: message.subject,
        content: message.content,
        html: message.html,
        is_read: true,
        received_at: message.receivedAt.getTime(),
        sent_at: message.sentAt?.getTime(),
        type: message.type as 'received' | 'sent',
      },
    })
  } catch (error) {
    console.error('Failed to mark message as read:', error)
    return NextResponse.json({ error: "Failed to load message" }, { status: 500 })
  }
}
