/**
 * CHRONO ADAPTER: VS CODE - EXTENSION BRIDGE
 * 
 * Main entry point implementing ChronoAdapter for Visual Studio Code.
 */

import type {
  ChronoAdapter,
  AdapterContext,
  HostSnapshot,
  RestoreRequest,
  RestoreResult,
  SemanticDelta,
} from "../sdk/adapter.ts";
import {
  AdapterTier,
  createCapabilityProfile,
} from "../sdk/capability.ts";
import type { AdapterCapabilityProfile } from "../sdk/capability.ts";
import { VSCodeObserver } from "./observe.ts";
import type { TextDocumentChangeEventLike } from "./observe.ts";
import { VSCodeSnapshotter } from "./snapshot.ts";
import type { EditorDocumentLike, TextEditorLike } from "./snapshot.ts";
import { VSCodeRestorer } from "./restore.ts";

export class VSCodeChronoAdapter implements ChronoAdapter {
  public readonly id = "chrono.adapter.vscode";
  public readonly name = "Chrono VS Code Adapter";
  public readonly version = "1.0.0";
  public readonly capabilities: AdapterCapabilityProfile;

  private readonly observer: VSCodeObserver;
  private readonly snapshotter: VSCodeSnapshotter;
  private readonly restorer: VSCodeRestorer;

  private context: AdapterContext | null = null;
  private openDocsProvider: (() => Iterable<EditorDocumentLike>) | null = null;
  private activeEditorProvider: (() => TextEditorLike | undefined) | null = null;
  private bufferWriter: ((uri: string, content: string) => Promise<boolean>) | null = null;

  constructor() {
    this.capabilities = createCapabilityProfile(
      this.id,
      this.name,
      this.version,
      AdapterTier.TIER_2_DELTA_RESTORE,
      {
        "text.buffer": {
          canSnapshot: true,
          canRestore: true,
          canStreamDeltas: true,
          canInvertDelta: true,
        },
        "editor.selection": {
          canSnapshot: true,
          canRestore: false,
          canStreamDeltas: false,
        },
      }
    );

    this.observer = new VSCodeObserver();
    this.snapshotter = new VSCodeSnapshotter();
    this.restorer = new VSCodeRestorer();
  }

  public async initialize(context: AdapterContext): Promise<void> {
    this.context = context;
    context.logger.info(`Initialized ${this.name} v${this.version}`);
  }

  public bindEditorHooks(
    openDocs: () => Iterable<EditorDocumentLike>,
    activeEditor: () => TextEditorLike | undefined,
    bufferWriter: (uri: string, content: string) => Promise<boolean>
  ): void {
    this.openDocsProvider = openDocs;
    this.activeEditorProvider = activeEditor;
    this.bufferWriter = bufferWriter;
  }

  public async handleDocumentChange(event: TextDocumentChangeEventLike): Promise<void> {
    await this.observer.handleDocumentChange(event);
  }

  public async snapshot(): Promise<HostSnapshot> {
    const docs = this.openDocsProvider ? this.openDocsProvider() : [];
    const editor = this.activeEditorProvider ? this.activeEditorProvider() : undefined;
    return this.snapshotter.captureSnapshot(docs, editor);
  }

  public async restore(request: RestoreRequest): Promise<RestoreResult> {
    if (!this.bufferWriter) {
      return {
        success: false,
        restoredCid: request.targetCid,
        errorMessage: "Buffer writer not bound to VS Code editor environment",
      };
    }
    return this.restorer.restoreState(request, this.bufferWriter);
  }

  public subscribeDeltas(listener: (delta: SemanticDelta) => Promise<void>): void {
    this.observer.onDelta(listener);
  }

  public diff(stateA: unknown, stateB: unknown): SemanticDelta[] {
    // Basic snapshot-to-snapshot diff implementation
    const diffs: SemanticDelta[] = [];
    const mapA = (stateA as Record<string, string>) || {};
    const mapB = (stateB as Record<string, string>) || {};

    const allKeys = new Set([...Object.keys(mapA), ...Object.keys(mapB)]);
    for (const key of allKeys) {
      const valA = mapA[key] ?? "";
      const valB = mapB[key] ?? "";
      if (valA !== valB) {
        diffs.push({
          type: "text.splice",
          targetUri: key,
          forward: {
            kind: "text.splice",
            range: { start: 0, end: valA.length },
            new_text: valB,
          },
        });
      }
    }
    return diffs;
  }

  public async dispose(): Promise<void> {
    this.context?.logger.info(`Disposed ${this.name}`);
  }
}
