/**
 * CHRONO ADAPTER: VS CODE - OBSERVE
 * 
 * Captures real-time editor mutations (document changes, cursor movements)
 * and translates them into CHRONO Semantic Deltas.
 */

import type { SemanticDelta } from "../sdk/adapter.ts";

export interface TextDocumentChangeEventLike {
  document: {
    uri: { toString(): string };
    getText(range?: unknown): string;
    offsetAt(position: { line: number; character: number }): number;
  };
  contentChanges: ReadonlyArray<{
    rangeOffset: number;
    rangeLength: number;
    text: string;
    range: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
  }>;
}

export class VSCodeObserver {
  private deltaListener: ((delta: SemanticDelta) => Promise<void>) | null = null;

  public onDelta(listener: (delta: SemanticDelta) => Promise<void>): void {
    this.deltaListener = listener;
  }

  /**
   * Handle VS Code workspace.onDidChangeTextDocument
   */
  public async handleDocumentChange(event: TextDocumentChangeEventLike): Promise<void> {
    if (!this.deltaListener || event.contentChanges.length === 0) {
      return;
    }

    const targetUri = event.document.uri.toString();

    // Ignore internal scheme files (git:, output:, vscode-userdata:)
    if (targetUri.startsWith("output:") || targetUri.startsWith("vscode-userdata:")) {
      return;
    }

    for (const change of event.contentChanges) {
      const forwardSplice = {
        range: {
          start: change.rangeOffset,
          end: change.rangeOffset + change.rangeLength,
        },
        text: change.text,
      };

      const semanticDelta: SemanticDelta = {
        type: "text.splice",
        targetUri,
        forward: {
          kind: "text.splice",
          range: forwardSplice.range,
          new_text: forwardSplice.text,
        },
        context: {
          startLine: change.range.start.line,
          startChar: change.range.start.character,
          endLine: change.range.end.line,
          endChar: change.range.end.character,
        },
      };

      await this.deltaListener(semanticDelta);
    }
  }
}
