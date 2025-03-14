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

  try {
    const db = createDb()
    const { id, messageId } = await params
    const email = await db.query.emails.findFirst({
      where: and(
          eq(emails.id, id),
          eq(emails.userId, userId!)
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
  try {
    const { id, messageId } = await params
    const db = createDb()
    const userId = await getUserId()

    const email = await db.query.emails.findFirst({
      where: and(
        eq(emails.id, id),
        eq(emails.userId, userId!)
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
        subject: message.subject,
        content: message.content,
        html: message.html,
        received_at: message.receivedAt.getTime()
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