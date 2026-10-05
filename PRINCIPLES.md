# CHRONO PRINCIPLES

These are the 7 inviolable laws of the CHRONO architecture. Every line of code, pull request, adapter, and query engine optimization must satisfy these rules without compromise. If a proposed feature violates any principle here, the feature is rejected.

---

### Rule 1: State Is Never Destroyed
State mutations in CHRONO are strictly append-only. Writing new state does not overwrite previous state; it emits an immutable state node or delta into a Directed Acyclic Graph (DAG). 
- History cannot be rewritten in place. 
- "Undo" is simply checking out a predecessor node or creating an inverse delta commit.
- Pruning and garbage collection may only pack or archive cold nodes to external tiers, never erase nodes that form the causal lineage of an active branch or marked pin.

### Rule 2: Causality Trumps Wall-Clock Time
Wall-clock time is physically unreliable: NTP syncs jump backward, timezone transitions skew offsets, and concurrent threads interleave without respect to milliseconds.
- Causality is governed exclusively by logical clocks (Lamport timestamps and Vector Clocks).
- A node $B$ is strictly after node $A$ if and only if $A \prec B$ in the causal DAG ancestry.
- Wall-clock timestamps are treated strictly as secondary metadata for human display and time-range query filters, never for concurrency control or DAG resolution.

### Rule 3: Deltas Must Carry Semantic Intent
Byte-level diffs and chunk deduplication (e.g., rsync or Myers diff on raw text) are transport details, not temporal state primitives.
- A CHRONO delta must represent the semantic domain mutation (e.g., `AST_RENAME_SYMBOL`, `BUFFER_INSERT_RANGE`, `ENV_SET_VARIABLE`).
- If an adapter cannot provide semantic granularity, it must emit a snapshot boundary rather than a deceptive byte-diff.
- Storing semantic intent enables algebraic 3-way merges and intelligent conflict resolution that raw text diffs fail to achieve.

### Rule 4: Determinism Is Non-Negotiable
Given a root snapshot $S_0$ and an ordered lineage of deltas $\Delta_1, \Delta_2, \dots, \Delta_n$, applying them sequentially:
$$S_n = \text{Fold}(S_0, [\Delta_1, \dots, \Delta_n])$$
must produce the exact bit-for-bit identical state $S_n$, on any machine, architecture, or runtime, at any point in the future.
- Non-deterministic inputs (network randoms, system clock readings, external process signals) must be captured at ingress as delta parameters.
- Replay engines must never invoke live external side effects during historical reconstruction.

### Rule 5: Adapters Degrade Gracefully
Not every host application (VS Code, terminal, Figma, browser, database client) exposes granular ASTs or continuous undo buffers.
- The CHRONO Adapter SDK enforces a tiered capability contract: Level 0 (Periodic Full Snapshot), Level 1 (Coarse Event Snapshot), Level 2 (Semantic Delta Stream), Level 3 (Bidirectional Active Replay).
- The CHRONO engine must function correctly regardless of the adapter's tier. A system missing fine deltas simply receives coarser scrub points; it never crashes or halts the causal graph.

### Rule 6: CQL Is the Truth; AI and Natural Language Are Frontend Views
Chrono Query Language (CQL) is a typed, deterministic graph query language with formal operational semantics.
- Natural language parsing ("Show me when the CSS grid broke yesterday") must compile directly to a concrete, verifiable CQL AST.
- AI models are auxiliary accelerators for indexing, vector search, and query compilation. 
- The CHRONO core state graph, replay verification, and merge engine must work with 100% functionality when all AI/LLM components are disabled or offline.

### Rule 7: Local Sovereignty and Zero Secret Leakage
Temporal capture records everything, which means it will inevitably capture API keys, tokens, session cookies, and private credentials unless actively safeguarded.
- CHRONO is local-first by default: all nodes, deltas, and WAL logs reside in user-controlled storage on disk.
- Adapters and serialization pipelines must execute credential-redaction sanitizers *before* hashing and committing state nodes to the graph.
- State nodes are content-addressed cryptographically (BLAKE3 / SHA-256). Once written, sensitive data cannot be quietly overwritten; therefore, zero leakage at the boundary is a hard precondition.
