import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/db/prisma.service';
import { createTestToken } from './auth-helper';
import * as fs from 'fs';
import * as path from 'path';

describe('Oracle Voice (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    process.env.VOICE_ENABLED = 'true';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    token = createTestToken({ sub: 'user1', isAdmin: true });
  });

  afterAll(async () => {
    await app.close();
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

  it('POST /oracle/voice/sessions -> create session', async () => {
    const res = await request(app.getHttpServer())
      .post('/oracle/voice/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ mode: 'MODE_PA', organizationId: 'org1' })
      .expect(201);

    expect(res.body.sessionId).toBeDefined();
    expect(res.body.correlationId).toBeDefined();
    expect(res.headers['x-correlation-id']).toBeDefined();
  });

  it('full flow: session -> upload sample1.wav -> timeline segments>0 -> generate artifacts', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/oracle/voice/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ mode: 'MODE_PA' })
      .expect(201);

    const sessionId = createRes.body.sessionId;
    const fixturePath = path.join(__dirname, 'fixtures', 'sample1.wav');
    const audioBuffer = fs.readFileSync(fixturePath);

    const chunkRes = await request(app.getHttpServer())
      .post(`/oracle/voice/sessions/${sessionId}/chunks`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-chunk-index', '0')
      .attach('audio', audioBuffer, 'sample1.wav')
      .expect(201);

    expect(chunkRes.body.accepted).toBe(true);
    expect(chunkRes.body.segmentsCreated.length).toBeGreaterThan(0);

    const timelineRes = await request(app.getHttpServer())
      .get(`/oracle/voice/sessions/${sessionId}/timeline`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(timelineRes.body.segments.length).toBeGreaterThan(0);
    expect(timelineRes.body.segments[0].text).toBeDefined();
    expect(timelineRes.body.segments[0].speakerLabel).toBeDefined();

    const genRes = await request(app.getHttpServer())
      .post(`/oracle/voice/sessions/${sessionId}/artifacts/generate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ types: ['MINUTES', 'LEGAL_ACT'] })
      .expect(201);

    expect(genRes.body.length).toBe(2);
    const artifactId = genRes.body[0].id;

    const artRes = await request(app.getHttpServer())
      .get(`/oracle/voice/artifacts/${artifactId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(artRes.body.contentMarkdown).toBeDefined();
    expect(artRes.body.contentMarkdown).toContain('TYBELOS Voice');
    expect(artRes.body.contentMarkdown).toContain('AZTEC ORACLE (SAFE)');
    expect(artRes.body.contentMarkdown).toContain('Buongiorno');
    expect(artRes.body.contentMarkdown).toMatch(/SPEAKER_\d+|[\w\s]+/);
  });
});
