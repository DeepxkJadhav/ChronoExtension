/**
 * CHRONO CLI: LOG COMMAND
 * 
 * Displays timeline history along active branch or whole DAG.
 */

import * as path from "node:path";
import { SQLiteStorage } from "../../store/backends/sqlite.ts";
import { ChronoDAG } from "../../core/graph/dag.ts";

export interface LogOptions {
  cwd?: string;
  branch?: string;
  limit?: number;
}

export function logCommand(options: LogOptions = {}): string {
  const rootDir = options.cwd ?? process.cwd();
  const dbPath = path.join(rootDir, ".chrono", "dag.db");

  let storage: SQLiteStorage;
  try {
    storage = new SQLiteStorage(dbPath);
  } catch {
    throw new Error(`No CHRONO repository found in ${rootDir}. Run 'chrono init' first.`);
  }

  const branchName = options.branch ?? "main";
  const headCid = storage.getBranchHead(branchName);
  if (!headCid) {
    storage.close();
    return `Branch '${branchName}' has no commits or does not exist.`;
  }

  const dag = new ChronoDAG();
  storage.loadIntoDAG(dag);

  const lines: string[] = [];
  lines.push(`Timeline on branch: [${branchName}]`);
  lines.push("─".repeat(50));

  let currCid: string | undefined = headCid;
  let count = 0;
  const max = options.limit ?? 20;

  while (currCid && count < max) {
    const node = dag.getNode(currCid);
    if (!node) break;

    const shortCid = node.cid.slice(0, 10);
    const kindIcon = node.kind === "snapshot" ? "📦" : node.kind === "merge" ? "🔀" : "●";
    const label = node.annotations?.label ? ` (${node.annotations.label})` : "";
    const wallTime = node.wallTime.split("T")[0] + " " + node.wallTime.split("T")[1]?.slice(0, 8);

    let summary = "";
    const body = node.body as Record<string, unknown> | null;
    if (body && body.kind === "delta") {
      const d = body.delta as { type?: string; target_uri?: string };
      summary = ` ${d.type ?? "edit"} -> ${d.target_uri ?? ""}`;
    }

    lines.push(`${kindIcon} ${shortCid}  [${wallTime}]  ${node.adapter.id}${label}${summary}`);

    currCid = node.parents.length > 0 ? node.parents[0] : undefined;
    count++;
  }

  storage.close();
  return lines.join("\n");
}
