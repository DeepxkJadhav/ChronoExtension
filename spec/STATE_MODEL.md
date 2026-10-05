# CHRONO SPECIFICATION: STATE MODEL

**Status**: Standard (Draft)  
**Version**: 1.0.0-draft  
**Authors**: Chrono Architecture Working Group  

---

## 1. Mathematical Formalism

Let history be represented as a directed acyclic graph:
$$\mathcal{G} = (\mathcal{V}, \mathcal{E})$$

Where:
- $\mathcal{V}$ is the set of immutable, content-addressed **State Nodes** ($v \in \mathcal{V}$).
- $\mathcal{E} \subseteq \mathcal{V} \times \mathcal{V}$ is the set of directed causal edges pointing backwards from a child state to its immediate causal parent(s). If $(u, v) \in \mathcal{E}$, then state $u$ causally descends directly from state $v$ (written $v \prec u$).

A branch $\mathcal{B}$ is a named mutable pointer to a head node:
$$\mathcal{B}: \text{BranchName} \to \text{NodeID}$$

---

## 2. State Node Definition

Every node $v \in \mathcal{V}$ is uniquely identified by a Content Identifier ($\text{CID}$):
$$\text{CID}(v) = \text{BLAKE3}(\text{CanonicalCanonicalize}(v))$$

### 2.1 Node Schema (JSON Schema / TypeScript)

```typescript
export type CID = string; // Hex-encoded 256-bit BLAKE3 hash

export interface StateNode {
  /** Protocol schema version */
  chrono_version: "1.0.0";

  /** Cryptographic content identifier of this node */
  cid: CID;

  /** Causal parent node identifiers (empty array only for initial root node) */
  parents: CID[];

  /** Logical causality clock */
  clock: VectorClock;

  /** Wall clock time at moment of emission (UTC ISO-8601). Informational only! */
  wall_time: string;

  /** Source adapter namespace that authored this node */
  adapter: {
    id: string;        // e.g. "chrono.adapter.vscode"
    version: string;   // e.g. "1.4.0"
    instance_id: string; // e.g. "agent-workstation-uuid"
  };

  /** Node category */
  kind: "snapshot" | "delta" | "epoch" | "merge";

  /** The state transformation payload */
  body: SnapshotBody | DeltaBody | EpochBody | MergeBody;

  /** Optional user or system annotations */
  annotations?: {
    label?: string;
    branch?: string;
    tags?: string[];
    author?: string;
  };
}
```

---

## 3. Node Varieties

### 3.1 Snapshot Node (`kind: "snapshot"`)
A Snapshot Node contains a complete, self-contained materialized state of the host domain at that point in time. It requires zero prior history to reconstruct.

```typescript
export interface SnapshotBody {
  kind: "snapshot";
  /** Canonical domain state representation */
  state: Record<string, unknown>;
  /** Byte size of raw serialized payload */
  bytes: number;
}
```

### 3.2 Delta Node (`kind: "delta"`)
A Delta Node encapsulates an atomic semantic mutation relative to its single primary parent $P_0$.

```typescript
export interface DeltaBody {
  kind: "delta";
  delta: SemanticDelta;
}

export interface SemanticDelta {
  /** Domain mutation classification */
  type: string; // e.g. "text.splice", "fs.file_write", "pty.exec"

  /** URI of the entity being mutated */
  target_uri: string; // e.g. "file:///workspace/src/auth.ts"

  /** Operation-specific forward parameters */
  forward: DeltaOperation;

  /** Optional inverse operation for sub-millisecond reverse-scrub */
  reverse?: DeltaOperation;

  /** Domain-level metadata for indexing and conflict resolution */
  context?: {
    ast_path?: string;
    cursor_position?: { line: number; character: number };
    selection_range?: { start: number; end: number };
    exit_code?: number;
  };
}
```

### 3.3 Epoch Node (`kind: "epoch"`)
An Epoch Node is a checkpoint combining a fully consolidated snapshot of all active adapter states with a hash-manifest of all intermediate deltas since the prior Epoch.

```typescript
export interface EpochBody {
  kind: "epoch";
  epoch_number: number;
  prior_epoch: CID | null;
  delta_count_since_prior: number;
  consolidated_state: Record<string, unknown>;
  manifest_merkle_root: string;
}
```

### 3.4 Merge Node (`kind: "merge"`)
A Merge Node reconciles two or more divergent parent branches. It references the Lowest Common Ancestor (LCA) and records the resolution delta or consolidated state.

```typescript
export interface MergeBody {
  kind: "merge";
  lca_cid: CID;
  strategy: "semantic_3way" | "ours" | "theirs" | "manual";
  conflicts_resolved: Array<{
    target_uri: string;
    resolution: "picked_a" | "picked_b" | "synthesized";
    details?: string;
  }>;
  resolved_state: Record<string, unknown>;
}
```

---

## 4. Delta Algebra & Invertibility

### 4.1 Delta Application
A delta $\Delta$ is a state transition function:
$$\Delta: \mathcal{S} \to \mathcal{S}$$
$$S_{t+1} = \Delta(S_t)$$

### 4.2 Invertibility
An invertible delta satisfies:
$$\Delta^{-1}(\Delta(S)) = S \quad \forall S \in \mathcal{S}$$

Where possible, adapters MUST emit the `reverse` operation alongside `forward`. This allows bidirectional timeline navigation without replaying from an epoch:
- Forward scrub: $S_{t+1} = \Delta_{\text{forward}}(S_t)$
- Backward scrub: $S_t = \Delta_{\text{reverse}}(S_{t+1})$

### 4.3 Delta Composition
Let $\Delta_1$ and $\Delta_2$ be two sequential deltas on target $T$. Their composition $\Delta_{\text{composed}} = \Delta_2 \circ \Delta_1$ satisfies:
$$(\Delta_2 \circ \Delta_1)(S) = \Delta_2(\Delta_1(S))$$

During Epoch consolidation or background compaction, adjacent fine-grained deltas (e.g. 50 single-keystroke splices) are folded into a single consolidated semantic delta.

---

## 5. Causal Ordering & Vector Clocks

Each node embeds a Vector Clock:
$$V: \text{AdapterID} \to \mathbb{N}$$

- When adapter $A$ emits a state node, it increments its own component: $V_A[A] \leftarrow V_A[A] + 1$.
- Causality relation: Node $u$ causally precedes node $v$ ($u \prec v$) if and only if:
$$\forall k, V_u[k] \le V_v[k] \quad \text{and} \quad \exists k, V_u[k] < V_v[k]$$
- If neither $u \prec v$ nor $v \prec u$, the events are **concurrent** ($u \parallel v$). Concurrent nodes in the DAG can be safely interleaved or branched.
