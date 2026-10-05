/**
 * CHRONO CLI: QUERY COMMAND
 * 
 * Executes a CQL query against the local repository and displays tabular results.
 */

import * as path from "node:path";
import { SQLiteStorage } from "../../store/backends/sqlite.ts";
import { ChronoDAG } from "../../core/graph/dag.ts";
import { Parser } from "../../query/cql/parser.ts";
import { Evaluator } from "../../query/cql/evaluator.ts";

export interface QueryOptions {
  cwd?: string;
  cql: string;
}

export function queryCommand(options: QueryOptions): string {
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

  const ast = Parser.parse(options.cql);
  const evaluator = new Evaluator({
    dag,
    branchResolver: (name) => storage.getBranchHead(name),
  });

  const startTime = performance.now();
  const results = evaluator.execute(ast);
  const elapsedMs = performance.now() - startTime;
  storage.close();

  if (results.length === 0) {
    return `0 rows returned (${elapsedMs.toFixed(2)}ms)`;
  }

  const lines: string[] = [];
  lines.push(`CQL Query: "${options.cql.trim()}"`);
  lines.push(`Returned ${results.length} rows in ${elapsedMs.toFixed(2)}ms`);
  lines.push("─".repeat(60));

  for (let i = 0; i < results.length; i++) {
    const row = results[i];
    lines.push(`Row ${i + 1}:`);
    for (const [k, v] of Object.entries(row)) {
      const valStr = typeof v === "object" ? JSON.stringify(v) : String(v);
      lines.push(`  ${k.padEnd(18)} : ${valStr}`);
    }
  }

  return lines.join("\n");
}
