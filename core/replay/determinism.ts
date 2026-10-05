/**
 * CHRONO CORE REPLAY: DETERMINISM AUDITOR & FUZZER
 * 
 * Verifies the foundational guarantee of CHRONO:
 * Replaying state at Node N must yield bitwise identical application state
 * regardless of run count, execution speed, or platform.
 */

import { ChronoDAG } from "../graph/dag.ts";
import { computeNodeCid, canonicalizeJson } from "../graph/node.ts";
import type { CID } from "../graph/node.ts";
import { DeterministicReplayer } from "./replayer.ts";
import type { ReconstructedDomainState } from "./replayer.ts";

export interface DeterminismCheckReport {
  targetCid: CID;
  iterationsRun: number;
  deterministic: boolean;
  stateDigest: string;
  divergencesDetected: number;
  averageReplayMs: number;
}

/**
 * Compute cryptographic digest of a reconstructed domain state
 */
export async function digestDomainState(state: ReconstructedDomainState): Promise<string> {
  const plainObj: Record<string, string> = {};
  const sortedUris = Array.from(state.buffers.keys()).sort();
  for (const uri of sortedUris) {
    plainObj[uri] = state.buffers.get(uri)!;
  }
  const serialized = canonicalizeJson(plainObj);
  return computeNodeCid(serialized);
}

export class DeterminismAuditor {
  private readonly dag: ChronoDAG;
  private readonly replayer: DeterministicReplayer;

  constructor(dag: ChronoDAG) {
    this.dag = dag;
    this.replayer = new DeterministicReplayer(dag);
  }

  /**
   * Run replay K times for a target node and assert that every single run
   * produces bit-for-bit identical state and matching cryptographic digests.
   */
  public async auditNode(targetCid: CID, iterations = 10): Promise<DeterminismCheckReport> {
    if (iterations < 2) {
      throw new Error("Determinism audit requires at least 2 iterations.");
    }

    let initialDigest: string | null = null;
    let totalMs = 0;
    let divergences = 0;

    for (let i = 0; i < iterations; i++) {
      const result = await this.replayer.reconstruct(targetCid);
      totalMs += result.elapsedMs;
      const currentDigest = await digestDomainState(result.state);

      if (initialDigest === null) {
        initialDigest = currentDigest;
      } else if (currentDigest !== initialDigest) {
        divergences++;
      }
    }

    return {
      targetCid,
      iterationsRun: iterations,
      deterministic: divergences === 0,
      stateDigest: initialDigest ?? "",
      divergencesDetected: divergences,
      averageReplayMs: totalMs / iterations,
    };
  }
}
