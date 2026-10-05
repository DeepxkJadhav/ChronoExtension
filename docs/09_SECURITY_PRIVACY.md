# Security & Privacy

Trust is the product. Design accordingly.

## Threat Model

**Protect against:**
- Adversarial adapters reading other scopes
- Malicious state corrupting the graph
- Prompt injection in state
- Cloud sync leaking state
- Physical access to the machine
- Supply chain attacks on dependencies

**Not protecting against (documented):**
- Root/administrator on user's machine
- Physical hardware attacks (unless user enables)
- Nation-state adversaries

## Privacy Principles

1. **Local-first.** Nothing leaves the machine by default.
2. **No telemetry.** Ever, unless opt-in and anonymized.
3. **No cloud required.** Cloud is an optional accelerator.
4. **User owns state.** Exportable, deletable, portable.
5. **Encrypted at rest** if user enables.
6. **E2E encrypted sync** if user enables.
7. **AI is opt-in.** Local-only default if enabled.
8. **Transparent.** Every network call logged, viewable.

## Access Control

### Filesystem
- `~/.chrono/` — mode 0700 (user only)
- Keys — mode 0600
- Store — encrypted (optional, recommended)

### Adapters
- Run in daemon process (trusted) or sandboxed (untrusted)
- Sandbox: seccomp (Linux), sandbox_init (macOS), job objects (Windows)
- Capabilities declared; violations terminate adapter
- Audit log of every syscall (verbose mode)

### IPC
- Unix socket, mode 0600
- No TCP by default (opt-in for remote)
- Auth: filesystem permissions + optional token

### AI
- Local model default
- Cloud opt-in per-adapter, per-scope
- Contract-logged: every call recorded
- No state sent without explicit contract

## Encryption

### At Rest
- Store: SQLCipher or custom AEAD (XChaCha20-Poly1305)
- Keys: derived from OS keychain (Keychain, libsecret, DPAPI)
- Optional: user-provided passphrase

### In Transit (Sync, Phase 4)
- TLS 1.3 for cloud
- Noise Protocol for P2P
- E2E: age or libsodium sealed boxes
- Keys: user-owned, never on server

### End-to-End Sync Design

    User A                    Server                    User B
      │                         │                          │
      │──[encrypted node]──────▶│                          │
      │                         │──[encrypted node]───────▶│
      │                         │                          │
      │  Server sees:           │                          │
      │  - node hashes          │                          │
      │  - timestamps           │                          │
      │  - sizes                │                          │
      │                         │                          │
      │  Server does NOT see:   │                          │
      │  - state contents       │                          │
      │  - embeddings           │                          │
      │  - metadata             │                          │

## Adapter Sandboxing

When adapter runs untrusted:

- Separate process
- No filesystem access except declared scope
- No network unless declared
- CPU/memory limits
- Killed on capability violation
- Communicates via daemon IPC only

## Prompt Injection Defense

State may contain adversarial text. Defenses:

1. **Separate channels:** state passed as data, never as
   instructions, in AI prompts
2. **Validation:** AI outputs validated against state
3. **Labeling:** AI outputs always marked "advisory"
4. **No auto-execute:** AI suggestions require user commit
5. **Sandboxed eval:** AI-proposed CQL runs read-only first

## Supply Chain

- Pin all dependency versions
- Lock files committed
- Audit dependencies quarterly
- Sign releases (Phase 4)
- SBOM published (Phase 4)
- Reproducible builds (Phase 5 goal)

## Data Portability

- `chrono export <scope>` → portable archive
- `chrono import <archive>` → restore
- Format: same on-disk format, so always readable
- No lock-in: state is yours

## Data Deletion

**Law 1 says state is never destroyed. How does this
reconcile with GDPR / right to be forgotten?**

- **Local state:** user may delete their own store
  (destroys local copy)
- **Sync state:** user may request server deletion
  (server deletes encrypted blob)
- **Crypto-shredding:** deleting the key renders state
  unrecoverable, even if ciphertext remains
- **Documented:** user consent required for sync;
  crypto-shredding is the deletion mechanism

## Incident Response

If a vulnerability is found:

1. **Acknowledge** within 48h
2. **Fix** in a patch release
3. **Disclose** after fix (30 days max)
4. **Credit** reporter (unless anonymous)
5. **Post-mortem** published

## Security Testing

- Fuzz adapters (cargo-fuzz)
- Fuzz CQL parser (jazzer)
- Fuzz CBOR parser
- Adversarial AI evaluation
- Third-party audit (Phase 4)
- Bug bounty (Phase 4+)

## Logging & Transparency

- Every network call logged in `~/.chrono/logs/net.log`
- Every AI call logged in `~/.chrono/logs/ai.log`
- User can view, export, delete logs
- No silent network activity

## Compliance (Phase 4+)

- **GDPR:** local-first satisfies most; documented
- **CCPA:** same
- **HIPAA:** enterprise self-hosted
- **SOC 2:** enterprise
- **No data resale:** never

## The Promise

> Your state is yours. You can export it, delete it, or
> keep it forever. We never see it. We never sell it. We
> never lose it.
>
> If we break this promise, the project dies. That's the
> point.

## The Rule

> Security is not a feature. It's the reason someone
> trusts CHRONO with their life's work. Treat every
> shortcut as a betrayal.
