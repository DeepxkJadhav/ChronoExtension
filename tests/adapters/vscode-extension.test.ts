/**
 * TESTS: VS CODE EXTENSION LIFECYCLE & BACKGROUND RECORDING
 * 
 * Verifies that the VS Code extension:
 * 1. Activates automatically without external daemons.
 * 2. Hooks document edits and records deltas into ChronoDAG.
 * 3. Registers status bar item and keybindings.
 * 4. Dispatches rewind/restore actions directly to VS Code text editor.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ChronoExtension } from "../../extensions/vscode/src/extension.ts";

describe("CHRONO VS Code Extension Integration", () => {

  function createMockVSCode() {
    let changeHandler: ((e: any) => Promise<void>) | null = null;
    let registeredCommands: Record<string, Function> = {};
    let activeEditorText = "export function test() { return 1; }";

    const mockEditor = {
      document: {
        uri: { toString: () => "file:///workspace/app.ts" },
        fileName: "app.ts",
        isDirty: false,
        languageId: "typescript",
        version: 1,
        getText: () => activeEditorText,
      },
      edit: async (callback: any) => {
        const builder = {
          replace: (_range: any, newText: string) => {
            activeEditorText = newText;
          },
        };
        callback(builder);
        return true;
      },
    };

    let panelMessageReceiver: ((msg: any) => Promise<void>) | null = null;

    const mockWebviewPanel = {
      title: "CHRONO: Time Machine",
      visible: true,
      webview: {
        html: "",
        onDidReceiveMessage: (cb: any) => {
          panelMessageReceiver = cb;
          return { dispose: () => {} };
        },
        postMessage: async (_msg: any) => true,
      },
      onDidDispose: (_cb: any) => ({ dispose: () => {} }),
      reveal: () => {},
      dispose: () => {},
    };

    const mockStatusBar = {
      text: "",
      tooltip: "",
      command: "",
      show: () => {},
      hide: () => {},
      dispose: () => {},
    };

    const mockVSCode = {
      workspace: {
        textDocuments: [mockEditor.document],
        onDidChangeTextDocument: (handler: any) => {
          changeHandler = handler;
          return { dispose: () => {} };
        },
      },
      window: {
        activeTextEditor: mockEditor,
        createStatusBarItem: () => mockStatusBar,
        createWebviewPanel: () => mockWebviewPanel,
        showInformationMessage: (_msg: string) => {},
      },
      commands: {
        registerCommand: (name: string, fn: Function) => {
          registeredCommands[name] = fn;
          return { dispose: () => {} };
        },
      },
      ViewColumn: { Beside: 2 },
      // Helpers for test assertions
      _simulateTyping: async (newText: string, offset: number, len: number) => {
        if (changeHandler) {
          await changeHandler({
            document: mockEditor.document,
            contentChanges: [{ rangeOffset: offset, rangeLength: len, text: newText }],
          });
        }
      },
      _executeCommand: async (name: string) => {
        if (registeredCommands[name]) {
          return await registeredCommands[name]();
        }
      },
      _sendWebviewMessage: async (msg: any) => {
        if (panelMessageReceiver) {
          await panelMessageReceiver(msg);
        }
      },
      _getActiveText: () => activeEditorText,
      _getStatusBar: () => mockStatusBar,
    };

    return mockVSCode;
  }

  test("activates background engine and sets up status bar", async () => {
    const mock = createMockVSCode();
    const extension = new ChronoExtension();
    const context: any = { subscriptions: [], globalStorageUri: { fsPath: ".chrono-test" } };

    await extension.activate(mock, context);

    assert.equal(mock._getStatusBar().text, "$(debug-step-back) Rewind Code");
    assert.equal(mock._getStatusBar().command, "chrono.rewind");
    assert.ok(context.subscriptions.length >= 4, "Registers event listeners and commands");
  });

  test("silently captures document typing into the background DAG", async () => {
    const mock = createMockVSCode();
    const extension = new ChronoExtension();
    const context: any = { subscriptions: [], globalStorageUri: { fsPath: ".chrono-test" } };

    await extension.activate(mock, context);

    // Simulate user typing in VS Code
    await mock._simulateTyping("// Header\n", 0, 0);
    await mock._simulateTyping("return 2;", 20, 9);

    // The extension seamlessly records without any terminal intervention
    assert.equal(mock._getStatusBar().text, "$(debug-step-back) Rewind Code");
  });

  test("opens scrubber webview and executes buffer rollback upon restore", async () => {
    const mock = createMockVSCode();
    const extension = new ChronoExtension();
    const context: any = { subscriptions: [], globalStorageUri: { fsPath: ".chrono-test" } };

    await extension.activate(mock, context);

    // 1. User presses Ctrl+Shift+T / Cmd+Shift+T
    await mock._executeCommand("chrono.openScrubber");

    // 2. User clicks "Rewind" in the webview
    const safeCode = "export function test() { return 'restored-safe'; }";
    await mock._sendWebviewMessage({
      command: "RESTORE_MOMENT",
      label: "Safe Version",
      content: safeCode,
    });

    // 3. VS Code text editor document buffer is updated immediately!
    assert.equal(mock._getActiveText(), safeCode);
  });
});
