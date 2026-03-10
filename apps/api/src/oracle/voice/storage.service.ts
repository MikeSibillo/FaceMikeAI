import * as fs from 'fs';
import * as path from 'path';

import { Injectable } from '@nestjs/common';

const STORAGE_ROOT = process.env.VOICE_STORAGE_PATH || path.join(process.cwd(), 'uploads', 'oracle-voice');

@Injectable()
export class VoiceStorageService {
  ensureDir(): void {
    if (!fs.existsSync(STORAGE_ROOT)) {
      fs.mkdirSync(STORAGE_ROOT, { recursive: true });
    }
  }

  getPath(sessionId: string, chunkId: string): string {
    const dir = path.join(STORAGE_ROOT, sessionId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `${chunkId}.bin`);
  }

  saveChunk(sessionId: string, chunkId: string, buffer: Buffer): string {
    this.ensureDir();
    const fp = this.getPath(sessionId, chunkId);
    fs.writeFileSync(fp, buffer);
    return fp;
  }

  loadChunk(sessionId: string, chunkId: string): Buffer | null {
    const fp = this.getPath(sessionId, chunkId);
    if (!fs.existsSync(fp)) return null;
    return fs.readFileSync(fp);
  }
}
