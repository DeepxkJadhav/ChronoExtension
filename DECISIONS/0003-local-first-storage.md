# ADR-0003: Local-First Storage Architecture

## Status
Accepted

## Context
High-frequency temporal state capture introduces critical constraints:
1. **Latency**: Developer actions (keystrokes, terminal keystroke echoes, file saves) occur at sub-millisecond intervals. Ingress serialization cannot incur network roundtrips.
2. **Bandwidth & Cost**: Continuous state streams generate substantial daily activity. Streaming every keystroke, AST shift, and buffer splice to a cloud backend incurs unsustainable network and compute costs.
3. **Security & Privacy**: Codebases contain proprietary business logic, intellectual property, internal tokens, and sensitive data. Sending continuous raw execution state to a multi-tenant cloud service introduces catastrophic compliance and confidentiality risks.

## Decision
CHRONO is built strictly as a **Local-First Architecture**.
- All state nodes, deltas, DAG metadata, and indices reside primarily on the local filesystem.
- The persistence engine uses a high-performance Write-Ahead Log (WAL) combined with SQLite for graph metadata and content-addressed flat files/blocks (compressed with zstd) for state payloads.
- Remote synchronization (Phase 4) is an optional, explicit, end-to-end encrypted peer-to-peer or self-hosted relay layer, never a prerequisite for local recording, replay, or querying.

## Consequences
### Positive
- **Zero Latency**: State emission and disk synchronization occur in $< 2$ milliseconds via local WAL append.
- **Offline Operation**: CHRONO operates with 100% functionality on an airplane or air-gapped secure environment without internet access.
- **Absolute Privacy**: Zero risk of intellectual property leakage or unauthorized data exfiltration.

### Trade-offs & Mitigations
- **Disk Usage**: Storing granular state history can accumulate disk space over months of continuous development.
  - *Mitigation*: We enforce Epoch consolidation, BLAKE3 content deduplication, zstd block compression, and cold-tier archiving to keep storage overhead under 100MB per day of active engineering.
- **Single Point of Failure**: If local hardware fails without a backup, local history could be lost.
  - *Mitigation*: Optional encrypted sync/backup plugins can mirror compressed Epoch bundles to secondary storage or S3/git remotes on command.
