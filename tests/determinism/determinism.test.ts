import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VectorClock, CausalityRelation } from "../../core/clock/logical.ts";
import { StateNode } from "../../core/graph/node.ts";
import { ChronoDAG } from "../../core/graph/dag.ts";
import { DeterministicReplayer } from "../../core/replay/replayer.ts";
import { DeterminismAuditor, digestDomainState } from "../../core/replay/determinism.ts";

describe("Vector Clocks & Causality", () => {
  it("increments actor ticks correctly", () => {
    const c1 = new VectorClock();
    assert.equal(c1.get("agent_1"), 0);

    const c2 = c1.tick("agent_1");
    assert.equal(c2.get("agent_1"), 1);
    assert.equal(c1.get("agent_1"), 0); // immutability check
  });

  it("calculates causal relations (BEFORE, AFTER, CONCURRENT, EQUAL)", () => {
    const clockBase = new VectorClock({ agent_a: 1, agent_b: 1 });
    const clockNext = clockBase.tick("agent_a");
    const clockConcurrent = clockBase.tick("agent_b");

    assert.equal(clockBase.compare(clockNext), CausalityRelation.BEFORE);
    assert.equal(clockNext.compare(clockBase), CausalityRelation.AFTER);
    assert.equal(clockNext.compare(clockConcurrent), CausalityRelation.CONCURRENT);
    assert.equal(clockBase.compare(new VectorClock({ agent_a: 1, agent_b: 1 })), CausalityRelation.EQUAL);
  });

  it("joins concurrent clocks by taking the supremum", () => {
    const clockA = new VectorClock({ agent_a: 3, agent_b: 1 });
    const clockB = new VectorClock({ agent_a: 1, agent_b: 4, agent_c: 2 });
    const joined = clockA.join(clockB);

    assert.equal(joined.get("agent_a"), 3);
    assert.equal(joined.get("agent_b"), 4);
    assert.equal(joined.get("agent_c"), 2);
  });
});

describe("ChronoDAG & Ancestry Resolution", () => {
  it("rejects nodes whose parents do not exist in the DAG", async () => {
    const dag = new ChronoDAG();
    const orphan = await StateNode.create({
      parents: ["b3_nonexistentparent123456789012345678901234567890123456789012345678"],
      clock: {},
      wallTime: new Date().toISOString(),
      adapter: { id: "test", version: "1.0", instanceId: "1" },
      kind: "delta",
      body: { kind: "delta" },
    });

    assert.throws(
      () => dag.addNode(orphan),
      /Causality violation/
    );
  });

  it("resolves Lowest Common Ancestor (LCA) on divergent branches", async () => {
    const dag = new ChronoDAG();

    // Root snapshot
    const root = await StateNode.create({
      parents: [],
      clock: { test: 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "test", version: "1.0", instanceId: "1" },
      kind: "snapshot",
      body: {
        kind: "snapshot",
        state: { "file:///app.ts": "const x = 1;" },
        bytes: 14,
      },
    });
    dag.addNode(root);

    // Branch A
    const a1 = await StateNode.create({
      parents: [root.cid],
      clock: { test: 2, branchA: 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "test", version: "1.0", instanceId: "1" },
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
    dag.addNode(a1);

    // Branch B
    const b1 = await StateNode.create({
      parents: [root.cid],
      clock: { test: 2, branchB: 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "test", version: "1.0", instanceId: "1" },
      kind: "delta",
      body: {
        kind: "delta",
        delta: {
          type: "text.splice",
          target_uri: "file:///app.ts",
          forward: { range: { start: 12, end: 13 }, text: "99" },
        },
      },
    });
    dag.addNode(b1);

    const lca = dag.findLowestCommonAncestor(a1.cid, b1.cid);
    assert.equal(lca, root.cid, "Root should be the LCA of divergent branches A and B");
  });
});

describe("Deterministic Replay Engine", () => {
  it("reconstructs exact buffer state across sequential deltas", async () => {
    const dag = new ChronoDAG();

    // 1. Root
    const root = await StateNode.create({
      parents: [],
      clock: { agent: 1 },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "snapshot",
      body: {
        kind: "snapshot",
        state: { "file:///main.ts": "hello" },
        bytes: 5,
      },
    });
    dag.addNode(root);

    // 2. Append " world"
    const node1 = await StateNode.create({
      parents: [root.cid],
      clock: { agent: 2 },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "delta",
      body: {
        kind: "delta",
        delta: {
          type: "text.splice",
          target_uri: "file:///main.ts",
          forward: { range: { start: 5, end: 5 }, text: " world" },
        },
      },
    });
    dag.addNode(node1);

    // 3. Append "!"
    const node2 = await StateNode.create({
      parents: [node1.cid],
      clock: { agent: 3 },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "delta",
      body: {
        kind: "delta",
        delta: {
          type: "text.splice",
          target_uri: "file:///main.ts",
          forward: { range: { start: 11, end: 11 }, text: "!" },
        },
      },
    });
    dag.addNode(node2);

    const replayer = new DeterministicReplayer(dag);

    // Replay at root
    const replayRoot = await replayer.reconstruct(root.cid);
    assert.equal(replayRoot.state.buffers.get("file:///main.ts"), "hello");

    // Replay at node1
    const replayNode1 = await replayer.reconstruct(node1.cid);
    assert.equal(replayNode1.state.buffers.get("file:///main.ts"), "hello world");

    // Replay at node2
    const replayNode2 = await replayer.reconstruct(node2.cid);
    assert.equal(replayNode2.state.buffers.get("file:///main.ts"), "hello world!");
  });

  it("passes 50-iteration determinism audit with zero divergence", async () => {
    const dag = new ChronoDAG();

    // Create a chain of 10 edits
    let prevCid = "";
    let clockVal = 1;

    const root = await StateNode.create({
      parents: [],
      clock: { agent: clockVal++ },
      wallTime: new Date().toISOString(),
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "snapshot",
      body: {
        kind: "snapshot",
        state: { "file:///buffer.ts": "A" },
        bytes: 1,
      },
    });
    dag.addNode(root);
    prevCid = root.cid;

    for (let i = 0; i < 10; i++) {
      const stepNode = await StateNode.create({
        parents: [prevCid],
        clock: { agent: clockVal++ },
        wallTime: new Date().toISOString(),
        adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
        kind: "delta",
        body: {
          kind: "delta",
          delta: {
            type: "text.splice",
            target_uri: "file:///buffer.ts",
            forward: { range: { start: i + 1, end: i + 1 }, text: String(i) },
          },
        },
      });
      dag.addNode(stepNode);
      prevCid = stepNode.cid;
    }

    const auditor = new DeterminismAuditor(dag);
    const report = await auditor.auditNode(prevCid, 50);

    assert.equal(report.deterministic, true, "Auditor must report 100% deterministic replay");
    assert.equal(report.divergencesDetected, 0, "Zero divergences allowed across 50 runs");
    assert.ok(report.stateDigest.startsWith("b3_"), "Digest must be a valid content address");
  });
});
