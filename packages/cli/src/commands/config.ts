import { Command } from "commander";
import { loadConfig, saveConfig } from "../config.js";

export function registerConfigCommand(program: Command) {
  const cmd = program.command("config").description("Configure API endpoint and API Key");

  cmd
    .command("set <key> <value>")
    .description("Set a config value (api-url or api-key)")
    .action((key: string, value: string) => {
      try {
        saveConfig(key, value);
        console.error(`Set ${key} successfully.`);
      } catch (e: any) {
        console.error(e.message);
        process.exit(1);
      }
    });

  cmd
    .command("list")
    .description("Show current configuration")
    .action(() => {
      const config = loadConfig();
      console.log(`api-url: ${config.apiUrl || "(not set)"}`);
      console.log(`api-key: ${config.apiKey ? config.apiKey.slice(0, 6) + "..." : "(not set)"}`);
    });
}
