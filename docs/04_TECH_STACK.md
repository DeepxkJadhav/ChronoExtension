# Tech Stack

Exact technologies. Why chosen. What to reject.

## Language: TypeScript (Primary)

**Why:**
- One language for core, CLI, UI, adapters
- Massive ecosystem for editor/tooling integrations
- Strong types for a data-heavy system
- Bun/Deno/Node all viable
- Easy to hire/contribute

**Runtime:** Bun (primary), Node 20+ (fallback)

**Why Bun:**
- Fast startup (daemon matters)
- Built-in SQLite, WebSocket, test runner
- Single binary possible (Phase 4)
- Ships fast

**Fallback plan:** If Bun breaks, code is Node-compatible.

## Language: Rust (Selective)

**Why:**
- Store engine (performance-critical)
- BLAKE3 hashing (crate exists)
- Compression (zstd, lz4)
- HNSW index (usearch/instant-distance)
- Future: WASM adapter sandbox

**Approach:** Rust compiled to a native addon via `napi-rs`,
called from TypeScript. Not a full rewrite.

**Rule:** Rust only where profiling justifies it.

## Storage: SQLite + Custom Binary

**SQLite for:**
- Indexes (causality, wall_time, path, adapter)
- Metadata (scopes, branches, tags, conflicts)
- WAL (leverage SQLite's)

**Custom binary for:**
- Hot node log (append-only, fast)
- Warm segments (compacted)
- Cold archives (zstd compressed)

**Why not pure SQLite for nodes?**
- BLOB-heavy workloads are slow
- Compaction is harder
- We want file-level streams for cold sync

**Why not RocksDB/LMDB?**
- Complexity
- Cross-platform pain
- SQLite is universal

## Serialization: Canonical CBOR

**Why CBOR:**
- Binary, compact
- Deterministic canonical form defined
- Available in every language
- Extensible (tags)

**Why not protobuf:**
- Canonical form is harder
- Schema evolution is stronger than we need
- CBOR is more flexible

**Why not JSON:**
- Too slow, too large
- Canonical form is painful

**Why not MessagePack:**
- CBOR has better spec coverage

## Hashing: BLAKE3

**Why:**
- Fastest secure hash
- Tree-structured (parallelizable)
- 32-byte output (same as SHA-256)
- Great Rust + JS support

**Why not SHA-256:**
- Slower
- No parallelism

**Why not xxHash:**
- Not cryptographic; need tamper evidence

## Compression: zstd

**Why:**
- Best ratio/speed tradeoff
- Dictionary support (great for state)
- Rust + JS bindings
- Streaming

**Levels:**
- Hot: none
- Warm: zstd-3
- Cold: zstd-19

## Embeddings (Semantic Index)

**Default model:** `nomic-embed-text-v1.5` (local, 768d)

**Why:**
- Runs locally (privacy)
- Good quality
- Small (~500MB)

**Fallback:** OpenAI `text-embedding-3-small` (opt-in)

**Index:** HNSW via `usearch` (Rust, fast).

**Rebuildable:** If index corrupts, rebuild from nodes.

## AI Providers (Optional)

Support multiple:
- OpenAI (GPT-4o, etc.)
- Anthropic (Claude)
- Local: Ollama, llama.cpp
- Any OpenAI-compatible API

**Contract:** See `ai/contracts/`. Providers implement
contracts. Swap via config.

**Rule:** No feature requires AI. AI accelerates.

## CLI Framework

**Choice:** `commander` (Node) or `cac` (Bun-friendly)

**Why:**
- Battle-tested
- Simple
- Good help output

**Not:** `yargs` (too heavy), `oclif` (over-engineered).

## Daemon Communication: gRPC

**Why:**
- Typed contracts (protobuf)
- Streaming
- Multi-language clients
- Mature

**Alternative:** Unix socket + JSON-RPC (simpler, less typed).

**Decision:** Start with JSON-RPC over Unix socket. Migrate
to gRPC if cross-language clients needed.

## UI Framework

**Choice:** Solid.js or SvelteKit

**Why:**
- Reactive, small, fast
- No virtual DOM overhead
- Good for timeline scrubbing (many DOM updates)

**Not React:** Too heavy for the scrubber use case.

**Not Vue:** Less active ecosystem for this domain.

**Rendering:** Canvas for timeline (thousands of nodes),
DOM for panels.

## Editor Integrations

- **VS Code:** Extension API (TypeScript)
- **Neovim:** Lua plugin calling CLI/daemon
- **JetBrains:** Plugin (Phase 3+)
- **Zed:** Extension (Phase 4+)

**First adapter:** VS Code. Largest audience, best API.

## Testing

- **Unit:** Bun test (fast)
- **Property:** fast-check
- **Integration:** Testcontainers (spawn real daemon)
- **Determinism:** Custom fuzzer
- **Benchmarks:** tinybench

**Rule:** Every PR adds or modifies tests. Non-negotiable.

## Linting / Formatting

- **Lint:** Biome (fast, Rust-based)
- **Format:** Biome
- **Types:** `tsc --strict` (or `tsgo` for speed)

**Not ESLint:** Too slow, too config-heavy.

## Build / Package

- **Monorepo:** Bun workspaces or pnpm
- **Build:** Bun build for JS, cargo for Rust
- **Package:** npm for JS, single binary for CLI (Phase 4)

## CI/CD

- **CI:** GitHub Actions
- **Cross-platform:** macOS (primary), Linux, Windows
- **Artefacts:** Signed binaries (Phase 4)

## Docs

- **Format:** Markdown (you're reading it)
- **Site:** Astro Starlight (Phase 3)
- **Spec:** `spec/` folder, versioned

## Analytics / Telemetry

**None by default.** If added (opt-in):
- Anonymous, aggregate
- Local-first
- Never state contents

## What to Reject

| Tempting | Why Reject |
|----------|-----------|
| Electron | Heavy; use Tauri if needed |
| PostgreSQL | Overkill; local-first |
| Redis | Local process; SQLite suffices |
| GraphQL | Overkill; typed RPC is better |
| Kubernetes | Not a server product |
| Vector DB as service | Local HNSW is enough |
| LangChain | Bloated; write contracts directly |
| CrewAI | Not an agent product |
| Next.js | Not a web app; it's a system |

## The Stack in One Line

> TypeScript + Bun + SQLite + canonical CBOR + BLAKE3 +
> Rust for hot paths + optional local embeddings + optional
> cloud AI + Unix-socket daemon + Solid.js scrubber.

## Dependency Policy

- Prefer stdlib / platform
- Prefer single-purpose libs
- Pin exact versions in production
- Audit every dependency quarterly
- Zero-dependency core where possible

## Long-Term Bets

- **WASM** for adapter sandboxing (Phase 4)
- **CRDT** for cross-user merge (Phase 4)
- **QUIC** for P2P sync (Phase 5+)
- **ZKP** for private state proofs (research)
