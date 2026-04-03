import { Command } from "commander";
import { api } from "../api.js";
import { log, printJson, printText, msToIso } from "../output.js";

const EXPIRY_MAP: Record<string, number> = {
  "1h": 3600000,
  "24h": 86400000,
  "3d": 259200000,
  permanent: 0,
};

export function registerCreateCommand(program: Command) {
  program
    .command("create")
    .description("Create a temporary email address")
    .option("--name <name>", "email prefix")
    .option("--domain <domain>", "email domain")
    .option("--subdomain <label>", "optional subdomain label")
    .option("--expiry <expiry>", "1h | 24h | 3d | permanent", "1h")
    .action(async (opts) => {
      const json = program.opts().json;
      const expiryTime = EXPIRY_MAP[opts.expiry];
      if (expiryTime === undefined) {
        log(`Error: Invalid expiry "${opts.expiry}". Valid: 1h, 24h, 3d, permanent`);
        process.exit(1);
      }

      try {
        let domain = opts.domain;
        if (!domain) {
          const config = (await api.getConfig()) as any;
          const domains = config.emailDomains?.split(",").map((d: string) => d.trim());
          if (!domains?.length) {
            log("Error: No email domains configured on server.");
            process.exit(1);
          }
          domain = domains[0];
        }

        const result = (await api.createEmail({
          name: opts.name,
          expiryTime,
          domain,
          subdomain: opts.subdomain,
        })) as any;

        const expiresAt =
          expiryTime === 0
            ? null
            : msToIso(Date.now() + expiryTime);

        if (json) {
          printJson({ id: result.id, address: result.email, expiresAt });
        } else {
          const expiryLabel = opts.expiry === "permanent" ? "permanent" : `expires in ${opts.expiry}`;
          printText(`Created: ${result.email} (${expiryLabel})`);
          printText(`ID: ${result.id}`);
        }
      } catch (e: any) {
        log(`Error: ${e.message}`);
        process.exit(1);
      }
    });
}
