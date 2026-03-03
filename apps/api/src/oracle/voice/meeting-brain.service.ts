import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { createHash } from 'crypto';

const TYBELOS_HEADER =
  '---\n**TYBELOS Voice — AZTEC ORACLE (SAFE)**\n---\n\n';

export type ArtifactType = 'MINUTES' | 'DECISIONS' | 'LEGAL_ACT';
export type SessionMode = 'MODE_PA' | 'MODE_DL' | 'MODE_GC' | 'MODE_SME';

interface TranscriptRow {
  startMs: number;
  endMs: number;
  speakerLabel: string;
  speakerName: string | null;
  text: string;
}

@Injectable()
export class MeetingBrainService {
  constructor(private readonly prisma: PrismaService) {}

  async extractEvents(sessionId: string, segments: TranscriptRow[]): Promise<void> {
    const actionItems = segments.filter((s) =>
      /^(dobbiamo|bisogna|da fare|action|todo)\b/i.test(s.text.trim()),
    );
    for (const seg of actionItems) {
      await this.prisma.oracleMeetingEvent.create({
        data: {
          sessionId,
          type: 'ACTION_ITEM',
          payload: { text: seg.text, startMs: seg.startMs, speaker: seg.speakerLabel },
          emittedBy: 'meeting-brain',
        },
      });
    }
    const decisions = segments.filter((s) =>
      /(decidiamo|decisione|approvato|accettato)\b/i.test(s.text),
    );
    for (const seg of decisions) {
      await this.prisma.oracleMeetingEvent.create({
        data: {
          sessionId,
          type: 'DECISION_PROPOSAL',
          payload: { text: seg.text, startMs: seg.startMs, speaker: seg.speakerLabel },
          emittedBy: 'meeting-brain',
        },
      });
    }
  }

  async generateArtifacts(
    sessionId: string,
    types: ArtifactType[],
    legalStyle?: string,
  ): Promise<{ id: string; type: string; checksum: string }[]> {
    const session = await this.prisma.oracleVoiceSession.findUnique({
      where: { id: sessionId },
      include: {
        transcriptSegments: { orderBy: { startMs: 'asc' } },
        meetingEvents: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!session) throw new Error('Session not found');

    const segments: TranscriptRow[] = session.transcriptSegments.map((s) => ({
      startMs: s.startMs,
      endMs: s.endMs,
      speakerLabel: s.speakerLabel,
      speakerName: s.speakerName,
      text: s.text,
    }));

    const results: { id: string; type: string; checksum: string }[] = [];
    for (const type of types) {
      const { contentMarkdown, contentJson } = this.buildArtifact(
        type,
        session.mode as SessionMode,
        segments,
        session.meetingEvents,
        legalStyle,
      );
      const checksum = createHash('sha256').update(contentMarkdown || JSON.stringify(contentJson)).digest('hex');
      const art = await this.prisma.oracleMeetingArtifact.create({
        data: {
          sessionId,
          type,
          contentMarkdown,
          contentJson: contentJson ?? undefined,
          checksum,
          generatedBy: 'tybelos-voice',
        },
      });
      results.push({ id: art.id, type: art.type, checksum: art.checksum || '' });
    }
    return results;
  }

  private buildArtifact(
    type: ArtifactType,
    mode: SessionMode,
    segments: TranscriptRow[],
    events: { type: string; payload: unknown }[],
    legalStyle?: string,
  ): { contentMarkdown: string; contentJson: object } {
    const sections: string[] = [TYBELOS_HEADER];
    const jsonSegments = segments.map((s) => ({
      startMs: s.startMs,
      endMs: s.endMs,
      speaker: s.speakerName || s.speakerLabel,
      text: s.text,
    }));

    if (type === 'MINUTES') {
      sections.push(`## Verbale\n\n`);
      sections.push(this.formatMinutes(segments, mode));
    } else if (type === 'DECISIONS') {
      sections.push(`## Decision Log\n\n`);
      sections.push(this.formatDecisions(events));
    } else if (type === 'LEGAL_ACT') {
      sections.push(`## Bozza Atto / Determinazione\n\n`);
      sections.push(this.formatLegalAct(segments, mode, legalStyle));
    }

    const contentMarkdown = sections.join('');
    const contentJson = { type, mode, segments: jsonSegments, generatedAt: new Date().toISOString() };
    return { contentMarkdown, contentJson };
  }

  private formatMinutes(segments: TranscriptRow[], mode: SessionMode): string {
    const tone = mode === 'MODE_PA' ? 'formale' : mode === 'MODE_GC' ? 'consiliare' : 'standard';
    let out = `*Registro: ${tone}*\n\n`;
    for (const s of segments) {
      const who = s.speakerName || s.speakerLabel;
      const ts = `[${this.msToTime(s.startMs)}]`;
      out += `${ts} **${who}**: ${s.text}\n\n`;
    }
    return out;
  }

  private formatDecisions(events: { type: string; payload: unknown }[]): string {
    const decisions = events.filter((e) => e.type === 'DECISION_PROPOSAL');
    if (decisions.length === 0) return '*Nessuna decisione esplicita registrata.*\n';
    return decisions
      .map((e, i) => {
        const p = e.payload as { text?: string; startMs?: number; speaker?: string };
        return `${i + 1}. (${p.speaker || 'N/A'}) ${p.text || ''}`;
      })
      .join('\n\n') + '\n';
  }

  private formatLegalAct(segments: TranscriptRow[], mode: SessionMode, _style?: string): string {
    let out = `*Bozza — nessuna firma applicata*\n\n`;
    out += this.formatMinutes(segments, mode);
    return out;
  }

  private msToTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  }
}
