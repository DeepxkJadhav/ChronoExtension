# CHRONO SPECIFICATION: ON-DISK STORAGE FORMAT

**Status**: Standard (Draft)  
**Version**: 1.0.0-final-draft  
**Commitment**: Any modification to this format requires a formal migration script (`store/migrations/`).  

---

## 1. Directory Structure

A CHRONO storage repository resides at `.chrono/` inside the workspace root (or in `$XDG_DATA_HOME/chrono/repos/<hash>` for bare/global stores):

```
.chrono/
├── CHRONO_VERSION          # Plaintext: "1.0.0"
├── config.json             # Local repository configuration
├── dag.db                  # SQLite database (metadata, DAG edges, branches, clocks)
├── dag.db-wal              # SQLite Write-Ahead Log
├── wal/                    # High-throughput append-only ingress log
│   ├── wal-00000001.log    # Active uncommitted adapter deltas
│   └── wal.meta            # Last flushed offset and sync checkpoint
├── objects/                # Content-addressed payload store
│   ├── 4b/
│   │   └── f68...          # zstd-compressed state payloads (BLAKE3 hash)
│   └── ...
├── epochs/                 # Consolidated epoch packs (coarse checkpoints)
│   ├── epoch-000001.pack   # Packed consolidated states
│   └── epoch-000001.idx    # Merkle index of pack
└── run/                    # Ephemeral runtime files (ignored by VCS)
    ├── chrono.sock         # Unix domain socket (or Windows pipe symlink)
    └── daemon.pid          # Process ID of active daemon
```

---

## 2. Content Addressing & Hash Commitment

- **Cryptographic Hash Algorithm**: **BLAKE3** (256-bit digest, hex-encoded).
  - *Rationale*: BLAKE3 is $> 5\times$ faster than SHA-256, tree-hashable by design, cryptographically secure, and resistant to length-extension attacks.
- **Multihash Prefix**: Objects use the multihash header `0x1e 0x20` (BLAKE3-256 with 32-byte digest length) to prevent ambiguity if algorithm transitions occur in future decades.
- **Node Identifier (CID)**: String representation is `b3_` followed by 64 hexadecimal characters:
  ```
  b3_a35f791e84c9823101dca471836109f0293847291a0984729104829471928472
  ```

---

## 3. Physical Object Format (`objects/xx/yyyy...`)

State payloads larger than 512 bytes are stored as compressed content-addressed files under `objects/` sharded by the first two characters of their hex hash.

Each object file begins with a 32-byte binary header:

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|       Magic: 'C' 'H' 'R' 'O'  | Format Ver: 1 | Codec (0=zstd)|
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                          Payload Type                         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|              Uncompressed Payload Length (64-bit)             |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|               Compressed Payload Length (64-bit)              |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Reserved (8 bytes)                      |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     zstd-Compressed Payload ...               |
```

- **Compression**: `zstd` (Zstandard) at compression level 3 for active writes; level 15 for compacted epoch packs.

---

## 4. Metadata Relational Schema (`dag.db`)

Graph traversal, indices, vector clocks, and branch heads are stored in SQLite 3 configured in `WAL` journaling mode with `PRAGMA synchronous = NORMAL`.

```sql
-- Core state nodes
CREATE TABLE IF NOT EXISTS nodes (
    cid TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK(kind IN ('snapshot', 'delta', 'epoch', 'merge')),
    adapter_id TEXT NOT NULL,
    wall_time TEXT NOT NULL,
    epoch_number INTEGER,
    object_offset INTEGER,
    payload_inline TEXT, -- JSON payload if < 512 bytes, NULL if stored in objects/
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Causal DAG edges (parent -> child)
CREATE TABLE IF NOT EXISTS edges (
    parent_cid TEXT NOT NULL,
    child_cid TEXT NOT NULL,
    ordinal INTEGER NOT NULL DEFAULT 0, -- 0 for primary, 1 for merge parent
    PRIMARY KEY (parent_cid, child_cid),
    FOREIGN KEY (parent_cid) REFERENCES nodes(cid),
    FOREIGN KEY (child_cid) REFERENCES nodes(cid)
);

CREATE INDEX IF NOT EXISTS idx_edges_child ON edges(child_cid);

-- Vector clocks for causal concurrency
CREATE TABLE IF NOT EXISTS vector_clocks (
    cid TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    sequence_num INTEGER NOT NULL,
    PRIMARY KEY (cid, actor_id),
    FOREIGN KEY (cid) REFERENCES nodes(cid) ON DELETE CASCADE
);

-- Named branches
CREATE TABLE IF NOT EXISTS branches (
    name TEXT PRIMARY KEY,
    head_cid TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (head_cid) REFERENCES nodes(cid)
);

-- Epoch checkpoints
CREATE TABLE IF NOT EXISTS epochs (
    epoch_id INTEGER PRIMARY KEY AUTOINCREMENT,
    head_cid TEXT NOT NULL,
    delta_count INTEGER NOT NULL,
    pack_path TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (head_cid) REFERENCES nodes(cid)
);
```

---

## 5. Ingress Write-Ahead Log (`wal/`)

To prevent blocking client threads and guarantee $< 2\text{ms}$ write latency:
1. Adapters append length-prefixed records directly to the active `wal/wal-XXXX.log` file with immediate OS buffer write.
2. Background thread flushes (`fdatasync`) every 100ms or 1,000 operations.
3. Daemon indexes WAL entries into `dag.db` asynchronously.
4. On unexpected crash or reboot, `chronod` replays un-indexed WAL records upon startup, verifying zero state loss.
