import { Command } from "commander";
import { api } from "../api.js";
import { log, printJson, printText, msToIso } from "../output.js";

export function registerReadCommand(program: Command) {
  program
    .command("read")
    .description("Read an email message")
    .requiredOption("--email-id <id>", "email ID")
    .requiredOption("--message-id <id>", "message ID")
    .option("--format <format>", "text | html", "text")
    .action(async (opts) => {
      const json = program.opts().json;
      try {
        const data = (await api.getMessage(opts.emailId, opts.messageId)) as any;
        const msg = data.message;

        if (json) {
          printJson({
            id: msg.id,
            from: msg.from_address,
            to: msg.to_address,
            subject: msg.subject,
            content: msg.content,
            html: msg.html,
            receivedAt: msg.received_at ? msToIso(msg.received_at) : null,
            type: msg.type,
          });
        } else {
          printText(`From: ${msg.from_address}`);
          printText(`To: ${msg.to_address}`);
          printText(`Subject: ${msg.subject}`);
          printText(`---`);
          if (opts.format === "html") {
            printText(msg.html || "(no HTML content)");
          } else {
            printText(msg.content || "(no text content)");
          }
        }
      } catch (e: any) {
        log(`Error: ${e.message}`);
        process.exit(1);
      }
    });
}
