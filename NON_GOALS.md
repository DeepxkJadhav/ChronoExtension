# CHRONO NON-GOALS

To maintain laser focus and protect against architectural bloat, this document enumerates what CHRONO is **explicitly not**, and what it will **never** become. If an idea or pull request pushes CHRONO toward any of these archetypes, it will be rejected.

---

### 1. CHRONO is NOT a Screen or Pixel Video Recorder
- **What people ask for**: "Record my desktop at 60 FPS like Loom or Rewind AI so I can watch a video of what I did."
- **Why we reject it**: Video pixels are semantically blind, storage-prohibitive, and non-reconstructible. You cannot extract an AST, branch an execution path, or diff memory structures from an MP4 stream. CHRONO stores *structured state nodes and semantic deltas*, not optical artifacts.

### 2. CHRONO is NOT a Replacement for Git
- **What people ask for**: "Make CHRONO replace my Git repo, commit messages, and GitHub pull requests."
- **Why we reject it**: Git is designed for deliberate, curated team checkpoints across human-reviewed source code. CHRONO is designed for continuous, high-frequency computational execution: every editor keystroke, terminal output, environment variable shift, and debugger state. CHRONO complements Git; Git commits serve as natural Epoch boundaries inside CHRONO's DAG.

### 3. CHRONO is NOT a Corporate SaaS Telemetry / Spyware Platform
- **What people ask for**: "Stream all developer activity, keystrokes, and active application windows to a centralized management analytics dashboard."
- **Why we reject it**: CHRONO is personal cognitive infrastructure and developer tooling. It operates local-first. We do not build employee surveillance systems, manager dashboards, or involuntary cloud exfiltration mechanisms.

### 4. CHRONO is NOT a Heavyweight VM Hypervisor / RAM Dump Engine
- **What people ask for**: "Snapshot the entire 64GB host RAM page table on every event like QEMU or VMware."
- **Why we reject it**: Freezing the entire physical memory space is IO-crushing and lacks domain semantics. CHRONO operates at the *application boundary* via lightweight, capability-driven adapters (e.g. VS Code workspace state, terminal PTY session buffers, browser DOM/LocalStorage), achieving microsecond recording with megabytes, not gigabytes, of overhead.

### 5. CHRONO is NOT an AI Chatbot or Autonomous Agent
- **What people ask for**: "Build an agentic assistant into CHRONO that rewrites my code while I scrub."
- **Why we reject it**: CHRONO is the deterministic state and time-travel substrate. While AI providers can plug in to assist with natural-language query compilation (translating questions into CQL) or semantic indexing, the core engine is an agnostic protocol. The substrate must remain 100% deterministic and functional without any AI or LLM connection.

### 6. CHRONO is NOT an Ephemeral In-Memory Cache or Message Queue
- **What people ask for**: "Use CHRONO as an in-memory Redis or Kafka stream that evicts old nodes when RAM runs low."
- **Why we reject it**: CHRONO's first principle is *State Is Never Destroyed*. The state graph is persisted to an append-only WAL and content-addressed storage engine on disk. It is not an ephemeral message bus or lossy circular buffer.

### 7. CHRONO is NOT a Monolithic IDE or Editor Fork
- **What people ask for**: "Fork VS Code or create a bespoke CHRONO text editor."
- **Why we reject it**: Developers love their existing editors, shells, and operating systems. CHRONO achieves leverage by being an open protocol with ubiquitous adapters, meeting engineers inside the tools they already use every day.
