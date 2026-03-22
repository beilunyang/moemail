import { Command } from "commander";
import { api } from "../api.js";
import { log, printJson, printText } from "../output.js";

export function registerDeleteCommand(program: Command) {
  program
    .command("delete")
    .description("Delete a mailbox or message")
    .requiredOption("--email-id <id>", "email ID")
    .option("--message-id <id>", "message ID (omit to delete entire mailbox)")
    .action(async (opts) => {
      const json = program.opts().json;
      try {
        if (opts.messageId) {
          await api.deleteMessage(opts.emailId, opts.messageId);
          if (json) {
            printJson({ success: true });
          } else {
            printText(`Deleted message ${opts.messageId}`);
          }
        } else {
          await api.deleteEmail(opts.emailId);
          if (json) {
            printJson({ success: true });
          } else {
            printText(`Deleted mailbox ${opts.emailId}`);
          }
        }
      } catch (e: any) {
        log(`Error: ${e.message}`);
        process.exit(1);
      }
    });
}
