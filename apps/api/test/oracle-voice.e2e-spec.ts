import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Oracle Voice (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('POST /oracle/voice/sessions -> create session', async () => {
    const res = await request(app.getHttpServer())
      .post('/oracle/voice/sessions')
      .send({ mode: 'MODE_PA', organizationId: 'e2e-org' })
      .expect(201);
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.correlationId).toBeDefined();
  });

  it('full flow: create session -> upload sample1.wav -> timeline segments>0 -> generate artifacts', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/oracle/voice/sessions')
      .send({ mode: 'MODE_PA' })
      .expect(201);

    const sessionId = createRes.body.sessionId;
    const fixturePath = path.join(__dirname, 'fixtures', 'sample1.wav');
    const wavBuffer = fs.readFileSync(fixturePath);

    const chunkRes = await request(app.getHttpServer())
      .post(`/oracle/voice/sessions/${sessionId}/chunks`)
      .set('x-chunk-index', '0')
      .set('x-sample-rate', '16000')
      .set('x-channels', '1')
      .attach('audio', wavBuffer, { filename: 'sample1.wav' })
      .expect(201);

    expect(chunkRes.body.accepted).toBe(true);
    expect(chunkRes.body.segmentsCreated).toBeGreaterThan(0);

    const timelineRes = await request(app.getHttpServer())
      .get(`/oracle/voice/sessions/${sessionId}/timeline`)
      .expect(200);

    expect(timelineRes.body.segments).toBeDefined();
    expect(timelineRes.body.segments.length).toBeGreaterThan(0);

    const artGenRes = await request(app.getHttpServer())
      .post(`/oracle/voice/sessions/${sessionId}/artifacts/generate`)
      .send({ types: ['MINUTES', 'LEGAL_ACT'] })
      .expect(201);

    expect(Array.isArray(artGenRes.body)).toBe(true);
    expect(artGenRes.body.length).toBeGreaterThanOrEqual(1);

    const artifactId = artGenRes.body[0]?.id;
    expect(artifactId).toBeDefined();

    const getArtRes = await request(app.getHttpServer())
      .get(`/oracle/voice/artifacts/${artifactId}`)
      .expect(200);

    expect(getArtRes.body.contentMarkdown).toBeDefined();
    expect(getArtRes.body.contentMarkdown).toContain('TYBELOS');
    expect(getArtRes.body.contentMarkdown).toContain('speaker');
    expect(getArtRes.body.contentJson).toBeDefined();
  });
});
