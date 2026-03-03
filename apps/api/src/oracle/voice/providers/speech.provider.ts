import { createHash } from 'crypto';

/** Input for transcription */
export interface TranscribeChunkInput {
  audioBytes: Buffer;
  mimeType: string;
  sampleRate?: number;
  channels?: number;
  sessionId: string;
  chunkIndex: number;
}

/** Single transcript segment */
export interface TranscriptSegment {
  startMs: number;
  endMs: number;
  text: string;
  confidence: number;
}

export interface TranscribeChunkResult {
  segments: TranscriptSegment[];
  text: string;
}

/** Deterministic provider: processes bytes, computes sha256, returns segments based on hash mapping */
export abstract class SpeechProvider {
  abstract transcribeChunk(input: TranscribeChunkInput): Promise<TranscribeChunkResult>;
}

/** Precomputed SHA256 of test fixtures apps/api/test/fixtures/sample1.wav and sample2.wav */
const FIXTURE_HASH_SAMPLE1 = '86b076a4834b050a4e06f9cb454a88edc5a7d1929b9cef56ef576a5f27ab10a5';
const FIXTURE_HASH_SAMPLE2 = '91be202420ebcfffb9795eec72d957f53fd6bf7ae2fb6c66a8a163d5e806a792';

export class DeterministicSpeechProvider implements SpeechProvider {
  /** Map sha256(audioBytes) -> mock transcript. Fixture bytes produce deterministic text. */
  private readonly fixtureMap: Map<string, { segments: TranscriptSegment[]; text: string }> =
    new Map();

  constructor() {
    this.fixtureMap.set(FIXTURE_HASH_SAMPLE1, {
      segments: [
        { startMs: 0, endMs: 1500, text: 'Buongiorno, apriamo la riunione.', confidence: 0.95 },
        { startMs: 1500, endMs: 3200, text: 'Oggi discutiamo i prossimi step del progetto.', confidence: 0.92 },
      ],
      text: 'Buongiorno, apriamo la riunione. Oggi discutiamo i prossimi step del progetto.',
    });
    this.fixtureMap.set(FIXTURE_HASH_SAMPLE2, {
      segments: [
        { startMs: 0, endMs: 1200, text: "Sono d'accordo con la proposta.", confidence: 0.94 },
        { startMs: 1200, endMs: 2800, text: 'Passiamo alla determinazione.', confidence: 0.91 },
      ],
      text: "Sono d'accordo con la proposta. Passiamo alla determinazione.",
    });
  }

  private sha256(buf: Buffer): string {
    return createHash('sha256').update(buf).digest('hex');
  }

  async transcribeChunk(input: TranscribeChunkInput): Promise<TranscribeChunkResult> {
    const hash = this.sha256(input.audioBytes);
    const cached = this.fixtureMap.get(hash);
    if (cached) {
      return cached;
    }
    // Fallback: generate deterministic segments from hash (no external API)
    const baseMs = input.chunkIndex * 5000;
    const segments: TranscriptSegment[] = [
      {
        startMs: baseMs,
        endMs: baseMs + 1500,
        text: `[Segment ${input.chunkIndex + 1}] Trascrizione deterministica da chunk audio.`,
        confidence: 0.88,
      },
    ];
    const text = segments.map((s) => s.text).join(' ');
    return { segments, text };
  }
}
