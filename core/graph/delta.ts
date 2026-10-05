/**
 * CHRONO CORE GRAPH: SEMANTIC DELTA
 * 
 * Defines structured domain mutations, inversion semantics, and algebraic composition.
 */

export interface TextSpliceOperation {
  range: {
    start: number;
    end: number;
  };
  text: string;
}

export interface FileMutationOperation {
  path: string;
  action: "create" | "modify" | "delete" | "rename";
  newContent?: string;
  oldContent?: string;
}

export interface TerminalExecOperation {
  command: string;
  cwd: string;
  exitCode?: number;
  stdoutDelta?: string;
}

export type DeltaPayload =
  | { kind: "text.splice"; splice: TextSpliceOperation }
  | { kind: "fs.mutation"; mutation: FileMutationOperation }
  | { kind: "terminal.exec"; exec: TerminalExecOperation }
  | { kind: "custom"; data: Record<string, unknown> };

export interface SemanticDelta {
  /** Domain mutation classification */
  readonly type: string;

  /** URI of the entity being modified */
  readonly targetUri: string;

  /** Forward operation parameters to advance state */
  readonly forward: DeltaPayload;

  /** Optional reverse operation to revert state backwards */
  readonly reverse?: DeltaPayload;

  /** Contextual domain information (AST node, cursor, env) */
  readonly context?: Record<string, unknown>;
}

/**
 * Apply a text splice operation to a string buffer
 */
export function applyTextSplice(
  buffer: string,
  splice: TextSpliceOperation
): string {
  const { start, end } = splice.range;
  if (start < 0 || end < start || start > buffer.length) {
    throw new RangeError(
      `Invalid splice range [${start}, ${end}] for buffer length ${buffer.length}`
    );
  }
  return buffer.slice(0, start) + splice.text + buffer.slice(end);
}

/**
 * Invert a text splice operation given the original replaced text
 */
export function invertTextSplice(
  splice: TextSpliceOperation,
  replacedOriginalText: string
): TextSpliceOperation {
  return {
    range: {
      start: splice.range.start,
      end: splice.range.start + splice.text.length,
    },
    text: replacedOriginalText,
  };
}
