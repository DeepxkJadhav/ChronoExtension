/**
 * CHRONO VS CODE EXTENSION: TYPES
 * 
 * Minimal type definitions reflecting the VS Code Extension API.
 * Ensures zero-dependency compilation and direct runtime compatibility.
 */

export interface VSCodePosition {
  line: number;
  character: number;
}

export interface VSCodeRange {
  start: VSCodePosition;
  end: VSCodePosition;
}

export interface VSCodeTextDocumentContentChangeEvent {
  range: VSCodeRange;
  rangeOffset: number;
  rangeLength: number;
  text: string;
}

export interface VSCodeUri {
  toString(): string;
  fsPath: string;
  scheme: string;
}

export interface VSCodeTextDocument {
  uri: VSCodeUri;
  fileName: string;
  isDirty: boolean;
  languageId: string;
  version: number;
  getText(range?: VSCodeRange): string;
}

export interface VSCodeTextEditor {
  document: VSCodeTextDocument;
  selection?: {
    active: VSCodePosition;
    anchor: VSCodePosition;
  };
  edit(callback: (editBuilder: any) => void): Thenable<boolean>;
}

export interface VSCodeWebviewPanel {
  title: string;
  visible: boolean;
  webview: {
    html: string;
    onDidReceiveMessage(listener: (message: any) => any): { dispose(): void };
    postMessage(message: any): Thenable<boolean>;
  };
  onDidDispose(listener: () => any): { dispose(): void };
  reveal(column?: number): void;
  dispose(): void;
}

export interface VSCodeStatusBarItem {
  text: string;
  tooltip?: string;
  command?: string;
  show(): void;
  hide(): void;
  dispose(): void;
}

export interface VSCodeExtensionContext {
  subscriptions: { dispose(): any }[];
  extensionPath: string;
  globalStorageUri: VSCodeUri;
}
