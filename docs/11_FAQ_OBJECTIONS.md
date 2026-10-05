# FAQ & Objections

Hard questions. Honest answers.

## "Isn't this just Git / Time Machine / Undo?"

No. Git is for code, coarse, manual. Time Machine is
backup, file-level, non-queryable. Undo is shallow,
per-app, linear. CHRONO is:
- Cross-app
- Semantic (not byte-level)
- Queryable (CQL)
- Branchable (like Git, but for everything)
- Replayable (deterministic)
- Local-first

The primitive is different. That's the point.

## "Won't this use enormous disk space?"

Naively, yes. In practice:
- Content-addressed → dedup across nodes
- Semantic deltas → only meaningful changes stored
- Three-tier storage → hot/warm/cold
- zstd compression → 10-20x on cold
- Typical user: ~1-10 GB/year

Compare: a single 4K video is 20 GB. Your entire
computing year fits in less.

## "Isn't this a privacy nightmare?"

It's the opposite. Local-first. No cloud. No telemetry.
Optional E2E encryption. Adapters sandboxed. AI opt-in
and local by default.

Compare to cloud SaaS: your data is on their servers.
Here, it's on yours.

## "Won't AI make this obsolete? Just ask ChatGPT."

AI without state is amnesiac. AI with state needs a
state layer. CHRONO is that layer. AI becomes the
*query accelerator*, not the source of truth.

If AI gets infinitely powerful, CHRONO becomes more
valuable, not less.

## "Why not just use an LLM to summarize my history?"

Because:
- Summaries lose detail
- You can't replay a summary
- You can't branch a summary
- You can't deterministically reconstruct from a summary

CHRONO stores *state*. AI indexes it. Different primitive.

## "Isn't this just event sourcing?"

Event sourcing is a backend pattern. CHRONO is a
user-facing primitive:
- Event sourcing: server-side, code-focused
- CHRONO: local, cross-app, queryable, branchable

Event sourcing inspired CHRONO. It is not CHRONO.

## "Won't this slow down my computer?"

Overhead:
- CPU: <1% typical
- RAM: <200 MB for daemon
- Disk I/O: batched, async

Recorded state is compressed and tiered. If your
computer slows down, that's a bug — report it.

## "What about apps I can't integrate with?"

Adapters cover common apps. For others:
- Filesystem adapter captures file changes
- Window manager adapter captures screen state
- Terminal adapter captures shell activity
- Clipboard adapter captures text

Most apps leave traces somewhere. CHRONO catches them.

## "How is this different from Rewind.ai?"

Rewind records screen. CHRONO records *state*:
- Screen: pixels, opaque, huge
- State: semantic, queryable, branchable

Rewind is a photo album. CHRONO is Git for reality.
They can coexist; CHRONO's screen adapter could even
integrate with Rewind.

## "Is this a startup or a project?"

Both. Open source core. Paid cloud for sync + teams.
The spec is public. The daemon is one implementation.

You become **the inventor of the temporal computing
layer**, not the owner of a proprietary app.

## "How will you make money?"

- Free: local, unlimited, forever
- $10/mo: encrypted sync, cross-device, team features
- Enterprise: self-hosted, SSO, compliance

Never:
- Charge for local features
- Sell data
- Ads

## "What if OpenAI / Google builds this?"

They can't. It's local-first, cross-vendor, spec-based.
Their business model is cloud, not local state.

If they build a version, it validates the category.
CHRONO is the open one.

## "What if it doesn't work?"

Then you'll have written:
- A spec for temporal state
- A reference implementation
- A language (CQL)
- A new way to think about computing

That's a career. That's a legacy.

## "Isn't this too ambitious for a solo dev?"

Every great project started with one person:
- Git: Linus, solo, 2 weeks
- Redis: antirez, solo, years
- SQLite: Hipp, small team
- Linux: Linus, solo, then community

The scope is large. The *initial* scope is small:
- Phase 1: local state for VS Code
- 3 months, solo

After that, community can help. The spec attracts
contributors.

## "What if users don't want this?"

Some won't. That's fine. The target is power users
who hit the "lost state" pain daily. They'll feel
the magic instantly.

Once they use it, they can't go back. That's the
adoption curve.

## "Why should I trust you with my history?"

You shouldn't — trust the *architecture*:
- Local-first (no trust in a server needed)
- Open source (auditable)
- Deterministic (verifiable)
- Exportable (no lock-in)

Trust the math, not the person.

## "What about my existing data?"

CHRONO observes from install date forward. It does
not retroactively record. You can import:
- Git history (Phase 2)
- Browser history (Phase 3)
- Filesystem timestamps (Phase 3)

But mostly: it starts when you start. That's enough.

## "What's the killer use case?"

Debugging. Specifically: "something broke and I don't
know what changed."

Second: "what if I had done X differently?"

Third: "show me how I solved this last time."

These three cover 80% of developer pain. CHRONO
solves them in seconds.

## "Is this a 'Git for X' pitch?"

No. Git for X is a cliché. CHRONO is a *state layer*.
Git is one thing you could build on it. So is Figma.
So is a database. So is an OS.

The primitive is broader than Git. The comparison is
a starting point, not the pitch.

## "What if the whole AI bubble pops?"

CHRONO works with zero AI. AI accelerates queries.
If AI disappears, CHRONO still works, just less
conveniently.

The primitive is timeless. AI is a multiplier.

## The Meta-Answer

For any objection:
1. Does it violate `MANIFESTO.md`? → Ignore it.
2. Does it violate `NON_GOALS.md`? → Ignore it.
3. Is it a real concern? → Address it in an ADR.
4. Is it fear? → Reread `MANIFESTO.md`.

The vision is the filter. The vision is the answer.
