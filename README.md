# CHRONO

> **Git for living computational state.**  
> A continuous, rewindable, branchable Directed Acyclic Graph (DAG) for developer environments.  
> Never lose context, never fear refactoring, and query the exact moment any state occurred.

---

## What is CHRONO?

Computers treat state destructively: every save erases the past, every undo stack drops history upon branching, and context is lost across process boundaries.

**CHRONO** makes computation non-destructive. It connects to your editor (VS Code), terminal, and filesystem through lightweight adapters, capturing state transitions as immutable, content-addressed semantic deltas in a causal DAG. You can scrub time, fork speculative explorations, run 3-way semantic merges, and query your timeline using Chrono Query Language (CQL).

```
[VS Code / PTY / FS Adapters]  --->  [Local Daemon (chronod)]  --->  [Immutable Causal DAG]
                                                                            |
                                  [Visual Scrubber UI & CQL Engine] <-------+
```

---

## Core Pillars & Protocol Blueprint

Before writing arbitrary code, CHRONO is defined by formal specifications:

- **[MANIFESTO.md](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/MANIFESTO.md)**: The foundational pitch and philosophy.
- **[PRINCIPLES.md](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/PRINCIPLES.md)**: The 7 inviolable laws of CHRONO (e.g., *State Is Never Destroyed*).
- **[GLOSSARY.md](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/GLOSSARY.md)**: Standard terminology (Node, Delta, Epoch, Replay, Adapter, Clock).
- **[NON_GOALS.md](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/NON_GOALS.md)**: Explicit scope boundaries (What CHRONO will never be).
- **[ROADMAP.md](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/ROADMAP.md)**: Phase 1 through 4 execution plan.

### Architecture Specifications
- **[spec/STATE_MODEL.md](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/spec/STATE_MODEL.md)**: Mathematical definition of state nodes, deltas, and vector clocks.
- **[spec/PROTOCOL.md](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/spec/PROTOCOL.md)**: The open JSON-RPC standard for adapter-daemon communication.
- **[spec/MERGE_SEMANTICS.md](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/spec/MERGE_SEMANTICS.md)**: 3-way semantic operational transform and conflict resolution.
- **[spec/ADAPTER_CONTRACT.md](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/spec/ADAPTER_CONTRACT.md)**: The 4-tier capability matrix for application bridges.
- **[spec/CQL.md](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/spec/CQL.md)**: Formal EBNF grammar for Chrono Query Language.
- **[store/format/on-disk.md](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/store/format/on-disk.md)**: Content-addressed BLAKE3 storage, WAL, and SQLite metadata format.

### Architecture Decisions (ADRs)
- **[0001: Why a DAG, Not a Log](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/DECISIONS/0001-why-a-dag-not-a-log.md)**
- **[0002: Semantic Deltas vs Byte Diffs](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/DECISIONS/0002-semantic-deltas-vs-byte-diffs.md)**
- **[0003: Local-First Storage Architecture](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/DECISIONS/0003-local-first-storage.md)**
- **[0004: Why a Dedicated Query Language (CQL)](file:///c:/Users/deepa/Documents/antigravity/calm-fermi/DECISIONS/0004-why-a-query-language.md)**

---

## The 8 Must-Decide Files Before Coding

| # | File | Status | Description |
|---|---|---|---|
| 1 | `MANIFESTO.md` | ✅ Complete | Why CHRONO exists in one concise thesis. |
| 2 | `NON_GOALS.md` | ✅ Complete | What we refuse to build. |
| 3 | `spec/STATE_MODEL.md` | ✅ Complete | Formal mathematical definition of State Nodes and Deltas. |
| 4 | `spec/MERGE_SEMANTICS.md` | ✅ Complete | Operational transformations and 3-way branch reconciliation. |
| 5 | `core/clock/logical.ts` | ✅ Complete | Vector clocks and causality partial ordering engine. |
| 6 | `store/format/on-disk.md` | ✅ Complete | Forever-commitment file format and schema. |
| 7 | `adapters/sdk/capability.ts` | ✅ Complete | 4-tier capability matrix and graceful degradation. |
| 8 | `ai/contracts/*.md` | ✅ Complete | Versioned contracts for summarization, diff, and intent. |

---

## License
Apache-2.0
