/**
 * CHRONO QUERY LANGUAGE: ABSTRACT SYNTAX TREE (AST)
 * 
 * AST node structures representing parsed CQL queries.
 */

export type ASTNodeType =
  | "Query"
  | "ProjectionItem"
  | "BranchSource"
  | "LineageSource"
  | "EpochSource"
  | "DagSource"
  | "BinaryExpression"
  | "UnaryExpression"
  | "PathExpression"
  | "FunctionCall"
  | "Literal"
  | "OrderBy"
  | "Limit";

export interface ASTNode {
  type: ASTNodeType;
}

export interface CqlQuery extends ASTNode {
  type: "Query";
  projections: ProjectionItem[];
  source: GraphSource;
  whereClause?: Expression;
  orderBy?: OrderByClause;
  limit?: LimitClause;
}

export interface ProjectionItem extends ASTNode {
  type: "ProjectionItem";
  expression: Expression;
  alias?: string;
}

export type GraphSource =
  | { type: "BranchSource"; branchName: string }
  | { type: "LineageSource"; nodeCid: string }
  | { type: "EpochSource"; epochId: string | number }
  | { type: "DagSource" };

export type Expression =
  | BinaryExpr
  | UnaryExpr
  | PathExpr
  | FunctionCallExpr
  | LiteralExpr;

export interface BinaryExpr extends ASTNode {
  type: "BinaryExpression";
  operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "=~" | "AND" | "OR" | "IN";
  left: Expression;
  right: Expression;
}

export interface UnaryExpr extends ASTNode {
  type: "UnaryExpression";
  operator: "NOT";
  argument: Expression;
}

export interface PathExpr extends ASTNode {
  type: "PathExpression";
  parts: string[];
}

export interface FunctionCallExpr extends ASTNode {
  type: "FunctionCall";
  name: string;
  arguments: Expression[];
}

export interface LiteralExpr extends ASTNode {
  type: "Literal";
  valueType: "string" | "number" | "boolean" | "null";
  value: string | number | boolean | null;
}

export interface OrderByClause extends ASTNode {
  type: "OrderBy";
  path: PathExpr;
  direction: "ASC" | "DESC";
}

export interface LimitClause extends ASTNode {
  type: "Limit";
  limit: number;
  offset?: number;
}
