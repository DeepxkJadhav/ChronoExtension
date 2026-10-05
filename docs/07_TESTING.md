# Testing Strategy

Correctness is the moat. Test like it.

## The Five Layers

1. **Unit tests** — functions, types, small modules
2. **Property tests** — invariants across random inputs
3. **Integration tests** — real daemon, real store
4. **Determinism tests** — replay produces identical state
5. **Adversarial tests** — corruption, kill -9, malformed input

## Layer 1 — Unit Tests

**Framework:** Bun test

**What:**
- Pure functions (compare, hash, canonicalize)
- Small classes (Node builder, Delta builder)
- Parsers (CQL lexer/parser)

**Coverage target:** 90%+ for `packages/core`

**Rule:** No unit test asserts on timing or ordering
unless it's a causality test.

## Layer 2 — Property Tests

**Framework:** fast-check

**Critical properties:**

### Vector Clocks
- `tick(clock, a) > clock` for all `a`
- `merge(a, b) === merge(b, a)` (commutativity)
- `merge(a, merge(b, c)) === merge(merge(a, b), c)` (associativity)
- `compare(a, b) === reverse(compare(b, a))`
- Concurrent clocks always have distinct hashes

### DAG
- Inserting N nodes yields a DAG
- No cycles possible (by construction)
- Common ancestor always exists for any two nodes

### Delta
- `apply(from, delta) === to` for every delta
- `diff(a, b) === inverse(diff(b, a))` (for reversible ops)

### Merge
- `merge(c, a, b) === merge(c, b, a)` (commutativity, auto only)
- `merge(c, a, a) === a` (idempotence)
- `merge(c, c, a) === a` (fast-forward)
- No op present in a or b is dropped (no-data-loss)

### CQL
- Every parseable query has an EXPLAIN
- Every query terminates
- Read queries never mutate state

### Replay
- `replay(node)` twice → identical state hash
- `replay(node)` on machine A === machine B
- `replay(node)` after 1 year still works (test via mock clock)

## Layer 3 — Integration Tests

**Framework:** Bun test + spawn real daemon

**Scenarios:**
- Start daemon, observe, kill, restart, verify
- Write 1000 nodes, query, verify count
- Branch, merge, verify
- Corruption: delete random byte, verify recovery

**Fixtures:**
- `tests/fixtures/graphs/` — hand-crafted DAGs
- `tests/fixtures/states/` — known states

## Layer 4 — Determinism Tests

**The most important tests.**

### Fuzzer
Generate random:
- Adapter sequences
- Deltas
- Branch operations
- Merge operations

For each:
1. Run 100 times
2. Assert identical node hashes every time
3. Assert identical final state hash

### Cross-Machine
- Run same sequence on macOS, Linux, Windows (CI)
- Assert identical hashes

### Cross-Version
- Run sequence on v1.0
- Run on v1.1
- Assert identical hashes

**If any determinism test fails, the build is red.**

## Layer 5 — Adversarial Tests

### Corruption
- Flip bit in hot log → verify recovery
- Truncate segment → verify graceful
- Delete index → verify rebuild
- Corrupt ref → verify WAL recovery

### Kill -9
- Kill daemon mid-write → restart → verify integrity

### Malformed Input
- Send garbage CQL → verify error, not crash
- Send invalid CBOR → verify rejection
- Send node with bad hash → verify rejection

### Fuzz
- `cargo-fuzz` for Rust components
- `jazzer` for JS components

### Adversarial AI
- Prompt injection in state → verify ignored
- Malicious embedding → verify isolation

## The Golden Test Suite

Every CHRONO implementation must pass:

    tests/golden/
      ├── graph-001-simple-linear/
      ├── graph-002-branch/
      ├── graph-003-merge/
      ├── graph-004-concurrent-edit/
      ├── graph-005-merge-conflict/
      ├── graph-006-large-100k-nodes/
      ├── determinism-001-replay/
      ├── determinism-002-cross-machine/
      └── ...

Each test:
- Input: operations (observe, branch, merge, query)
- Output: expected nodes, expected query results, expected state hashes

Golden tests are **frozen**. If they change, that's a
breaking change requiring a version bump.

## Benchmarks

**Framework:** tinybench

**Benchmarks:**
- `observe()` latency
- `append()` latency
- `replay(near)` latency
- `replay(far)` latency
- `query(simple)` latency
- `query(semantic)` latency
- `merge(auto)` latency

**Regression threshold:** >20% slowdown = red build.

## Coverage

- `packages/core`: 90%
- `packages/store`: 85%
- `packages/daemon`: 80%
- Adapters: 70% (adapter-specific)
- UI: 60% (visual testing separately)

**Not:** 100% coverage. Some code is not worth testing.

## Visual Tests

- Scrubber: snapshot tests (Playwright)
- Timeline rendering: golden screenshots

## Manual Tests (Weekly)

- Record 1h of real work
- Scrub back through it
- Verify state matches memory

## CI Pipeline

On every push:
1. Lint
2. Typecheck
3. Unit tests
4. Property tests (1000 cases)
5. Integration tests
6. Determinism tests
7. Benchmarks (vs baseline)

On release:
- All above + cross-platform matrix
- Adversarial tests
- Fuzz (1h)

## The Red Line

**Never merge a PR that:**
- Breaks a golden test
- Reduces determinism
- Introduces a data-loss path
- Fails a property test
- Slows benchmarks >20%

**Never ship a release that:**
- Fails any adversarial test
- Has unresolved conflict in `spec/`
- Changes `MANIFESTO.md` without an ADR

## Testing Philosophy

> Tests are not a tax. They are the reason someone will
> trust CHRONO with their entire computing life.
>
> A bug in a note-taking app loses a note.
> A bug in CHRONO loses a decade.
>
> Test accordingly.

## The 100% Rule

100% of:
- Data loss scenarios must have a test
- Determinism guarantees must have a test
- Merge semantics must have a test
- Causality invariants must have a test

Everything else: judgment.
