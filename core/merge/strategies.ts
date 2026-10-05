/**
 * CHRONO CORE MERGE: THREE-WAY SEMANTIC MERGE
 * 
 * Reconciles divergent branches using the Lowest Common Ancestor (LCA) as base.
 * Follows spec/MERGE_SEMANTICS.md.
 */

import { ChronoDAG } from "../graph/dag.ts";
import { StateNode } from "../graph/node.ts";
import type { CID } from "../graph/node.ts";
import { DeterministicReplayer } from "../replay/replayer.ts";
import { ConflictKind } from "./conflicts.ts";
import type { SemanticConflict, MergeReport } from "./conflicts.ts";

export class SemanticMergeEngine {
  private readonly dag: ChronoDAG;
  private readonly replayer: DeterministicReplayer;

  constructor(dag: ChronoDAG) {
    this.dag = dag;
    this.replayer = new DeterministicReplayer(dag);
  }

  /**
   * Perform 3-way merge between leftCid and rightCid
   */
  public async merge(leftCid: CID, rightCid: CID): Promise<MergeReport> {
    // Invariant I: Idempotence (merge(A, A) === A)
    if (leftCid === rightCid) {
      const leftState = await this.replayer.reconstruct(leftCid);
      return {
        success: true,
        baseCid: leftCid,
        leftCid,
        rightCid,
        conflicts: [],
        mergedBuffers: new Map(leftState.state.buffers),
      };
    }

    // Step 1: Find Lowest Common Ancestor
    const lcaCid = this.dag.findLowestCommonAncestor(leftCid, rightCid);
    if (!lcaCid) {
      throw new Error(`Cannot merge: no common ancestor found between ${leftCid} and ${rightCid}`);
    }

    // Invariant II: Fast-forward left
    if (leftCid === lcaCid) {
      const rightState = await this.replayer.reconstruct(rightCid);
      return {
        success: true,
        baseCid: lcaCid,
        leftCid,
        rightCid,
        conflicts: [],
        mergedBuffers: new Map(rightState.state.buffers),
      };
    }

    // Invariant III: Fast-forward right
    if (rightCid === lcaCid) {
      const leftState = await this.replayer.reconstruct(leftCid);
      return {
        success: true,
        baseCid: lcaCid,
        leftCid,
        rightCid,
        conflicts: [],
        mergedBuffers: new Map(leftState.state.buffers),
      };
    }

    // Step 2: Reconstruct all 3 states
    const baseReplay = await this.replayer.reconstruct(lcaCid);
    const leftReplay = await this.replayer.reconstruct(leftCid);
    const rightReplay = await this.replayer.reconstruct(rightCid);

    const baseBuffers = baseReplay.state.buffers;
    const leftBuffers = leftReplay.state.buffers;
    const rightBuffers = rightReplay.state.buffers;

    const allUris = new Set([
      ...baseBuffers.keys(),
      ...leftBuffers.keys(),
      ...rightBuffers.keys(),
    ]);

    const mergedBuffers = new Map<string, string>();
    const conflicts: SemanticConflict[] = [];

    for (const uri of allUris) {
      const baseContent = baseBuffers.get(uri);
      const leftContent = leftBuffers.get(uri);
      const rightContent = rightBuffers.get(uri);

      // Case 1: Unchanged in right -> take left
      if (rightContent === baseContent) {
        if (leftContent !== undefined) {
          mergedBuffers.set(uri, leftContent);
        }
        continue;
      }

      // Case 2: Unchanged in left -> take right
      if (leftContent === baseContent) {
        if (rightContent !== undefined) {
          mergedBuffers.set(uri, rightContent);
        }
        continue;
      }

      // Case 3: Both modified identically -> take left (or right)
      if (leftContent === rightContent) {
        if (leftContent !== undefined) {
          mergedBuffers.set(uri, leftContent);
        }
        continue;
      }

      // Case 4: Delete in one, edit in other
      if (leftContent === undefined || rightContent === undefined) {
        conflicts.push({
          targetUri: uri,
          kind: ConflictKind.DELETE_MODIFY,
          baseContent,
          leftContent,
          rightContent,
          description: `Resource was deleted in one branch but modified in the other`,
        });
        continue;
      }

      // Case 5: Independent non-conflicting lines / sections vs direct collision
      const autoMerged = this.tryMergeText(baseContent ?? "", leftContent, rightContent);
      if (autoMerged !== null) {
        mergedBuffers.set(uri, autoMerged);
      } else {
        conflicts.push({
          targetUri: uri,
          kind: ConflictKind.OVERLAPPING,
          baseContent,
          leftContent,
          rightContent,
          description: `Direct collision in buffer content`,
        });
      }
    }

    return {
      success: conflicts.length === 0,
      baseCid: lcaCid,
      leftCid,
      rightCid,
      conflicts,
      mergedBuffers,
    };
  }

  /**
   * Line-based 3-way reconciliation for simple text mutations
   */
  private tryMergeText(base: string, left: string, right: string): string | null {
    const baseLines = base.split("\n");
    const leftLines = left.split("\n");
    const rightLines = right.split("\n");

    // If both purely appended lines at the end, interleave safely
    if (
      left.startsWith(base) &&
      right.startsWith(base) &&
      baseLines.length > 0
    ) {
      const leftAppended = left.slice(base.length);
      const rightAppended = right.slice(base.length);
      return base + leftAppended + rightAppended;
    }

    return null;
  }
}
