import { Command } from "commander";
import { api } from "../api.js";
import { log, printJson, printText } from "../output.js";

export function registerSendCommand(program: Command) {
  program
    .command("send")
    .description("Send an email from a temporary address")
    .requiredOption("--email-id <id>", "email ID to send from")
    .requiredOption("--to <address>", "recipient email address")
    .requiredOption("--subject <subject>", "email subject")
    .requiredOption("--content <content>", "email body text")
    .action(async (opts) => {
      const json = program.opts().json;
      try {
        const result = (await api.sendEmail(opts.emailId, {
          to: opts.to,
          subject: opts.subject,
          content: opts.content,
        })) as any;

        if (json) {
          printJson({
            success: true,
            remainingEmails: result.remainingEmails,
          });
        } else {
          printText(`Email sent successfully. Remaining today: ${result.remainingEmails}`);
        }
      } catch (e: any) {
        log(`Error: ${e.message}`);
        process.exit(1);
      }
    });
}
