/**
 * CHRONO: TIMELINE INDEX
 * 
 * Maps human wall-clock time to logical causality and DAG nodes.
 * Allows queries like "what happened 20 minutes ago" or "between 2pm and 3pm".
 */

import { StateNode } from "../graph/node.ts";

export interface TimelineEntry {
  cid: string;
  wallTimeMs: number;
  wallTimeIso: string;
  branch: string;
  label: string;
}

export class TimelineIndex {
  private entries: TimelineEntry[] = [];

  public indexNode(node: StateNode): void {
    const wallMs = new Date(node.wallTime).getTime();
    this.entries.push({
      cid: node.cid,
      wallTimeMs: wallMs,
      wallTimeIso: node.wallTime,
      branch: (node.annotations?.branch as string) || "main",
      label: (node.annotations?.label as string) || "",
    });

    // Keep sorted by wall time
    this.entries.sort((a, b) => a.wallTimeMs - b.wallTimeMs);
  }

  public findNearestToTime(targetTimeMs: number): TimelineEntry | null {
    if (this.entries.length === 0) return null;

    let closest = this.entries[0];
    let minDiff = Math.abs(closest.wallTimeMs - targetTimeMs);

    for (const entry of this.entries) {
      const diff = Math.abs(entry.wallTimeMs - targetTimeMs);
      if (diff < minDiff) {
        minDiff = diff;
        closest = entry;
      }
    }

    return closest;
  }

  public findRange(startTimeMs: number, endTimeMs: number): TimelineEntry[] {
    return this.entries.filter(
      (e) => e.wallTimeMs >= startTimeMs && e.wallTimeMs <= endTimeMs
    );
  }

  public getRecent(count: number): TimelineEntry[] {
    return this.entries.slice(-count);
  }
}
