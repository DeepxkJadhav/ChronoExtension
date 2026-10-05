/**
 * CHRONO ADAPTER: VS CODE - RESTORE
 * 
 * Rehydrates the VS Code editor buffers to a historical state node.
 */

import type { RestoreRequest, RestoreResult } from "../sdk/adapter.ts";

export interface WorkspaceEditLike {
  replace(uri: unknown, range: unknown, newText: string): void;
}

export interface WorkspaceLike {
  applyEdit(edit: WorkspaceEditLike): Promise<boolean>;
  openTextDocument(uri: string): Promise<unknown>;
}

export class VSCodeRestorer {
  /**
   * Apply reconstructed document buffers into active VS Code documents.
   */
  public async restoreState(
    request: RestoreRequest,
    applyBufferToUri: (uriString: string, content: string) => Promise<boolean>
  ): Promise<RestoreResult> {
    try {
      for (const [uri, domainData] of Object.entries(request.state)) {
        if (uri.startsWith("chrono://")) {
          // Internal UI/cursor metadata, skip direct document edit
          continue;
        }

        let content = "";
        if (typeof domainData === "string") {
          content = domainData;
        } else if (domainData && typeof domainData === "object" && "content" in domainData) {
          content = String((domainData as { content: unknown }).content);
        }

        const success = await applyBufferToUri(uri, content);
        if (!success) {
          return {
            success: false,
            restoredCid: request.targetCid,
            errorMessage: `Failed to apply reconstructed buffer to document ${uri}`,
          };
        }
      }

      return {
        success: true,
        restoredCid: request.targetCid,
      };
    } catch (err: unknown) {
      return {
        success: false,
        restoredCid: request.targetCid,
        errorMessage: (err as Error).message,
      };
    }
  }
}
