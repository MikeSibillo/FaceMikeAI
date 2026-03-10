import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';

describe('Oracle Voice (e2e)', () => {
  let app: INestApplication;
  const fixturesDir = path.join(__dirname, 'fixtures');
  const sample1Path = path.join(fixturesDir, 'sample1.wav');

  beforeAll(async () => {
    process.env.VOICE_ENABLED = 'true';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aztec_test';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /api/oracle/voice/sessions -> create session', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/oracle/voice/sessions')
      .set('Authorization', 'Bearer test-token')
      .send({ mode: 'MODE_PA' })
      .expect(201);
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.correlationId).toBeDefined();
    expect(res.headers['x-correlation-id']).toBeDefined();
  });

  it('full flow: create session -> upload chunk -> timeline segments>0 -> generate artifacts', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/oracle/voice/sessions')
      .set('Authorization', 'Bearer test-token')
      .send({ mode: 'MODE_PA' })
      .expect(201);
    const sessionId = createRes.body.sessionId;

    const buf = fs.existsSync(sample1Path)
      ? fs.readFileSync(sample1Path)
      : Buffer.alloc(1024);
    const chunkRes = await request(app.getHttpServer())
      .post(`/api/oracle/voice/sessions/${sessionId}/chunks`)
      .set('Authorization', 'Bearer test-token')
      .set('x-chunk-index', '0')
      .set('x-sample-rate', '16000')
      .set('x-channels', '1')
      .attach('audio', buf, { filename: 'sample1.wav' })
      .expect(201);

    expect(chunkRes.body.accepted).toBe(true);
    expect(chunkRes.body.segmentsCreated).toBeGreaterThan(0);

    const timelineRes = await request(app.getHttpServer())
      .get(`/api/oracle/voice/sessions/${sessionId}/timeline`)
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(timelineRes.body.segments.length).toBeGreaterThan(0);
    expect(timelineRes.body.segments[0]).toHaveProperty('speakerLabel');
    expect(timelineRes.body.segments[0]).toHaveProperty('text');

    const genRes = await request(app.getHttpServer())
      .post(`/api/oracle/voice/sessions/${sessionId}/artifacts/generate`)
      .set('Authorization', 'Bearer test-token')
      .send({ types: ['MINUTES', 'LEGAL_ACT'] })
      .expect(201);

    expect(genRes.body).toHaveLength(2);
    const artifactId = genRes.body.find((a: { type: string }) => a.type === 'MINUTES')?.id;
    expect(artifactId).toBeDefined();

    const artRes = await request(app.getHttpServer())
      .get(`/api/oracle/voice/artifacts/${artifactId}`)
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(artRes.body.contentMarkdown).toBeDefined();
    expect(artRes.body.contentMarkdown).toContain('TYBELOS Voice');
    expect(artRes.body.contentMarkdown).toContain('AZTEC ORACLE');
    expect(artRes.body.contentMarkdown).toMatch(/speaker|SPEAKER_|timestamp|\d+:\d+/i);
  });
});
