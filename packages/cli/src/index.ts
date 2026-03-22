#!/usr/bin/env node
import { Command } from "commander";
import { registerConfigCommand } from "./commands/config.js";
import { registerCreateCommand } from "./commands/create.js";
import { registerListCommand } from "./commands/list.js";

const program = new Command();

program
  .name("moemail")
  .description("MoeMail CLI — Agent-friendly temporary email tool")
  .version("0.1.0")
  .option("--json", "output as JSON");

registerConfigCommand(program);
registerCreateCommand(program);
registerListCommand(program);

program.parse();
