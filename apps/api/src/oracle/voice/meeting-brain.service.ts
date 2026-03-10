import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PrismaClient, OracleMeetingEventType, OracleMeetingArtifactType, OracleVoiceSessionMode } from '@ai-aztec/db';

const ARTIFACT_HEADER = 'TYBELOS Voice — AZTEC ORACLE (SAFE)';

export interface SegmentWithSpeaker {
  startMs: number;
  endMs: number;
  speakerLabel: string;
  speakerName?: string;
  text: string;
  confidence?: number;
}

export interface MeetingMemory {
  segments: SegmentWithSpeaker[];
  actionItems: string[];
  decisionProposals: string[];
  riskFlags: string[];
  mode: OracleVoiceSessionMode;
}

@Injectable()
export class MeetingBrainService {
  constructor(private readonly prisma: PrismaClient) {}

  async loadMemory(sessionId: string): Promise<MeetingMemory> {
    const [segments, events] = await Promise.all([
      this.prisma.oracleTranscriptSegment.findMany({
        where: { sessionId },
        orderBy: [{ startMs: 'asc' }],
      }),
      this.prisma.oracleMeetingEvent.findMany({
        where: { sessionId },
        orderBy: [{ createdAt: 'asc' }],
      }),
    ]);

    const session = await this.prisma.oracleVoiceSession.findUnique({
      where: { id: sessionId },
      select: { mode: true },
    });

    const actionItems: string[] = [];
    const decisionProposals: string[] = [];
    const riskFlags: string[] = [];

    for (const e of events) {
      const p = e.payload as Record<string, unknown> | null;
      if (e.type === 'ACTION_ITEM' && p?.text) actionItems.push(String(p.text));
      if (e.type === 'DECISION_PROPOSAL' && p?.text) decisionProposals.push(String(p.text));
      if (e.type === 'RISK_FLAG' && p?.text) riskFlags.push(String(p.text));
    }

    const segs: SegmentWithSpeaker[] = segments.map((s) => ({
      startMs: s.startMs,
      endMs: s.endMs,
      speakerLabel: s.speakerLabel,
      speakerName: s.speakerName ?? undefined,
      text: s.text,
      confidence: s.confidence ?? undefined,
    }));

    return {
      segments: segs,
      actionItems,
      decisionProposals,
      riskFlags,
      mode: session?.mode ?? 'MODE_PA',
    };
  }

  async emitEvent(
    sessionId: string,
    type: OracleMeetingEventType,
    payload: Record<string, unknown>,
    emittedBy?: string,
  ): Promise<void> {
    await this.prisma.oracleMeetingEvent.create({
      data: { sessionId, type, payload: payload as object, emittedBy },
    });
  }

  async extractAndSaveEvents(sessionId: string, segments: SegmentWithSpeaker[]): Promise<void> {
    for (const s of segments) {
      const lower = s.text.toLowerCase();
      if (lower.includes('action item') || lower.includes('to do') || lower.includes('da fare')) {
        await this.emitEvent(sessionId, 'ACTION_ITEM', { text: s.text, speaker: s.speakerName ?? s.speakerLabel, startMs: s.startMs }, 'TYBELOS');
      }
      if (lower.includes('decidiamo') || lower.includes('decisione') || lower.includes('proposta')) {
        await this.emitEvent(sessionId, 'DECISION_PROPOSAL', { text: s.text, speaker: s.speakerName ?? s.speakerLabel, startMs: s.startMs }, 'TYBELOS');
      }
      if (lower.includes('rischio') || lower.includes('delay') || lower.includes('claim')) {
        await this.emitEvent(sessionId, 'RISK_FLAG', { text: s.text, speaker: s.speakerName ?? s.speakerLabel, startMs: s.startMs }, 'TYBELOS');
      }
    }
  }

  generateMinutes(memory: MeetingMemory): string {
    const modeLabel = this.getModeLabel(memory.mode);
    let md = `# ${ARTIFACT_HEADER}\n\n`;
    md += `## Verbale — ${modeLabel}\n\n`;
    md += '### Timeline\n\n';
    for (const s of memory.segments) {
      const ts = this.formatTimestamp(s.startMs);
      const speaker = s.speakerName ?? s.speakerLabel;
      md += `- **${ts}** — *${speaker}*: ${s.text}\n`;
    }
    if (memory.actionItems.length) {
      md += '\n### Action Items\n\n';
      for (const a of memory.actionItems) md += `- ${a}\n`;
    }
    if (memory.decisionProposals.length) {
      md += '\n### Proposte di decisione\n\n';
      for (const d of memory.decisionProposals) md += `- ${d}\n`;
    }
    return md;
  }

  generateDecisions(memory: MeetingMemory): string {
    let md = `# ${ARTIFACT_HEADER}\n\n`;
    md += '## Decision Log\n\n';
    for (const d of memory.decisionProposals) {
      md += `- ${d}\n`;
    }
    if (memory.decisionProposals.length === 0) {
      md += '*Nessuna decisione registrata in sessione.*\n';
    }
    return md;
  }

  generateLegalAct(memory: MeetingMemory, style?: string): string {
    const styleLabel = style ?? 'standard';
    let md = `# ${ARTIFACT_HEADER}\n\n`;
    md += `## Bozza Atto / Determinazione — ${styleLabel}\n\n`;
    md += '*Documento di BOZZA — nessuna firma applicata.*\n\n';
    md += '### Contesto\n\n';
    for (const s of memory.segments.slice(0, 5)) {
      const ts = this.formatTimestamp(s.startMs);
      md += `- [${ts}] ${s.speakerName ?? s.speakerLabel}: ${s.text}\n`;
    }
    if (memory.decisionProposals.length) {
      md += '\n### Elementi decisori\n\n';
      for (const d of memory.decisionProposals) md += `- ${d}\n`;
    }
    return md;
  }

  private getModeLabel(mode: OracleVoiceSessionMode): string {
    const map: Record<OracleVoiceSessionMode, string> = {
      MODE_PA: 'Pubblica Amministrazione',
      MODE_DL: 'Decision Log',
      MODE_GC: 'Governance & Compliance',
      MODE_SME: 'Piccole e Medie Imprese',
    };
    return map[mode] ?? mode;
  }

  private formatTimestamp(ms: number): string {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  static contentToChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}
