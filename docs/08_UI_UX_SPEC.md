# UI / UX Specification

The scrubber is the brand. Design it like it matters.

## Design Principles

1. **Time is the primary axis.** Everything revolves around
   the timeline. Not documents, not files, not apps.
2. **The present is one moment.** Always show where "now"
   is, but never privilege it.
3. **Branches are visible.** Multiple timelines shown as
   parallel tracks.
4. **Replay is instant.** Scrubbing feels like video.
5. **Query is direct.** Type → results. No wizard.
6. **Never modal.** Actions happen inline, on the timeline.
7. **Keyboard-first.** Every action has a shortcut.
8. **No chrome.** The timeline IS the interface.
9. **Dark by default.** Light theme available.
10. **Local-first feels.** Nothing spins. Nothing waits.

## The Scrubber (The Iconic Component)

### Layout

    ┌─────────────────────────────────────────────────────┐
    │ [now]                                                │
    │ ───●───────●──────●───┬──●────●───●───●───●─────▶   │
    │  t-3h    t-2h   t-1h  now  +5m +10m +15m ...       │
    │                                                      │
    │ ┌─────────────────────────────────────────────────┐ │
    │ │  PREVIEW PANEL                                  │ │
    │ │  State at playhead:                             │ │
    │ │  - src/auth.ts                                  │ │
    │ │  - terminal: `npm test`                         │ │
    │ │  - browser: docs.example.com                    │ │
    │ └─────────────────────────────────────────────────┘ │
    └─────────────────────────────────────────────────────┘

### Interactions

| Action | Result |
|--------|--------|
| Drag playhead | Scrub through time |
| Click a node | Jump to that moment |
| Right-click node | Context menu (branch, tag, diff) |
| Scroll on timeline | Zoom in/out (linear ↔ log scale) |
| `Cmd+Shift+T` | Toggle scrubber |
| Arrow keys | Step 1 node / 1 minute / 1 hour |
| `B` | Branch from playhead |
| `D` | Diff current vs playhead |
| `M` | Merge branch |
| `Q` | Open query bar |
| `Esc` | Close, return to now |

### Visual Language

- **Nodes:** small dots (●) on the timeline
- **Branches:** parallel horizontal tracks
- **Merge:** two tracks converging
- **Conflict:** red dot with pulse
- **Tag:** small flag (⚑)
- **AI action:** subtle purple glow
- **Opaque node:** hollow circle (○) — no replay

### Colors

    Background:    #0A0A0B
    Timeline:      #1A1A1D
    Node:          #5A5A60
    Node (now):    #FFFFFF
    Branch:        #4A9EFF
    Conflict:      #FF4A4A
    AI:            #A855F7
    Text:          #E5E5E7
    Text-muted:    #8A8A90

## The Branch View

    ┌─────────────────────────────────────────────────┐
    │  main ────●────●────●────●───┬──────●────●────▶  │
    │                              │                   │
    │  exp/auth                    │                   │
    │  ─────────●────●────●───────●────●────●─────▶    │
    │                                                        │
    │  hotfix                                       │
    │  ────────────────────●────●────────────────────▶     │
    └─────────────────────────────────────────────────┘

Nodes aligned horizontally by causality. Vertical position
groups branches. Merge edges curve between tracks.

### Interactions
- Click branch → focus
- Double-click branch → checkout
- Right-click branch → rename, delete, merge
- Drag node to another branch → cherry-pick (with confirm)

## The Diff View

    ┌─────────────────────────────────────────────────┐
    │  A: node abc123         B: node def456           │
    │  ─────────────────────────────────────────────  │
    │                                                  │
    │  src/auth.ts                                     │
    │  - const user = req.body.name                    │
    │  + const user = req.body.userId                  │
    │                                                  │
    │  src/middleware.ts                               │
    │  - export function auth(req, res) {              │
    │  + export function auth(req, res, next) {        │
    │                                                  │
    │  ─────────────────────────────────────────────  │
    │  Intent: rename user → userId throughout auth    │
    │  Risk: low                                       │
    │  [Merge] [Branch from A] [Branch from B]        │
    └─────────────────────────────────────────────────┘

## The Query Bar

    ┌─────────────────────────────────────────────────┐
    │  ⌘K  Query or ask...                            │
    │                                                  │
    │  > show auth edits last 2h                      │
    │                                                  │
    │  ┌────────────────────────────────────────────┐ │
    │  │ SELECT * FROM branch "main"                 │ │
    │  │ WHERE CHANGED "src/auth/**"                 │ │
    │  │   AND AFTER "2h ago"                        │ │
    │  │                                              │ │
    │  │ [Run] [Explain] [Save as...]                │ │
    │  └────────────────────────────────────────────┘ │
    └─────────────────────────────────────────────────┘

- Natural language → CQL preview
- User can edit the CQL
- Results stream below
- Every query is saveable (named query)

## The Conflict Resolution View

    ┌─────────────────────────────────────────────────┐
    │  Conflict in src/auth.ts (lines 42-58)          │
    │                                                  │
    │  Base (common ancestor):                         │
    │  const user = req.body.name;                     │
    │                                                  │
    │  Yours (main):                                   │
    │  const user = req.body.userId;  ← renamed       │
    │                                                  │
    │  Theirs (exp/auth):                              │
    │  const user = await getUser(req);  ← await      │
    │                                                  │
    │  ┌────────────────────────────────────────────┐ │
    │  │ Suggested resolution (AI, unverified):     │ │
    │  │ const user = await getUserById(req.body.userId);│
    │  └────────────────────────────────────────────┘ │
    │                                                  │
    │  [Accept suggestion] [Edit manually] [Keep both]│
    │  [Abort merge]                                   │
    └─────────────────────────────────────────────────┘

## The CLI

    $ chrono log --last 2h --scope vscode
    ● abc123  2m ago   src/auth.ts (modified)
    ● def456  5m ago   package.json (modified)
    ● ghi789  1h ago   src/middleware.ts (modified)
    ● jkl012  2h ago   (branch created: experiment)

    $ chrono query "show auth edits last 2h"
    → 12 nodes. Run `chrono show <hash>` for details.

    $ chrono branch experiment from main
    ✓ Branch "experiment" created at abc123.

    $ chrono merge experiment into main
    ⚠ 2 conflicts in src/auth.ts
    → Run `chrono resolve` to reconcile.

    $ chrono replay abc123 --scope vscode
    ✓ State restored to abc123.
    → Checkout: `chrono checkout abc123`

## Keyboard Shortcuts (Global)

| Key | Action |
|-----|--------|
| `Cmd+Shift+T` | Toggle scrubber |
| `Cmd+Shift+B` | Toggle branch view |
| `Cmd+K` | Query bar |
| `Cmd+Shift+D` | Diff |
| `Cmd+Shift+M` | Merge |
| `Cmd+Shift+Z` | Branch from here |
| `←` / `→` | Step node |
| `Shift+←` / `Shift+→` | Step 1h |
| `Space` | Play/pause (timeline) |
| `Esc` | Close overlay |

## Onboarding (First 5 Minutes)

1. Install CHRONO (`brew install chrono`)
2. `chrono init` — creates `~/.chrono`, registers default adapters
3. `chrono start` — daemon starts
4. Record 5 minutes of real work
5. `Cmd+Shift+T` — scrubber appears
6. Drag back — watch yourself work
7. **"Oh."**

## Accessibility

- Full keyboard navigation
- Screen reader labels on all nodes
- High-contrast mode
- Reduced motion mode
- No reliance on color alone

## Mobile (Phase 5+)

- Read-only scrubber
- Query interface
- Approve/reject merges
- No editing

## The Rule

> Every interaction must be:
> - **Instant** (<100ms perceived)
> - **Reversible** (undo, always)
> - **Keyboard-accessible**
>
> If any is missing, redesign.
