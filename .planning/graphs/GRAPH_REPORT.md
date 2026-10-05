# Graph Report - calm-fermi  (2026-10-05)

## Corpus Check
- 71 files · ~143,340 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 830 nodes · 1268 edges · 39 communities
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `47a1a920`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.ts
- ChronoDAG
- Data Model
- Testing Strategy
- Glossary
- Launch & Growth
- Architecture
- Tech Stack
- Security & Privacy
- Build Plan
- FAQ & Objections
- 3. Core RPC Methods
- Daily Workflow
- UI / UX Specification
- Product Specification
- Core Concepts
- VectorClock
- CHRONO SPECIFICATION: MERGE SEMANTICS
- CHRONO SPECIFICATION: STATE MODEL
- CHRONO ROADMAP
- package.json
- compilerOptions
- START HERE
- CHRONO SPECIFICATION: CHRONO QUERY LANGUAGE (CQL)
- CHRONO NON-GOALS
- CHRONO PRINCIPLES
- ADR-0001: Why a Directed Acyclic Graph (DAG) Instead of a Linear Log
- ADR-0002: Semantic Deltas vs Byte-Level Diffs
- ADR-0003: Local-First Storage Architecture
- ADR-0004: Why a Dedicated Chrono Query Language (CQL)
- CHRONO
- AI CONTRACT: NATURAL LANGUAGE TO CQL COMPILER
- AI CONTRACT: TIMELINE & BRANCH SUMMARIZATION
- Parser
- CHRONO SPECIFICATION: ON-DISK STORAGE FORMAT
- AI CONTRACT: SEMANTIC DIFF EXPLAINER
- CHRONO MANIFESTO
- sqlite.ts
- Communities (37 total, 0 thin omitted)

## God Nodes (most connected - your core abstractions)
1. `ChronoDAG` - 40 edges
2. `Communities (37 total, 0 thin omitted)` - 38 edges
3. `StateNode` - 33 edges
4. `CID` - 31 edges
5. `Glossary` - 28 edges
6. `Parser` - 25 edges
7. `Data Model` - 23 edges
8. `Tech Stack` - 23 edges
9. `FAQ & Objections` - 22 edges
10. `SQLiteStorage` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Surprising Connections (you probably didn't know these)` --references--> `ChronoAdapter`  [INFERRED]
  .planning/graphs/GRAPH_REPORT.md → adapters/sdk/adapter.ts
- `3. The TypeScript Interface Contract` --references--> `ChronoAdapter`  [INFERRED]
  spec/ADAPTER_CONTRACT.md → adapters/sdk/adapter.ts
- `God Nodes (most connected - your core abstractions)` --references--> `VSCodeChronoAdapter`  [INFERRED]
  .planning/graphs/GRAPH_REPORT.md → adapters/vscode/index.ts
- `Surprising Connections (you probably didn't know these)` --references--> `VSCodeObserver`  [INFERRED]
  .planning/graphs/GRAPH_REPORT.md → adapters/vscode/observe.ts
- `Knowledge Gaps` --references--> `ActorId`  [INFERRED]
  .planning/graphs/GRAPH_REPORT.md → core/clock/logical.ts

## Import Cycles
- None detected.

## Communities (39 total, 0 thin omitted)

### Community 0 - "index.ts"
Cohesion: 0.06
Nodes (27): AdapterContext, ChronoAdapter, CID, HostSnapshot, RestoreRequest, RestoreResult, SemanticDelta, AdapterCapabilityProfile (+19 more)

### Community 1 - "ChronoDAG"
Cohesion: 0.07
Nodes (30): replayCommand(), CausalityRelation, VectorClockSnapshot, ChronoDAG, applyTextSplice(), DeltaPayload, FileMutationOperation, SemanticDelta (+22 more)

### Community 2 - "Data Model"
Cohesion: 0.06
Nodes (31): adapter.idx, AdapterIdentity, Branch, Branch, Canonical Form, Capabilities, causality.idx, Conflict (+23 more)

### Community 3 - "Testing Strategy"
Cohesion: 0.07
Nodes (29): Adversarial AI, CI Pipeline, Corruption, Coverage, CQL, Cross-Machine, Cross-Version, DAG (+21 more)

### Community 4 - "Glossary"
Cohesion: 0.07
Nodes (28): A, B, C, D, E, F, G, Glossary (+20 more)

### Community 5 - "Launch & Growth"
Cohesion: 0.07
Nodes (26): Anti-Growth Tactics, Blog Posts (Monthly), Community, Content Strategy, Demos (Weekly during build), Docs (Continuous), Growth Principles, How (+18 more)

### Community 6 - "Architecture"
Cohesion: 0.08
Nodes (25): Adapters, AI Orchestrator, Architecture, Branching, Concurrency Model, CQL Evaluator, Data Flow, Extensibility Points (+17 more)

### Community 7 - "Tech Stack"
Cohesion: 0.08
Nodes (23): AI Providers (Optional), Analytics / Telemetry, Build / Package, CI/CD, CLI Framework, Compression: zstd, Daemon Communication: gRPC, Dependency Policy (+15 more)

### Community 8 - "Security & Privacy"
Cohesion: 0.08
Nodes (23): Access Control, Adapter Sandboxing, Adapters, AI, At Rest, Compliance (Phase 4+), Data Deletion, Data Portability (+15 more)

### Community 9 - "Build Plan"
Cohesion: 0.08
Nodes (25): Anti-Patterns (Do Not), Beyond Phase 4 (Years 3-10), Build Plan, Deliverables, Exit Criteria, Month 11-12 — Polish + Growth, Month 13-15 — Spec v1.0, Month 16-18 — Sync (+17 more)

### Community 10 - "FAQ & Objections"
Cohesion: 0.09
Nodes (22): FAQ & Objections, "How is this different from Rewind.ai?", "How will you make money?", "Is this a 'Git for X' pitch?", "Is this a startup or a project?", "Isn't this a privacy nightmare?", "Isn't this just event sourcing?", "Isn't this just Git / Time Machine / Undo?" (+14 more)

### Community 11 - "3. Core RPC Methods"
Cohesion: 0.10
Nodes (19): 1. Protocol Architecture, 2.1 Transport Layer, 2.2 Framing Format, 2. Framing & Transport, 3.1 `chrono.handshake`, 3.2 `chrono.node.emit`, 3.3 `chrono.host.restore` (Daemon $\to$ Adapter), 3.4 `chrono.query.execute` (+11 more)

### Community 12 - "Daily Workflow"
Cohesion: 0.11
Nodes (18): Branches, Commits, Daily Workflow, Handling Interruptions, Issues, Monthly Review (Last Friday 2h), PRs, The Daily Log (+10 more)

### Community 13 - "UI / UX Specification"
Cohesion: 0.11
Nodes (18): Accessibility, Colors, Design Principles, Interactions, Interactions, Keyboard Shortcuts (Global), Layout, Mobile (Phase 5+) (+10 more)

### Community 14 - "Product Specification"
Cohesion: 0.11
Nodes (17): Core Features (Phase 1 → Phase 4), Phase 1 — Foundation (Months 1-3), Phase 2 — Cognition (Months 4-6), Phase 3 — Breadth (Months 7-12), Phase 4 — Protocol (Months 13-24), Pricing (Phase 4+), Product Specification, Success Metrics (+9 more)

### Community 15 - "Core Concepts"
Cohesion: 0.12
Nodes (16): Adapter (`Adapter`), Branch (`Branch`), Capability (`Capability`), CHRONO GLOSSARY, Chrono Query Language (`CQL`), Content Address (`CID`), Core Concepts, Delta (`Delta`) (+8 more)

### Community 16 - "VectorClock"
Cohesion: 0.10
Nodes (16): DomainCapability, StateDomain, ActorId, VectorClock, DAGStats, Clock Service, Month 1 — The Graph, Community Hubs (Navigation) (+8 more)

### Community 17 - "CHRONO SPECIFICATION: MERGE SEMANTICS"
Cohesion: 0.12
Nodes (15): 1. The Core Problem, 2. Merge Algorithm Pipeline, 3.1 Non-Overlapping Splices, 3.2 Overlapping Splices (Conflict), 3. Operational Transformation Rules for Text Splices, 4.1 Strategy `semantic_3way` (Default), 4.2 Strategy `ours` (Branch $A$ Precedence), 4.3 Strategy `theirs` (Branch $B$ Precedence) (+7 more)

### Community 18 - "CHRONO SPECIFICATION: STATE MODEL"
Cohesion: 0.13
Nodes (14): 1. Mathematical Formalism, 2.1 Node Schema (JSON Schema / TypeScript), 2. State Node Definition, 3.1 Snapshot Node (`kind: "snapshot"`), 3.2 Delta Node (`kind: "delta"`), 3.3 Epoch Node (`kind: "epoch"`), 3.4 Merge Node (`kind: "merge"`), 3. Node Varieties (+6 more)

### Community 19 - "CHRONO ROADMAP"
Cohesion: 0.14
Nodes (13): CHRONO ROADMAP, Definition of Done (DoD), Definition of Done (DoD), Definition of Done (DoD), Definition of Done (DoD), Deliverables, Deliverables, Deliverables (+5 more)

### Community 20 - "package.json"
Cohesion: 0.12
Nodes (15): author, description, keywords, license, name, scripts, test, test:adapters (+7 more)

### Community 21 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, skipLibCheck (+3 more)

### Community 22 - "START HERE"
Cohesion: 0.20
Nodes (9): Reading Order, START HERE, The 13 Documents, The First Step, The North Star, The One-Image Version, The One-Paragraph Version, The One-Sentence Version (+1 more)

### Community 23 - "CHRONO SPECIFICATION: CHRONO QUERY LANGUAGE (CQL)"
Cohesion: 0.20
Nodes (9): 1. Overview, 2. Formal Grammar (EBNF), 3. Built-in Functions, 4. Query Examples, 5. Execution Pipeline, CHRONO SPECIFICATION: CHRONO QUERY LANGUAGE (CQL), Example 1: Locate When an Exception or Failure Occurred, Example 2: Find All Changes to a Specific Authentication File (+1 more)

### Community 24 - "CHRONO NON-GOALS"
Cohesion: 0.22
Nodes (8): 1. CHRONO is NOT a Screen or Pixel Video Recorder, 2. CHRONO is NOT a Replacement for Git, 3. CHRONO is NOT a Corporate SaaS Telemetry / Spyware Platform, 4. CHRONO is NOT a Heavyweight VM Hypervisor / RAM Dump Engine, 5. CHRONO is NOT an AI Chatbot or Autonomous Agent, 6. CHRONO is NOT an Ephemeral In-Memory Cache or Message Queue, 7. CHRONO is NOT a Monolithic IDE or Editor Fork, CHRONO NON-GOALS

### Community 25 - "CHRONO PRINCIPLES"
Cohesion: 0.22
Nodes (8): CHRONO PRINCIPLES, Rule 1: State Is Never Destroyed, Rule 2: Causality Trumps Wall-Clock Time, Rule 3: Deltas Must Carry Semantic Intent, Rule 4: Determinism Is Non-Negotiable, Rule 5: Adapters Degrade Gracefully, Rule 6: CQL Is the Truth; AI and Natural Language Are Frontend Views, Rule 7: Local Sovereignty and Zero Secret Leakage

### Community 26 - "ADR-0001: Why a Directed Acyclic Graph (DAG) Instead of a Linear Log"
Cohesion: 0.25
Nodes (7): ADR-0001: Why a Directed Acyclic Graph (DAG) Instead of a Linear Log, Consequences, Context, Decision, Positive, Status, Trade-offs & Mitigations

### Community 27 - "ADR-0002: Semantic Deltas vs Byte-Level Diffs"
Cohesion: 0.25
Nodes (7): ADR-0002: Semantic Deltas vs Byte-Level Diffs, Consequences, Context, Decision, Positive, Status, Trade-offs & Mitigations

### Community 28 - "ADR-0003: Local-First Storage Architecture"
Cohesion: 0.25
Nodes (7): ADR-0003: Local-First Storage Architecture, Consequences, Context, Decision, Positive, Status, Trade-offs & Mitigations

### Community 29 - "ADR-0004: Why a Dedicated Chrono Query Language (CQL)"
Cohesion: 0.25
Nodes (7): ADR-0004: Why a Dedicated Chrono Query Language (CQL), Consequences, Context, Decision, Positive, Status, Trade-offs & Mitigations

### Community 30 - "CHRONO"
Cohesion: 0.25
Nodes (7): Architecture Decisions (ADRs), Architecture Specifications, CHRONO, Core Pillars & Protocol Blueprint, License, The 8 Must-Decide Files Before Coding, What is CHRONO?

### Community 31 - "AI CONTRACT: NATURAL LANGUAGE TO CQL COMPILER"
Cohesion: 0.29
Nodes (6): 1. Objective, 2. Invariants & Guardrails, 3. Input Specification, 4. Prompt Template, 5. Output JSON Schema, AI CONTRACT: NATURAL LANGUAGE TO CQL COMPILER

### Community 32 - "AI CONTRACT: TIMELINE & BRANCH SUMMARIZATION"
Cohesion: 0.29
Nodes (6): 1. Objective, 2. Invariants & Guardrails, 3. Input Specification, 4. Prompt Template, 5. Output JSON Schema, AI CONTRACT: TIMELINE & BRANCH SUMMARIZATION

### Community 33 - "Parser"
Cohesion: 0.12
Nodes (18): ASTNode, ASTNodeType, BinaryExpr, CqlQuery, Expression, FunctionCallExpr, GraphSource, LimitClause (+10 more)

### Community 34 - "CHRONO SPECIFICATION: ON-DISK STORAGE FORMAT"
Cohesion: 0.29
Nodes (6): 1. Directory Structure, 2. Content Addressing & Hash Commitment, 3. Physical Object Format (`objects/xx/yyyy...`), 4. Metadata Relational Schema (`dag.db`), 5. Ingress Write-Ahead Log (`wal/`), CHRONO SPECIFICATION: ON-DISK STORAGE FORMAT

### Community 35 - "AI CONTRACT: SEMANTIC DIFF EXPLAINER"
Cohesion: 0.33
Nodes (5): 1. Objective, 2. Invariants & Guardrails, 3. Input Specification, 4. Output JSON Schema, AI CONTRACT: SEMANTIC DIFF EXPLAINER

### Community 36 - "CHRONO MANIFESTO"
Cohesion: 0.50
Nodes (3): CHRONO MANIFESTO, The Core Thesis, The Premise

### Community 37 - "sqlite.ts"
Cohesion: 0.09
Nodes (17): branchCommand(), BranchOptions, initCommand(), InitOptions, logCommand(), LogOptions, queryCommand(), QueryOptions (+9 more)

### Community 38 - "Communities (37 total, 0 thin omitted)"
Cohesion: 0.05
Nodes (38): Communities (37 total, 0 thin omitted), Community 0 - "index.ts", Community 10 - "FAQ & Objections", Community 11 - "3. Core RPC Methods", Community 12 - "Daily Workflow", Community 13 - "UI / UX Specification", Community 14 - "Product Specification", Community 15 - "Core Concepts" (+30 more)

## Knowledge Gaps
- **466 isolated node(s):** `CID`, `BranchOptions`, `InitOptions`, `LogOptions`, `QueryOptions` (+461 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 536 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VectorClock` connect `VectorClock` to `ChronoDAG`, `sqlite.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `ChronoDAG` (e.g. with `God Nodes (most connected - your core abstractions)` and `Suggested Questions`) actually correct?**
  _`ChronoDAG` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `CID`, `BranchOptions`, `InitOptions` to the rest of the system?**
  _466 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05673076923076923 - nodes in this community are weakly interconnected._
- **Why does `StateNode` connect `ChronoDAG` to `VectorClock`, `Parser`, `sqlite.ts`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `StateNode` (e.g. with `God Nodes (most connected - your core abstractions)` and `Surprising Connections (you probably didn't know these)`) actually correct?**
  _`StateNode` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `ChronoDAG` be split into smaller, more focused modules?**
  _Cohesion score 0.0653417645287564 - nodes in this community are weakly interconnected._