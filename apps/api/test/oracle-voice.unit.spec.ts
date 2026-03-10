import { Test } from '@nestjs/testing';
import { PrismaClient } from '@ai-aztec/db';
import { OracleVoiceModule } from '../src/oracle/voice/oracle-voice.module';
import { OracleVoiceService } from '../src/oracle/voice/oracle-voice.service';
import { VoiceStorageService } from '../src/oracle/voice/storage.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Oracle Voice (unit)', () => {
  let service: OracleVoiceService;
  let prisma: PrismaClient;

  const fixturesDir = path.join(__dirname, 'fixtures');
  const sample1Path = path.join(fixturesDir, 'sample1.wav');
  const sample2Path = path.join(fixturesDir, 'sample2.wav');

  beforeAll(async () => {
    process.env.VOICE_ENABLED = 'true';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aztec_test';

    const moduleRef = await Test.createTestingModule({
      imports: [OracleVoiceModule],
    }).compile();

    service = moduleRef.get(OracleVoiceService);
    prisma = moduleRef.get(PrismaClient);
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('should create session', async () => {
    const result = await service.createSession({ mode: 'MODE_PA' });
    expect(result.sessionId).toBeDefined();
    expect(result.correlationId).toBeDefined();
  });

  it('should ingest chunk and create segments', async () => {
    const { sessionId } = await service.createSession({ mode: 'MODE_PA' });
    const buf = fs.existsSync(sample1Path)
      ? fs.readFileSync(sample1Path)
      : Buffer.alloc(1024, 0);

    const result = await service.ingestChunk(sessionId, buf, 0, 'audio/wav', 16000, 1);
    expect(result.accepted).toBe(true);
    expect(result.chunkId).toBeDefined();
    expect(result.segmentsCreated).toBeGreaterThan(0);
  });

  it('should create speaker and enroll', async () => {
    const speaker = await service.createSpeaker({
      displayName: 'TestSpeaker',
      roleLabel: 'Test',
    });
    expect(speaker.id).toBeDefined();

    const buf = fs.existsSync(sample1Path)
      ? fs.readFileSync(sample1Path)
      : Buffer.alloc(512);
    const enrollResult = await service.enrollSpeaker(speaker.id, buf, 'audio/wav');
    expect(enrollResult.voiceprintId).toBeDefined();
  });

  it('should generate minutes artifact with checksum', async () => {
    const { sessionId } = await service.createSession({ mode: 'MODE_PA' });
    const buf = fs.existsSync(sample1Path)
      ? fs.readFileSync(sample1Path)
      : Buffer.alloc(1024);
    await service.ingestChunk(sessionId, buf, 0, 'audio/wav');

    const generated = await service.generateArtifacts(sessionId, ['MINUTES']);
    expect(generated).toHaveLength(1);
    expect(generated[0].type).toBe('MINUTES');

    const artifacts = await service.getArtifacts(sessionId);
    expect(artifacts.length).toBeGreaterThan(0);
    const art = artifacts[0] as { contentMarkdown?: string; checksumSha256?: string };
    expect(art.contentMarkdown).toContain('TYBELOS Voice');
    expect(art.contentMarkdown).toContain('AZTEC ORACLE');
    expect(art.checksumSha256).toBeDefined();
    expect(art.checksumSha256!.length).toBe(64);
  });
});
