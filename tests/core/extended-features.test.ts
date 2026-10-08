/**
 * TESTS: EXTENDED CHRONO FEATURES
 * 
 * Verifies:
 * 1. BranchManager (create, checkout, head update)
 * 2. EpochManager (checkpoint registration, nearest ancestor discovery)
 * 3. TimelineIndex (wall-clock range search, nearest time lookup)
 * 4. ContentDeduplicator (content interning, hash deduplication)
 * 5. TerminalAdapter (command & exit code capture)
 * 6. CLI Merge & Status commands
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ChronoDAG } from "../../core/graph/dag.ts";
import { StateNode } from "../../core/graph/node.ts";
import { BranchManager } from "../../core/graph/branch.ts";
import { EpochManager } from "../../core/graph/epoch.ts";
import { TimelineIndex } from "../../core/clock/timeline.ts";
import { ContentDeduplicator } from "../../core/compress/dedupe.ts";
import { TerminalAdapter } from "../../adapters/terminal/index.ts";
import { executeMerge } from "../../cli/commands/merge.ts";
import { executeStatus } from "../../cli/commands/status.ts";

describe("CHRONO Extended Features Suite", () => {

  test("BranchManager creates and manages branch pointers", async () => {
    const dag = new ChronoDAG();
    const genesis = await StateNode.create({
      parents: [],
      clock: { "chrono.core": 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "chrono.core", version: "1.0.0", instanceId: "test" },
      kind: "snapshot",
      body: { kind: "snapshot", state: { "file:///test.ts": "initial" } },
      annotations: { label: "Root" },
    });
    dag.addNode(genesis);

    const bm = new BranchManager(dag);
    bm.init(genesis.cid);

    assert.equal(bm.getActiveBranchName(), "main");
    assert.equal(bm.getActiveBranch()?.headCid, genesis.cid);

    // Create branch
    const fixBranch = bm.createBranch("fix/auth");
    assert.equal(fixBranch.name, "fix/auth");
    assert.equal(fixBranch.forkCid, genesis.cid);

    // Checkout
    bm.checkout("fix/auth");
    assert.equal(bm.getActiveBranchName(), "fix/auth");

    // List branches
    assert.equal(bm.listBranches().length, 2);
  });

  test("EpochManager tracks checkpoints and finds nearest ancestor", async () => {
    const dag = new ChronoDAG();
    const epochNode = await StateNode.create({
      parents: [],
      clock: { "chrono.core": 1 },
      wallTime: new Date(Date.now() - 60000).toISOString(),
      adapter: { id: "chrono.core", version: "1.0.0", instanceId: "test" },
      kind: "snapshot",
      body: { kind: "snapshot", state: {} },
    });
    dag.addNode(epochNode);

    const childDelta = await StateNode.create({
      parents: [epochNode.cid],
      clock: { "chrono.core": 2 },
      wallTime: new Date().toISOString(),
      adapter: { id: "chrono.core", version: "1.0.0", instanceId: "test" },
      kind: "delta",
      body: { kind: "delta", delta: { type: "text.splice", target_uri: "f", forward: { range: { start: 0, end: 0 }, new_text: "a" } } },
    });
    dag.addNode(childDelta);

    const em = new EpochManager(dag);
    const cp = em.registerCheckpoint(epochNode, 0);

    assert.equal(cp.nodeCid, epochNode.cid);
    const nearest = em.findNearestCheckpoint(childDelta.cid);
    assert.equal(nearest?.nodeCid, epochNode.cid);
  });

  test("TimelineIndex indexes nodes and performs time range searches", async () => {
    const index = new TimelineIndex();
    const now = Date.now();

    const node1 = await StateNode.create({
      parents: [],
      clock: { "chrono.core": 1 },
      wallTime: new Date(now - 10000).toISOString(),
      adapter: { id: "test", version: "1.0.0", instanceId: "1" },
      kind: "snapshot",
      body: { kind: "snapshot", state: {} },
      annotations: { label: "Step 1", branch: "main" },
    });

    const node2 = await StateNode.create({
      parents: [node1.cid],
      clock: { "chrono.core": 2 },
      wallTime: new Date(now).toISOString(),
      adapter: { id: "test", version: "1.0.0", instanceId: "1" },
      kind: "snapshot",
      body: { kind: "snapshot", state: {} },
      annotations: { label: "Step 2", branch: "main" },
    });

    index.indexNode(node1);
    index.indexNode(node2);

    const nearest = index.findNearestToTime(now - 8000);
    assert.equal(nearest?.cid, node1.cid);

    const range = index.findRange(now - 15000, now + 5000);
    assert.equal(range.length, 2);
  });

  test("ContentDeduplicator deduplicates identical content blocks", () => {
    const dedupe = new ContentDeduplicator();
    const h1 = dedupe.intern("function calculate() { return 42; }");
    const h2 = dedupe.intern("function calculate() { return 42; }");

    assert.equal(h1, h2, "Identical content returns identical hash");
    assert.equal(dedupe.blockCount, 1, "Only one block stored");
    assert.equal(dedupe.get(h1), "function calculate() { return 42; }");
  });

  test("TerminalAdapter captures shell command and exit code into semantic delta", () => {
    const adapter = new TerminalAdapter();
    const delta = adapter.captureExecution("term://pty0", {
      command: "npm test",
      exitCode: 1,
      stderr: "FAIL: Expected true but got false",
    });

    assert.equal(delta.type, "terminal.exec");
    assert.equal(delta.targetUri, "term://pty0");
    assert.equal((delta.forward as any).exit_code, 1);
  });

  test("CLI merge and status commands execute cleanly", async () => {
    const dag = new ChronoDAG();
    const root = await StateNode.create({
      parents: [],
      clock: { "chrono.core": 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "test", version: "1.0.0", instanceId: "1" },
      kind: "snapshot",
      body: { kind: "snapshot", state: { "file:///a.ts": "codeA" } },
    });
    dag.addNode(root);

    const branchA = await StateNode.create({
      parents: [root.cid],
      clock: { "chrono.core": 2 },
      wallTime: new Date().toISOString(),
      adapter: { id: "test", version: "1.0.0", instanceId: "1" },
      kind: "snapshot",
      body: { kind: "snapshot", state: { "file:///a.ts": "codeA_fixed", "file:///b.ts": "codeB" } },
    });
    dag.addNode(branchA);

    const branches: Record<string, string> = {
      main: root.cid,
      feature: branchA.cid,
    };

    // Check status
    const status = executeStatus(dag, branches, "main");
    assert.equal(status.activeBranch, "main");
    assert.equal(status.totalNodes, 2);

    // Merge feature into main
    const mergeRes = await executeMerge(dag, branches, {
      sourceBranch: "feature",
      targetBranch: "main",
    });

    assert.ok(mergeRes.success);
    assert.equal(mergeRes.conflicts, 0);
    assert.equal(branches.main, mergeRes.mergedCid);
  });
});
