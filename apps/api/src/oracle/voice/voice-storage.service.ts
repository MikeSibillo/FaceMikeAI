import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VoiceStorageService {
  private readonly baseDir = process.env.VOICE_STORAGE_PATH || 'uploads/oracle-voice';

  ensureDir(): string {
    const dir = path.resolve(process.cwd(), this.baseDir);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  saveChunk(sessionId: string, chunkIndex: number, buffer: Buffer): { storageKey: string; sha256: string } {
    const dir = this.ensureDir();
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    const ext = 'bin';
    const storageKey = `${sessionId}/${chunkIndex}.${ext}`;
    const fullPath = path.join(dir, storageKey);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    return { storageKey, sha256 };
  }

  getChunk(storageKey: string): Buffer | null {
    const fullPath = path.resolve(process.cwd(), this.baseDir, storageKey);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath);
  }
}
