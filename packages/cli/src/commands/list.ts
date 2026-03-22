import { Command } from "commander";
import { api } from "../api.js";
import { log, printJson, printText, msToIso } from "../output.js";

export function registerListCommand(program: Command) {
  program
    .command("list")
    .description("List mailboxes or messages")
    .option("--email-id <id>", "list messages in this mailbox")
    .option("--cursor <cursor>", "pagination cursor")
    .action(async (opts) => {
      const json = program.opts().json;
      try {
        if (opts.emailId) {
          const data = (await api.listMessages(opts.emailId, opts.cursor)) as any;
          if (json) {
            printJson({
              messages: data.messages.map((m: any) => ({
                id: m.id,
                from: m.from_address,
                subject: m.subject,
                receivedAt: m.received_at ? msToIso(m.received_at) : null,
              })),
              nextCursor: data.nextCursor,
              total: data.total,
            });
          } else {
            if (!data.messages.length) {
              printText("No messages.");
            } else {
              for (const m of data.messages) {
                printText(`[${m.id}] From: ${m.from_address} — ${m.subject}`);
              }
              printText(`Total: ${data.total}`);
            }
          }
        } else {
          // Note: GET /api/emails returns raw Drizzle ORM objects.
          // expiresAt is a Date serialized to ISO string (not epoch ms).
          const data = (await api.listEmails(opts.cursor)) as any;
          if (json) {
            printJson({
              emails: data.emails.map((e: any) => ({
                id: e.id,
                address: e.address,
                expiresAt: e.expiresAt || null,
              })),
              nextCursor: data.nextCursor,
              total: data.total,
            });
          } else {
            if (!data.emails.length) {
              printText("No mailboxes.");
            } else {
              for (const e of data.emails) {
                printText(`[${e.id}] ${e.address}`);
              }
              printText(`Total: ${data.total}`);
            }
          }
        }
      } catch (e: any) {
        log(`Error: ${e.message}`);
        process.exit(1);
      }
    });
}
