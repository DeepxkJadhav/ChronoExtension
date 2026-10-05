/**
 * CHRONO CORE REPLAY: DETERMINISTIC REPLAYER
 * 
 * Reconstructs application state at an arbitrary node N in the DAG
 * by finding the nearest ancestor snapshot/epoch and folding deltas.
 */

import { ChronoDAG } from "../graph/dag.ts";
import { StateNode } from "../graph/node.ts";
import type { CID } from "../graph/node.ts";
import { applyTextSplice } from "../graph/delta.ts";
import type { TextSpliceOperation } from "../graph/delta.ts";

export interface ReconstructedDomainState {
  /** Map of targetUri to text content or state object */
  buffers: Map<string, string>;
  /** Auxiliary environment or session state */
  metadata: Map<string, unknown>;
}

export interface ReplayResult {
  targetCid: CID;
  baseCid: CID;
  deltaCountFolded: number;
  state: ReconstructedDomainState;
  elapsedMs: number;
}

export class DeterministicReplayer {
  private readonly dag: ChronoDAG;

  constructor(dag: ChronoDAG) {
    this.dag = dag;
  }

  /**
   * Reconstruct state at target node N.
   */
  public async reconstruct(targetCid: CID): Promise<ReplayResult> {
    const startTime = performance.now();
    const targetNode = this.dag.getNode(targetCid);
    if (!targetNode) {
      throw new Error(`Target node ${targetCid} not found in DAG.`);
    }

    // Step 1: Find nearest ancestor snapshot or epoch (or root)
    const baseNode = this.findNearestSnapshotAncestor(targetCid);
    if (!baseNode) {
      throw new Error(`No root snapshot or epoch found in ancestry of ${targetCid}`);
    }

    // Step 2: Initialize state from the base snapshot
    const state: ReconstructedDomainState = {
      buffers: new Map(),
      metadata: new Map(),
    };

    this.hydrateBaseState(state, baseNode);

    // If target IS the base node, return immediately
    if (baseNode.cid === targetCid) {
      return {
        targetCid,
        baseCid: baseNode.cid,
        deltaCountFolded: 0,
        state,
        elapsedMs: performance.now() - startTime,
      };
    }

    // Step 3: Get causal lineage from baseNode to targetNode
    const lineage = this.dag.getLineage(baseNode.cid, targetCid);

    // Step 4: Fold deltas forward (skip index 0 which is baseNode itself)
    let deltasFolded = 0;
    for (let i = 1; i < lineage.length; i++) {
      const stepNode = lineage[i];
      this.applyNodeDelta(state, stepNode);
      deltasFolded++;
    }

    return {
      targetCid,
      baseCid: baseNode.cid,
      deltaCountFolded: deltasFolded,
      state,
      elapsedMs: performance.now() - startTime,
    };
  }

  private findNearestSnapshotAncestor(targetCid: CID): StateNode | null {
    const targetNode = this.dag.getNode(targetCid);
    if (!targetNode) return null;

    if (targetNode.kind === "snapshot" || targetNode.kind === "epoch") {
      return targetNode;
    }

    // BFS backward through parents to find the closest snapshot
    const queue: CID[] = [...targetNode.parents];
    const visited = new Set<CID>();

    while (queue.length > 0) {
      const currCid = queue.shift()!;
      if (visited.has(currCid)) continue;
      visited.add(currCid);

      const node = this.dag.getNode(currCid);
      if (!node) continue;

      if (node.kind === "snapshot" || node.kind === "epoch") {
        return node;
      }

      for (const p of node.parents) {
        if (!visited.has(p)) {
          queue.push(p);
        }
      }
    }

    // If no explicit snapshot found, look for DAG root
    const roots = this.dag.getRoots();
    if (roots.length > 0) {
      return this.dag.getNode(roots[0]) ?? null;
    }

    return null;
  }

  private hydrateBaseState(state: ReconstructedDomainState, baseNode: StateNode): void {
    const body = baseNode.body as Record<string, unknown>;
    if (!body) return;

    if (body.kind === "snapshot") {
      const rawState = (body.state as Record<string, unknown>) ?? {};
      for (const [uri, val] of Object.entries(rawState)) {
        if (typeof val === "string") {
          state.buffers.set(uri, val);
        } else if (val && typeof val === "object" && "content" in val) {
          state.buffers.set(uri, String((val as { content: unknown }).content));
        } else {
          state.metadata.set(uri, val);
        }
      }
    }
  }

  private applyNodeDelta(state: ReconstructedDomainState, node: StateNode): void {
    const body = node.body as Record<string, unknown>;
    if (!body || body.kind !== "delta") {
      return;
    }

    const delta = body.delta as {
      type: string;
      target_uri: string;
      forward: Record<string, unknown>;
    };

    if (!delta) return;

    if (delta.type === "text.splice") {
      const current = state.buffers.get(delta.target_uri) ?? "";
      const spliceOp = delta.forward as unknown as {
        range: { start: number; end: number };
        new_text?: string;
        text?: string;
      };
      const textToInsert = spliceOp.new_text ?? spliceOp.text ?? "";
      const nextBuffer = applyTextSplice(current, {
        range: spliceOp.range,
        text: textToInsert,
      });
      state.buffers.set(delta.target_uri, nextBuffer);
    } else if (delta.type === "fs.mutation") {
      const mutation = delta.forward as unknown as {
        action: string;
        newContent?: string;
      };
      if (mutation.action === "delete") {
        state.buffers.delete(delta.target_uri);
      } else if (mutation.newContent !== undefined) {
        state.buffers.set(delta.target_uri, mutation.newContent);
      }
    } else {
      state.metadata.set(`${delta.target_uri}@${node.cid}`, delta.forward);
    }
  }
}
