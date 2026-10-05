import test, { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { WriteAheadLog } from "../../store/wal/write-ahead.ts";
import { SQLiteStorage } from "../../store/backends/sqlite.ts";
import { StateNode } from "../../core/graph/node.ts";
import { ChronoDAG } from "../../core/graph/dag.ts";

describe("Write-Ahead Log (WAL) Durability", () => {
  let tempDir: string;
  let walPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "chrono-wal-test-"));
    walPath = path.join(tempDir, "test.wal");
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("appends records with valid checksums and replays them", async () => {
    const wal = new WriteAheadLog(walPath);
    await wal.open();

    const seq1 = await wal.append("node.emit", { cid: "b3_node1", text: "hello" });
    const seq2 = await wal.append("branch.update", { name: "main", head: "b3_node1" });
    await wal.sync();
    await wal.close();

    assert.equal(seq1, 1);
    assert.equal(seq2, 2);

    // Replay on separate instance
    const replayed: Array<{ type: string; payload: Record<string, unknown> }> = [];
    const walReader = new WriteAheadLog(walPath);
    await walReader.open();

    const count = await walReader.replay((rec) => {
      replayed.push({ type: rec.type, payload: rec.payload });
    });
    await walReader.close();

    assert.equal(count, 2);
    assert.equal(replayed[0].type, "node.emit");
    assert.equal(replayed[0].payload.cid, "b3_node1");
    assert.equal(replayed[1].type, "branch.update");
    assert.equal(replayed[1].payload.name, "main");
  });

  it("detects corruption if checksum is invalid", async () => {
    const wal = new WriteAheadLog(walPath);
    await wal.open();
    await wal.append("node.emit", { data: "safe payload" });
    await wal.close();

    // Corrupt one byte inside the file
    const fileBuf = await fs.readFile(walPath);
    fileBuf[fileBuf.length - 2] ^= 0xff; // flip bits
    await fs.writeFile(walPath, fileBuf);

    const walReader = new WriteAheadLog(walPath);
    await walReader.open();

    await assert.rejects(
      async () => {
        await walReader.replay(() => {});
      },
      /WAL corruption detected/
    );
    await walReader.close();
  });
});

describe("SQLite Metadata & DAG Persistence", () => {
  it("persists nodes, parents, vector clocks, and branches", async () => {
    const storage = new SQLiteStorage(":memory:");

    const rootNode = await StateNode.create({
      parents: [],
      clock: { "agent_1": 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0.0", instanceId: "inst1" },
      kind: "snapshot",
      body: { kind: "snapshot", state: { "file:///app.ts": "let a = 1;" } },
    });

    storage.saveNode(rootNode);

    const childNode = await StateNode.create({
      parents: [rootNode.cid],
      clock: { "agent_1": 2 },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0.0", instanceId: "inst1" },
      kind: "delta",
      body: {
        kind: "delta",
        delta: {
          type: "text.splice",
          target_uri: "file:///app.ts",
          forward: { range: { start: 8, end: 9 }, text: "2" },
        },
      },
    });

    storage.saveNode(childNode);
    storage.setBranchHead("main", childNode.cid);

    // Retrieve child from storage
    const fetchedChild = storage.getNode(childNode.cid);
    assert.ok(fetchedChild);
    assert.equal(fetchedChild.cid, childNode.cid);
    assert.deepEqual(fetchedChild.parents, [rootNode.cid]);
    assert.equal(fetchedChild.clock.get("agent_1"), 2);

    // Check branch pointer
    const headCid = storage.getBranchHead("main");
    assert.equal(headCid, childNode.cid);

    // Hydrate a fresh ChronoDAG from SQLite
    const dag = new ChronoDAG();
    const loadedCount = storage.loadIntoDAG(dag);
    assert.equal(loadedCount, 2);
    assert.ok(dag.hasNode(rootNode.cid));
    assert.ok(dag.hasNode(childNode.cid));

    storage.close();
  });
});
