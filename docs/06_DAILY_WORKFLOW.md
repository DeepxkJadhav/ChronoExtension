# Daily Workflow

How to actually work on CHRONO, day to day.

## The Daily Loop

    06:00-07:00  Wake, no phone, review yesterday's log
    07:00-08:00  Read: one paper, one competitor, one user note
    08:00-08:30  Plan: pick ONE deliverable for the day
    08:30-12:00  DEEP WORK: build the deliverable
    12:00-13:00  Lunch, walk, no screens
    13:00-15:00  DEEP WORK: continue, test, iterate
    15:00-16:00  Demo to self: does it work?
    16:00-17:00  Write: 200-word log, update docs
    17:00-18:00  Admin: emails, issues, reviews
    18:00-19:00  Exercise
    19:00-21:00  Family / rest / reading
    21:00-22:00  Reflect: 3 things learned, 1 thing to try
    22:00        Sleep

**Non-negotiables:**
- No phone before 08:00
- No screens after 21:00
- 4+ hours of deep work daily
- One demo per day

## The Weekly Loop

**Monday — Direction**
- Review roadmap
- Pick week's deliverable
- Write it on a sticky note

**Tuesday-Thursday — Execution**
- Deep work, daily demos
- Only work on the week's deliverable
- Say no to everything else

**Friday — Ship**
- Ship something visible: demo, blog, release, PR
- Write a 500-word weekly log
- Review with a peer or mentor

**Saturday — Explore**
- Read, tinker, no obligation
- No shipping, no demos

**Sunday — Rest**
- Full off
- No CHRONO thinking

## The Monthly Loop

**First Monday**
- Review phase exit criteria
- Assess: are we on track?
- Adjust: scope, not goals

**Last Friday**
- Ship monthly release
- Write monthly retrospective
- Update `MANIFESTO.md` if needed (rare)

## The Repo Workflow

### Branches
- `main` — always shippable
- `feat/*` — feature branches
- `spec/*` — spec changes
- `docs/*` — docs only

### Commits
- Atomic: one change per commit
- Message: `<area>: <what> <why>`
- Example: `core: add vector clock compare`

### PRs
- Every change via PR (even solo)
- Self-review required
- No merge without tests
- No merge without docs if interface changed

### Issues
- Every bug: issue
- Every feature: issue first, code second
- Label: `phase-1`, `phase-2`, etc.
- Weekly triage

## The Decision Log

Every non-trivial decision → `DECISIONS/NNNN-title.md`:

    # NNNN — Decision

    ## Context
    ## Options Considered
    ## Decision
    ## Consequences
    ## Date

Never delete. Amend with new ADRs if changed.

## The Daily Log

Write it. Every day. 200 words max.

    ## 2025-06-15

    Built: vector clock compare + tests.
    Learned: vector clocks don't compress easily.
    Next: Epoch compression prototype.
    Blocked: none.

After 1 year, this log is a book. After 10, a legacy.

## Tools

- **Editor:** Zed or Neovim (fast, no Electron)
- **Terminal:** Ghostty or WezTerm
- **Task tracking:** Linear or plain Markdown
- **Notes:** Obsidian (ironically) or plain files
- **Time:** Time-blocked calendar

**Rule:** Every tool must serve the work. No tool for
tool's sake.

## The Focus Protocol

When starting deep work:
1. Phone in another room
2. Close every tab except the task
3. Write the deliverable on paper
4. Set a 90-minute timer
5. No Slack, no email, no Twitter
6. When timer rings, take 20 minutes off

Repeat 2-3 times per day.

## Handling Interruptions

- **Urgent + important** → handle, log, return
- **Urgent + not important** → defer to admin hour
- **Not urgent + important** → schedule
- **Not urgent + not important** → delete

## The Solo Founder Rules

1. **You are the bottleneck.** Protect your time.
2. **You cannot do everything.** Say no daily.
3. **You will be lonely.** Find 2-3 peers, not a crowd.
4. **You will doubt.** Reread `MANIFESTO.md`.
5. **You will want to pivot.** Read `NON_GOALS.md`.
6. **You will burn out.** Sleep is productive.
7. **You will compare.** Don't. Ship your thing.

## Weekly Review (Friday 1h)

Answer in writing:
1. What shipped?
2. What did I learn?
3. What's blocked?
4. What am I avoiding?
5. Next week's deliverable?

## Monthly Review (Last Friday 2h)

Answer in writing:
1. Phase exit criteria: on track?
2. What assumptions broke?
3. What's the biggest risk?
4. What am I over-investing in?
5. What am I under-investing in?
6. What do I need to say no to?
7. Am I still in love with the vision?

If #7 is "no," stop and reread `MANIFESTO.md`.

## The Rule

> Consistency beats intensity. Show up every day.
> Ship every week. Review every month. Over a decade,
> this compounds into something nobody can catch.
