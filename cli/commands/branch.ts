/**
 * CHRONO CLI: BRANCH COMMAND
 * 
 * Lists or creates timeline branches.
 */

import * as path from "node:path";
import { SQLiteStorage } from "../../store/backends/sqlite.ts";

export interface BranchOptions {
  cwd?: string;
  createName?: string;
  fromCid?: string;
}

export function branchCommand(options: BranchOptions = {}): string {
  const rootDir = options.cwd ?? process.cwd();
  const dbPath = path.join(rootDir, ".chrono", "dag.db");

  let storage: SQLiteStorage;
  try {
    storage = new SQLiteStorage(dbPath);
  } catch {
    throw new Error(`No CHRONO repository found in ${rootDir}. Run 'chrono init' first.`);
  }

  if (options.createName) {
    const fromCid = options.fromCid ?? storage.getBranchHead("main");
    if (!fromCid) {
      storage.close();
      throw new Error("Cannot branch: no parent node found.");
    }

    storage.setBranchHead(options.createName, fromCid);
    storage.close();
    return `✓ Branch '${options.createName}' created at ${fromCid.slice(0, 10)}`;
  }

  const branches = storage.listBranches();
  storage.close();

  if (branches.length === 0) {
    return "No branches found.";
  }

  const lines = ["Active branches:"];
  for (const b of branches) {
    lines.push(`  ${b.name.padEnd(20)} -> ${b.headCid.slice(0, 10)} (${b.updatedAt})`);
  }
  return lines.join("\n");
}
