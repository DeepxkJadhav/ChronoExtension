import test, { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { initCommand } from "../../cli/commands/init.ts";
import { logCommand } from "../../cli/commands/log.ts";
import { branchCommand } from "../../cli/commands/branch.ts";
import { replayCommand } from "../../cli/commands/replay.ts";
import { queryCommand } from "../../cli/commands/query.ts";

describe("CHRONO CLI Commands", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "chrono-cli-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("executes full workflow: init -> log -> branch -> replay -> query", async () => {
    // 1. init
    const initMsg = await initCommand({ cwd: tempDir });
    assert.ok(initMsg.includes("Initialized empty CHRONO repository"));
    assert.ok(initMsg.includes("Genesis CID: b3_"));

    const genesisCidMatch = initMsg.match(/Genesis CID: (b3_[a-f0-9]+)/);
    assert.ok(genesisCidMatch);
    const genesisCid = genesisCidMatch[1];

    // 2. log
    const logMsg = logCommand({ cwd: tempDir });
    assert.ok(logMsg.includes("Timeline on branch: [main]"));
    assert.ok(logMsg.includes("chrono.core"));

    // 3. branch
    const branchMsg = branchCommand({ cwd: tempDir, createName: "experiment" });
    assert.ok(branchMsg.includes("Branch 'experiment' created"));

    const listBranchesMsg = branchCommand({ cwd: tempDir });
    assert.ok(listBranchesMsg.includes("main"));
    assert.ok(listBranchesMsg.includes("experiment"));

    // 4. replay
    const replayMsg = await replayCommand({ cwd: tempDir, targetCid: genesisCid });
    assert.ok(replayMsg.includes(`Replay target: ${genesisCid}`));
    assert.ok(replayMsg.includes("Deltas folded: 0"));

    // 5. query
    const queryMsg = queryCommand({
      cwd: tempDir,
      cql: "SELECT cid, adapter.id FROM branch('main');",
    });
    assert.ok(queryMsg.includes("Returned 1 rows"));
    assert.ok(queryMsg.includes("chrono.core"));
  });
});
