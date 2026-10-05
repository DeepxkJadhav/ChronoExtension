#!/usr/bin/env node
/**
 * CHRONO CLI: MAIN ENTRY
 * 
 * Command dispatcher for chrono CLI:
 * chrono init
 * chrono log
 * chrono branch [name]
 * chrono replay <cid>
 * chrono query "<cql>"
 */

import { initCommand } from "./commands/init.ts";
import { logCommand } from "./commands/log.ts";
import { branchCommand } from "./commands/branch.ts";
import { replayCommand } from "./commands/replay.ts";
import { queryCommand } from "./commands/query.ts";

export async function runCli(args: string[]): Promise<void> {
  const command = args[0];

  try {
    switch (command) {
      case "init": {
        const msg = await initCommand();
        console.log(msg);
        break;
      }
      case "log": {
        const branchIdx = args.indexOf("--branch");
        const branch = branchIdx !== -1 ? args[branchIdx + 1] : undefined;
        console.log(logCommand({ branch }));
        break;
      }
      case "branch": {
        const name = args[1] && !args[1].startsWith("-") ? args[1] : undefined;
        console.log(branchCommand({ createName: name }));
        break;
      }
      case "replay": {
        const cid = args[1];
        if (!cid) {
          console.error("Usage: chrono replay <cid>");
          process.exit(1);
        }
        const msg = await replayCommand({ targetCid: cid });
        console.log(msg);
        break;
      }
      case "query": {
        const cql = args.slice(1).join(" ");
        if (!cql) {
          console.error("Usage: chrono query \"<cql_expression>\"");
          process.exit(1);
        }
        console.log(queryCommand({ cql }));
        break;
      }
      case "help":
      case "--help":
      case "-h":
      default: {
        console.log(`
CHRONO: Git for living computational state

Usage:
  chrono init                 Initialize .chrono repository in current directory
  chrono log [--branch <b]    Display commit timeline
  chrono branch [name]        List or create branches
  chrono replay <cid>         Reconstruct and inspect state at node <cid>
  chrono query "<cql>"        Execute a Chrono Query Language expression
  chrono help                 Show this help message
        `.trim());
        break;
      }
    }
  } catch (err: unknown) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  runCli(process.argv.slice(2));
}
