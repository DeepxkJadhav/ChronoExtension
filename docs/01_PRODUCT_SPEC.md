# Product Specification

## The Problem

Software forgets. Every action you take — every keystroke,
every edit, every decision — evaporates. The tools we use
are memoryless by default:

- **Undo**: shallow (10-100 steps), linear, per-app
- **Version history**: manual, code-only, coarse
- **Backups**: coarse, non-queryable, non-branchable
- **Snapshots**: opaque, huge, non-semantic
- **Browser history**: URLs only, no state
- **OS time machine**: file-level, slow, not semantic

None of these give you **a queryable, branchable,
replayable timeline** of *everything*.

The cost:
- You can't answer "what did I change that broke this?"
- You can't try "what if I had done X differently?"
- You can't hand a bug report to someone and say "replay it"
- You can't search your own past work by meaning
- You can't merge two divergent realities

## The Product

CHRONO is a **temporal computing layer**. It observes your
system, records state as a causal graph, and lets you:

1. **Scrub** — move through time like a video editor
2. **Branch** — fork reality and try alternatives
3. **Merge** — combine two timelines deterministically
4. **Query** — ask in CQL or natural language
5. **Replay** — reconstruct any past state exactly

## The Demo (What Makes People Remember)

**Scenario:** You're debugging. Something broke 40 minutes ago.

**Without CHRONO:**
- Read logs. Guess. Reproduce. Fail. Repeat.
- 45 minutes of pain.

**With CHRONO:**
1. Press `Cmd+Shift+T` → timeline scrubber appears
2. Drag back 40 minutes → watch files, terminal, browser replay
3. Pause at the exact moment of the break
4. Right-click → "Branch here"
5. In the branch, apply a fix, test
6. Merge back to main
7. **Done in 3 minutes.**

**This demo is the entire product.** If it doesn't feel like
magic the first time, we've failed.

## Core Features (Phase 1 → Phase 4)

### Phase 1 — Foundation (Months 1-3)
- ✅ Local state graph (DAG of nodes)
- ✅ VS Code adapter (observe + replay)
- ✅ CLI: `chrono log`, `chrono checkout`, `chrono replay`
- ✅ Scrubber UI (basic)
- ✅ Deterministic replay (verified)

### Phase 2 — Cognition (Months 4-6)
- ✅ Semantic deltas (not byte diffs)
- ✅ CQL v1 (query language)
- ✅ Branch / merge engine
- ✅ Natural language → CQL compiler
- ✅ Semantic search (embeddings)

### Phase 3 — Breadth (Months 7-12)
- ✅ Filesystem adapter
- ✅ Browser adapter (tabs, DOM, network)
- ✅ Terminal adapter
- ✅ Window manager adapter (macOS first)
- ✅ Cross-scope queries

### Phase 4 — Protocol (Months 13-24)
- ✅ Open CHRONO protocol spec
- ✅ Public adapter SDK
- ✅ Community adapters
- ✅ Sync protocol (local-first, encrypted)
- ✅ Collaboration (multi-user branches)

## What CHRONO Is Not

Read `NON_GOALS.md`. Seriously. Every week.

## Target User

**Primary:** Solo developers, researchers, writers, designers
who:
- Work on complex, multi-hour projects
- Debug hard problems
- Want to "try things" without fear
- Value local-first, privacy-preserving tools

**Secondary:** Teams who need shared, queryable project state.

**Not target:** Casual users who don't hit the "lost state"
pain. They won't feel the magic.

## Success Metrics

| Metric | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|--------|---------|---------|---------|---------|
| DAU | 10 | 100 | 1,000 | 10,000 |
| Adapters | 1 | 2 | 5 | 20+ |
| Community PRs | 0 | 5 | 50 | 200+ |
| Spec implementers | 0 | 1 | 5 | 20+ |

**Never** optimize for:
- Vanity signups
- Time-in-app
- "Engagement"

Optimize for:
- Users who depend on CHRONO daily
- Adapters written by others
- The spec being adopted

## The Moat

1. **The protocol** — if others implement it, we win
2. **The adapter network** — hard to replicate
3. **The correctness** — deterministic replay is hard
4. **The brand** — "the person who made computers remember"

## Pricing (Phase 4+)

- **Free forever:** Local, unlimited recording, all core features
- **Paid ($10/mo):** Encrypted sync, cross-device, team features
- **Enterprise:** Self-hosted, SSO, audit logs

**Never charge for:**
- Number of states recorded
- Time depth
- Local features

## The Pitch (30 seconds)

> "Every computer forgets. Undo is 50 steps. Version
> history is manual. CHRONO makes every state of every
> app queryable, branchable, and replayable — like Git
> for everything. It's local-first, AI-optional, and
> state is never destroyed. I built the temporal
> computing layer."

## The Pitch (5 seconds)

> "Git for everything. Time as a first-class primitive."

## The One-Line Tattoo

> **Computers should remember.**
