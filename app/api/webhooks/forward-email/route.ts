import { NextRequest, NextResponse } from "next/server";
import { createDb } from "@/lib/db";
import { messages, emails } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

interface ForwardEmailWebhookPayload {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    content?: string;
  }>;
  messageId?: string;
  date?: string;
  headers?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    console.log("[WEBHOOK] Forward Email webhook received");

    // 解析请求体
    const payload: ForwardEmailWebhookPayload = await request.json();
    console.log("[WEBHOOK] Payload:", {
      to: payload.to,
      from: payload.from,
      subject: payload.subject,
      hasText: !!payload.text,
      hasHtml: !!payload.html,
      attachmentCount: payload.attachments?.length || 0,
    });

    const { to, from, subject, text, html, date } = payload;

    // 验证必要字段
    if (!to || !from) {
      console.error("[WEBHOOK] Missing required fields:", { to, from });
      return NextResponse.json(
        { error: "Missing required fields: to, from" },
        { status: 400 }
      );
    }

    // 查找对应的邮箱记录
    let db, email;
    try {
      db = createDb();
      email = await db.query.emails.findFirst({
        where: eq(emails.address, to),
        with: {
          user: true,
        },
      });
    } catch (dbError) {
      console.error("[WEBHOOK] Database connection error:", dbError);
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: "This might be expected in development environment",
        },
        { status: 503 }
      );
    }

    if (!email) {
      console.warn("[WEBHOOK] Email address not found in system:", to);
      return NextResponse.json(
        { error: "Email address not found in system" },
        { status: 404 }
      );
    }

    console.log("[WEBHOOK] Found email record:", {
      emailId: email.id,
      userId: email.userId,
      address: email.address,
    });

    // 检查邮箱是否已过期
    if (email.expiresAt && new Date(email.expiresAt) < new Date()) {
      console.warn("[WEBHOOK] Email address has expired:", {
        address: to,
        expiresAt: email.expiresAt,
      });
      return NextResponse.json(
        { error: "Email address has expired" },
        { status: 410 }
      );
    }

    // 存储邮件到数据库（匹配现有 schema）
    const messageData = {
      emailId: email.id,
      fromAddress: from,
      toAddress: to,
      subject: subject || "(无主题)",
      content: text || "",
      html: html || "",
      type: "received",
      receivedAt: date ? new Date(date) : new Date(),
      sentAt: date ? new Date(date) : new Date(),
    };

    const [newMessage] = await db
      .insert(messages)
      .values(messageData)
      .returning();

    console.log("[WEBHOOK] Message saved successfully:", {
      messageId: newMessage.id,
      emailId: email.id,
      from,
      subject,
    });

    return NextResponse.json({
      success: true,
      messageId: newMessage.id,
      message: "Email received and stored successfully",
    });
  } catch (error) {
    console.error("[WEBHOOK] Forward Email webhook error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 支持 GET 请求用于健康检查
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Forward Email Webhook",
    timestamp: new Date().toISOString(),
  });
}
