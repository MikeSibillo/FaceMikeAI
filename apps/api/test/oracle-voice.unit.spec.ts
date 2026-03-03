import { Test, TestingModule } from '@nestjs/testing';
import { DbModule } from '../src/db/db.module';
import { OracleVoiceModule } from '../src/oracle/voice/oracle-voice.module';
import { OracleVoiceService } from '../src/oracle/voice/oracle-voice.service';
import { PrismaService } from '../src/db/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Oracle Voice (unit)', () => {
  let service: OracleVoiceService;
  let prisma: PrismaService;
  const origEnv = process.env;

  beforeAll(async () => {
    process.env.VOICE_ENABLED = 'true';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/test';
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbModule, OracleVoiceModule],
    }).compile();
    service = module.get<OracleVoiceService>(OracleVoiceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    process.env = origEnv;
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.oracleMeetingArtifact.deleteMany();
    await prisma.oracleMeetingEvent.deleteMany();
    await prisma.oracleTranscriptSegment.deleteMany();
    await prisma.oracleVoiceChunk.deleteMany();
    await prisma.oracleVoiceSession.deleteMany();
    await prisma.oracleVoiceprint.deleteMany();
    await prisma.oracleSpeakerProfile.deleteMany();
  });

  it('create session -> ingest chunk -> segments', async () => {
    const { sessionId, correlationId } = await service.createSession({
      mode: 'MODE_PA',
      organizationId: 'org1',
      projectId: 'proj1',
    });
    expect(sessionId).toBeDefined();
    expect(correlationId).toBeDefined();

    const fixturePath = path.join(__dirname, 'fixtures', 'sample1.wav');
    const audioBytes = fs.readFileSync(fixturePath);

    const result = await service.ingestChunk(sessionId, 0, audioBytes, 'audio/wav');
    expect(result.accepted).toBe(true);
    expect(result.chunkId).toBeDefined();
    expect(result.segmentsCreated.length).toBeGreaterThan(0);

    const timeline = await service.getTimeline(sessionId);
    expect(timeline.segments.length).toBeGreaterThan(0);
    expect(timeline.segments[0].text).toContain('Buongiorno');
    expect(timeline.segments[0].speakerLabel).toBeDefined();
  });

  it('enrollment -> matching', async () => {
    const profile = await service.createSpeaker({
      displayName: 'Michele',
      roleLabel: 'Responsabile',
    });
    expect(profile.id).toBeDefined();

    const fixturePath = path.join(__dirname, 'fixtures', 'sample1.wav');
    const audioBytes = fs.readFileSync(fixturePath);

    const enroll = await service.enrollVoice(profile.id, audioBytes, 'audio/wav');
    expect(enroll.voiceprintId).toBeDefined();
  });

  it('generate minutes -> checksum', async () => {
    const { sessionId } = await service.createSession({ mode: 'MODE_PA' });
    const fixturePath = path.join(__dirname, 'fixtures', 'sample1.wav');
    const audioBytes = fs.readFileSync(fixturePath);
    await service.ingestChunk(sessionId, 0, audioBytes, 'audio/wav');

    const arts = await service.generateArtifacts(sessionId, ['MINUTES', 'LEGAL_ACT']);
    expect(arts.length).toBe(2);
    expect(arts[0].checksum).toBeDefined();
    expect(arts[0].type).toBe('MINUTES');

    const artifact = await service.getArtifact(arts[0].id);
    expect(artifact.contentMarkdown).toContain('TYBELOS Voice');
    expect(artifact.contentMarkdown).toContain('Buongiorno');
    expect(artifact.contentMarkdown).toContain('AZTEC ORACLE (SAFE)');
  });
});
