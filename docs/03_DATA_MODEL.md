# Data Model

Every entity. Every field. Every relationship.

## Entity Relationship

    Scope 1──* Node *──* Node (via parents)
                │
                │
                * Delta
                │
                *
                Op

    Branch *──1 Node (head)
    Tag    *──1 Node
    Epoch  1──* Node

## Scope

A namespaced slice of reality.

    Scope {
      uri:        string   // "chrono://app/vscode/workspace/abc"
      hash:       Hash     // BLAKE3(uri)
      created_at: Timestamp
      adapter_id: AdapterId
      metadata:   Map<string, bytes>
    }

**Examples:**
- `chrono://app/vscode/workspace/abc123`
- `chrono://fs/home/user/projects/chrono`
- `chrono://os/window-manager/display/0`
- `chrono://browser/tab/xyz789`

**Rule:** One adapter owns one scope. Cross-scope is explicit.

## Node

An immutable, content-addressed state record.

    Node {
      id:        Hash        // BLAKE3(canonical(this minus id))
      parents:   [Hash]      // 0..N
      clock:     VectorClock
      wall_time: Option<Ns>
      adapter:   AdapterId
      scope:     ScopeHash
      delta_ref: Hash        // pointer to Delta
      metadata:  Map<string, bytes>
      signature: Option<Sig>
    }

**Rules:**
- `id` computed from canonical CBOR of everything except `id`
- `parents` empty → genesis node
- `parents` length 1 → normal commit
- `parents` length 2+ → merge node
- `clock` dominates all parents' clocks
- `wall_time` is a hint, never truth

## Delta

The semantic difference between two nodes.

    Delta {
      hash:  Hash
      from:  Hash            // parent node
      to:    Hash            // this node
      base:  Option<Hash>    // for 3-way
      ops:   [Op]            // ordered
    }

**Rules:**
- Ops ordered by causal application order
- `base` present only for merges
- Delta hash = BLAKE3(canonical(ops))

## Op

The atomic unit of change.

    Op =
      | SetPath    { path: Path, value: Value }
      | DeletePath { path: Path }
      | InsertSeq  { path: Path, index: uint, value: Value }
      | DeleteSeq  { path: Path, index: uint }
      | MoveSeq    { path: Path, from: uint, to: uint }
      | Custom     { kind: string, payload: bytes }

**Path:** JSON-pointer-like, e.g. `/src/auth.ts/line/5`.

**Value:** canonical CBOR: null, bool, int, float, string,
bytes, array, map. No functions, no refs.

## VectorClock

    VectorClock = Map<AdapterId, uint64>

**Rules:**
- Monotonic per adapter
- Compare pointwise (see `core/clock/logical.ts`)
- Never shrinks (except via Epoch compression)

## Epoch

Coarse causal checkpoint.

    Epoch {
      id:      Hash
      scope:   ScopeHash
      covers:  [AdapterId]
      through: uint64
      node:    Hash          // checkpoint node
    }

**Purpose:** Fast seek in replay. Analogous to a commit's
"snapshot" in some systems, but derived.

## Branch

Named pointer to a node.

    Branch {
      name:       string     // "main", "experiment/auth"
      scope:      ScopeHash
      head:       Hash
      created_at: Hash       // node at creation
      policy:     BranchPolicy
      metadata:   Map<string, bytes>
    }

    BranchPolicy {
      ai_may_write:   bool   // default false
      auto_merge:     bool   // default false
      retention_days: Option<uint>
    }

## Tag

Immutable named pointer.

    Tag {
      name: string
      node: Hash
      scope: ScopeHash
      created_at: Timestamp
    }

## Conflict

First-class node.

    Conflict {
      hash:       Hash
      kind:       ConflictKind
      scope:      ScopeHash
      base:       Hash
      left:       Hash
      right:      Hash
      paths:      [Path]
      suggestion: Option<Hash>  // AI-proposed resolution node
      resolved:   Option<Hash>  // resolution node if resolved
      created_at: Timestamp
    }

    ConflictKind =
      | "overlapping" | "delete_modify" | "semantic"
      | "schema" | "ordering"

## State (Returned from replay)

Adapter-defined. Interface:

    State {
      scope:   ScopeHash
      node:    Hash
      payload: AdapterSpecific
      hash:    Hash   // BLAKE3(canonical(payload))
    }

**Rule:** Two replays of the same node must yield identical
`hash`. If not, the adapter violates its contract.

## AdapterIdentity

    AdapterIdentity {
      id:               AdapterId
      version:          semver
      protocol_version: semver
      display_name:     string
      author:           string
    }

## Capabilities

See `adapters/sdk/capability.ts` for full definition.

## Index Entries

### causality.idx
    { scope, clock_hash, node_hash }

### wall_time.idx
    { scope, wall_time_ns, node_hash }

### path.idx
    { scope, path_prefix, node_hash, op_kind }

### adapter.idx
    { adapter_id, node_hash }

### semantic.hnsw
    { node_hash, embedding_vector }

## Storage Layout

On disk (see `store/format/on-disk.md` for binary details):

    ~/.chrono/scopes/<scope-hash>/
      meta.json
      nodes/{hot,warm,cold}/
      index/*.idx
      refs/{branches,tags}/
      wal/

## Lifecycles

### Node
    created (observe)
      → hot
      → warm (after threshold)
      → cold (after threshold)
      → archived (never deleted)

### Branch
    created (explicit)
      → active (head advances)
      → stale (no commits for N days)
      → archived (explicit, still readable)

### Scope
    created (adapter registers)
      → active
      → dormant (adapter silent, no writes)
      → archived (user opt-in)

## Relationships

- Scope 1─* Node
- Node *─* Node (parents)
- Node 1─1 Delta (via delta_ref)
- Delta 1─* Op
- Node *─1 Epoch (may be checkpoint)
- Branch *─1 Node (head)
- Tag 1─1 Node
- Conflict *─1 Node (each parent)
- Adapter 1─* Scope

## Invariants

**I1:** Every node's id = BLAKE3(canonical(node - id))
**I2:** Every node's clock dominates all its parents' clocks
**I3:** Every branch's head is a valid node in its scope
**I4:** Every delta's from/to are valid nodes
**I5:** Every delta's ops, applied in order, produce `to` from `from`
**I6:** Concurrent nodes never share content hash
**I7:** Genesis node has 0 parents and empty delta
**I8:** Merge node has ≥2 parents and a 3-way delta
**I9:** No node is deleted; only tiered
**I10:** Replay is deterministic (same node → same state hash)

## Canonical Form

For hashing to be stable across machines:

- CBOR canonical form (RFC 8949)
- Map keys sorted lexicographically by UTF-8 bytes
- No indefinite-length arrays
- Smallest integer encoding
- No NaN in floats
- Timestamps: RFC 3339 with nanoseconds
- Strings: UTF-8, no BOM

## Sizes (Typical)

| Entity | Size |
|--------|------|
| Node (header only) | ~200 bytes |
| Delta (10 ops) | ~500 bytes |
| Op (average) | ~50 bytes |
| Full state (VS Code) | ~10-100 KB |
| Embedding (768d, fp16) | ~1.5 KB |

## Privacy Fields

Nodes may carry `metadata` tagged as `private: true`.
Private metadata:
- Never indexed
- Never sent to AI
- Never synced (Phase 4)
- Encrypted at rest if user enables

## Versioning

Data model version: `1`.

Future versions:
- Add fields only
- Never remove
- Never renumber
- Migrations are additive

See `store/format/on-disk.md`.
