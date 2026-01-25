import { callWebhook } from "@/lib/webhook"
import { WEBHOOK_CONFIG } from "@/config"
import { z } from "zod"
import { EmailMessage } from "@/lib/webhook"


const testSchema = z.object({
  url: z.string().url()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url } = testSchema.parse(body)

    await callWebhook(url, {
      event: WEBHOOK_CONFIG.EVENTS.NEW_MESSAGE,
      data: {
        emailId: "123456789",
        messageId: '987654321',
        fromAddress: "sender@example.com",
        subject: "Test Email",
        content: "This is a test email.",
        html: "<p>This is a <strong>test</strong> email.</p>",
        receivedAt: "2023-03-01T12:00:00Z",
        toAddress: "recipient@example.com"
      } as EmailMessage
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to test webhook:", error)
    return Response.json(
      { error: "Failed to test webhook" },
      { status: 400 }
    )
  }
} 