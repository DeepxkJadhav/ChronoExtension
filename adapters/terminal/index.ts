/**
 * CHRONO ADAPTER: TERMINAL
 * 
 * Captures terminal command executions, exit codes, and standard error streams.
 */

import type { SemanticDelta } from "../sdk/adapter.ts";

export interface TerminalExecution {
  command: string;
  exitCode: number;
  stdout?: string;
  stderr?: string;
  cwd?: string;
}

export class TerminalAdapter {
  public readonly id = "chrono.adapter.terminal";
  public readonly version = "1.0.0";

  public captureExecution(ptyUri: string, exec: TerminalExecution): SemanticDelta {
    return {
      type: "terminal.exec",
      targetUri: ptyUri,
      forward: {
        kind: "terminal.exec",
        command: exec.command,
        exit_code: exec.exitCode,
        stdout: exec.stdout,
        stderr: exec.stderr,
        cwd: exec.cwd || process.cwd(),
      },
    };
  }
}
