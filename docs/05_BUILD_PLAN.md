# Build Plan

Phase by phase. Week by week. Deliverable by deliverable.

**Rule:** Never start Phase N+1 until Phase N's exit criteria
are met. Momentum kills projects that don't say "done."

---

## Phase 0 — Setup (Week 0, 3 days)

### Deliverables
- [ ] Repo created, private
- [ ] `docs/` populated with all 13 files
- [ ] Monorepo skeleton: `packages/core`, `packages/cli`,
      `packages/daemon`, `packages/adapter-vscode`,
      `packages/ui-scrubber`, `packages/store`
- [ ] CI: lint + typecheck + test on push
- [ ] `MANIFESTO.md` printed and taped above desk

### Exit Criteria
- `bun test` passes (0 tests is fine, but wiring works)
- Repo builds on macOS + Linux + Windows

---

## Phase 1 — Foundation (Months 1-3)

**Goal:** Prove the primitive works. Ship the killer demo.

### Month 1 — The Graph

**Week 1-2: State model**
- [ ] `packages/core`: Node, Delta, Op types
- [ ] Canonical CBOR serialization
- [ ] BLAKE3 hashing
- [ ] Test: roundtrip node → bytes → node
- [ ] Test: hash stability across runs

**Week 3: Vector clocks**
- [ ] Implement `tick`, `merge`, `compare`
- [ ] Property tests (commutativity, antisymmetry)
- [ ] Causality detection tests

**Week 4: In-memory graph**
- [ ] Node insertion
- [ ] Parent traversal
- [ ] Common ancestor detection
- [ ] Topological ordering

**Exit:** Can build a DAG in memory, hash nodes, compare causality.

### Month 2 — Storage + CLI

**Week 5-6: SQLite store**
- [ ] Node append log
- [ ] Indexes: causality, wall_time
- [ ] WAL for crash recovery
- [ ] Test: kill -9 mid-write, recover

**Week 7: CLI skeleton**
- [ ] `chrono init`
- [ ] `chrono log` (list nodes)
- [ ] `chrono show <hash>`
- [ ] `chrono checkout <hash>` (no-op for now)

**Week 8: Branch/tag basics**
- [ ] `chrono branch <name>` (create ref)
- [ ] `chrono tag <name>`
- [ ] `chrono branches` (list)

**Exit:** Can create a real DAG on disk, inspect it, branch it.

### Month 3 — The Demo

**Week 9-10: VS Code adapter (MVP)**
- [ ] Observe: on file save, emit a node
- [ ] Replay: given node, restore file contents
- [ ] Delta: diff two nodes
- [ ] Test: 100 sequential saves → 100 nodes

**Week 11: Scrubber UI (v1)**
- [ ] Solid.js app in `packages/ui-scrubber`
- [ ] Timeline canvas (nodes as points)
- [ ] Playhead (drag to scrub)
- [ ] Preview panel: shows state at playhead
- [ ] Connect to daemon via JSON-RPC

**Week 12: The demo**
- [ ] Record 3-minute screencast
- [ ] Scrub back, branch, replay, merge
- [ ] Publish to Twitter/X, Hacker News
- [ ] Collect feedback, iterate

**Phase 1 Exit Criteria:**
- ✅ Deterministic replay verified (1000 fuzz cases)
- ✅ Demo recorded and shared
- ✅ 10 early users giving feedback
- ✅ Zero data loss in 30-day stress test
- ✅ `MANIFESTO.md` unchanged (still true)

---

## Phase 2 — Cognition (Months 4-6)

**Goal:** Semantic layer. CQL. Merge. AI as index.

### Month 4 — Semantic Deltas + CQL

**Week 13-14: Semantic deltas**
- [ ] Delta compression (dedupe identical ops)
- [ ] Path-based indexing
- [ ] Chunker for large states

**Week 15-16: CQL v1**
- [ ] Lexer, parser, AST (from `spec/CQL.md`)
- [ ] Evaluator (SELECT, DIFF, FIND)
- [ ] `chrono query "..."` CLI
- [ ] `EXPLAIN` output

**Exit:** Can query the graph with real CQL.

### Month 5 — Branch + Merge

**Week 17-18: Branch engine**
- [ ] Full branch lifecycle
- [ ] Checkout semantics
- [ ] Branch metadata (intent, policy)

**Week 19-20: Merge engine**
- [ ] Three-way merge
- [ ] Conflict classification (all 8 kinds)
- [ ] Auto-merge for resolvable
- [ ] Conflict nodes for unresolvable
- [ ] Test suite: commutativity, idempotence, no-data-loss

**Exit:** Can merge two branches deterministically.

### Month 6 — AI as Index

**Week 21-22: Embeddings**
- [ ] Local embedding model (nomic)
- [ ] HNSW index
- [ ] Background indexing job
- [ ] `SIMILAR TO` in CQL

**Week 23-24: NL → CQL**
- [ ] Contract: `intent-parse`
- [ ] Validation (must parse)
- [ ] Fallback: regex router
- [ ] CLI: `chrono ask "..."`

**Phase 2 Exit Criteria:**
- ✅ CQL spec frozen (v1.0)
- ✅ Merge passes full test suite
- ✅ Semantic search works locally
- ✅ NL queries work for top 20 shapes
- ✅ 100 DAU

---

## Phase 3 — Breadth (Months 7-12)

**Goal:** More adapters. Real users. Cross-scope.

### Month 7-8 — Filesystem + Terminal
- [ ] FS adapter (inotify/FSEvents/ReadDirectoryChangesW)
- [ ] Terminal adapter (shell history, cwd, env)
- [ ] Cross-scope queries

### Month 9-10 — Browser + Window Manager
- [ ] Browser adapter (tab state, DOM snapshot, network)
- [ ] macOS window manager adapter
- [ ] Query across apps: "what was I looking at when I
      edited auth.ts?"

### Month 11-12 — Polish + Growth
- [ ] UI polish (branch view, diff view)
- [ ] Performance (replay <50ms for near nodes)
- [ ] Docs site (Astro Starlight)
- [ ] First external contributor
- [ ] First external adapter (community)

**Phase 3 Exit Criteria:**
- ✅ 5+ adapters
- ✅ 1,000 DAU
- ✅ 10+ community PRs
- ✅ 1 external adapter
- ✅ Docs site live

---

## Phase 4 — Protocol (Months 13-24)

**Goal:** CHRONO becomes a standard, not a product.

### Month 13-15 — Spec v1.0
- [ ] `spec/PROTOCOL.md` complete
- [ ] `spec/ADAPTER_CONTRACT.md` complete
- [ ] Reference implementations in TS + Rust
- [ ] Conformance test suite

### Month 16-18 — Sync
- [ ] Local-first sync protocol
- [ ] E2E encryption (age or libsodium)
- [ ] P2P via libp2p (or simpler: S3-compatible)
- [ ] Multi-device branch merge

### Month 19-21 — Collaboration
- [ ] Shared scopes
- [ ] Cross-user branches
- [ ] CRDT-based merge for text-heavy state
- [ ] Team features (permissions, audit)

### Month 22-24 — Ecosystem
- [ ] Public adapter SDK published
- [ ] Adapter marketplace (curated)
- [ ] Second implementation (Rust)
- [ ] Conference talk, paper

**Phase 4 Exit Criteria:**
- ✅ Spec v1.0 published
- ✅ 20+ adapters
- ✅ 10,000 DAU
- ✅ 1 external implementation
- ✅ 5+ contributors to spec

---

## Beyond Phase 4 (Years 3-10)

The long arc:

1. **OS-level integration** — CHRONO as a system service
2. **Hardware acceleration** — dedicated state recording
3. **Enterprise** — self-hosted, compliance (SOC2, HIPAA)
4. **Research** — ZKP for private state, formal verification
5. **Standardization** — W3C/IETF RFC for temporal state

The endpoint: **CHRONO is to state what TCP/IP is to packets.**

---

## Weekly Cadence (Every Week)

- **Monday:** Review roadmap, pick one deliverable
- **Tuesday-Thursday:** Build, test, iterate
- **Friday:** Demo (to self or others), write 200-word log
- **Weekend:** Rest. Or explore, not execute.

## Monthly Cadence

- **First Monday:** Review exit criteria for phase
- **Last Friday:** Ship something visible (demo, blog, release)

## Anti-Patterns (Do Not)

- Start Phase N+1 before Phase N ships
- Add features not in the plan
- Chase every user request
- Optimize before measuring
- Skip tests because "just prototyping"
- Break `NON_GOALS.md`

## The Rule

> Ship small, ship often, ship **only** what moves you
> toward the phase exit criteria. Everything else is a
> distraction wearing a mask.
