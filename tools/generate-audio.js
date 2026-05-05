const fs = require("fs");
const path = require("path");

const outDir = path.resolve(__dirname, "..", "assets", "audio");
fs.mkdirSync(outDir, { recursive: true });

const SAMPLE_RATE = 22050;

writeWav("glimmerwald-theme.wav", makeTheme(28));
writeWav("slash.wav", toneSweep(0.16, 680, 180, "noise"));
writeWav("hit.wav", toneSweep(0.22, 160, 85, "square"));
writeWav("pickup.wav", arpeggio([523.25, 659.25, 783.99, 1046.5], 0.075));
writeWav("hurt.wav", toneSweep(0.26, 190, 70, "saw"));
writeWav("gate.wav", arpeggio([196, 246.94, 329.63, 493.88, 659.25], 0.14));

function makeTheme(seconds) {
  const total = Math.floor(seconds * SAMPLE_RATE);
  const data = new Float32Array(total);
  const scale = [196, 246.94, 293.66, 329.63, 392, 440, 493.88, 587.33];
  const bass = [98, 130.81, 146.83, 164.81];
  for (let i = 0; i < total; i += 1) {
    const t = i / SAMPLE_RATE;
    const beat = Math.floor(t * 2.4);
    const note = scale[(beat * 3 + Math.floor(t / 4)) % scale.length];
    const bassNote = bass[Math.floor(t / 3.2) % bass.length];
    const env = 0.45 + 0.55 * Math.sin((t * 2.4 % 1) * Math.PI);
    const shimmer = Math.sin(t * note * Math.PI * 2) * 0.12 * env;
    const octave = Math.sin(t * note * 2 * Math.PI * 2) * 0.045 * env;
    const low = Math.sin(t * bassNote * Math.PI * 2) * 0.12;
    const pad = Math.sin(t * 49 * Math.PI * 2) * 0.035;
    data[i] = softClip(shimmer + octave + low + pad);
  }
  fadeEdges(data, 0.35);
  return data;
}

function toneSweep(seconds, start, end, shape) {
  const total = Math.floor(seconds * SAMPLE_RATE);
  const data = new Float32Array(total);
  let noise = 0;
  for (let i = 0; i < total; i += 1) {
    const t = i / SAMPLE_RATE;
    const p = i / total;
    const freq = start + (end - start) * p;
    const env = Math.pow(1 - p, 2.2);
    noise = noise * 0.84 + (Math.random() * 2 - 1) * 0.16;
    let wave = Math.sin(t * freq * Math.PI * 2);
    if (shape === "square") wave = wave > 0 ? 1 : -1;
    if (shape === "saw") wave = ((t * freq) % 1) * 2 - 1;
    if (shape === "noise") wave = wave * 0.45 + noise * 0.55;
    data[i] = softClip(wave * env * 0.7);
  }
  fadeEdges(data, 0.01);
  return data;
}

function arpeggio(notes, noteSeconds) {
  const total = Math.floor(notes.length * noteSeconds * SAMPLE_RATE);
  const data = new Float32Array(total);
  for (let i = 0; i < total; i += 1) {
    const t = i / SAMPLE_RATE;
    const idx = Math.min(notes.length - 1, Math.floor(t / noteSeconds));
    const local = (t - idx * noteSeconds) / noteSeconds;
    const env = Math.sin(local * Math.PI);
    const freq = notes[idx];
    data[i] = softClip(Math.sin(t * freq * Math.PI * 2) * env * 0.55 + Math.sin(t * freq * 2 * Math.PI * 2) * env * 0.15);
  }
  fadeEdges(data, 0.01);
  return data;
}

function writeWav(name, samples) {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    pcm[i] = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767)));
  }
  const header = Buffer.alloc(44);
  const byteLength = pcm.length * 2;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + byteLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(byteLength, 40);
  fs.writeFileSync(path.join(outDir, name), Buffer.concat([header, Buffer.from(pcm.buffer)]));
}

function fadeEdges(data, seconds) {
  const count = Math.floor(seconds * SAMPLE_RATE);
  for (let i = 0; i < Math.min(count, data.length); i += 1) {
    const fadeIn = i / count;
    const fadeOut = (data.length - 1 - i) / count;
    data[i] *= fadeIn;
    data[data.length - 1 - i] *= Math.max(0, fadeOut);
  }
}

function softClip(value) {
  return Math.tanh(value * 1.2) * 0.82;
}
