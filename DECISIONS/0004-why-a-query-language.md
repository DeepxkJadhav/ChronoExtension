# ADR-0004: Why a Dedicated Chrono Query Language (CQL)

## Status
Accepted

## Context
A state graph accumulating millions of nodes across days and weeks is useless if developers cannot locate specific moments in time. Users need to ask questions such as:
- *"Find when `handleLogin` was first introduced on branch `feature/auth`."*
- *"Show all states where test execution failed after editing `src/middleware.ts`."*
- *"Replay the exact buffer state right before the unhandled exception occurred."*

We evaluated three potential query paradigms:
1. **Ad-hoc CLI flags**: e.g., `chrono log --file src/app.ts --after "yesterday" --type EDIT`. While simple, flag-based queries break down under complex relational conditions (joins across adapters, temporal bounds, parent-child path expressions).
2. **Direct SQL access**: Exposing the underlying SQLite database directly to users. While powerful, raw SQL exposes physical table schemas, requires verbose joins across recursive parent-edge tables, and leaks low-level storage details into user scripts.
3. **Pure Natural Language via LLMs**: Asking users to type prompts into an LLM chatbot. While intuitive, LLMs are non-deterministic, prone to hallucinating timestamps or non-existent nodes, incapable of exact cryptographic verification, and require network or heavy compute.

## Decision
We define and implement **Chrono Query Language (CQL)**: a lightweight, typed, deterministic domain-specific query language tailored specifically for temporal graph traversal.
- CQL features first-class temporal and graph primitives (`branch()`, `epoch()`, `delta()`, `ancestor_of()`, `since()`, `between()`).
- CQL compiles into an abstract syntax tree (AST) and executes against the DAG indices with guaranteed deterministic performance.
- Natural language interfaces are supported, but only as a compiler frontend that emits valid CQL expressions rather than directly manipulating graph state.

## Consequences
### Positive
- **Composability**: Developers can write scripts, CI hooks, and editor shortcuts that invoke verifiable CQL queries.
- **Speed & Optimization**: The CQL evaluator can optimize temporal graph walks using index-assisted pruning and epoch skips.
- **Safety**: Queries are read-only and strictly isolated from write paths, preventing accidental state corruption.

### Trade-offs & Mitigations
- **Learning Curve**: Developers must learn basic CQL syntax.
  - *Mitigation*: We design CQL to closely mirror familiar SQL/GraphQL constructs, and provide an interactive query builder and AI-driven natural-language-to-CQL compiler.
