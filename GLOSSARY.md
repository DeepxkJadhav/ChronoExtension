# CHRONO GLOSSARY

This glossary establishes the canonical taxonomy for CHRONO. Use these terms precisely across documentation, protocol definitions, APIs, and variable names.

---

### Core Concepts

#### State Node (`Node`)
The fundamental immutable vertex in the CHRONO DAG. A state node represents a discrete point in computational history. Every node is content-addressed by its cryptographic hash ($H = \text{BLAKE3}(\text{payload})$) and contains references to zero, one, or more parent node IDs, a logical vector clock, and either a complete state payload (Snapshot Node) or a semantic delta (Delta Node).

#### Delta (`Delta`)
A structured, semantic description of the transition from one state node to its child. Unlike raw text diffs (Myers diff) or binary diffs (bsdiff), a semantic delta encapsulates domain intent (e.g., `BufferSplice`, `FileCreated`, `TerminalCommandDispatched`, `WindowFocusShifted`). Every delta must define an `apply(state) -> state` transformation, and reversible deltas define an `invert() -> Delta` transformation.

#### Directed Acyclic Graph (`DAG`)
The global state tree of CHRONO. Vertices are State Nodes; directed edges point backwards from children to their causal parents. Unlike a linear Git commit log or append-only event log, the CHRONO DAG accommodates non-linear branching, parallel adapter timelines, and merge nodes with multiple parents.

#### Branch (`Branch`)
A mutable named reference pointing to a specific head node in the DAG (analogous to a Git branch). Branches allow speculative exploration (e.g., `feature/auth-refactor`, `debug/session-42`, `main`).

#### Playhead (`Playhead`)
The active inspection cursor within a branch or timeline. The playhead represents the specific node currently being rendered, replayed, or scrubbed in the user interface or host adapter. The playhead can detachedly scrub backwards through historical nodes without altering the branch's tip.

#### Epoch (`Epoch`)
A coarse-grained temporal checkpoint in the DAG containing a consolidated full snapshot and an indexing manifest. Epochs bound delta-fold chains: rather than replaying 100,000 fine-grained deltas from the dawn of time, the replayer jumps directly to the nearest preceding Epoch boundary and folds only subsequent deltas to achieve sub-millisecond scrub latency.

#### Replay (`Replay`)
The deterministic re-creation of application state at an arbitrary node $N$. Replay is performed by locating the nearest causal ancestor Epoch (or Root Snapshot) and folding deltas along the shortest causal path to $N$:
$$S_N = \text{Fold}(S_{\text{Epoch}}, [\Delta_1, \Delta_2, \dots, \Delta_k])$$

#### Determinism (`Determinism`)
The mathematical property that replaying node $N$ under identical initial conditions will always produce the exact same byte-for-byte state, regardless of hardware, operating system, or execution timing.

#### Adapter (`Adapter`)
A lightweight plugin or bridge residing within or alongside a host environment (e.g., VS Code extension, zsh shell hook, Chrome DevTools extension, Docker state monitor). Adapters capture host events, translate them into CHRONO deltas/snapshots, and listen for restore/checkout commands to rehydrate the host application.

#### Capability (`Capability`)
A formal manifest declared by an adapter defining what dimensions of state it can capture, snapshot, restore, and diff. Capabilities determine whether an adapter supports full state rehydration (Level 3) or read-only event observation (Level 1).

#### Logical Clock (`Clock`)
A causal ordering mechanism (Lamport timestamp or Vector Clock) assigned to every node. Because physical wall clocks drift and skew, logical clocks guarantee that if event $A$ caused event $B$, then $\text{Clock}(A) < \text{Clock}(B)$.

#### Chrono Query Language (`CQL`)
The domain-specific query language designed to traverse, filter, and extract temporal slices from the DAG. (e.g., `SELECT state FROM branch('main') WHERE delta.type == 'ERROR' SINCE epoch('v1.0')`).

#### Write-Ahead Log (`WAL`)
The durability journal where state nodes and incoming adapter events are sequentially appended and flushed to disk (`fsync`) prior to DAG insertion and indexing, guaranteeing zero state loss even during unexpected kernel crashes or power failures.

#### Content Address (`CID`)
The cryptographic identifier of a node, computed by hashing its canonical canonicalized JSON or binary encoding. If two states are identical, they yield identical CIDs, providing automatic state deduplication across branches and sessions.
