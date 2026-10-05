/**
 * CHRONO STORE: SQLITE BACKEND
 * 
 * Persistent storage for DAG edges, nodes, vector clocks, and branch heads
 * implementing the specification in store/format/on-disk.md.
 */

import { DatabaseSync } from "node:sqlite";
import * as path from "node:path";
import * as fs from "node:fs";
import { StateNode } from "../../core/graph/node.ts";
import type { CID, NodeKind, StateNodeData } from "../../core/graph/node.ts";
import { ChronoDAG } from "../../core/graph/dag.ts";
import { VectorClock } from "../../core/clock/logical.ts";
import type { VectorClockSnapshot } from "../../core/clock/logical.ts";

export interface BranchInfo {
  name: string;
  headCid: CID;
  createdAt: string;
  updatedAt: string;
}

export class SQLiteStorage {
  private db: DatabaseSync;

  constructor(dbPath: string) {
    if (dbPath !== ":memory:") {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA synchronous = NORMAL;");

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS nodes (
        cid TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        adapter_id TEXT NOT NULL,
        adapter_version TEXT NOT NULL,
        adapter_instance TEXT NOT NULL,
        wall_time TEXT NOT NULL,
        epoch_number INTEGER,
        payload_inline TEXT,
        annotations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS edges (
        parent_cid TEXT NOT NULL,
        child_cid TEXT NOT NULL,
        ordinal INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (parent_cid, child_cid),
        FOREIGN KEY (parent_cid) REFERENCES nodes(cid),
        FOREIGN KEY (child_cid) REFERENCES nodes(cid)
      );

      CREATE INDEX IF NOT EXISTS idx_edges_child ON edges(child_cid);

      CREATE TABLE IF NOT EXISTS vector_clocks (
        cid TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        sequence_num INTEGER NOT NULL,
        PRIMARY KEY (cid, actor_id),
        FOREIGN KEY (cid) REFERENCES nodes(cid) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS branches (
        name TEXT PRIMARY KEY,
        head_cid TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (head_cid) REFERENCES nodes(cid)
      );

      CREATE TABLE IF NOT EXISTS epochs (
        epoch_id INTEGER PRIMARY KEY AUTOINCREMENT,
        head_cid TEXT NOT NULL,
        delta_count INTEGER NOT NULL,
        pack_path TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (head_cid) REFERENCES nodes(cid)
      );
    `);
  }

  public saveNode(node: StateNode): void {
    const insertNode = this.db.prepare(`
      INSERT OR IGNORE INTO nodes (
        cid, kind, adapter_id, adapter_version, adapter_instance,
        wall_time, payload_inline, annotations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertNode.run(
      node.cid,
      node.kind,
      node.adapter.id,
      node.adapter.version,
      node.adapter.instanceId,
      node.wallTime,
      JSON.stringify(node.body),
      node.annotations ? JSON.stringify(node.annotations) : null
    );

    // Save parent edges
    const insertEdge = this.db.prepare(`
      INSERT OR IGNORE INTO edges (parent_cid, child_cid, ordinal) VALUES (?, ?, ?)
    `);

    node.parents.forEach((parentCid, index) => {
      insertEdge.run(parentCid, node.cid, index);
    });

    // Save vector clock components
    const insertClock = this.db.prepare(`
      INSERT OR IGNORE INTO vector_clocks (cid, actor_id, sequence_num) VALUES (?, ?, ?)
    `);

    const clockObj = node.clock.toJSON();
    for (const [actor, seq] of Object.entries(clockObj)) {
      insertClock.run(node.cid, actor, seq);
    }
  }

  public getNode(cid: CID): StateNode | null {
    const getNodeStmt = this.db.prepare(`
      SELECT * FROM nodes WHERE cid = ?
    `);

    const row = getNodeStmt.get(cid) as Record<string, unknown> | undefined;
    if (!row) {
      return null;
    }

    // Fetch parents
    const getParentsStmt = this.db.prepare(`
      SELECT parent_cid FROM edges WHERE child_cid = ? ORDER BY ordinal ASC
    `);
    const parentRows = getParentsStmt.all(cid) as Array<{ parent_cid: string }>;
    const parents = parentRows.map((r) => r.parent_cid);

    // Fetch vector clock
    const getClockStmt = this.db.prepare(`
      SELECT actor_id, sequence_num FROM vector_clocks WHERE cid = ?
    `);
    const clockRows = getClockStmt.all(cid) as Array<{ actor_id: string; sequence_num: number }>;
    const clockSnapshot: VectorClockSnapshot = {};
    for (const r of clockRows) {
      clockSnapshot[r.actor_id] = r.sequence_num;
    }

    const nodeData: StateNodeData = {
      chronoVersion: "1.0.0",
      cid: String(row.cid),
      parents,
      clock: clockSnapshot,
      wallTime: String(row.wall_time),
      adapter: {
        id: String(row.adapter_id),
        version: String(row.adapter_version),
        instanceId: String(row.adapter_instance),
      },
      kind: row.kind as NodeKind,
      body: row.payload_inline ? JSON.parse(String(row.payload_inline)) : null,
      annotations: row.annotations ? JSON.parse(String(row.annotations)) : undefined,
    };

    return StateNode.fromVerified(nodeData);
  }

  public setBranchHead(name: string, headCid: CID): void {
    const now = new Date().toISOString();
    const upsertStmt = this.db.prepare(`
      INSERT INTO branches (name, head_cid, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        head_cid = excluded.head_cid,
        updated_at = excluded.updated_at
    `);
    upsertStmt.run(name, headCid, now, now);
  }

  public getBranchHead(name: string): CID | null {
    const stmt = this.db.prepare("SELECT head_cid FROM branches WHERE name = ?");
    const row = stmt.get(name) as { head_cid: string } | undefined;
    return row ? row.head_cid : null;
  }

  public listBranches(): BranchInfo[] {
    const stmt = this.db.prepare("SELECT name, head_cid, created_at, updated_at FROM branches ORDER BY name ASC");
    const rows = stmt.all() as Array<{ name: string; head_cid: string; created_at: string; updated_at: string }>;
    return rows.map((r) => ({
      name: r.name,
      headCid: r.head_cid,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  /**
   * Hydrates an in-memory ChronoDAG with all historical nodes from disk in topological order
   */
  public loadIntoDAG(dag: ChronoDAG): number {
    // Topological load: roots first, then children
    const stmt = this.db.prepare(`
      SELECT n.cid FROM nodes n
      LEFT JOIN edges e ON n.cid = e.child_cid
      GROUP BY n.cid
      ORDER BY COUNT(e.parent_cid) ASC, n.wall_time ASC
    `);

    const rows = stmt.all() as Array<{ cid: string }>;
    let loaded = 0;
    for (const r of rows) {
      if (!dag.hasNode(r.cid)) {
        const node = this.getNode(r.cid);
        if (node) {
          dag.addNode(node);
          loaded++;
        }
      }
    }
    return loaded;
  }

  public close(): void {
    this.db.close();
  }
}
