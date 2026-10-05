/**
 * CHRONO CORE MERGE: CONFLICTS
 * 
 * Formal data structure representing merge conflicts in the DAG.
 */

import type { CID } from "../graph/node.ts";

export const ConflictKind = {
  OVERLAPPING: "overlapping",
  DELETE_MODIFY: "delete_modify",
  SEMANTIC: "semantic",
  SCHEMA: "schema",
  ORDERING: "ordering",
} as const;

export type ConflictKind = typeof ConflictKind[keyof typeof ConflictKind];

export interface SemanticConflict {
  targetUri: string;
  kind: ConflictKind;
  baseContent?: string;
  leftContent?: string;
  rightContent?: string;
  leftRange?: { start: number; end: number };
  rightRange?: { start: number; end: number };
  description: string;
}

export interface MergeReport {
  success: boolean;
  baseCid: CID;
  leftCid: CID;
  rightCid: CID;
  conflicts: SemanticConflict[];
  mergedBuffers: Map<string, string>;
}
