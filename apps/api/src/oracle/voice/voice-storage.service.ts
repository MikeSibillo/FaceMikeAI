import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VoiceStorageService {
  private readonly baseDir: string;

  constructor() {
    this.baseDir = process.env.VOICE_STORAGE_PATH || path.join(process.cwd(), 'uploads', 'oracle-voice');
  }

  async saveChunk(sessionId: string, chunkIndex: number, buffer: Buffer): Promise<{ storageKey: string; sha256: string }> {
    const dir = path.join(this.baseDir, sessionId);
    await fs.promises.mkdir(dir, { recursive: true });
    const storageKey = `${sessionId}/${chunkIndex}.bin`;
    const filePath = path.join(this.baseDir, storageKey);
    await fs.promises.writeFile(filePath, buffer);
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    return { storageKey, sha256 };
  }

  async readChunk(storageKey: string): Promise<Buffer> {
    const filePath = path.join(this.baseDir, storageKey);
    return fs.promises.readFile(filePath);
  }
}
