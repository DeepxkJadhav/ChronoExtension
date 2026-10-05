import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ChronoDAG } from "../../core/graph/dag.ts";
import { StateNode } from "../../core/graph/node.ts";
import { SemanticMergeEngine } from "../../core/merge/strategies.ts";
import { ConflictKind } from "../../core/merge/conflicts.ts";

describe("Three-Way Semantic Merge", () => {
  it("enforces idempotence: merge(A, A) === A", async () => {
    const dag = new ChronoDAG();
    const root = await StateNode.create({
      parents: [],
      clock: { user: 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "snapshot",
      body: { kind: "snapshot", state: { "file:///app.ts": "let a = 1;" } },
    });
    dag.addNode(root);

    const engine = new SemanticMergeEngine(dag);
    const report = await engine.merge(root.cid, root.cid);

    assert.equal(report.success, true);
    assert.equal(report.conflicts.length, 0);
    assert.equal(report.mergedBuffers.get("file:///app.ts"), "let a = 1;");
  });

  it("handles fast-forward merge cleanly", async () => {
    const dag = new ChronoDAG();
    const root = await StateNode.create({
      parents: [],
      clock: { user: 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "snapshot",
      body: { kind: "snapshot", state: { "file:///app.ts": "v1" } },
    });
    dag.addNode(root);

    const child = await StateNode.create({
      parents: [root.cid],
      clock: { user: 2 },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "delta",
      body: {
        kind: "delta",
        delta: {
          type: "text.splice",
          target_uri: "file:///app.ts",
          forward: { range: { start: 1, end: 2 }, text: "2" },
        },
      },
    });
    dag.addNode(child);

    const engine = new SemanticMergeEngine(dag);
    const report = await engine.merge(root.cid, child.cid);

    assert.equal(report.success, true);
    assert.equal(report.conflicts.length, 0);
    assert.equal(report.mergedBuffers.get("file:///app.ts"), "v2");
  });

  it("automatically merges orthogonal changes to disjoint resources", async () => {
    const dag = new ChronoDAG();
    const root = await StateNode.create({
      parents: [],
      clock: { user: 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "snapshot",
      body: {
        kind: "snapshot",
        state: {
          "file:///app.ts": "const app = 1;",
          "file:///db.ts": "const db = 1;",
        },
      },
    });
    dag.addNode(root);

    // Branch A modifies app.ts
    const branchA = await StateNode.create({
      parents: [root.cid],
      clock: { user: 2, branchA: 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "delta",
      body: {
        kind: "delta",
        delta: {
          type: "text.splice",
          target_uri: "file:///app.ts",
          forward: { range: { start: 12, end: 13 }, text: "2" },
        },
      },
    });
    dag.addNode(branchA);

    // Branch B modifies db.ts
    const branchB = await StateNode.create({
      parents: [root.cid],
      clock: { user: 2, branchB: 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "delta",
      body: {
        kind: "delta",
        delta: {
          type: "text.splice",
          target_uri: "file:///db.ts",
          forward: { range: { start: 11, end: 12 }, text: "2" },
        },
      },
    });
    dag.addNode(branchB);

    const engine = new SemanticMergeEngine(dag);
    const report = await engine.merge(branchA.cid, branchB.cid);

    assert.equal(report.success, true);
    assert.equal(report.conflicts.length, 0);
    assert.equal(report.mergedBuffers.get("file:///app.ts"), "const app = 2;");
    assert.equal(report.mergedBuffers.get("file:///db.ts"), "const db = 2;");
  });

  it("detects direct collision conflict when both branches edit the same buffer", async () => {
    const dag = new ChronoDAG();
    const root = await StateNode.create({
      parents: [],
      clock: { user: 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "snapshot",
      body: { kind: "snapshot", state: { "file:///config.json": '{"mode": "dev"}' } },
    });
    dag.addNode(root);

    const branchA = await StateNode.create({
      parents: [root.cid],
      clock: { user: 2, branchA: 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "delta",
      body: {
        kind: "delta",
        delta: {
          type: "text.splice",
          target_uri: "file:///config.json",
          forward: { range: { start: 10, end: 13 }, text: "prod" },
        },
      },
    });
    dag.addNode(branchA);

    const branchB = await StateNode.create({
      parents: [root.cid],
      clock: { user: 2, branchB: 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "delta",
      body: {
        kind: "delta",
        delta: {
          type: "text.splice",
          target_uri: "file:///config.json",
          forward: { range: { start: 10, end: 13 }, text: "staging" },
        },
      },
    });
    dag.addNode(branchB);

    const engine = new SemanticMergeEngine(dag);
    const report = await engine.merge(branchA.cid, branchB.cid);

    assert.equal(report.success, false, "Conflicting edits must flag success = false");
    assert.equal(report.conflicts.length, 1);
    assert.equal(report.conflicts[0].kind, ConflictKind.OVERLAPPING);
    assert.equal(report.conflicts[0].targetUri, "file:///config.json");
  });
});
