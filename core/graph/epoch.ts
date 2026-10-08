/**
 * CHRONO: EPOCH MANAGER
 * 
 * Provides coarse time bucketing and full-snapshot checkpoints.
 * Allows O(1) state reconstruction jumping instead of folding 10,000s of deltas.
 */

import { StateNode } from "./node.ts";
import { ChronoDAG } from "./dag.ts";

export interface EpochCheckpoint {
  id: string;
  nodeCid: string;
  timestamp: string;
  deltaCountSinceLast: number;
}

export class EpochManager {
  private readonly dag: ChronoDAG;
  private readonly checkpoints: EpochCheckpoint[] = [];
  private readonly epochIntervalDeltas: number;

  constructor(dag: ChronoDAG, epochIntervalDeltas = 100) {
    this.dag = dag;
    this.epochIntervalDeltas = epochIntervalDeltas;
  }

  public registerCheckpoint(node: StateNode, deltasSinceLast = 0): EpochCheckpoint {
    if (node.kind !== "snapshot") {
      throw new Error(`Cannot create epoch checkpoint from delta node ${node.cid}`);
    }

    const checkpoint: EpochCheckpoint = {
      id: `epoch_${this.checkpoints.length + 1}`,
      nodeCid: node.cid,
      timestamp: node.wallTime,
      deltaCountSinceLast: deltasSinceLast,
    };

    this.checkpoints.push(checkpoint);
    return checkpoint;
  }

  public findNearestCheckpoint(targetCid: string): EpochCheckpoint | null {
    if (this.checkpoints.length === 0) return null;

    // Check if target is itself an epoch
    for (let i = this.checkpoints.length - 1; i >= 0; i--) {
      const cp = this.checkpoints[i];
      if (this.dag.isAncestor(cp.nodeCid, targetCid)) {
        return cp;
      }
    }

    return this.checkpoints[0];
  }

  public listCheckpoints(): EpochCheckpoint[] {
    return [...this.checkpoints];
  }
}
