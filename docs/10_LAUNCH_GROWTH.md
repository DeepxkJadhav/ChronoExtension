# Launch & Growth

How to ship CHRONO and grow it without selling out.

## The Launch Sequence

### T-90 days: Pre-launch
- Build in public (Twitter/X, blog)
- Weekly demo GIFs
- No product page yet
- Recruit 10 alpha testers

### T-30 days: Private alpha
- 10-50 users on real work
- Collect bugs, feedback
- Fix, iterate, no features
- Record the killer demo

### T-7 days: Tease
- Post the 3-minute demo (Twitter/X)
- No product yet, just the demo
- "Coming next week"
- Collect emails on landing page

### T-0: Launch

**Where:**
- Hacker News (Show HN)
- Twitter/X (thread)
- Reddit (r/programming, r/devtools)
- Lobsters
- Personal blog post

**What:**
- The demo GIF first
- One-paragraph pitch
- Link to install
- Free, open source (or free tier)

**Post title:** "Show HN: CHRONO — a temporal state layer for your entire computer"

### T+1 to T+7: Respond
- Answer every comment
- Fix every bug reported
- Ship daily updates
- Thank every early user

### T+30: Retrospective
- What worked?
- What didn't?
- Who's still using it?
- What's next?

## Growth Principles

1. **Quality over virality.** 100 daily users > 100k
   one-day signups.
2. **Adapters over features.** Every new adapter adds
   value to every user.
3. **Community over company.** Open source, open spec.
4. **Depth over breadth.** Be the tool for power users
   first. Casual users will come.
5. **Word of mouth over ads.** If it's not remarkable,
   it doesn't deserve to grow.

## Content Strategy

### Blog Posts (Monthly)
- Deep dives on the internals
- "Why determinism matters"
- "How we think about time"
- Case studies from users

### Demos (Weekly during build)
- Short GIFs (10-30s)
- One feature per demo
- Twitter/X + YouTube Shorts

### Talks (Quarterly)
- Local meetups
- Conferences (Strange Loop, RustConf, etc.)
- Podcasts

### Docs (Continuous)
- Every feature documented
- Every concept explained
- Every API example in 3 languages

## Community

### Where
- GitHub (code, issues, discussions)
- Discord or Matrix (chat)
- Monthly office hours (video call)

### How
- Respond to every issue within 48h
- Label beginner-friendly issues
- Celebrate every contributor
- Never let a PR rot

### Who
- Power users → contributors
- Contributors → maintainers
- Maintainers → stewards

## The Contributor Funnel

    User → reports bug → fixes bug → becomes contributor
         → writes adapter → becomes maintainer
         → shapes spec → becomes steward

Every stage must be respected.

## Monetization (Phase 4+)

**Never:**
- Ads
- Data resale
- Paywalled core features
- Per-recorded-state pricing

**Yes:**
- Paid sync (encrypted, cross-device)
- Paid team features (shared scopes)
- Paid enterprise (self-hosted, compliance)
- Paid support (SLA)

**Model:** Open core. Everything local is free forever.
Cloud is paid. Enterprise is paid.

## The Spec Strategy

The protocol is the moat. To make it standard:

1. Publish `spec/` v1.0
2. Provide conformance tests
3. Court second implementations (Rust, Go, Python)
4. Submit to IETF / W3C (Phase 5)
5. Never require CHRONO-branded daemon

If others implement CHRONO, CHRONO wins.

## Metrics That Matter

Track:
- DAU (daily active users)
- Adapters written by others
- Community PRs merged
- Spec implementations
- Retention (30-day, 90-day)

Ignore:
- Total signups
- Time-in-app
- Pageviews
- Twitter followers

## Retention Strategy

The product must become **load-bearing** for users.
They should feel *wrong* without it.

Tactics:
- Onboarding that shows the magic in 5 minutes
- Daily-use features (scrub, replay)
- Integration with tools they already use (VS Code)
- Local-first data they can't easily move

If a user churns, ask: why? Fix the answer.

## Anti-Growth Tactics

Do NOT:
- Send marketing emails without opt-in
- Use dark patterns
- Gamify usage
- Nag with notifications
- Add "social" features for engagement
- Optimize for app store ranking

Growth is a *result* of being useful, not a goal.

## The Long Game

Year 1: 1,000 users.
Year 2: 10,000 users.
Year 3: 100,000 users.
Year 5: 1,000,000 users.
Year 10: CHRONO is a standard.

Compounding beats virality. Every year, the moat deepens.

## The Rule

> If we have to trick people into using CHRONO, we've
> already lost. Build something worth using. Tell the
> truth about it. Let it spread.
