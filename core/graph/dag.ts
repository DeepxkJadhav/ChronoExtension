/**
 * CHRONO CORE GRAPH: DIRECTED ACYCLIC GRAPH (DAG)
 * 
 * Manages state nodes, causal edge relationships, topological walks,
 * lineage extraction, and Lowest Common Ancestor (LCA) resolution.
 */

import { StateNode } from "./node.ts";
import type { CID } from "./node.ts";
import type { VectorClock } from "../clock/logical.ts";

export interface DAGStats {
  nodeCount: number;
  edgeCount: number;
  rootCount: number;
  headCount: number;
}

export class ChronoDAG {
  /** Map of CID to StateNode */
  private readonly nodes: Map<CID, StateNode> = new Map();

  /** Map of child CID to parent CIDs */
  private readonly parentsMap: Map<CID, Set<CID>> = new Map();

  /** Map of parent CID to children CIDs */
  private readonly childrenMap: Map<CID, Set<CID>> = new Map();

  /** Track root nodes (zero parents) */
  private readonly roots: Set<CID> = new Set();

  /** Track head nodes (zero children) */
  private readonly heads: Set<CID> = new Set();

  constructor() {}

  /**
   * Insert a verified StateNode into the DAG.
   * Throws if parent nodes are missing (causality prerequisite).
   */
  public addNode(node: StateNode): void {
    if (this.nodes.has(node.cid)) {
      return; // Idempotent insert
    }

    // Verify parents exist in DAG unless this is a root node
    for (const parentCid of node.parents) {
      if (!this.nodes.has(parentCid)) {
        throw new Error(
          `Causality violation: Parent node ${parentCid} must exist before inserting child ${node.cid}`
        );
      }
    }

    this.nodes.set(node.cid, node);
    this.parentsMap.set(node.cid, new Set(node.parents));

    if (!this.childrenMap.has(node.cid)) {
      this.childrenMap.set(node.cid, new Set());
    }

    if (node.parents.length === 0) {
      this.roots.add(node.cid);
    } else {
      for (const parentCid of node.parents) {
        let childSet = this.childrenMap.get(parentCid);
        if (!childSet) {
          childSet = new Set();
          this.childrenMap.set(parentCid, childSet);
        }
        childSet.add(node.cid);
        // Parent is no longer a head
        this.heads.delete(parentCid);
      }
    }

    // A newly inserted node begins as a head
    this.heads.add(node.cid);
  }

  public getNode(cid: CID): StateNode | undefined {
    return this.nodes.get(cid);
  }

  public hasNode(cid: CID): boolean {
    return this.nodes.has(cid);
  }

  public getParents(cid: CID): CID[] {
    const set = this.parentsMap.get(cid);
    return set ? Array.from(set) : [];
  }

  public getChildren(cid: CID): CID[] {
    const set = this.childrenMap.get(cid);
    return set ? Array.from(set) : [];
  }

  public getHeads(): CID[] {
    return Array.from(this.heads);
  }

  public getRoots(): CID[] {
    return Array.from(this.roots);
  }

  /**
   * Retrieve all causal ancestors of a node (transitive closure of parents)
   */
  public getAncestors(cid: CID): Set<CID> {
    const ancestors = new Set<CID>();
    const queue: CID[] = [...this.getParents(cid)];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!ancestors.has(current)) {
        ancestors.add(current);
        const parents = this.getParents(current);
        for (const p of parents) {
          if (!ancestors.has(p)) {
            queue.push(p);
          }
        }
      }
    }

    return ancestors;
  }

  /**
   * Find the Lowest Common Ancestor (LCA) between two nodes in the DAG.
   * Uses ancestor intersection and picks the candidate with highest topological rank / clock.
   */
  public findLowestCommonAncestor(cidA: CID, cidB: CID): CID | null {
    if (cidA === cidB) {
      return cidA;
    }

    const nodeA = this.getNode(cidA);
    const nodeB = this.getNode(cidB);
    if (!nodeA || !nodeB) {
      return null;
    }

    // Check if one is direct ancestor of the other
    const ancestorsA = this.getAncestors(cidA);
    if (ancestorsA.has(cidB)) {
      return cidB;
    }

    const ancestorsB = this.getAncestors(cidB);
    if (ancestorsB.has(cidA)) {
      return cidA;
    }

    // Intersect ancestors
    const commonAncestors: CID[] = [];
    for (const anc of ancestorsA) {
      if (ancestorsB.has(anc)) {
        commonAncestors.push(anc);
      }
    }

    if (commonAncestors.length === 0) {
      return null;
    }

    // Rank candidates: the best LCA is not an ancestor of any other common ancestor
    let bestLca = commonAncestors[0];
    let maxLamport = this.getNode(bestLca)?.clock.lamportSum ?? 0;

    for (let i = 1; i < commonAncestors.length; i++) {
      const cand = commonAncestors[i];
      const candLamport = this.getNode(cand)?.clock.lamportSum ?? 0;
      if (candLamport > maxLamport) {
        bestLca = cand;
        maxLamport = candLamport;
      }
    }

    return bestLca;
  }

  /**
   * Extract ordered causal lineage path from base node to target node.
   * Returns list of nodes in topological order [fromCid, ..., toCid].
   */
  public getLineage(fromCid: CID, toCid: CID): StateNode[] {
    if (fromCid === toCid) {
      const single = this.getNode(toCid);
      return single ? [single] : [];
    }

    const path: CID[] = [];
    const visited = new Set<CID>();

    // BFS backwards from toCid towards fromCid
    const parentPointer = new Map<CID, CID>();
    const queue: CID[] = [toCid];
    visited.add(toCid);
    let found = false;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === fromCid) {
        found = true;
        break;
      }

      for (const p of this.getParents(curr)) {
        if (!visited.has(p)) {
          visited.add(p);
          parentPointer.set(p, curr);
          queue.push(p);
        }
      }
    }

    if (!found) {
      throw new Error(`No causal path found from ${fromCid} to ${toCid}`);
    }

    // Reconstruct path forward
    let curr: CID | undefined = fromCid;
    while (curr) {
      path.push(curr);
      curr = parentPointer.get(curr);
    }

    return path.map((c) => this.getNode(c)!);
  }

  public get size(): number {
    return this.nodes.size;
  }

  public isAncestor(ancestorCid: CID, targetCid: CID): boolean {
    return this.getAncestors(targetCid).has(ancestorCid);
  }

  public getStats(): DAGStats {
    let edgeCount = 0;
    for (const parents of this.parentsMap.values()) {
      edgeCount += parents.size;
    }
    return {
      nodeCount: this.nodes.size,
      edgeCount,
      rootCount: this.roots.size,
      headCount: this.heads.size,
    };
  }
}
