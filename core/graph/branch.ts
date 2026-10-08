/**
 * CHRONO: BRANCH MANAGER
 * 
 * Manages branch references, active pointers, and fork points in the ChronoDAG.
 */

import { ChronoDAG } from "./dag.ts";
import { StateNode } from "./node.ts";

export interface BranchRef {
  name: string;
  headCid: string;
  forkCid: string;
  createdAt: string;
  updatedAt: string;
}

export class BranchManager {
  private readonly dag: ChronoDAG;
  private readonly branches: Map<string, BranchRef> = new Map();
  private activeBranchName = "main";

  constructor(dag: ChronoDAG) {
    this.dag = dag;
  }

  public init(genesisCid: string): void {
    const now = new Date().toISOString();
    this.branches.set("main", {
      name: "main",
      headCid: genesisCid,
      forkCid: genesisCid,
      createdAt: now,
      updatedAt: now,
    });
    this.activeBranchName = "main";
  }

  public getActiveBranch(): BranchRef | undefined {
    return this.branches.get(this.activeBranchName);
  }

  public getActiveBranchName(): string {
    return this.activeBranchName;
  }

  public getBranch(name: string): BranchRef | undefined {
    return this.branches.get(name);
  }

  public listBranches(): BranchRef[] {
    return Array.from(this.branches.values());
  }

  public createBranch(name: string, fromCid?: string): BranchRef {
    if (this.branches.has(name)) {
      throw new Error(`Branch "${name}" already exists`);
    }

    const currentHead = fromCid || this.getActiveBranch()?.headCid;
    if (!currentHead) {
      throw new Error("Cannot create branch: No head node reference available");
    }

    if (!this.dag.hasNode(currentHead)) {
      throw new Error(`Cannot fork from non-existent node "${currentHead}"`);
    }

    const now = new Date().toISOString();
    const ref: BranchRef = {
      name,
      headCid: currentHead,
      forkCid: currentHead,
      createdAt: now,
      updatedAt: now,
    };

    this.branches.set(name, ref);
    return ref;
  }

  public checkout(name: string): BranchRef {
    const branch = this.branches.get(name);
    if (!branch) {
      throw new Error(`Branch "${name}" not found`);
    }
    this.activeBranchName = name;
    return branch;
  }

  public updateHead(branchName: string, newHeadCid: string): void {
    const branch = this.branches.get(branchName);
    if (!branch) {
      throw new Error(`Branch "${branchName}" not found`);
    }
    branch.headCid = newHeadCid;
    branch.updatedAt = new Date().toISOString();
  }
}
