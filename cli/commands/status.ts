/**
 * CHRONO CLI: STATUS COMMAND
 * 
 * Reports the current branch, head node CID, vector clock, and DAG metrics.
 */

import { ChronoDAG } from "../../core/graph/dag.ts";

export interface StatusReport {
  activeBranch: string;
  headCid: string | null;
  totalNodes: number;
  branchesCount: number;
  wallTime?: string;
  label?: string;
}

export function executeStatus(
  dag: ChronoDAG,
  branches: Record<string, string>,
  activeBranch = "main"
): StatusReport {
  const headCid = branches[activeBranch] || null;
  const headNode = headCid ? dag.getNode(headCid) : null;

  return {
    activeBranch,
    headCid,
    totalNodes: dag.size,
    branchesCount: Object.keys(branches).length,
    wallTime: headNode?.wallTime,
    label: (headNode?.annotations?.label as string) || "Clean state",
  };
}
