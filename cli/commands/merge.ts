/**
 * CHRONO CLI: MERGE COMMAND
 * 
 * Executes three-way semantic merge between target branch and active branch.
 */

import { ChronoDAG } from "../../core/graph/dag.ts";
import { SemanticMergeEngine } from "../../core/merge/strategies.ts";
import { StateNode } from "../../core/graph/node.ts";

export interface MergeCommandOptions {
  sourceBranch: string;
  targetBranch?: string;
  strategy?: "semantic" | "ours" | "theirs";
}

export async function executeMerge(
  dag: ChronoDAG,
  branches: Record<string, string>,
  options: MergeCommandOptions
): Promise<{ success: boolean; mergedCid?: string; conflicts: number; message: string }> {
  const sourceCid = branches[options.sourceBranch];
  const targetBranch = options.targetBranch || "main";
  const targetCid = branches[targetBranch];

  if (!sourceCid) {
    throw new Error(`Branch "${options.sourceBranch}" not found`);
  }
  if (!targetCid) {
    throw new Error(`Target branch "${targetBranch}" not found`);
  }

  const mergeEngine = new SemanticMergeEngine(dag);
  const result = await mergeEngine.merge(targetCid, sourceCid);

  if (!result.success && result.conflicts.length > 0) {
    return {
      success: false,
      conflicts: result.conflicts.length,
      message: `Merge failed with ${result.conflicts.length} conflict(s). Run 'chrono status' for details.`,
    };
  }

  // Create clean merge commit node
  const now = new Date().toISOString();
  const targetNode = dag.getNode(targetCid)!;
  const mergedNode = await StateNode.create({
    parents: [targetCid, sourceCid],
    clock: targetNode.clock.tick("chrono.merge").toJSON(),
    wallTime: now,
    adapter: { id: "chrono.core", version: "1.0.0", instanceId: "cli-merge" },
    kind: "snapshot",
    body: {
      kind: "snapshot",
      state: Object.fromEntries(result.mergedBuffers.entries()),
    },
    annotations: {
      label: `Merged branch '${options.sourceBranch}' into '${targetBranch}'`,
      branch: targetBranch,
    },
  });

  dag.addNode(mergedNode);
  branches[targetBranch] = mergedNode.cid;

  return {
    success: true,
    mergedCid: mergedNode.cid,
    conflicts: 0,
    message: `Successfully merged '${options.sourceBranch}' into '${targetBranch}' (New head: ${mergedNode.cid.slice(0, 10)})`,
  };
}
