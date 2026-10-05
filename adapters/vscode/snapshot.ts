/**
 * CHRONO ADAPTER: VS CODE - SNAPSHOT
 * 
 * Captures open documents, dirty buffers, active cursor locations,
 * and workspace folder layouts into a consolidated HostSnapshot.
 */

import type { HostSnapshot } from "../sdk/adapter.ts";

export interface EditorDocumentLike {
  uri: { toString(): string };
  isDirty: boolean;
  getText(): string;
  languageId: string;
}

export interface TextEditorLike {
  document: EditorDocumentLike;
  selection?: {
    active: { line: number; character: number };
    anchor: { line: number; character: number };
  };
}

export class VSCodeSnapshotter {
  /**
   * Produce a complete HostSnapshot from active text documents and visible editors.
   */
  public captureSnapshot(
    openDocuments: Iterable<EditorDocumentLike>,
    activeEditor?: TextEditorLike
  ): HostSnapshot {
    const domains: Record<string, unknown> = {};
    let totalBytes = 0;

    for (const doc of openDocuments) {
      const uri = doc.uri.toString();
      if (uri.startsWith("output:") || uri.startsWith("git:")) {
        continue;
      }

      const content = doc.getText();
      totalBytes += content.length;

      domains[uri] = {
        content,
        isDirty: doc.isDirty,
        languageId: doc.languageId,
      };
    }

    if (activeEditor) {
      domains["chrono://editor/active"] = {
        uri: activeEditor.document.uri.toString(),
        cursor: activeEditor.selection?.active,
        anchor: activeEditor.selection?.anchor,
      };
    }

    return {
      timestamp: new Date().toISOString(),
      domains,
      byteSize: totalBytes,
    };
  }
}
