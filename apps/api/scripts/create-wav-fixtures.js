const fs = require('fs');
const path = require('path');

function createWav(sampleRate = 16000, durationSec = 0.5, channels = 1) {
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = Math.floor(sampleRate * channels * (bitsPerSample / 8) * durationSec);
  const fileSize = 36 + dataSize;

  const buf = Buffer.alloc(44 + dataSize);
  let offset = 0;

  buf.write('RIFF', offset); offset += 4;
  buf.writeUInt32LE(fileSize, offset); offset += 4;
  buf.write('WAVE', offset); offset += 4;
  buf.write('fmt ', offset); offset += 4;
  buf.writeUInt32LE(16, offset); offset += 4;
  buf.writeUInt16LE(1, offset); offset += 2;  // PCM
  buf.writeUInt16LE(channels, offset); offset += 2;
  buf.writeUInt32LE(sampleRate, offset); offset += 4;
  buf.writeUInt32LE(byteRate, offset); offset += 4;
  buf.writeUInt16LE(blockAlign, offset); offset += 2;
  buf.writeUInt16LE(bitsPerSample, offset); offset += 2;
  buf.write('data', offset); offset += 4;
  buf.writeUInt32LE(dataSize, offset); offset += 4;
  for (let i = 0; i < dataSize; i++) buf[offset + i] = (i % 256);
  return buf;
}

const fixturesDir = path.join(__dirname, '../test/fixtures');
fs.mkdirSync(fixturesDir, { recursive: true });
fs.writeFileSync(path.join(fixturesDir, 'sample1.wav'), createWav(16000, 0.3));
fs.writeFileSync(path.join(fixturesDir, 'sample2.wav'), createWav(16000, 0.5));
console.log('Created sample1.wav and sample2.wav');
