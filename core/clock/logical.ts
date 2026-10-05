/**
 * CHRONO CORE CLOCK: LOGICAL & VECTOR CLOCKS
 * 
 * Causality model for the CHRONO DAG.
 * Wall-clock time drifts, skews, and steps backward.
 * Causality in CHRONO is governed strictly by partial ordering via Vector Clocks,
 * with Lamport timestamps and tie-breakers used for deterministic total ordering.
 */

export type ActorId = string;

export const CausalityRelation = {
  BEFORE: "BEFORE",
  AFTER: "AFTER",
  CONCURRENT: "CONCURRENT",
  EQUAL: "EQUAL",
} as const;

export type CausalityRelation = typeof CausalityRelation[keyof typeof CausalityRelation];

export interface VectorClockSnapshot {
  [actorId: string]: number;
}

export class VectorClock {
  private readonly clockMap: Map<ActorId, number>;

  constructor(initial?: VectorClockSnapshot | Map<ActorId, number>) {
    this.clockMap = new Map();
    if (initial instanceof Map) {
      for (const [actor, seq] of initial.entries()) {
        this.clockMap.set(actor, seq);
      }
    } else if (initial) {
      for (const [actor, seq] of Object.entries(initial)) {
        this.clockMap.set(actor, seq);
      }
    }
  }

  /**
   * Get the logical sequence number for a given actor
   */
  public get(actorId: ActorId): number {
    return this.clockMap.get(actorId) ?? 0;
  }

  /**
   * Produce a new VectorClock incrementing the sequence number for the specified actor.
   */
  public tick(actorId: ActorId): VectorClock {
    const next = new VectorClock(this.clockMap);
    const current = next.get(actorId);
    next.clockMap.set(actorId, current + 1);
    return next;
  }

  /**
   * Compute the supremum (pointwise maximum) of this clock and another clock.
   * Used when merging two causal branches or joining incoming adapter events.
   */
  public join(other: VectorClock): VectorClock {
    const merged = new VectorClock(this.clockMap);
    for (const [actor, otherSeq] of other.clockMap.entries()) {
      const currentSeq = merged.get(actor);
      if (otherSeq > currentSeq) {
        merged.clockMap.set(actor, otherSeq);
      }
    }
    return merged;
  }

  /**
   * Compare causality between this clock (A) and another clock (B).
   * A <= B iff for all k, A[k] <= B[k].
   * A < B iff A <= B and A != B.
   */
  public compare(other: VectorClock): CausalityRelation {
    let hasGreater = false;
    let hasLesser = false;

    const allActors = new Set([...this.clockMap.keys(), ...other.clockMap.keys()]);

    for (const actor of allActors) {
      const aSeq = this.get(actor);
      const bSeq = other.get(actor);

      if (aSeq > bSeq) {
        hasGreater = true;
      } else if (aSeq < bSeq) {
        hasLesser = true;
      }
    }

    if (hasGreater && hasLesser) {
      return CausalityRelation.CONCURRENT;
    }
    if (hasGreater && !hasLesser) {
      return CausalityRelation.AFTER;
    }
    if (!hasGreater && hasLesser) {
      return CausalityRelation.BEFORE;
    }
    return CausalityRelation.EQUAL;
  }

  /**
   * Returns true if this clock is a causal ancestor of the target clock
   * (i.e. this < target or this == target).
   */
  public isAncestorOf(target: VectorClock): boolean {
    const rel = this.compare(target);
    return rel === CausalityRelation.BEFORE || rel === CausalityRelation.EQUAL;
  }

  /**
   * Compute the scalar Lamport sum (total operations witnessed)
   */
  public get lamportSum(): number {
    let sum = 0;
    for (const seq of this.clockMap.values()) {
      sum += seq;
    }
    return sum;
  }

  /**
   * Deterministic JSON representation with sorted keys
   */
  public toJSON(): VectorClockSnapshot {
    const obj: VectorClockSnapshot = {};
    const sortedActors = Array.from(this.clockMap.keys()).sort();
    for (const actor of sortedActors) {
      const val = this.clockMap.get(actor);
      if (val !== undefined && val > 0) {
        obj[actor] = val;
      }
    }
    return obj;
  }

  /**
   * Canonical string for deterministic content addressing
   */
  public serialize(): string {
    return JSON.stringify(this.toJSON());
  }

  public static deserialize(serialized: string): VectorClock {
    return new VectorClock(JSON.parse(serialized));
  }
}
