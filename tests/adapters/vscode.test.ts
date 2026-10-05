import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VSCodeChronoAdapter } from "../../adapters/vscode/index.ts";
import type { EditorDocumentLike, TextEditorLike } from "../../adapters/vscode/snapshot.ts";
import type { SemanticDelta } from "../../adapters/sdk/adapter.ts";

describe("VS Code Adapter Contract & Lifecycle", () => {
  it("initializes and declares Tier 2 capabilities", async () => {
    const adapter = new VSCodeChronoAdapter();
    assert.equal(adapter.id, "chrono.adapter.vscode");
    assert.equal(adapter.capabilities.tier, 2);
    assert.equal(adapter.capabilities.domains["text.buffer"].canStreamDeltas, true);
    assert.equal(adapter.capabilities.domains["text.buffer"].canRestore, true);

    await adapter.initialize({
      workspaceRoot: "/workspace",
      daemonIpcPath: "/tmp/chrono.sock",
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    });
  });

  it("intercepts editor document changes and translates to semantic deltas", async () => {
    const adapter = new VSCodeChronoAdapter();
    const emittedDeltas: SemanticDelta[] = [];

    adapter.subscribeDeltas(async (delta) => {
      emittedDeltas.push(delta);
    });

    // Simulate VS Code onDidChangeTextDocument event
    await adapter.handleDocumentChange({
      document: {
        uri: { toString: () => "file:///workspace/src/app.ts" },
        getText: () => "const greeting = 'hello';",
        offsetAt: () => 0,
      },
      contentChanges: [
        {
          rangeOffset: 17,
          rangeLength: 5,
          text: "world",
          range: {
            start: { line: 0, character: 17 },
            end: { line: 0, character: 22 },
          },
        },
      ],
    });

    assert.equal(emittedDeltas.length, 1);
    const d = emittedDeltas[0];
    assert.equal(d.type, "text.splice");
    assert.equal(d.targetUri, "file:///workspace/src/app.ts");
    assert.deepEqual(d.forward, {
      kind: "text.splice",
      range: { start: 17, end: 22 },
      new_text: "world",
    });
  });

  it("snapshots and restores open documents", async () => {
    const adapter = new VSCodeChronoAdapter();
    const virtualFiles = new Map<string, string>([
      ["file:///workspace/src/index.ts", "console.log('original');"],
    ]);

    // Bind mock VS Code environment
    adapter.bindEditorHooks(
      () => [
        {
          uri: { toString: () => "file:///workspace/src/index.ts" },
          isDirty: false,
          getText: () => virtualFiles.get("file:///workspace/src/index.ts") ?? "",
          languageId: "typescript",
        },
      ],
      () => ({
        document: {
          uri: { toString: () => "file:///workspace/src/index.ts" },
          isDirty: false,
          getText: () => virtualFiles.get("file:///workspace/src/index.ts") ?? "",
          languageId: "typescript",
        },
        selection: {
          active: { line: 0, character: 10 },
          anchor: { line: 0, character: 10 },
        },
      }),
      async (uri, content) => {
        virtualFiles.set(uri, content);
        return true;
      }
    );

    // Capture snapshot
    const snap = await adapter.snapshot();
    assert.ok(snap.domains["file:///workspace/src/index.ts"]);

    // Restore to past state
    const restoreResult = await adapter.restore({
      targetCid: "b3_target123",
      state: {
        "file:///workspace/src/index.ts": "console.log('restored in past');",
      },
    });

    assert.equal(restoreResult.success, true);
    assert.equal(
      virtualFiles.get("file:///workspace/src/index.ts"),
      "console.log('restored in past');"
    );
  });
});
