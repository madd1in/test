import math
import random
import struct
import wave
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "audio" / "nocturne-hunter-loop.wav"
SAMPLE_RATE = 44100
BPM = 144
BEAT = 60 / BPM
BARS = 16
DURATION = BARS * 4 * BEAT

NOTE_OFFSETS = {
    "C": -9,
    "C#": -8,
    "D": -7,
    "D#": -6,
    "E": -5,
    "F": -4,
    "F#": -3,
    "G": -2,
    "G#": -1,
    "A": 0,
    "A#": 1,
    "B": 2,
}


def note_freq(note):
    name = note[:-1]
    octave = int(note[-1])
    semitone = NOTE_OFFSETS[name] + (octave - 4) * 12
    return 440.0 * (2 ** (semitone / 12))


def env(local, length, attack=0.01, decay=0.04, sustain=0.72, release=0.08):
    if local < 0 or local >= length:
      return 0.0
    if local < attack:
      return local / attack
    if local < attack + decay:
      return 1 - (1 - sustain) * ((local - attack) / decay)
    if local > length - release:
      return sustain * max(0.0, (length - local) / release)
    return sustain


def square(phase, duty=0.5):
    return 1.0 if (phase % 1.0) < duty else -1.0


def tri(phase):
    return 4.0 * abs((phase % 1.0) - 0.5) - 1.0


def saw(phase):
    return 2.0 * (phase % 1.0) - 1.0


def add_note(buffer, start, length, freq, amp, wave_kind="square", duty=0.5, attack=0.01, release=0.08):
    first = max(0, int(start * SAMPLE_RATE))
    last = min(len(buffer), int((start + length) * SAMPLE_RATE))
    phase = 0.0
    phase_step = freq / SAMPLE_RATE
    for i in range(first, last):
        local = i / SAMPLE_RATE - start
        vibrato = 1 + 0.0035 * math.sin(2 * math.pi * 5.3 * local)
        phase += phase_step * vibrato
        if wave_kind == "triangle":
            value = tri(phase)
        elif wave_kind == "saw":
            value = 0.55 * saw(phase) + 0.3 * square(phase, duty)
        else:
            value = square(phase, duty)
        buffer[i] += value * amp * env(local, length, attack=attack, release=release)


def add_kick(buffer, start):
    first = int(start * SAMPLE_RATE)
    length = int(0.15 * SAMPLE_RATE)
    for n in range(length):
        i = first + n
        if i >= len(buffer):
            break
        t = n / SAMPLE_RATE
        freq = 92 * (1 - min(1, t / 0.13)) + 42
        value = math.sin(2 * math.pi * freq * t)
        buffer[i] += value * 0.38 * math.exp(-t * 23)


def add_snare(buffer, start):
    rng = random.Random(31337 + int(start * 1000))
    first = int(start * SAMPLE_RATE)
    length = int(0.11 * SAMPLE_RATE)
    for n in range(length):
        i = first + n
        if i >= len(buffer):
            break
        t = n / SAMPLE_RATE
        noise = rng.uniform(-1, 1)
        tone = math.sin(2 * math.pi * 185 * t) * 0.3
        buffer[i] += (noise * 0.28 + tone) * math.exp(-t * 28)


def add_hat(buffer, start, amp=0.12):
    rng = random.Random(9000 + int(start * 2000))
    first = int(start * SAMPLE_RATE)
    length = int(0.045 * SAMPLE_RATE)
    for n in range(length):
        i = first + n
        if i >= len(buffer):
            break
        t = n / SAMPLE_RATE
        buffer[i] += rng.uniform(-1, 1) * amp * math.exp(-t * 65)


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    buffer = [0.0] * int(DURATION * SAMPLE_RATE)

    chords = [
        ["A3", "C4", "E4", "G#4"],
        ["F3", "A3", "C4", "E4"],
        ["G3", "B3", "D4", "F4"],
        ["E3", "G#3", "B3", "D4"],
        ["A3", "C4", "E4", "A4"],
        ["D3", "F3", "A3", "C4"],
        ["F3", "A3", "C4", "E4"],
        ["E3", "G#3", "B3", "E4"],
    ]
    bass_roots = ["A2", "F2", "G2", "E2", "A2", "D2", "F2", "E2"]
    lead = ["A4", "C5", "B4", "G#4", "A4", "E5", "D5", "C5", "B4", "C5", "A4", "G#4", "E4", "G#4", "B4", "E5"]

    for bar in range(BARS):
        bar_start = bar * 4 * BEAT
        chord = chords[bar % len(chords)]
        root = bass_roots[bar % len(bass_roots)]

        for note in chord:
            add_note(buffer, bar_start, 4 * BEAT, note_freq(note), 0.045, "triangle", attack=0.025, release=0.16)

        for step in range(16):
            t = bar_start + step * BEAT / 4
            arp_note = chord[(step + (bar % 3)) % len(chord)]
            add_note(buffer, t, BEAT / 4 * 0.86, note_freq(arp_note), 0.072, "square", duty=0.31, attack=0.003, release=0.035)

        for beat in range(4):
            t = bar_start + beat * BEAT
            add_note(buffer, t, BEAT * 0.82, note_freq(root), 0.18, "saw", duty=0.42, attack=0.004, release=0.04)
            add_kick(buffer, t)
            add_hat(buffer, t + BEAT / 2, 0.09)

        add_snare(buffer, bar_start + BEAT * 1.5)
        add_snare(buffer, bar_start + BEAT * 3.5)

    for i, note in enumerate(lead):
        start = (8 * BEAT) + i * BEAT / 2
        add_note(buffer, start, BEAT * 0.44, note_freq(note), 0.11, "square", duty=0.27, attack=0.006, release=0.06)
        add_note(buffer, start, BEAT * 0.44, note_freq(note) * 2, 0.025, "triangle", attack=0.006, release=0.06)

    for i, note in enumerate(reversed(lead)):
        start = (40 * BEAT) + i * BEAT / 2
        add_note(buffer, start, BEAT * 0.42, note_freq(note), 0.1, "square", duty=0.24, attack=0.006, release=0.055)

    peak = max(0.01, max(abs(sample) for sample in buffer))
    gain = 0.88 / peak
    fade_samples = int(0.04 * SAMPLE_RATE)
    frames = bytearray()
    for i, sample in enumerate(buffer):
        fade = 1.0
        if i < fade_samples:
            fade = i / fade_samples
        elif len(buffer) - i < fade_samples:
            fade = (len(buffer) - i) / fade_samples
        value = max(-1.0, min(1.0, sample * gain * fade))
        frames.extend(struct.pack("<h", int(value * 32767)))

    with wave.open(str(OUT), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(frames)

    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes, {DURATION:.2f}s)")


if __name__ == "__main__":
    main()
