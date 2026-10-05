/**
 * CHRONO CLI: REPLAY COMMAND
 * 
 * Reconstructs and inspects the exact state at a historical node.
 */

import * as path from "node:path";
import { SQLiteStorage } from "../../store/backends/sqlite.ts";
import { ChronoDAG } from "../../core/graph/dag.ts";
import { DeterministicReplayer } from "../../core/replay/replayer.ts";

export interface ReplayOptions {
  cwd?: string;
  targetCid: string;
}

export async function replayCommand(options: ReplayOptions): Promise<string> {
  const rootDir = options.cwd ?? process.cwd();
  const dbPath = path.join(rootDir, ".chrono", "dag.db");

  let storage: SQLiteStorage;
  try {
    storage = new SQLiteStorage(dbPath);
  } catch {
    throw new Error(`No CHRONO repository found in ${rootDir}. Run 'chrono init' first.`);
  }

  const dag = new ChronoDAG();
  storage.loadIntoDAG(dag);

  const replayer = new DeterministicReplayer(dag);
  const result = await replayer.reconstruct(options.targetCid);
  storage.close();

  const lines: string[] = [];
  lines.push(`Replay target: ${result.targetCid}`);
  lines.push(`Base snapshot: ${result.baseCid}`);
  lines.push(`Deltas folded: ${result.deltaCountFolded} (${result.elapsedMs.toFixed(2)}ms)`);
  lines.push("─".repeat(50));
  lines.push(`Reconstructed Buffers (${result.state.buffers.size}):`);

  for (const [uri, content] of result.state.buffers.entries()) {
    const preview = content.length > 80 ? content.slice(0, 80) + "..." : content;
    lines.push(`  ${uri} (${content.length} bytes):`);
    lines.push(`    "${preview}"`);
  }

  return lines.join("\n");
}
