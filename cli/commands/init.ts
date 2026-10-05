/**
 * CHRONO CLI: INIT COMMAND
 * 
 * Initializes a new .chrono repository in the specified workspace root.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { SQLiteStorage } from "../../store/backends/sqlite.ts";
import { StateNode } from "../../core/graph/node.ts";

export interface InitOptions {
  cwd?: string;
  force?: boolean;
}

export async function initCommand(options: InitOptions = {}): Promise<string> {
  const rootDir = options.cwd ?? process.cwd();
  const chronoDir = path.join(rootDir, ".chrono");

  try {
    const stat = await fs.stat(chronoDir);
    if (stat.isDirectory() && !options.force) {
      return `CHRONO repository already exists at ${chronoDir}`;
    }
  } catch {
    // Doesn't exist, proceed
  }

  // Create standard directory structure matching store/format/on-disk.md
  await fs.mkdir(path.join(chronoDir, "wal"), { recursive: true });
  await fs.mkdir(path.join(chronoDir, "objects"), { recursive: true });
  await fs.mkdir(path.join(chronoDir, "epochs"), { recursive: true });
  await fs.mkdir(path.join(chronoDir, "run"), { recursive: true });

  await fs.writeFile(path.join(chronoDir, "CHRONO_VERSION"), "1.0.0\n", "utf-8");
  await fs.writeFile(
    path.join(chronoDir, "config.json"),
    JSON.stringify(
      {
        version: "1.0.0",
        hashAlgorithm: "BLAKE3",
        compression: "zstd",
        epochInterval: 50,
      },
      null,
      2
    ),
    "utf-8"
  );

  // Initialize SQLite database
  const dbPath = path.join(chronoDir, "dag.db");
  const storage = new SQLiteStorage(dbPath);

  // Create initial Genesis Root Node
  const genesisNode = await StateNode.create({
    parents: [],
    clock: { system: 1 },
    wallTime: new Date().toISOString(),
    adapter: { id: "chrono.core", version: "1.0.0", instanceId: "init" },
    kind: "snapshot",
    body: { kind: "snapshot", state: {}, bytes: 0 },
    annotations: { label: "Genesis Root Node", branch: "main" },
  });

  storage.saveNode(genesisNode);
  storage.setBranchHead("main", genesisNode.cid);
  storage.close();

  return `Initialized empty CHRONO repository at ${chronoDir} (Genesis CID: ${genesisNode.cid})`;
}
