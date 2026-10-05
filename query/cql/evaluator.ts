/**
 * CHRONO QUERY LANGUAGE: EVALUATOR
 * 
 * Executes parsed CqlQuery AST against a ChronoDAG and StateNodes.
 */

import { ChronoDAG } from "../../core/graph/dag.ts";
import { StateNode } from "../../core/graph/node.ts";
import type { CID } from "../../core/graph/node.ts";
import type {
  CqlQuery,
  Expression,
  BinaryExpr,
  PathExpr,
  FunctionCallExpr,
  LiteralExpr,
} from "./ast.ts";

export interface QueryExecutionContext {
  dag: ChronoDAG;
  branchResolver?: (branchName: string) => CID | null;
}

export interface QueryResultRow {
  [key: string]: unknown;
}

export class Evaluator {
  private readonly context: QueryExecutionContext;

  constructor(context: QueryExecutionContext) {
    this.context = context;
  }

  public execute(query: CqlQuery): QueryResultRow[] {
    // 1. Resolve candidate nodes from source
    const candidates = this.resolveSourceNodes(query.source);

    // 2. Filter nodes using whereClause
    const filteredNodes = query.whereClause
      ? candidates.filter((node) => Boolean(this.evaluateExpression(query.whereClause!, node)))
      : candidates;

    // 3. Sort nodes if ORDER BY is present
    const sortedNodes = [...filteredNodes];
    if (query.orderBy) {
      const order = query.orderBy;
      sortedNodes.sort((a, b) => {
        const valA = this.resolvePath(order.path.parts, a);
        const valB = this.resolvePath(order.path.parts, b);

        let cmp = 0;
        if (typeof valA === "number" && typeof valB === "number") {
          cmp = valA - valB;
        } else {
          cmp = String(valA ?? "").localeCompare(String(valB ?? ""));
        }
        return order.direction === "DESC" ? -cmp : cmp;
      });
    }

    // 4. Apply pagination (LIMIT & OFFSET)
    let pagedNodes = sortedNodes;
    if (query.limit) {
      const offset = query.limit.offset ?? 0;
      pagedNodes = sortedNodes.slice(offset, offset + query.limit.limit);
    }

    // 5. Project result columns
    return pagedNodes.map((node) => this.projectRow(query.projections, node));
  }

  private resolveSourceNodes(source: CqlQuery["source"]): StateNode[] {
    const dag = this.context.dag;

    if (source.type === "DagSource") {
      const allCids = new Set<CID>();
      const queue = [...dag.getHeads(), ...dag.getRoots()];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (!allCids.has(curr)) {
          allCids.add(curr);
          queue.push(...dag.getParents(curr));
        }
      }
      return Array.from(allCids).map((c) => dag.getNode(c)!).filter(Boolean);
    }

    if (source.type === "BranchSource") {
      if (!this.context.branchResolver) {
        throw new Error(`Cannot query branch('${source.branchName}'): no branch resolver configured`);
      }
      const headCid = this.context.branchResolver(source.branchName);
      if (!headCid) {
        return [];
      }
      return this.walkLineageFrom(headCid);
    }

    if (source.type === "LineageSource") {
      return this.walkLineageFrom(source.nodeCid);
    }

    return [];
  }

  private walkLineageFrom(startCid: CID): StateNode[] {
    const nodes: StateNode[] = [];
    let curr: CID | undefined = startCid;
    const visited = new Set<CID>();

    while (curr && !visited.has(curr)) {
      visited.add(curr);
      const node = this.context.dag.getNode(curr);
      if (node) {
        nodes.push(node);
        curr = node.parents.length > 0 ? node.parents[0] : undefined;
      } else {
        break;
      }
    }

    return nodes;
  }

  private projectRow(projections: CqlQuery["projections"], node: StateNode): QueryResultRow {
    const row: QueryResultRow = {};

    for (const proj of projections) {
      const expr = proj.expression;
      if (expr.type === "PathExpression") {
        const pathKey = expr.parts.join(".");
        if (pathKey === "*") {
          row.cid = node.cid;
          row.kind = node.kind;
          row.wall_time = node.wallTime;
          row.adapter = node.adapter;
          row.body = node.body;
          row.parents = node.parents;
          row.clock = node.clock.toJSON();
        } else {
          row[pathKey] = this.resolvePath(expr.parts, node);
        }
      } else if (expr.type === "Literal") {
        row[String(expr.value)] = expr.value;
      } else {
        const val = this.evaluateExpression(expr, node);
        row["result"] = val;
      }
    }

    return row;
  }

  private evaluateExpression(expr: Expression, node: StateNode): unknown {
    switch (expr.type) {
      case "Literal":
        return expr.value;

      case "PathExpression":
        return this.resolvePath(expr.parts, node);

      case "UnaryExpression":
        if (expr.operator === "NOT") {
          return !this.evaluateExpression(expr.argument, node);
        }
        break;

      case "BinaryExpression": {
        const left = this.evaluateExpression(expr.left, node);
        const right = this.evaluateExpression(expr.right, node);

        switch (expr.operator) {
          case "==":
            return left === right;
          case "!=":
            return left !== right;
          case "<":
            return Number(left) < Number(right);
          case "<=":
            return Number(left) <= Number(right);
          case ">":
            return Number(left) > Number(right);
          case ">=":
            return Number(left) >= Number(right);
          case "=~":
            return new RegExp(String(right)).test(String(left));
          case "AND":
            return Boolean(left) && Boolean(right);
          case "OR":
            return Boolean(left) || Boolean(right);
          case "IN":
            return Array.isArray(right) ? right.includes(left) : false;
        }
        break;
      }

      case "FunctionCall": {
        return this.evaluateFunction(expr, node);
      }
    }

    return false;
  }

  private evaluateFunction(expr: FunctionCallExpr, node: StateNode): unknown {
    const fnName = expr.name.toLowerCase();
    if (fnName === "contains_text") {
      const queryStr = String(this.evaluateExpression(expr.arguments[0], node) ?? "");
      const bodyStr = JSON.stringify(node.body);
      return bodyStr.includes(queryStr);
    }

    if (fnName === "has_tag") {
      const tagStr = String(this.evaluateExpression(expr.arguments[0], node) ?? "");
      const tags = node.annotations?.tags ?? [];
      return tags.includes(tagStr);
    }

    if (fnName === "since") {
      const target = String(this.evaluateExpression(expr.arguments[0], node) ?? "");
      // Returns true if target is in ancestors of node
      const ancestors = this.context.dag.getAncestors(node.cid);
      return ancestors.has(target);
    }

    return null;
  }

  private resolvePath(parts: string[], node: StateNode): unknown {
    if (parts.length === 0) return undefined;
    const rootPart = parts[0].toLowerCase();

    let curr: unknown;
    if (rootPart === "node") {
      curr = node;
    } else if (rootPart === "cid") {
      curr = node.cid;
    } else if (rootPart === "kind") {
      curr = node.kind;
    } else if (rootPart === "wall_time") {
      curr = node.wallTime;
    } else if (rootPart === "clock") {
      curr = node.clock.lamportSum;
    } else if (rootPart === "adapter") {
      curr = node.adapter;
    } else if (rootPart === "delta") {
      curr = (node.body as Record<string, unknown>)?.delta;
    } else if (rootPart === "state") {
      curr = (node.body as Record<string, unknown>)?.state;
    } else {
      curr = (node as unknown as Record<string, unknown>)[parts[0]];
    }

    for (let i = 1; i < parts.length; i++) {
      if (curr === null || typeof curr !== "object") {
        return undefined;
      }
      curr = (curr as Record<string, unknown>)[parts[i]];
    }

    return curr;
  }
}
