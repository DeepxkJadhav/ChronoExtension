/**
 * CHRONO ADAPTER SDK: ADAPTER BASE CONTRACT
 * 
 * The primary interface implemented by all host environment adapters
 * (VS Code, terminal, filesystem, browser).
 */

import type { AdapterCapabilityProfile } from "./capability.ts";

export type CID = string;

export interface SemanticDelta {
  /** Domain classification, e.g. 'text.splice', 'terminal.exec', 'fs.write' */
  type: string;
  /** Uniform Resource Identifier of the target entity */
  targetUri: string;
  /** Operation payload advancing from parent to child state */
  forward: Record<string, unknown>;
  /** Optional inverse operation for fast reverse playback */
  reverse?: Record<string, unknown>;
  /** Auxiliary context metadata (cursor, AST node, exit code) */
  context?: Record<string, unknown>;
}

export interface HostSnapshot {
  /** Timestamp when snapshot was captured */
  timestamp: string;
  /** Full domain state map keyed by resource URI */
  domains: Record<string, unknown>;
  /** Raw payload byte size */
  byteSize: number;
}

export interface RestoreRequest {
  targetCid: CID;
  state: Record<string, unknown>;
  /** Optional delta sequence to apply from current head if incremental */
  deltas?: SemanticDelta[];
}

export interface RestoreResult {
  success: boolean;
  restoredCid: CID;
  errorMessage?: string;
}

export interface AdapterContext {
  workspaceRoot: string;
  daemonIpcPath: string;
  logger: {
    debug(msg: string, ...args: unknown[]): void;
    info(msg: string, ...args: unknown[]): void;
    warn(msg: string, ...args: unknown[]): void;
    error(msg: string, ...args: unknown[]): void;
  };
}

export interface ChronoAdapter {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly capabilities: AdapterCapabilityProfile;

  initialize(context: AdapterContext): Promise<void>;
  snapshot(): Promise<HostSnapshot>;
  restore(request: RestoreRequest): Promise<RestoreResult>;
  subscribeDeltas(listener: (delta: SemanticDelta) => Promise<void>): void;
  diff(stateA: unknown, stateB: unknown): SemanticDelta[];
  dispose(): Promise<void>;
}
