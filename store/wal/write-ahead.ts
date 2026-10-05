/**
 * CHRONO STORE: WRITE-AHEAD LOG (WAL)
 * 
 * Provides durability, crash recovery, and fast append-only logging for state mutations.
 * In accordance with Rule 1 ("State is never destroyed") and Rule 7 ("Local Sovereignty").
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Buffer } from "node:buffer";

export interface WALRecord {
  sequenceNumber: number;
  timestamp: string;
  type: "node.emit" | "branch.update" | "epoch.checkpoint" | "custom";
  payload: Record<string, unknown>;
}

/**
 * Simple 32-bit Adler-32 / CRC checksum for integrity validation
 */
export function calculateChecksum(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  const MOD_ADLER = 65521;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % MOD_ADLER;
    b = (b + a) % MOD_ADLER;
  }
  return (b << 16) | a;
}

export class WriteAheadLog {
  private fileHandle: fs.FileHandle | null = null;
  private currentSeq = 0;
  private readonly walPath: string;

  constructor(walPath: string) {
    this.walPath = walPath;
  }

  public async open(): Promise<void> {
    await fs.mkdir(path.dirname(this.walPath), { recursive: true });
    this.fileHandle = await fs.open(this.walPath, "a+");
  }

  /**
   * Append a structured record to the WAL with length-prefixing and checksum
   */
  public async append(type: WALRecord["type"], payload: Record<string, unknown>): Promise<number> {
    if (!this.fileHandle) {
      throw new Error("WAL is not open. Call open() first.");
    }

    this.currentSeq++;
    const record: WALRecord = {
      sequenceNumber: this.currentSeq,
      timestamp: new Date().toISOString(),
      type,
      payload,
    };

    const serialized = Buffer.from(JSON.stringify(record), "utf-8");
    const checksum = calculateChecksum(serialized);

    // Frame: [4 bytes payload length] [4 bytes checksum] [payload bytes]
    const header = Buffer.alloc(8);
    header.writeUInt32BE(serialized.length, 0);
    header.writeInt32BE(checksum, 4);

    await this.fileHandle.write(header);
    await this.fileHandle.write(serialized);

    return this.currentSeq;
  }

  /**
   * Force sync buffer to physical disk
   */
  public async sync(): Promise<void> {
    if (this.fileHandle) {
      await this.fileHandle.sync();
    }
  }

  /**
   * Replay all valid records from the start of the WAL for recovery after restart
   */
  public async replay(onRecord: (record: WALRecord) => void | Promise<void>): Promise<number> {
    if (!this.fileHandle) {
      throw new Error("WAL is not open. Call open() first.");
    }

    const fileStat = await this.fileHandle.stat();
    if (fileStat.size === 0) {
      return 0;
    }

    const buffer = await fs.readFile(this.walPath);
    let offset = 0;
    let count = 0;

    while (offset + 8 <= buffer.length) {
      const payloadLength = buffer.readUInt32BE(offset);
      const expectedChecksum = buffer.readInt32BE(offset + 4);
      offset += 8;

      if (offset + payloadLength > buffer.length) {
        // Incomplete / truncated write at end of WAL; stop safely
        break;
      }

      const payloadBytes = buffer.subarray(offset, offset + payloadLength);
      offset += payloadLength;

      const actualChecksum = calculateChecksum(payloadBytes);
      if (actualChecksum !== expectedChecksum) {
        throw new Error(
          `WAL corruption detected at byte offset ${offset}: checksum mismatch (expected ${expectedChecksum}, got ${actualChecksum})`
        );
      }

      const rawJson = payloadBytes.toString("utf-8");
      const record = JSON.parse(rawJson) as WALRecord;
      if (record.sequenceNumber > this.currentSeq) {
        this.currentSeq = record.sequenceNumber;
      }

      await onRecord(record);
      count++;
    }

    return count;
  }

  /**
   * Reset / rotate WAL after full checkpoint to sqlite
   */
  public async truncate(): Promise<void> {
    if (this.fileHandle) {
      await this.fileHandle.truncate(0);
      this.currentSeq = 0;
    }
  }

  public async close(): Promise<void> {
    if (this.fileHandle) {
      await this.fileHandle.sync();
      await this.fileHandle.close();
      this.fileHandle = null;
    }
  }
}
