import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Lexer } from "../../query/cql/lexer.ts";
import { Parser } from "../../query/cql/parser.ts";
import { Evaluator } from "../../query/cql/evaluator.ts";
import { ChronoDAG } from "../../core/graph/dag.ts";
import { StateNode } from "../../core/graph/node.ts";

describe("CQL Lexer & Parser", () => {
  it("tokenizes and parses basic SELECT queries", () => {
    const queryStr = `
      SELECT cid, wall_time, delta.type
      FROM branch('main')
      WHERE delta.type == 'text.splice'
      ORDER BY clock DESC
      LIMIT 10 OFFSET 5;
    `;

    const ast = Parser.parse(queryStr);
    assert.equal(ast.type, "Query");
    assert.equal(ast.projections.length, 3);
    assert.equal(ast.source.type, "BranchSource");
    if (ast.source.type === "BranchSource") {
      assert.equal(ast.source.branchName, "main");
    }
    assert.ok(ast.whereClause);
    assert.equal(ast.orderBy?.direction, "DESC");
    assert.equal(ast.limit?.limit, 10);
    assert.equal(ast.limit?.offset, 5);
  });

  it("parses queries with function calls and regex matching", () => {
    const queryStr = `
      SELECT cid, node
      FROM dag()
      WHERE delta.target_uri =~ 'auth.*' AND contains_text('token');
    `;

    const ast = Parser.parse(queryStr);
    assert.equal(ast.source.type, "DagSource");
    assert.equal(ast.whereClause?.type, "BinaryExpression");
  });
});

describe("CQL Query Execution", () => {
  it("executes queries against a live ChronoDAG", async () => {
    const dag = new ChronoDAG();

    // Node 1: initial root
    const root = await StateNode.create({
      parents: [],
      clock: { user: 1 },
      wallTime: "2026-10-05T01:00:00Z",
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "snapshot",
      body: { kind: "snapshot", state: { "file:///src/db.ts": "db_init()" } },
    });
    dag.addNode(root);

    // Node 2: edit db.ts
    const editDb = await StateNode.create({
      parents: [root.cid],
      clock: { user: 2 },
      wallTime: "2026-10-05T02:00:00Z",
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "delta",
      body: {
        kind: "delta",
        delta: {
          type: "text.splice",
          target_uri: "file:///src/db.ts",
          forward: { text: "connect_pool()" },
        },
      },
    });
    dag.addNode(editDb);

    // Node 3: edit auth.ts
    const editAuth = await StateNode.create({
      parents: [editDb.cid],
      clock: { user: 3 },
      wallTime: "2026-10-05T03:00:00Z",
      adapter: { id: "vscode", version: "1.0", instanceId: "i1" },
      kind: "delta",
      body: {
        kind: "delta",
        delta: {
          type: "text.splice",
          target_uri: "file:///src/auth.ts",
          forward: { text: "jwt_verify_signature" },
        },
      },
    });
    dag.addNode(editAuth);

    const evaluator = new Evaluator({
      dag,
      branchResolver: (name) => (name === "main" ? editAuth.cid : null),
    });

    // Query 1: Find all modifications to auth.ts
    const q1 = Parser.parse(`
      SELECT cid, delta.target_uri
      FROM branch('main')
      WHERE delta.target_uri == 'file:///src/auth.ts';
    `);
    const res1 = evaluator.execute(q1);

    assert.equal(res1.length, 1);
    assert.equal(res1[0]["cid"], editAuth.cid);
    assert.equal(res1[0]["delta.target_uri"], "file:///src/auth.ts");

    // Query 2: Find nodes containing substring 'connect_pool'
    const q2 = Parser.parse(`
      SELECT cid
      FROM dag()
      WHERE contains_text('connect_pool');
    `);
    const res2 = evaluator.execute(q2);

    assert.equal(res2.length, 1);
    assert.equal(res2[0]["cid"], editDb.cid);

    // Query 3: Order by clock DESC with LIMIT 2
    const q3 = Parser.parse(`
      SELECT cid, clock
      FROM dag()
      ORDER BY clock DESC
      LIMIT 2;
    `);
    const res3 = evaluator.execute(q3);

    assert.equal(res3.length, 2);
    assert.equal(res3[0]["cid"], editAuth.cid);
    assert.equal(res3[1]["cid"], editDb.cid);
  });
});
