# Architecture

## System Overview

    ┌─────────────────────────────────────────────────────┐
    │                    USER INTERFACES                   │
    │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
    │  │  CLI     │  │ Scrubber │  │ VS Code / Browser │  │
    │  │ chrono   │  │   UI     │  │    Extensions     │  │
    │  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
    │       │             │                  │            │
    │       └─────────────┼──────────────────┘            │
    │                     │ IPC (Unix socket / gRPC)      │
    ├─────────────────────┼──────────────────────────────┤
    │                     ▼                               │
    │         ┌──────────────────────────┐                │
    │         │        DAEMON            │                │
    │         │  ┌────────────────────┐  │                │
    │         │  │  Adapter Registry  │  │                │
    │         │  │  Clock Service     │  │                │
    │         │  │  Replay Engine     │  │                │
    │         │  │  Merge Engine      │  │                │
    │         │  │  CQL Evaluator     │  │                │
    │         │  │  AI Orchestrator   │  │                │
    │         │  └────────────────────┘  │                │
    │         └────────┬─────────────────┘                │
    │                  │                                  │
    │                  ▼                                  │
    │         ┌──────────────────────────┐                │
    │         │        STORE             │                │
    │         │  Hot (log) / Warm (seg)  │                │
    │         │  Cold (archive)          │                │
    │         │  Indexes (causality,     │                │
    │         │    wall_time, path,      │                │
    │         │    semantic)             │                │
    │         └──────────────────────────┘                │
    └─────────────────────────────────────────────────────┘

## The Daemon

**One process. Always running. Invisible.**

Responsibilities:
- Own the store (single writer)
- Run adapters on schedule
- Serve CLI + UI requests
- Manage vector clocks
- Coordinate AI calls
- Handle sync (Phase 4)

**Why a daemon?**
- Multiple apps need to observe/query the same graph
- Store needs a single writer (SQLite/LMDB)
- Adapters need a stable host
- Replay is compute-heavy; cache in one place

**Communication:** Unix domain socket (macOS/Linux),
Named pipe (Windows). Protocol: gRPC over the socket.

## The Core Engine

### Clock Service
- Owns the vector clock per scope
- On every node creation: `tick()`
- On merge: `merge(a, b)`
- Serializes causality to disk

### Replay Engine
```
replay(node):
  1. Find nearest epoch checkpoint ≤ node
  2. Load checkpoint state
  3. Walk deltas from checkpoint → node (topological)
  4. For concurrent deltas, call merge engine
  5. Verify hash matches node.hash
  6. Return state
```
- Caches replayed states (LRU, bounded)
- Parallel-safe (pure function)

### Merge Engine
- Implements `MERGE_SEMANTICS.md`
- Handles all 8 conflict kinds
- Falls back to manual on unresolvable
- Never silently loses state

### CQL Evaluator
- Parses CQL → AST
- Plans query (index selection)
- Executes against store
- Streams results (never loads all)

### AI Orchestrator
- Runs contract-based calls
- Falls back to non-AI when disabled
- Logs every call
- Caches aggressively

## The Store

Three tiers:

| Tier | Location | Latency | Size |
|------|----------|---------|------|
| Hot  | RAM + SSD log | <1ms | last 10k nodes |
| Warm | SSD segments | ~10ms | last 90 days |
| Cold | Compressed archive | seconds | everything else |

**Content-addressed.** Node hash = BLAKE3(canonical CBOR).

**Indexes:**
- `causality.idx` — (scope, clock, node)
- `wall_time.idx` — (scope, time, node)
- `path.idx` — path prefix → nodes
- `adapter.idx` — adapter → nodes
- `semantic.hnsw` — optional, rebuildable

## Adapters

Each adapter:
1. Declares capabilities (see `capability.ts`)
2. Observes a scope on a schedule
3. Emits nodes when state changes
4. Can replay a node to state
5. Can diff two nodes
6. Can apply a delta

**Adapters are sandboxed.** They cannot:
- Read other scopes
- Mutate existing nodes
- Access filesystem directly
- Make undeclared network calls

**Adapters are the moat.** Every new adapter adds value
to every user.

## Data Flow

### Observing
```
Adapter.observe()
  → reads current state
  → computes delta from last node
  → if delta empty: skip
  → else: clock.tick()
         → node = { ... }
         → store.append(node)
         → index.update(node)
```

### Replaying
```
User: chrono replay abc123
  → daemon receives
  → replay_engine.replay(abc123)
  → adapter.apply(state, delta) for each step
  → returns State
  → caller renders
```

### Querying
```
User: chrono query "show auth edits last 2h"
  → CQL parser → AST
  → planner: index scan on semantic + wall_time
  → executor: scan, filter, project
  → stream results
```

### Branching
```
User: chrono branch "experiment" from main
  → create ref refs/branches/experiment → head(main)
  → done
```

### Merging
```
User: chrono merge experiment into main
  → merge_engine.merge(base, main_head, exp_head)
  → classify conflicts
  → if auto-resolvable: apply, create merge node
  → else: create conflict node, present to user
```

## Concurrency Model

- **Daemon:** single-threaded event loop (async) for I/O,
  worker pool for CPU-heavy (replay, merge, index)
- **Store:** single writer (daemon), many readers
- **Adapters:** run in daemon process (trusted) or separate
  processes (untrusted, sandboxed)
- **UI/CLI:** clients, never hold locks

## Failure Modes

| Failure | Response |
|---------|----------|
| Daemon crash | WAL replay on restart |
| Adapter crash | Restart with backoff; log |
| Store corruption | Skip bad records; refetch from peer |
| AI unavailable | Fall back to non-AI |
| Index corruption | Rebuild from nodes |
| Disk full | Roll to cold storage; warn user |
| Clock drift | Ignore; causality is not time |

## Extensibility Points

1. **Adapters** — anyone can write one
2. **CQL functions** — plugin-defined ops
3. **AI providers** — pluggable
4. **Storage backends** — SQLite default, others possible
5. **Sync transports** — P2P, S3, custom
6. **UI frontends** — CLI, GUI, IDE, web

## What NOT to Couple

- Core engine ↔ adapters: separate
- Core engine ↔ AI: separate (AI is optional)
- Store format ↔ query engine: separate
- UI ↔ daemon internals: separate (via gRPC)

## The Protocol

CHRONO is a **protocol** more than a product. The daemon is
one implementation. Anyone can:
- Write a new adapter
- Write a new UI
- Implement the protocol in another language
- Build a compatible store

The protocol is documented in `spec/`. It is the moat.

## Performance Targets

| Operation | Target | Hard Limit |
|-----------|--------|------------|
| observe() | <10ms | 50ms |
| append node | <5ms | 20ms |
| replay (near) | <50ms | 200ms |
| replay (far) | <500ms | 2s |
| CQL simple query | <100ms | 500ms |
| CQL semantic query | <500ms | 2s |
| merge auto | <200ms | 1s |
| branch create | <5ms | 20ms |

## Scalability Ceiling

- **Per scope:** millions of nodes (segments scale)
- **Per machine:** hundreds of scopes
- **Across machines:** sync is opt-in, bounded by user

## Security Model

See `09_SECURITY_PRIVACY.md`. Short version:
- Local-first, no cloud required
- Adapters sandboxed
- Optional E2E encryption for sync
- No telemetry by default

## The Three Invariants

1. **Determinism:** `replay(node)` → same state, forever, everywhere.
2. **No data loss:** state is compressed, archived, never deleted.
3. **Causality:** merge respects the DAG; concurrent edits never silently overwrite.

Break any of these and CHRONO is not CHRONO.
