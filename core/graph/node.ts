/**
 * CHRONO CORE GRAPH: STATE NODE
 * 
 * Immutable, content-addressed vertex representing a point in computational history.
 */

import { VectorClock } from "../clock/logical.ts";
import type { VectorClockSnapshot } from "../clock/logical.ts";

export type CID = string;

export type NodeKind = "snapshot" | "delta" | "epoch" | "merge";

export interface NodeAdapterInfo {
  id: string;
  version: string;
  instanceId: string;
}

export interface NodeAnnotations {
  label?: string;
  branch?: string;
  tags?: string[];
  author?: string;
}

export interface StateNodeData<TBody = unknown> {
  chronoVersion: "1.0.0";
  cid?: CID;
  parents: CID[];
  clock: VectorClockSnapshot;
  wallTime: string;
  adapter: NodeAdapterInfo;
  kind: NodeKind;
  body: TBody;
  annotations?: NodeAnnotations;
}

/**
 * Deterministic canonical JSON serializer (sorted keys, no whitespace)
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalizeJson).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return JSON.stringify(key) + ":" + canonicalizeJson(val);
  });
  return "{" + pairs.join(",") + "}";
}

/**
 * Compute 64-character hex hash from canonical payload.
 * Defaults to SHA-256 in standard environments with 'b3_' prefix fallback.
 */
export async function computeNodeCid(canonicalPayload: string): Promise<CID> {
  // Check for Web Crypto API (supported in modern Node, browsers, Bun, Deno)
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(canonicalPayload);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `b3_${hex}`;
  }
  // Node.js crypto fallback
  try {
    const nodeCrypto = await import("crypto");
    const hash = nodeCrypto.createHash("sha256").update(canonicalPayload).digest("hex");
    return `b3_${hash}`;
  } catch {
    throw new Error("No cryptographic hashing engine available in current runtime.");
  }
}

export class StateNode<TBody = unknown> {
  public readonly chronoVersion: "1.0.0" = "1.0.0";
  public readonly cid: CID;
  public readonly parents: ReadonlyArray<CID>;
  public readonly clock: VectorClock;
  public readonly wallTime: string;
  public readonly adapter: Readonly<NodeAdapterInfo>;
  public readonly kind: NodeKind;
  public readonly body: Readonly<TBody>;
  public readonly annotations?: Readonly<NodeAnnotations>;

  private constructor(data: StateNodeData<TBody>, cid: CID) {
    this.chronoVersion = "1.0.0";
    this.cid = cid;
    this.parents = Object.freeze([...data.parents]);
    this.clock = new VectorClock(data.clock);
    this.wallTime = data.wallTime;
    this.adapter = Object.freeze({ ...data.adapter });
    this.kind = data.kind;
    this.body = Object.freeze(data.body);
    if (data.annotations) {
      this.annotations = Object.freeze({ ...data.annotations });
    }
    Object.freeze(this);
  }

  /**
   * Factory to construct and cryptographically hash a new immutable StateNode
   */
  public static async create<TBody = unknown>(
    data: Omit<StateNodeData<TBody>, "chronoVersion" | "cid">
  ): Promise<StateNode<TBody>> {
    const canonicalPayload = canonicalizeJson({
      chronoVersion: "1.0.0",
      parents: data.parents,
      clock: data.clock,
      wallTime: data.wallTime,
      adapter: data.adapter,
      kind: data.kind,
      body: data.body,
      annotations: data.annotations ?? null,
    });

    const cid = await computeNodeCid(canonicalPayload);
    return new StateNode<TBody>(
      {
        chronoVersion: "1.0.0",
        cid,
        parents: data.parents,
        clock: data.clock,
        wallTime: data.wallTime,
        adapter: data.adapter,
        kind: data.kind,
        body: data.body,
        annotations: data.annotations,
      },
      cid
    );
  }

  /**
   * Reconstitute an existing StateNode from validated storage
   */
  public static fromVerified<TBody = unknown>(data: StateNodeData<TBody>): StateNode<TBody> {
    if (!data.cid) {
      throw new Error("Cannot reconstitute StateNode without verified CID");
    }
    return new StateNode<TBody>(data, data.cid);
  }

  public toJSON(): StateNodeData<TBody> {
    return {
      chronoVersion: this.chronoVersion,
      cid: this.cid,
      parents: [...this.parents],
      clock: this.clock.toJSON(),
      wallTime: this.wallTime,
      adapter: { ...this.adapter },
      kind: this.kind,
      body: this.body,
      annotations: this.annotations ? { ...this.annotations } : undefined,
    };
  }
}
