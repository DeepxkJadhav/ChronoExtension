# ADR-0001: Why a Directed Acyclic Graph (DAG) Instead of a Linear Log

## Status
Accepted

## Context
When modeling the history of an interactive system, systems traditionally choose between two foundational topologies:
1. **A Linear Append-Only Log** (e.g., standard undo/redo stacks, event sourcing, Kafka topics, WAL files): Every event is appended to an index $0, 1, 2, \dots, N$.
2. **A Directed Acyclic Graph (DAG)** (e.g., Git, Merkle DAGs, CRDTs): States are nodes, and directed edges model causal ancestry, allowing forks, concurrent branches, and multi-parent joins (merges).

A linear log is simpler to implement: undoing is moving an index pointer backward; redoing is moving it forward. However, in an interactive developer workflow:
- If a user rolls back state from step 10 to step 7 and takes a new action, a linear log must either **drop** steps 8, 9, 10 forever (destructive undo), or convert "undo" into a forward event (reversion), cluttering history and making exploratory branching impossible.
- Developers routinely explore speculative paths ("What if I try this other library?"). They need to branch, evaluate, and potentially merge or preserve both paths without losing either.
- In a multi-adapter environment (e.g., terminal executing tests while VS Code is editing code), events occur concurrently across independent processes. Forcing them into a strict linear sequence introduces arbitrary ordering artifacts that misrepresent true causality.

## Decision
We choose a **Directed Acyclic Graph (DAG)** as the fundamental topology for CHRONO's state model.
- Each state node explicitly references zero (root), one (linear evolution), or multiple (merge) causal parent node IDs.
- Branching is a first-class operation: creating a new node from any historical node creates a child edge without altering or discarding any existing descendants.
- Merges are first-class nodes referencing multiple parent nodes, resolved via lowest common ancestor (LCA) algorithms.

## Consequences
### Positive
- **Zero Data Loss**: Undoing and re-typing never obliterates previous historical timelines.
- **Exploratory Branching**: Developers can fork any past computational state into a named branch, perform experiments, and switch between branches seamlessly.
- **Accurate Concurrency**: Multiple adapters can emit nodes with independent causal parents, reconciling them cleanly into a causal graph via vector clocks without false serialization.

### Trade-offs & Mitigations
- **Complexity**: Traversal and replay require graph walks (topological sort, LCA discovery) rather than array indexing.
  - *Mitigation*: We maintain linearized branch indices and coarse Epoch checkpoints to keep common replay operations $O(1)$ or $O(k)$ where $k$ is small.
- **Mental Model**: Users are accustomed to a linear scrubber playhead.
  - *Mitigation*: The user interface provides a linear scrubber view for the active branch, while displaying an expandable DAG branch visualization when branches fork.
