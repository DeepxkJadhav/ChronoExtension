# Glossary

Every term. Defined. Cross-referenced.

## A

**Adapter** — A process that observes a scope and emits
nodes. Implements `capability.ts`. Sandboxed.

**ADAPTER_CONTRACT.md** — Spec defining the adapter interface.

**Age** — A file encryption format. Used for optional
E2E sync.

**AI Orchestrator** — Component routing AI calls through
contracts.

## B

**BLAKE3** — The hash function used for content-addressing.

**Branch** — A named pointer to a node in a scope.

**BranchPolicy** — Rules for a branch (AI may write, etc.).

## C

**Canonical Form** — Deterministic serialization (CBOR).

**Capability** — What an adapter can do (observe, replay, etc.).

**CBOR** — Concise Binary Object Representation (RFC 8949).

**Causal Order** — Partial order defined by vector clocks:
`equal`, `before`, `after`, `concurrent`.

**CHRONO** — The project. Also: the temporal state layer.

**Clock Service** — Component managing vector clocks.

**Conflict** — First-class node representing a merge
conflict. Has a kind, base, left, right, paths, optional
suggestion.

**Content-Addressed** — Identity = hash of content.

**CQL** — Chrono Query Language. The query language.

## D

**Daemon** — The background process. Owns the store,
runs adapters, serves queries.

**DAG** — Directed Acyclic Graph. The structure of nodes
within a scope.

**Delta** — Semantic difference between two nodes.

**Determinism** — Same input → same output, always,
everywhere. The core invariant.

**Diff** — Compute the delta between two nodes.

## E

**E2E Encryption** — End-to-end encryption for sync.

**Epoch** — Coarse causal checkpoint for fast replay.

## F

**fast-check** — Property testing library.

**Forest** — Multiple scopes on one machine.

## G

**Genesis Node** — The first node in a scope. 0 parents.

**gRPC** — RPC framework. Possible future IPC.

## H

**Hash** — BLAKE3 output. 32 bytes.

**HNSW** — Hierarchical Navigable Small World. Vector
index algorithm.

**Hot Store** — Recent nodes, in memory + SSD log.

## I

**Index** — Accelerator for queries. Rebuildable.

**Intent** — AI-parsed natural language → CQL.

## J

**JSON-RPC** — Remote procedure call protocol. Initial IPC.

## K

**Key** — Encryption key. Stored in OS keychain.

## L

**Lamport Clock** — Total-order logical clock. Rejected
in favor of vector clocks.

**Local-first** — Data lives on user's machine. Cloud
optional.

**Logical Clock** — Vector clock. Defines causality.

## M

**Manifesto** — The document stating CHRONO's purpose.

**Merge** — Combine two branches into one node.

**Merge Engine** — Component implementing merge.

**Metadata** — Adapter-specific fields on nodes.

## N

**Natural Language Query** — Text → CQL. Optional, AI-assisted.

**Node** — An immutable, content-addressed state record.

**NON_GOALS.md** — What CHRONO refuses to build.

## O

**Op** — Atomic unit of change within a delta.

**Opaque Node** — A node whose adapter cannot replay.
Marked as such.

**Orchestrator** — AI component.

## P

**Parent** — A node this node descends from.

**Path** — JSON-pointer-like reference to state.

**PRINCIPLES.md** — The five laws of CHRONO.

**Property Test** — Test asserting invariants across
random inputs.

**Protocol** — The open spec others implement.

## Q

**Query** — A CQL expression. Read or write.

**Query Bar** — The UI for CQL.

## R

**Replay** — Reconstruct state at a node. Deterministic.

**Replay Engine** — Component implementing replay.

**Rewind** — A different product. Screen-recording.
Not CHRONO.

**Root** — A node with no parents (genesis).

## S

**Sandbox** — Isolated execution environment for adapters.

**Scope** — A namespaced slice of reality (e.g., one
VS Code workspace).

**Scope URI** — Unique identifier for a scope.

**Semantic Delta** — Delta at the meaning level, not byte.

**Shard** — A partition of a scope (future).

**Signature** — Optional cryptographic signature on a node.

**Spec** — The protocol specification. Lives in `spec/`.

**State** — The full condition of a scope at a node.

**State Graph** — The DAG of nodes within a scope.

**Store** — The persistence layer.

**Sync** — Replication across machines (Phase 4).

## T

**Tag** — Immutable named pointer to a node.

**Temporal Computing** — The paradigm CHRONO introduces.

**Three-Way Merge** — Merge using common ancestor as base.

**Time Machine** — Apple's backup tool. Not CHRONO.

**Timeline** — The user-facing view of the graph.

**Transactional** — All-or-nothing writes.

## U

**UI Scrubber** — The iconic timeline interface.

**Unix Socket** — IPC mechanism.

## V

**Vector Clock** — Map of adapter → counter. Defines
causality.

**Voxel** — Not a CHRONO term. Just checking.

## W

**Wall Time** — Real-world clock time. A hint, not truth.

**WAL** — Write-Ahead Log. Crash recovery.

**Warm Store** — Compacted older nodes.

**WASM** — WebAssembly. Future adapter sandbox.

## X

**XChaCha20-Poly1305** — AEAD cipher for at-rest
encryption.

## Y

**YAML** — Not used. All config is TOML.

## Z

**zstd** — Compression algorithm. Used for cold storage.

**ZKP** — Zero-Knowledge Proof. Research direction.

---

## The Meta-Glossary

**CHRONO** — A temporal state layer.

**Temporal State** — First-class, content-addressed,
branchable, queryable representation of every state a
system has been in.

**The Bet** — Everyone else builds agents that *do*
things. CHRONO builds the *memory layer* that makes
everything legible.

**The Goal** — CHRONO becomes to state what TCP/IP is
to packets.

**The Rule** — Computers should remember.
