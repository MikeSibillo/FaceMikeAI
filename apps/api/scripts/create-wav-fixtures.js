const fs = require('fs');
const path = require('path');

function createMinimalWav(samples, sampleRate = 16000, numChannels = 1) {
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const fileSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // fmt chunk size
  buffer.writeUInt16LE(1, offset); offset += 2;   // PCM
  buffer.writeUInt16LE(numChannels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(blockAlign, offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(samples[i], offset);
    offset += 2;
  }
  return buffer;
}

function generateSamples(durationSec, freq = 440) {
  const sampleRate = 16000;
  const len = sampleRate * durationSec;
  const samples = [];
  for (let i = 0; i < len; i++) {
    samples.push(Math.floor(32767 * 0.3 * Math.sin(2 * Math.PI * freq * i / sampleRate)));
  }
  return samples;
}

const fixturesDir = path.join(__dirname, '..', 'test', 'fixtures');
if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir, { recursive: true });

const sample1 = createMinimalWav(generateSamples(0.5), 16000, 1);
const sample2 = createMinimalWav(generateSamples(0.4, 520), 16000, 1);

fs.writeFileSync(path.join(fixturesDir, 'sample1.wav'), sample1);
fs.writeFileSync(path.join(fixturesDir, 'sample2.wav'), sample2);
console.log('Created sample1.wav and sample2.wav');
console.log('sample1 size:', sample1.length, 'sample2 size:', sample2.length);
