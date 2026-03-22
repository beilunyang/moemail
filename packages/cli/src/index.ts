#!/usr/bin/env node
import { Command } from "commander";
import { registerConfigCommand } from "./commands/config.js";
import { registerCreateCommand } from "./commands/create.js";
import { registerListCommand } from "./commands/list.js";
import { registerWaitCommand } from "./commands/wait.js";
import { registerReadCommand } from "./commands/read.js";

const program = new Command();

program
  .name("moemail")
  .description("MoeMail CLI — Agent-friendly temporary email tool")
  .version("0.1.0")
  .option("--json", "output as JSON");

registerConfigCommand(program);
registerCreateCommand(program);
registerListCommand(program);
registerWaitCommand(program);
registerReadCommand(program);

program.parse();
