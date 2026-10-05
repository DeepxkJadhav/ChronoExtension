# START HERE

You are about to build CHRONO — a temporal computing layer.

This `docs/` folder is your operating manual. It contains
everything: the vision, the architecture, the plan, the
workflow, the tests, the launch.

## Reading Order

If you have **5 minutes**:
  → 01_PRODUCT_SPEC.md (skim the demo section)

If you have **1 hour**:
  → 00, 01, 02, 05

If you have **1 day**:
  → Read all 13 in order.

If you're **about to code**:
  → 02, 03, 04, 06

If you're **about to ship**:
  → 07, 08, 09, 10

## The 13 Documents

| # | File | Purpose |
|---|------|---------|
| 00 | START_HERE.md | This file |
| 01 | PRODUCT_SPEC.md | What CHRONO is, feature by feature |
| 02 | ARCHITECTURE.md | How the system is structured |
| 03 | DATA_MODEL.md | Every entity, field, relationship |
| 04 | TECH_STACK.md | Exact technologies and why |
| 05 | BUILD_PLAN.md | Week-by-week, phase-by-phase |
| 06 | DAILY_WORKFLOW.md | How to work day-to-day |
| 07 | TESTING.md | How to verify correctness |
| 08 | UI_UX_SPEC.md | Every screen, every interaction |
| 09 | SECURITY_PRIVACY.md | Trust model, encryption |
| 10 | LAUNCH_GROWTH.md | How to ship and grow |
| 11 | FAQ_OBJECTIONS.md | Hard questions, honest answers |
| 12 | GLOSSARY.md | Every term defined |

## The One-Sentence Version

CHRONO is a temporal state layer: every app, file, and
system state becomes a queryable, branchable, replayable
timeline — like Git for everything, not just code.

## The One-Paragraph Version

Today, software forgets. Undo is 50 steps. Version history
is manual. Time Machine is a backup. We accept this because
we don't know better. CHRONO changes the primitive: state
is a first-class, content-addressed, causally-ordered graph.
The present is just one view. Users can scrub, branch,
merge, and query their entire computing history — across
apps — with natural language or a precise query language.
AI indexes it; it does not own it. State is never destroyed.
Local-first is physics, not policy.

## The One-Image Version

    Timeline of your entire computing life:

    [Yesterday]──[2h ago]──[now]──┬──[branch: experiment]
                                   │
                                   └──[branch: bug fix]
                                        │
                                        └──[merge → main]

    You scrub back. You branch. You replay. You merge.
    You never lose anything again.

## Your Identity

You are not "an AI founder."
You are not "building an agent."
You are not "doing a wrapper."

You are **the person who made computers remember.**

Own that. Ship that. Protect that.

## The North Star

Every decision answers one question:

> "Does this make CHRONO more like a *new layer of
> computing*, or more like a *product feature*?"

If feature → reject.
If layer → build.

## The First Step

Read 01_PRODUCT_SPEC.md.
Then read 05_BUILD_PLAN.md.
Then open your terminal and create the repo.

Go.
