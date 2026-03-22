import { Command } from "commander";
import { api } from "../api.js";
import { log, printJson, printText, msToIso } from "../output.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function registerWaitCommand(program: Command) {
  program
    .command("wait")
    .description("Wait for a new email to arrive")
    .requiredOption("--email-id <id>", "email ID to watch")
    .option("--timeout <seconds>", "max wait time in seconds", "120")
    .option("--interval <seconds>", "poll interval in seconds", "5")
    .action(async (opts) => {
      const json = program.opts().json;
      const timeout = parseInt(opts.timeout, 10);
      const interval = parseInt(opts.interval, 10);
      const emailId = opts.emailId;

      try {
        const initial = (await api.listMessages(emailId)) as any;
        const knownIds = new Set<string>(initial.messages.map((m: any) => m.id));

        const startTime = Date.now();

        while (true) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          if (elapsed >= timeout) {
            log(`Timeout: no new messages received within ${timeout}s`);
            process.exit(1);
          }

          log(`Polling... (${elapsed}/${timeout}s)`);
          await sleep(interval * 1000);

          const current = (await api.listMessages(emailId)) as any;
          const newMessages = current.messages.filter((m: any) => !knownIds.has(m.id));

          if (newMessages.length > 0) {
            const msg = newMessages[0];
            if (json) {
              printJson({
                messageId: msg.id,
                from: msg.from_address,
                subject: msg.subject,
                receivedAt: msg.received_at ? msToIso(msg.received_at) : null,
              });
            } else {
              printText(`New message from ${msg.from_address}: "${msg.subject}"`);
              printText(`Message ID: ${msg.id}`);
            }
            return;
          }
        }
      } catch (e: any) {
        log(`Error: ${e.message}`);
        process.exit(1);
      }
    });
}
