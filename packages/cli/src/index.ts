#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("moemail")
  .description("MoeMail CLI — Agent-friendly temporary email tool")
  .version("0.1.0")
  .option("--json", "output as JSON");

program.parse();
