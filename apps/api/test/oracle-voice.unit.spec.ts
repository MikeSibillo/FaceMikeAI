import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../src/prisma/prisma.module';
import { VoiceModule } from '../src/oracle/voice/voice.module';
import { VoiceSessionService } from '../src/oracle/voice/voice-session.service';
import { VoiceSpeakerService } from '../src/oracle/voice/voice-speaker.service';
import { PrismaService } from '../src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Oracle Voice (unit)', () => {
  let sessionService: VoiceSessionService;
  let speakerService: VoiceSpeakerService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, VoiceModule],
    }).compile();

    sessionService = module.get(VoiceSessionService);
    speakerService = module.get(VoiceSpeakerService);
    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create session', async () => {
    const { sessionId, correlationId } = await sessionService.createSession({
      mode: 'MODE_PA',
      organizationId: 'org-1',
    });
    expect(sessionId).toBeDefined();
    expect(correlationId).toBeDefined();
    expect(typeof sessionId).toBe('string');
    expect(typeof correlationId).toBe('string');
  });

  it('should ingest chunk and create segments', async () => {
    const { sessionId } = await sessionService.createSession({ mode: 'MODE_PA' });
    const fixturePath = path.join(__dirname, 'fixtures', 'sample1.wav');
    const audioBuffer = fs.readFileSync(fixturePath);

    const result = await sessionService.ingestChunk(
      sessionId,
      0,
      audioBuffer,
      'audio/wav',
      16000,
      1,
    );
    expect(result.accepted).toBe(true);
    expect(result.chunkId).toBeDefined();
    expect(result.segmentsCreated).toBeGreaterThan(0);
  });

  it('should enroll speaker and match voice', async () => {
    const profile = await speakerService.createSpeaker('TestSpeaker', 'Engineer');
    expect(profile.id).toBeDefined();
    expect(profile.displayName).toBe('TestSpeaker');

    const fixturePath = path.join(__dirname, 'fixtures', 'sample1.wav');
    const sampleBytes = fs.readFileSync(fixturePath);
    const { voiceprintId } = await speakerService.enrollVoice(profile.id, sampleBytes, 'audio/wav');
    expect(voiceprintId).toBeDefined();
  });

  it('should generate minutes artifact with checksum', async () => {
    const { sessionId } = await sessionService.createSession({ mode: 'MODE_PA' });
    const fixturePath = path.join(__dirname, 'fixtures', 'sample1.wav');
    const audioBuffer = fs.readFileSync(fixturePath);
    await sessionService.ingestChunk(sessionId, 0, audioBuffer, 'audio/wav', 16000, 1);

    const artifacts = await sessionService.generateArtifacts(sessionId, ['MINUTES', 'LEGAL_ACT']);
    expect(artifacts.length).toBeGreaterThanOrEqual(1);
    for (const a of artifacts) {
      expect(a.checksumSha256).toBeDefined();
      expect(a.contentMarkdown).toContain('TYBELOS Voice');
      expect(a.contentMarkdown).toContain('AZTEC ORACLE');
    }
  });
});
