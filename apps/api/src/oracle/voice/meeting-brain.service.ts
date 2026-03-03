import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ArtifactType,
  MeetingEventType,
  VoiceSessionMode,
} from '@prisma/client';
import { createHash } from 'crypto';

const TYBELOS_HEADER = 'TYBELOS Voice — AZTEC ORACLE (SAFE)';

@Injectable()
export class MeetingBrainService {
  constructor(private readonly prisma: PrismaService) {}

  async extractAndStoreEvents(
    sessionId: string,
    segments: Array<{ startMs: number; endMs: number; speakerLabel: string; text: string; speakerName?: string }>,
    emittedBy?: string,
  ): Promise<void> {
    const actionItems: MeetingEventType[] = [];
    for (const seg of segments) {
      if (/action|todo|da fare|to do/i.test(seg.text)) {
        actionItems.push('ACTION_ITEM' as MeetingEventType);
      }
      if (/decidiamo|decisione|proposta|proposal|decision/i.test(seg.text)) {
        actionItems.push('DECISION_PROPOSAL' as MeetingEventType);
      }
      if (/rischio|risk|at risk|delay/i.test(seg.text)) {
        actionItems.push('RISK_FLAG' as MeetingEventType);
      }
    }
    const seen = new Set<string>();
    for (const t of actionItems) {
      const key = `${t}-${sessionId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      await this.prisma.oracleMeetingEvent.create({
        data: {
          sessionId,
          type: t,
          payload: { source: 'MeetingBrain', extracted: true },
          emittedBy,
        },
      });
    }
  }

  async generateArtifact(
    sessionId: string,
    type: ArtifactType,
    legalStyle?: string,
    generatedBy?: string,
  ): Promise<{ id: string; contentMarkdown: string; contentJson: object; checksumSha256: string }> {
    const segments = await this.prisma.oracleTranscriptSegment.findMany({
      where: { sessionId },
      orderBy: [{ startMs: 'asc' }],
    });
    const session = await this.prisma.oracleVoiceSession.findUnique({
      where: { id: sessionId },
      include: { events: true },
    });
    if (!session) throw new Error('Session not found');

    const mode = session.mode as VoiceSessionMode;
    const parts: string[] = [`# ${TYBELOS_HEADER}\n`, `## ${type}\n`, `Modo: ${mode}\n`, '\n### Timeline\n'];

    const jsonSegments = segments.map((s) => ({
      startMs: s.startMs,
      endMs: s.endMs,
      speaker: s.speakerName || s.speakerLabel,
      text: s.text,
    }));

    for (const s of segments) {
      const speaker = s.speakerName || s.speakerLabel;
      const ts = this.formatTimestamp(s.startMs);
      parts.push(`- **${ts}** [${speaker}]: ${s.text}\n`);
    }

    if (type === 'LEGAL_ACT' && legalStyle) {
      parts.push(`\n### Bozza Atto (${legalStyle})\n`);
      parts.push('*Atto generato come BOZZA — nessuna firma automatica.*\n');
      const preambolo = `Determinazione in data ${new Date().toISOString().split('T')[0]} — Verbale riunione.\n`;
      parts.push(preambolo);
    }

    if (type === 'DECISIONS') {
      const decisions = session.events.filter((e) => e.type === 'DECISION_PROPOSAL');
      parts.push('\n### Decisioni proposte\n');
      for (const d of decisions) {
        parts.push(`- ${JSON.stringify((d.payload as { source?: string })?.source ?? 'N/A')}\n`);
      }
    }

    const contentMarkdown = parts.join('');
    const contentJson = {
      type,
      mode,
      segments: jsonSegments,
      generatedAt: new Date().toISOString(),
      generatedBy: generatedBy || 'TYBELOS',
    };
    const checksumSha256 = createHash('sha256').update(contentMarkdown).digest('hex');

    const artifact = await this.prisma.oracleMeetingArtifact.create({
      data: {
        sessionId,
        type,
        contentMarkdown,
        contentJson: contentJson as object,
        checksumSha256,
        generatedBy: generatedBy || 'TYBELOS',
      },
    });

    return {
      id: artifact.id,
      contentMarkdown,
      contentJson,
      checksumSha256,
    };
  }

  private formatTimestamp(ms: number): string {
    const sec = Math.floor(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
