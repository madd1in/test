const fs = require("node:fs");
const path = require("node:path");

const sampleRate = 44100;
const outDir = path.join(__dirname, "..", "assets", "audio");
fs.mkdirSync(outDir, { recursive: true });

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function writeWav(name, seconds, generator) {
  const frames = Math.floor(seconds * sampleRate);
  const channels = 2;
  const dataSize = frames * channels * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < frames; i += 1) {
    const t = i / sampleRate;
    const value = generator(t, i, frames);
    const left = clamp(value[0], -1, 1);
    const right = clamp(value[1], -1, 1);
    buffer.writeInt16LE(Math.round(left * 32767), 44 + i * 4);
    buffer.writeInt16LE(Math.round(right * 32767), 46 + i * 4);
  }

  fs.writeFileSync(path.join(outDir, name), buffer);
}

function sine(freq, t) {
  return Math.sin(Math.PI * 2 * freq * t);
}

function square(freq, t) {
  return sine(freq, t) >= 0 ? 1 : -1;
}

function saw(freq, t) {
  return 2 * (t * freq - Math.floor(0.5 + t * freq));
}

function envelope(t, start, length, attack = 0.01, release = 0.12) {
  const local = t - start;
  if (local < 0 || local > length) return 0;
  if (local < attack) return local / attack;
  if (local > length - release) return Math.max(0, (length - local) / release);
  return 1;
}

function noteFreq(semitone) {
  return 55 * Math.pow(2, semitone / 12);
}

writeWav("bgm-loop.wav", 16, (t) => {
  const loopT = t % 16;
  const beat = loopT % 0.5;
  const bar = Math.floor(loopT / 0.5);
  const bassPattern = [0, 0, 7, 0, 10, 7, 3, 5, 0, 0, 7, 12, 10, 7, 5, 3];
  const arpPattern = [12, 19, 24, 19, 15, 22, 27, 22, 10, 17, 22, 17, 14, 21, 26, 21];
  const bass = saw(noteFreq(bassPattern[bar % bassPattern.length]), t) * 0.16 * (1 - beat * 0.65);
  const arpEnv = envelope(loopT, Math.floor(loopT / 0.25) * 0.25, 0.18, 0.006, 0.08);
  const arp = square(noteFreq(arpPattern[Math.floor(loopT / 0.25) % arpPattern.length]), t) * 0.075 * arpEnv;
  const pad = (sine(noteFreq(24), t) + sine(noteFreq(31), t) * 0.7 + sine(noteFreq(36), t) * 0.45) * 0.055;
  const kick = Math.exp(-beat * 18) * sine(48 + beat * 160, t) * 0.34;
  const snareSlot = Math.abs((loopT % 2) - 1) < 0.045 ? 1 : 0;
  const noise = (Math.random() * 2 - 1) * snareSlot * 0.08;
  const hat = (Math.random() * 2 - 1) * (beat > 0.25 && beat < 0.31 ? 0.05 : 0);
  const mix = bass + arp + pad + kick + noise + hat;
  return [mix * 0.88, (mix + arp * 0.25) * 0.82];
});

writeWav("engine-loop.wav", 3, (t) => {
  const rumble = sine(72, t) * 0.18 + saw(36, t) * 0.12 + sine(144, t) * 0.06;
  const pulse = 0.72 + Math.sin(Math.PI * 2 * 7 * t) * 0.08;
  return [rumble * pulse, rumble * (pulse + 0.04)];
});

writeWav("boost.wav", 0.72, (t, i, frames) => {
  const p = i / frames;
  const freq = 220 + p * 880;
  const tone = sine(freq, t) * 0.34 + saw(freq * 0.5, t) * 0.18;
  const env = Math.sin(Math.PI * p);
  return [tone * env, (tone + sine(freq * 1.5, t) * 0.1) * env];
});

writeWav("crash.wav", 0.58, (t, i, frames) => {
  const p = i / frames;
  const env = Math.pow(1 - p, 2.2);
  const noise = (Math.random() * 2 - 1) * 0.52 * env;
  const hit = sine(78 - p * 34, t) * 0.42 * env;
  return [noise + hit, noise * 0.85 - hit * 0.4];
});

writeWav("pickup.wav", 0.42, (t, i, frames) => {
  const p = i / frames;
  const env = Math.sin(Math.PI * p);
  const tone = sine(620 + p * 460, t) * 0.26 + sine(1240 + p * 920, t) * 0.12;
  return [tone * env, tone * env * 0.92];
});

writeWav("checkpoint.wav", 0.86, (t, i, frames) => {
  const p = i / frames;
  const env = Math.sin(Math.PI * p);
  const chord = sine(440, t) * 0.18 + sine(554.37, t) * 0.15 + sine(659.25, t) * 0.14;
  const rise = sine(330 + p * 660, t) * 0.11;
  return [(chord + rise) * env, (chord - rise * 0.3) * env];
});

console.log(`Wrote WAV assets to ${outDir}`);
