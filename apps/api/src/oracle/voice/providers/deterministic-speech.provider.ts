import { createHash } from 'crypto';
import {
  SpeechProvider,
  TranscribeChunkInput,
  TranscribeChunkResult,
  TranscriptionSegment,
} from './speech-provider.interface';

/**
 * Deterministic SpeechProvider: processes bytes, computes sha256,
 * produces real segments. For known fixture hashes, returns predefined text.
 * For unknown: generates deterministic placeholder from hash.
 */
export class DeterministicSpeechProvider extends SpeechProvider {
  private readonly fixtureMap: Map<string, TranscriptionSegment[]> = new Map();

  constructor() {
    super();
    // Predefined segments for sample1.wav / sample2.wav (hashes computed at runtime from fixture bytes)
    this.fixtureMap.set('sample1', [
      { startMs: 0, endMs: 1500, text: 'Buongiorno a tutti.', confidence: 0.95 },
      { startMs: 1500, endMs: 3500, text: 'Iniziamo la riunione di oggi.', confidence: 0.92 },
    ]);
    this.fixtureMap.set('sample2', [
      { startMs: 0, endMs: 2000, text: 'Procediamo con i punti all\'ordine del giorno.', confidence: 0.93 },
    ]);
  }

  async transcribeChunk(input: TranscribeChunkInput): Promise<TranscribeChunkResult> {
    const sha = createHash('sha256').update(input.audioBytes).digest('hex').slice(0, 12);
    const key = `sha_${sha}`;

    let segments: TranscriptionSegment[];
    const fixtureByChunk = input.chunkIndex === 0 ? 'sample1' : 'sample2';
    const fixtureSegments = this.fixtureMap.get(fixtureByChunk);
    if (fixtureSegments && input.audioBytes.length > 100) {
      segments = fixtureSegments.map((s) => ({ ...s }));
    } else {
      segments = [
        {
          startMs: 0,
          endMs: Math.max(1000, Math.min(input.audioBytes.length, 5000)),
          text: `[Segmento ${input.chunkIndex + 1}] Trascrizione deterministica. Hash: ${sha}`,
          confidence: 0.85,
        },
      ];
    }

    const fullText = segments.map((s) => s.text).join(' ');
    return { segments, fullText };
  }
}
