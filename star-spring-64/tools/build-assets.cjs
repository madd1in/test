const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const textureDir = path.join(root, "assets", "textures");
const audioDir = path.join(root, "assets", "audio");

fs.mkdirSync(textureDir, { recursive: true });
fs.mkdirSync(audioDir, { recursive: true });

const textures = {
  "grass_tile.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<defs><filter id="n"><feTurbulence baseFrequency=".028" numOctaves="4" seed="13"/><feColorMatrix values=".18 .54 .10 0 0 .08 .40 .12 0 0 .04 .25 .08 0 0 0 0 0 1 0"/></filter></defs>
<rect width="512" height="512" fill="#6bc179"/>
<rect width="512" height="512" filter="url(#n)" opacity=".45"/>
<g opacity=".42" stroke="#e5f7a0" stroke-width="5" stroke-linecap="round">
<path d="M31 428c55-19 105-21 151 0s92 20 151-3 101-20 148 4"/>
<path d="M-4 155c60 23 116 22 167-2s102-21 155 2 104 22 164-2"/>
</g>
<g fill="#f8df65" opacity=".88"><circle cx="92" cy="89" r="7"/><circle cx="398" cy="151" r="5"/><circle cx="243" cy="363" r="6"/><circle cx="449" cy="407" r="8"/></g>
</svg>`,
  "cliff_tile.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#8d7057"/>
<g stroke="#573f31" stroke-width="8" opacity=".55">
<path d="M0 86h153l34 41h136l29-41h160"/><path d="M0 238h91l44-48h112l52 50h213"/><path d="M0 398h173l31-44h130l42 46h136"/>
</g>
<g fill="#c0a586" opacity=".52"><circle cx="75" cy="299" r="26"/><circle cx="396" cy="67" r="32"/><circle cx="302" cy="436" r="25"/><circle cx="203" cy="156" r="18"/></g>
<path d="M22 0l31 512M178 0l-21 512M330 0l27 512M477 0l-43 512" stroke="#6d4f3b" stroke-width="5" opacity=".32"/>
</svg>`,
  "brick_tile.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#c76f5a"/>
<g fill="#e79c73" opacity=".5"><rect x="0" y="0" width="122" height="58"/><rect x="138" y="0" width="122" height="58"/><rect x="276" y="0" width="122" height="58"/><rect x="414" y="0" width="98" height="58"/>
<rect x="64" y="74" width="122" height="58"/><rect x="202" y="74" width="122" height="58"/><rect x="340" y="74" width="122" height="58"/>
<rect x="0" y="148" width="122" height="58"/><rect x="138" y="148" width="122" height="58"/><rect x="276" y="148" width="122" height="58"/><rect x="414" y="148" width="98" height="58"/>
<rect x="64" y="222" width="122" height="58"/><rect x="202" y="222" width="122" height="58"/><rect x="340" y="222" width="122" height="58"/>
<rect x="0" y="296" width="122" height="58"/><rect x="138" y="296" width="122" height="58"/><rect x="276" y="296" width="122" height="58"/><rect x="414" y="296" width="98" height="58"/>
<rect x="64" y="370" width="122" height="58"/><rect x="202" y="370" width="122" height="58"/><rect x="340" y="370" width="122" height="58"/></g>
<g stroke="#763e39" stroke-width="8" opacity=".55"><path d="M0 66h512M0 140h512M0 214h512M0 288h512M0 362h512M0 436h512"/><path d="M130 0v66M268 0v66M406 0v66M56 66v74M194 66v74M332 66v74M470 66v74"/></g>
</svg>`,
  "flower_tile.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#77c895"/>
<path d="M0 412c74-41 127-41 193 0s130 39 192-2 95-37 127-8v110H0z" fill="#4aa178" opacity=".68"/>
<g opacity=".9">
<g transform="translate(95 112)"><circle r="14" fill="#ffd166"/><circle cx="-14" r="10" fill="#f1725f"/><circle cx="14" r="10" fill="#f1725f"/><circle cy="-14" r="10" fill="#f1725f"/><circle cy="14" r="10" fill="#f1725f"/></g>
<g transform="translate(368 168) scale(.85)"><circle r="14" fill="#ffd166"/><circle cx="-14" r="10" fill="#7ec8e3"/><circle cx="14" r="10" fill="#7ec8e3"/><circle cy="-14" r="10" fill="#7ec8e3"/><circle cy="14" r="10" fill="#7ec8e3"/></g>
<g transform="translate(231 344) scale(1.1)"><circle r="14" fill="#ffd166"/><circle cx="-14" r="10" fill="#fff0a4"/><circle cx="14" r="10" fill="#fff0a4"/><circle cy="-14" r="10" fill="#fff0a4"/><circle cy="14" r="10" fill="#fff0a4"/></g>
</g>
<g stroke="#e8ffd6" stroke-width="4" opacity=".35"><path d="M30 78c56 30 104 27 159-3s103-29 156 1 92 31 137 2"/><path d="M9 270c64-25 116-22 156 9s87 31 141 0 117-32 185 0"/></g>
</svg>`,
  "cloud_tile.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<defs><radialGradient id="g" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9e7f2"/></radialGradient></defs>
<rect width="512" height="512" fill="url(#g)"/>
<g fill="#ffffff" opacity=".45"><circle cx="96" cy="112" r="64"/><circle cx="168" cy="98" r="45"/><circle cx="418" cy="196" r="72"/><circle cx="333" cy="391" r="78"/><circle cx="150" cy="398" r="58"/></g>
<g stroke="#79bfd2" stroke-width="6" opacity=".34"><path d="M0 106c60 26 121 24 181-7s117-32 174 0 105 31 157 3"/><path d="M0 316c50-20 111-18 182 8s133 27 195 0 107-29 135-13"/></g>
</svg>`,
  "spring_pad.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" rx="64" fill="#1b2a38"/>
<circle cx="256" cy="256" r="194" fill="#f1725f"/><circle cx="256" cy="256" r="136" fill="#ffd166"/><circle cx="256" cy="256" r="82" fill="#79d4a8"/>
<path d="M96 256h320M256 96v320" stroke="#fff7cf" stroke-width="30" stroke-linecap="round" opacity=".76"/>
</svg>`,
  "star_texture.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#ffd166"/><path d="M256 42l54 146 156 9-122 98 40 153-128-86-128 86 40-153-122-98 156-9z" fill="#fff7cf"/>
<path d="M256 82l38 118 123 5-96 76 31 120-96-67-96 67 31-120-96-76 123-5z" fill="#f7a83b"/>
</svg>`,
  "hero_cloth.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#5a8cff"/><path d="M0 90c76 29 136 25 207-11s130-35 189 1 89 38 116 21v132c-57 28-113 24-170-12s-112-36-167 0S61 260 0 233z" fill="#79d4a8" opacity=".62"/>
<g stroke="#13232c" stroke-width="10" opacity=".2"><path d="M40 0l82 512M198 0l-38 512M362 0l54 512"/></g>
</svg>`,
  "enemy_skin.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#9d5ed6"/><circle cx="128" cy="126" r="58" fill="#eec8ff" opacity=".42"/><circle cx="344" cy="190" r="84" fill="#f1725f" opacity=".35"/><circle cx="232" cy="370" r="72" fill="#ffd166" opacity=".28"/>
<path d="M0 403c58 27 116 26 174-3s115-31 171-3 111 30 167 0v115H0z" fill="#4e2d77" opacity=".35"/>
</svg>`,
  "water_tile.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#3bb7da"/><g fill="none" stroke="#d5fbff" stroke-width="12" opacity=".5"><path d="M-20 110c52-31 101-31 147 0s96 31 151 0 104-31 156 0 87 32 114 0"/><path d="M-20 258c52-31 101-31 147 0s96 31 151 0 104-31 156 0 87 32 114 0"/><path d="M-20 406c52-31 101-31 147 0s96 31 151 0 104-31 156 0 87 32 114 0"/></g>
</svg>`,
};

for (const [name, content] of Object.entries(textures)) {
  fs.writeFileSync(path.join(textureDir, name), content);
}

const sampleRate = 44100;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function writeWav(filename, seconds, sampler) {
  const frameCount = Math.floor(seconds * sampleRate);
  const dataSize = frameCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < frameCount; i += 1) {
    const t = i / sampleRate;
    const s = clamp(sampler(t, seconds), -0.98, 0.98);
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  fs.writeFileSync(path.join(audioDir, filename), buffer);
}

function env(t, seconds, attack = 0.01, release = 0.08) {
  const a = clamp(t / attack, 0, 1);
  const r = clamp((seconds - t) / release, 0, 1);
  return Math.min(a, r);
}

function sine(freq, t) {
  return Math.sin(Math.PI * 2 * freq * t);
}

function pulse(freq, t) {
  return sine(freq, t) > 0 ? 1 : -1;
}

writeWav("jump.wav", 0.32, (t, seconds) => {
  const f = 220 + t * 620;
  return (sine(f, t) * 0.45 + sine(f * 2, t) * 0.12) * env(t, seconds, 0.01, 0.12);
});

writeWav("land.wav", 0.18, (t, seconds) => {
  const noise = Math.sin((t * 9127) % 17) * Math.sin((t * 4421) % 9);
  return (noise * 0.18 + sine(90, t) * 0.18) * env(t, seconds, 0.004, 0.1);
});

writeWav("pickup.wav", 0.36, (t, seconds) => {
  const notes = [659.25, 783.99, 987.77];
  const note = notes[Math.min(notes.length - 1, Math.floor((t / seconds) * notes.length))];
  return (sine(note, t) * 0.34 + sine(note * 2, t) * 0.08) * env(t, seconds, 0.006, 0.07);
});

writeWav("star.wav", 1.05, (t, seconds) => {
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  const note = notes[Math.min(notes.length - 1, Math.floor(t / 0.18))];
  return (sine(note, t) * 0.28 + sine(note * 1.5, t) * 0.08) * env(t, seconds, 0.01, 0.18);
});

writeWav("bounce.wav", 0.42, (t, seconds) => {
  const f = 180 + Math.sin(t * 24) * 70 + t * 360;
  return (pulse(f, t) * 0.22 + sine(f * 0.5, t) * 0.2) * env(t, seconds, 0.01, 0.14);
});

writeWav("hurt.wav", 0.42, (t, seconds) => {
  const f = 280 - t * 180;
  const wobble = sine(17, t) * 0.13;
  return (sine(f, t) * 0.3 + wobble) * env(t, seconds, 0.006, 0.18);
});

writeWav("win.wav", 1.4, (t, seconds) => {
  const notes = [392, 523.25, 659.25, 783.99, 1046.5, 1318.51];
  const note = notes[Math.min(notes.length - 1, Math.floor(t / 0.18))];
  return (sine(note, t) * 0.27 + sine(note * 2, t) * 0.08) * env(t, seconds, 0.01, 0.22);
});

writeWav("bgm_loop.wav", 24, (t) => {
  const beat = 60 / 132;
  const melody = [392, 440, 523.25, 659.25, 587.33, 523.25, 440, 392, 329.63, 392, 493.88, 587.33, 659.25, 587.33, 523.25, 440];
  const bass = [98, 130.81, 146.83, 130.81, 110, 146.83, 164.81, 146.83];
  const step = Math.floor(t / (beat * 0.5));
  const note = melody[step % melody.length];
  const bassNote = bass[Math.floor(t / beat) % bass.length];
  const local = (t % (beat * 0.5)) / (beat * 0.5);
  const gate = local < 0.82 ? 1 : 0.25;
  const drums = Math.sin((t * 7200) % 31) * (local < 0.08 ? 0.08 : 0);
  return pulse(note, t) * 0.08 * gate + sine(note * 2, t) * 0.025 + pulse(bassNote, t) * 0.06 + drums;
});

console.log(`Generated ${Object.keys(textures).length} textures and 8 audio files.`);
