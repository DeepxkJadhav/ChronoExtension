# ADR-0002: Semantic Deltas vs Byte-Level Diffs

## Status
Accepted

## Context
When persisting fine-grained state transitions, two primary approaches exist:
1. **Byte-Level Diffs**: Text/binary diff algorithms (Myers diff, Patience diff, bsdiff, VCDIFF). State changes are treated as arbitrary insertions and deletions of byte sequences within an opaque stream.
2. **Semantic Deltas**: Strongly typed, domain-specific mutation payloads (e.g., `BufferSplice { range: [10, 15], text: "count" }`, `AST_RENAME { from: "foo", to: "bar" }`, `ENV_VAR_SET { key: "PORT", value: "8080" }`).

Byte-level diffs are easy to implement because they treat all data as dumb bytes. However:
- A single high-level user action (e.g., refactoring a method name across 20 files, or formatting a document with Prettier) generates thousands of byte diff hunks, completely obscuring the original developer intent.
- Three-way merges using line/byte diffs are notoriously brittle: whitespace changes, moved blocks, and independent variable renames cause spurious conflicts.
- Querying and indexing raw byte hunks is computationally expensive and semantically poor. You cannot ask: *"Show me when variable `apiKey` was mutated"* without full-text regex scanning across unstructured diff text.

## Decision
We choose **Semantic Deltas** as the primary state representation in CHRONO.
- Adapters report mutations using structured domain schemas defined in the Adapter SDK.
- Each delta carries an explicit type identifier, target path/entity, payload attributes, and invertible semantics where applicable.
- Byte-level diffs are relegated solely to Level 0 fallback adapters (for black-box applications that can only provide raw text or files) and to physical compression layers on disk (e.g., zstd block compression).

## Consequences
### Positive
- **Intelligent Merging**: Two independent branches that make orthogonal semantic changes (e.g., adding imports vs editing a function body) can merge cleanly without line-adjacency conflict.
- **Expressive Querying**: Chrono Query Language (CQL) can filter, index, and join directly on delta types and attributes (e.g., `delta.type == 'SYMBOL_RENAME'`).
- **Compact Footprint**: Semantic operations are drastically smaller than raw diff hunks (e.g., renaming a variable is a single 40-byte delta rather than dozens of modified file hunks).

### Trade-offs & Mitigations
- **Adapter Complexity**: Adapters must inspect host application events and translate them into typed deltas rather than doing a crude text diff of files on disk.
  - *Mitigation*: The Adapter SDK provides pre-built helper modules (e.g., splice accumulators, AST diff helpers) and supports fallback to snapshot/byte diffing when semantic extraction is impossible.
