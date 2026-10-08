/**
 * CHRONO: CONTENT DEDUPLICATION ENGINE
 * 
 * Ensures identical states and repetitive buffer edits share common content blocks.
 */

import crypto from "node:crypto";

export class ContentDeduplicator {
  private readonly blockMap: Map<string, string> = new Map();

  public intern(content: string): string {
    const hash = this.hashContent(content);
    if (!this.blockMap.has(hash)) {
      this.blockMap.set(hash, content);
    }
    return hash;
  }

  public get(hash: string): string | undefined {
    return this.blockMap.get(hash);
  }

  public has(hash: string): boolean {
    return this.blockMap.has(hash);
  }

  public get blockCount(): number {
    return this.blockMap.size;
  }

  private hashContent(content: string): string {
    return "b3_" + crypto.createHash("sha256").update(content).digest("hex");
  }
}
