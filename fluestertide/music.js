(function (root) {
  'use strict';

  // All melodies and arrangements are original. BPM counts the displayed meter's pulses.
  const definitions = {
    title: { title: 'Segel im Morgenrot', bpm: 80, meter: [4, 4], tonic: 'D4', mood: 'adventure', chords: ['D3 F3 A3', 'Bb2 D3 F3', 'C3 E3 G3', 'A2 C#3 E3', 'D3 F3 A3', 'G2 Bb2 D3', 'A2 C#3 E3', 'D3 F3 A3'], melody: ['D4:1 F4:.5 A4:.5 D5:1 C5:.5 A4:.5', 'Bb4:1 A4:.5 F4:.5 D4:1 F4:1', 'E4:.5 G4:.5 C5:1 B4:.5 G4:.5 E4:1', 'A4:1 G4:.5 E4:.5 C#4:1 A4:1'] },
    harbor: { title: 'Eine Welle wartet', bpm: 76, meter: [4, 4], tonic: 'G4', mood: 'calm', chords: ['G2 B2 D3', 'E3 G3 B3', 'C3 E3 G3', 'D3 F#3 A3', 'G2 B2 D3', 'C3 E3 G3', 'D3 F#3 A3', 'G2 B2 D3'], melody: ['G4:1 B4:.5 A4:.5 G4:1 D4:1', 'E4:1 G4:1 B4:.5 A4:.5 G4:1', 'E4:.5 G4:.5 C5:1 G4:1 E4:1', 'F#4:1 A4:.5 G4:.5 F#4:1 D4:1'] },
    tavern: { title: 'Der schiefe Aal tanzt', bpm: 96, meter: [6, 8], tonic: 'D4', mood: 'shanty', chords: ['D3 F#3 A3', 'G2 B2 D3', 'A2 C#3 E3', 'D3 F#3 A3', 'B2 D3 F#3', 'G2 B2 D3', 'A2 C#3 E3', 'D3 F#3 A3'], melody: ['D4:1 F#4:1 A4:1 D5:1 A4:1 F#4:1', 'G4:1 B4:.5 A4:.5 G4:1 D4:1 G4:2', 'A4:1 E4:1 C#4:1 E4:.5 F#4:.5 G4:1 A4:1', 'F#4:1 E4:1 D4:1 A3:1 D4:2'] },
    bazaar: { title: 'Pippas bunte Münzen', bpm: 104, meter: [6, 8], tonic: 'A4', mood: 'market', chords: ['A2 C3 E3', 'F3 A3 C4', 'G2 B2 D3', 'E3 G#3 B3', 'A2 C3 E3', 'D3 F3 A3', 'E3 G#3 B3', 'A2 C3 E3'], melody: ['A4:.5 B4:.5 C5:1 E5:1 C5:1 B4:1 A4:1', 'A4:1 C5:.5 A4:.5 F4:1 A4:1 C5:1 A4:1', 'B4:.5 D5:.5 G4:1 A4:1 B4:1 D5:1 B4:1', 'G#4:1 B4:1 E5:.5 D5:.5 B4:1 G#4:1 E4:1'] },
    lighthouse: { title: 'Ein Licht durch den Nebel', bpm: 78, meter: [4, 4], tonic: 'C4', mood: 'hope', chords: ['C3 E3 G3', 'F3 A3 C4', 'A2 C3 E3', 'G2 B2 D3', 'C3 E3 G3', 'F3 A3 C4', 'G2 B2 D3', 'C3 E3 G3'], melody: ['C4:1 E4:.5 G4:.5 C5:1 B4:.5 G4:.5', 'A4:1 G4:1 F4:.5 E4:.5 F4:1', 'E4:1 A4:1 C5:.5 B4:.5 A4:1', 'G4:1 D4:.5 G4:.5 B4:1 G4:1'] },
    lagoon: { title: 'Die Muschel flüstert', bpm: 68, meter: [4, 4], tonic: 'E4', mood: 'mystery', chords: ['E3 G3 B3', 'C3 E3 G3', 'D3 F#3 A3', 'B2 D#3 F#3', 'E3 G3 B3', 'A2 C3 E3', 'B2 D#3 F#3', 'E3 G3 B3'], melody: ['E4:1 R:.5 B4:.5 G4:1 F#4:1', 'E4:.5 G4:.5 C5:1 B4:1 G4:1', 'F#4:1 A4:1 D5:.5 A4:.5 F#4:1', 'D#4:1 F#4:.5 B4:.5 A4:1 F#4:1'] },
    wreck: { title: 'Balthasars letzter Walzer', bpm: 62, meter: [4, 4], tonic: 'A3', mood: 'ghost', chords: ['A2 C3 E3', 'D3 F3 A3', 'F3 A3 C4', 'E3 G#3 B3', 'A2 C3 E3', 'F3 A3 C4', 'E3 G#3 B3', 'A2 C3 E3'], melody: ['A3:1 E4:1 C4:.5 B3:.5 A3:1', 'D4:1 F4:1 E4:.5 D4:.5 A3:1', 'C4:1 F4:.5 A4:.5 G4:1 F4:1', 'B3:1 G#3:1 E4:1 R:1'] },
    vault: { title: 'Das Herz der Schweigeglocke', bpm: 82, meter: [4, 4], tonic: 'D4', mood: 'tension', chords: ['D3 F3 A3', 'Bb2 D3 F3', 'G2 Bb2 D3', 'A2 C#3 E3', 'D3 F3 A3', 'C3 E3 G3', 'A2 C#3 E3', 'D3 F3 A3'], melody: ['D4:.5 A4:.5 D4:.5 F4:.5 E4:1 D4:1', 'F4:.5 Bb4:.5 F4:.5 D4:.5 C4:1 D4:1', 'G4:.5 D5:.5 G4:.5 Bb4:.5 A4:1 G4:1', 'C#4:.5 E4:.5 A4:.5 G4:.5 E4:1 C#4:1'] },
    finale: { title: 'Krummwasser singt wieder', bpm: 112, meter: [6, 8], tonic: 'D4', mood: 'triumph', chords: ['D3 F#3 A3', 'G2 B2 D3', 'B2 D3 F#3', 'A2 C#3 E3', 'D3 F#3 A3', 'G2 B2 D3', 'A2 C#3 E3', 'D3 F#3 A3'], melody: ['D4:1 F#4:.5 A4:.5 D5:1 C#5:1 A4:1 F#4:1', 'G4:1 B4:1 D5:1 B4:.5 A4:.5 G4:1 D4:1', 'B4:1 F#4:1 D5:.5 C#5:.5 B4:1 A4:1 F#4:1', 'A4:1 C#5:1 E5:1 D5:.5 C#5:.5 A4:2'] }
  };

  function noteMidi(note) {
    if (note === 'R') return null;
    const match = /^([A-G])([#b]?)(-?\d)$/.exec(note);
    if (!match) throw new Error('Ungültige Note: ' + note);
    return (Number(match[3]) + 1) * 12 + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1]] + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0);
  }
  function parseMelody(pattern) {
    return pattern.split(' ').map(token => { const [note, duration] = token.split(':'); return { midi: noteMidi(note), duration: Number(duration) }; });
  }
  const scores = Object.fromEntries(Object.entries(definitions).map(([id, d]) => [id, Object.freeze({ id, title: d.title, bpm: d.bpm, meter: Object.freeze(d.meter), beatsPerBar: d.meter[0], bars: 16, tonic: noteMidi(d.tonic), mood: d.mood, chords: Object.freeze(d.chords.map(chord => Object.freeze(chord.split(' ').map(noteMidi)))), melody: Object.freeze(d.melody.map(pattern => Object.freeze(parseMelody(pattern).map(Object.freeze)))) })]));
  Object.freeze(scores);
  const midiToFrequency = midi => 440 * Math.pow(2, (midi - 69) / 12);
  const loopSeconds = score => score.bars * score.beatsPerBar * 60 / score.bpm;
  function buildBar(score, index) {
    const bar = ((index % score.bars) + score.bars) % score.bars;
    const chord = score.chords[bar % score.chords.length];
    const beats = score.beatsPerBar;
    const quiet = ['calm', 'mystery', 'ghost'].includes(score.mood);
    const events = [];
    let beat = 0;
    const melody = bar === score.bars - 1 ? [{ midi: score.tonic, duration: beats - .5 }, { midi: null, duration: .5 }] : score.melody[bar % score.melody.length];
    for (const note of melody) {
      if (note.midi !== null) events.push({ voice: 'lead', midi: note.midi + (bar >= 8 && bar < 12 && score.mood !== 'ghost' ? 12 : 0), beat, duration: note.duration * .86, velocity: quiet ? .044 : .054 });
      beat += note.duration;
    }
    events.push({ voice: 'bass', midi: chord[0] - 12, beat: 0, duration: beats / 2 * .78, velocity: .11 });
    events.push({ voice: 'bass', midi: chord[0] - 5, beat: beats / 2, duration: beats / 2 * .68, velocity: .085 });
    for (let pulse = 0; pulse < beats * 2; pulse++) {
      events.push({ voice: 'arp', midi: chord[[0, 2, 1, 2][pulse % 4]] + 12, beat: pulse / 2, duration: .32, velocity: quiet ? .019 : .025 });
      if (!quiet || pulse % 2 === 0) events.push({ voice: 'drum', drum: 'hat', beat: pulse / 2, duration: .045, velocity: quiet ? .011 : .018 });
    }
    events.push({ voice: 'drum', drum: 'kick', beat: 0, duration: .12, velocity: quiet ? .047 : .075 });
    events.push({ voice: 'drum', drum: 'snare', beat: beats / 2, duration: .10, velocity: quiet ? .024 : .045 });
    if (score.mood === 'tension') events.push({ voice: 'drum', drum: 'kick', beat: beats - .5, duration: .09, velocity: .045 });
    return events.sort((a, b) => a.beat - b.beat);
  }
  function scoreEvents(score) {
    return Array.from({ length: score.bars }, (_, bar) => buildBar(score, bar).map(event => ({ ...event, beat: bar * score.beatsPerBar + event.beat }))).flat();
  }

  const sound = (frequency, duration, velocity, extra = {}) => ({ frequency, duration, velocity, ...extra });
  const rustle = (cutoff, duration, velocity, extra = {}) => ({ noise: true, cutoff, duration, velocity, ...extra });
  const ambienceProfiles = {
    title: { title: 'Holz, Tau und leise Gläser', interval: 12, events: [sound(106, .4, .014, { to: 73, wave: 'triangle', pan: -.2 }), rustle(250, .12, .016, { delay: .24 }), rustle(430, .9, .015, { delay: .7, attack: .3, release: .35, pan: .35 })] },
    harbor: { title: 'Knarrende Stege, Wellen und ferne Möwen', interval: 8.6, events: [sound(83, .48, .019, { to: 61, wave: 'triangle', pan: -.35 }), rustle(280, .15, .024, { delay: .17 }), sound(540, .07, .008, { to: 290, delay: .52 }), rustle(620, .95, .021, { cutoffEnd: 360, delay: .65, attack: .3, release: .4, pan: .3 }), sound(1280, .08, .006, { to: 1530, delay: 1.7, pan: -.55 }), sound(1440, .07, .005, { to: 1120, delay: 1.82, pan: -.48 })] },
    tavern: { title: 'Gläser, Kamin und alte Balken', interval: 7.3, events: [sound(1260, .08, .012, { pan: -.4 }), rustle(1150, .04, .02, { delay: .2 }), sound(92, .36, .014, { to: 69, wave: 'triangle', delay: .44 }), rustle(760, .3, .012, { attack: .08, delay: .75, pan: .42 }), sound(1840, .16, .005, { delay: 1.2, pan: -.25 }), rustle(210, .4, .008, { attack: .12, delay: 1.5, pan: .2 })] },
    bazaar: { title: 'Segeltuch, Münzen und Pippas winzige Töne', interval: 8.2, events: [rustle(780, .19, .022, { pan: -.3 }), sound(1420, .055, .009, { to: 1750, delay: .35, pan: .45 }), sound(1240, .06, .007, { to: 1510, delay: .46, pan: .42 }), rustle(400, .55, .014, { delay: .85, attack: .15, release: .2, pan: -.45 }), sound(2090, .08, .006, { delay: 1.48, pan: .2 })] },
    lighthouse: { title: 'Leise Zahnräder im Dunkeln', interval: 10.4, events: [rustle(190, .23, .022, { pan: -.2 }), sound(86, .42, .013, { to: 81, delay: .18 }), rustle(490, .94, .015, { attack: .32, release: .35, delay: .7, pan: .5 }), sound(380, .09, .006, { to: 310, delay: 1.5, pan: -.3 })] },
    lagoon: { title: 'Wassertropfen, Wellen und Muschelresonanz', interval: 8.1, events: [sound(740, .11, .016, { to: 480, pan: -.45 }), sound(1060, .08, .009, { to: 710, delay: .32, pan: .3 }), sound(164, .5, .008, { delay: .55 }), rustle(570, .96, .018, { cutoffEnd: 320, attack: .3, release: .4, delay: .8, pan: .4 }), sound(1680, .075, .004, { to: 1450, delay: 1.7, pan: -.5 })] },
    wreck: { title: 'Knarrendes Holz und ein stiller Kiel', interval: 11.2, events: [sound(81, .62, .02, { to: 55, wave: 'triangle', pan: -.35 }), sound(58, .8, .011, { delay: .42, pan: .3 }), rustle(170, .12, .017, { delay: .7 }), rustle(360, .72, .009, { delay: 1.1, attack: .25, release: .3, pan: .45 })] },
    vault: { title: 'Gedämpfter Klang in der Glockenkammer', interval: 12.3, events: [sound(135, 1.1, .012, { attack: .2, pan: -.18 }), sound(271, .6, .004, { delay: .08, attack: .15, pan: .35 }), rustle(270, .27, .006, { delay: .85, attack: .09 }), sound(809, .2, .0025, { delay: 1.15, pan: -.4 })] },
    ocean: { title: 'Sanfte Meeresbrise', interval: 7.4, events: [rustle(680, 1.5, .032, { cutoffEnd: 420, attack: .4, release: .5, offset: .2, pan: -.3 }), rustle(1100, .42, .01, { delay: .85, attack: .12, offset: .6, pan: .4 }), sound(1280, .08, .004, { to: 1510, delay: 1.5, pan: -.5 }), sound(1460, .09, .004, { to: 1180, delay: 1.63, pan: -.45 })] },
    lamp: { title: 'Laternenwärme und sanftes Surren', interval: 9.1, events: [sound(104, .62, .013, { to: 101, attack: .18, pan: -.12 }), rustle(1300, .035, .014, { delay: .5 }), rustle(540, .95, .012, { attack: .3, release: .35, delay: .8, pan: .45 }), sound(1568, .12, .004, { delay: 1.4, pan: -.3 })] },
    ghost: { title: 'Balthasars warme Schiffserinnerung', interval: 10.6, events: [sound(98, .55, .016, { to: 73, wave: 'triangle', pan: -.25 }), sound(110, .8, .009, { delay: .36, attack: .2, pan: .2 }), rustle(500, .82, .014, { delay: .8, attack: .3, release: .3, pan: .45 }), sound(440, .08, .003, { delay: 1.6, pan: -.3 })] },
    harmony: { title: 'Der Dreiklang atmet', interval: 11.8, events: [sound(146.83, .65, .009, { attack: .18, pan: -.35 }), sound(220, .55, .006, { delay: .2, attack: .15, pan: .35 }), sound(293.66, .7, .004, { delay: .4, attack: .18 }), sound(880, .16, .0025, { delay: 1.1, pan: -.25 })] }
  };
  function worldSnapshot(input = {}) {
    if (!input || typeof input !== 'object') input = {};
    const flags = input.flags && typeof input.flags === 'object' ? input.flags : input;
    return {
      finished: input.finished === true || flags.finished === true || ['gentle', 'loud'].includes(flags.ending),
      lampLit: !!flags.lampLit, beaconFixed: !!flags.beaconFixed,
      ghostHelped: !!flags.ghostHelped, harmonyUnlocked: !!flags.harmonyUnlocked,
      harborBandComplete: !!flags.harborBandComplete
    };
  }
  function ambienceFor(scene, state = {}) {
    const world = worldSnapshot(state);
    if (world.finished || scene === 'finale') return ambienceProfiles.ocean;
    if (scene === 'lighthouse' && (world.lampLit || world.beaconFixed)) return ambienceProfiles.lamp;
    if (scene === 'wreck' && world.ghostHelped) return ambienceProfiles.ghost;
    if (scene === 'vault' && world.harmonyUnlocked) return ambienceProfiles.harmony;
    return ambienceProfiles[scene] || ambienceProfiles.title;
  }
  const effectTypes = Object.freeze(['click', 'success', 'pickup', 'use', 'combine', 'error', 'travel', 'discovery', 'step']);
  function soundEvents(type, scene = 'harbor', alternate = 0) {
    const sand = scene === 'lagoon' || scene === 'bazaar';
    const stone = scene === 'vault' || scene === 'lighthouse';
    if (type === 'click') return [sound(760, .042, .025, { to: 510 })];
    if (type === 'success') return [74, 78, 81].map((midi, index) => sound(midiToFrequency(midi), .12, .072, { delay: index * .085, wave: 'triangle' }));
    if (type === 'pickup') return [sound(620, .065, .068, { wave: 'triangle' }), sound(930, .08, .047, { delay: .055 })];
    if (type === 'use') return [rustle(stone ? 1450 : 850, .05, .054), sound(stone ? 390 : 305, .10, .029, { to: stone ? 330 : 210, delay: .015 })];
    if (type === 'combine') return [349.23, 523.25, 698.46].map((frequency, index) => sound(frequency, .11, .059, { delay: index * .058, wave: 'triangle' }));
    if (type === 'error') return [sound(196, .095, .045, { to: 160 }), sound(146.83, .08, .035, { delay: .07 })];
    if (type === 'travel') return [rustle(900, .11, .032, { attack: .015 }), sound(235, .15, .032, { to: 103, wave: 'triangle', delay: .035 })];
    if (type === 'discovery') return [523.25, 783.99, 1046.5].map((frequency, index) => sound(frequency, index === 2 ? .24 : .14, .052, { delay: index * .09 }));
    if (type === 'step') return [rustle(sand ? 950 : stone ? 1500 : 650, sand ? .038 : .026, sand ? .045 : .062, { offset: alternate % 2 ? .07 : 0 }), sound(stone ? 180 : 95, .03, .023, { to: stone ? 118 : 74, wave: 'triangle' })];
    return [];
  }
  function toneEvents(id) {
    if (id === 'sea') return [sound(146.83, .33, .052, { attack: .028 }), sound(73.42, .24, .027, { delay: .025 })];
    if (id === 'wind') return [sound(440, .24, .035, { to: 466.16, attack: .04 }), rustle(1650, .15, .014, { delay: .04, attack: .035 })];
    if (id === 'heart') return [sound(293.66, .25, .043, { attack: .025 }), sound(349.23, .22, .027, { delay: .028 })];
    return [];
  }
  const bandIds = Object.freeze(['wood', 'glass', 'shell', 'bell']);
  function bandEvents(id) {
    if (id === 'wood') return [rustle(620, .035, .065, { pan: -.35, room: 0 }), sound(196, .11, .042, { to: 140, wave: 'triangle', pan: -.35, room: 0 })];
    if (id === 'glass') return [sound(1174.66, .23, .042, { pan: .3, room: .04 }), sound(2349.32, .12, .013, { delay: .006, pan: .3, room: .04 })];
    if (id === 'shell') return [sound(392, .3, .039, { to: 415.3, attack: .035, pan: -.12, room: .05 }), rustle(1280, .14, .008, { delay: .025, attack: .035, pan: -.12, room: 0 })];
    if (id === 'bell') return [sound(783.99, .4, .041, { pan: .2, room: .075 }), sound(1568, .27, .012, { delay: .005, pan: .2, room: .075 }), sound(2110, .14, .004, { delay: .008, pan: .2, room: .075 })];
    return [];
  }
  function arrangementEvents(score, index, state = {}) {
    const world = worldSnapshot(state), chord = score.chords[index % score.chords.length], beat = score.beatsPerBar;
    const note = (midi, at, velocity=.009) => ({voice:'ornament',midi,beat:at,duration:.45,velocity});
    if (world.harborBandComplete && score.id === 'harbor' && index % 4 === 0) return [note(chord[2]+12,0,.01),note(chord[1]+12,1.5,.008)];
    if (world.finished && index % 4 === 0) return [note(chord[2]+12,beat-1,.008)];
    if (score.id === 'lighthouse' && (world.lampLit || world.beaconFixed) && index % 2 === 0) return [note(chord[1]+12,beat-1)];
    if (score.id === 'wreck' && world.ghostHelped && index % 2 === 0) return [note(chord[1]+12,beat/2+.5,.008)];
    if (score.id === 'vault' && world.harmonyUnlocked && index % 2 === 0) return [note(chord[2]+12,beat-1,.01)];
    return [];
  }

  const PREF_KEY = 'fluestertide.music.v1';
  function createPlayer(environment = {}) {
    const win = environment.window || root || {};
    const doc = environment.document || win.document;
    const storage = environment.storage || (() => { try { return win.localStorage; } catch (_) { return null; } })();
    const Audio = environment.AudioContext || win.AudioContext || win.webkitAudioContext;
    const interval = environment.setInterval || win.setInterval && win.setInterval.bind(win);
    const clear = environment.clearInterval || win.clearInterval && win.clearInterval.bind(win);
    let enabled = true, volume = .35, soundEnabled = true, soundVolume = .45, scene = 'title', activeScene = 'title';
    let context = null, master = null, musicBus = null, effectsBus = null, soundMaster = null, ambienceBus = null, bandBus = null, noise = null;
    let initialized = false, unlocked = false, playing = false, soundPlaying = false, ready = false, error = null, ducked = false, disposed = false, pageHidden = false;
    let timer = null, cursor = 0, loopStart = 0, loopNumber = 0, pending = null, transitionAt = 0, events = scoreEvents(scores.title), resumeToken = 0;
    let pendingSuspension = Promise.resolve(), suspensionCount = 0;
    let world = worldSnapshot(), worldSignature = JSON.stringify(world), nextAmbienceAt = 0, ambienceCycle = 0, stepSequence = 0;
    let arrangementWorld = world, pendingArrangement = null, arrangementAt = 0, ornamentBar = '';
    let bandQueue = null, bandPlaying = false, bandStep = -1;
    const lastEffect = new Map();
    const records = new Set();
    const listeners = [];
    try {
      const saved = storage && JSON.parse(storage.getItem(PREF_KEY));
      if (saved && typeof saved.enabled === 'boolean') enabled = saved.enabled;
      if (saved && Number.isFinite(saved.volume)) volume = Math.max(0, Math.min(1, saved.volume));
      if (saved && typeof saved.soundEnabled === 'boolean') soundEnabled = saved.soundEnabled;
      if (saved && Number.isFinite(saved.soundVolume)) soundVolume = Math.max(0, Math.min(1, saved.soundVolume));
    } catch (_) { /* Storage is optional, including file:// private windows. */ }
    const hidden = () => pageHidden || !!(doc && doc.hidden);
    const musicWanted = () => enabled && volume > 0;
    const soundWanted = () => soundEnabled && soundVolume > 0;
    const anyWanted = () => musicWanted() || soundWanted();
    const canRun = () => !disposed && unlocked && context && context.state === 'running' && !hidden();
    const getStatus = () => ({ enabled, playing, scene, activeScene, title: scores[scene].title, volume, soundEnabled, soundVolume, soundPlaying, ambience: ambienceFor(scene, world).title, ready, error, ducked, bandPlaying, bandStep });
    function emit() {
      const detail = getStatus();
      if (typeof environment.onStatus === 'function') environment.onStatus(detail);
      if (win.dispatchEvent && win.CustomEvent) win.dispatchEvent(new win.CustomEvent('fluestertide:music', { detail }));
    }
    function persist() { try { if (storage) storage.setItem(PREF_KEY, JSON.stringify({ enabled, volume, soundEnabled, soundVolume })); } catch (_) {} }
    function listen(target, event, handler) {
      if (target && target.addEventListener) { target.addEventListener(event, handler); listeners.push([target, event, handler]); }
    }
    function ramp(param, value, duration = .05) {
      if (!param || !context) return;
      const now = context.currentTime;
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(value, now + duration);
    }
    function levels() {
      if (!context) return;
      ramp(master.gain, enabled ? volume : 0, .06);
      ramp(musicBus.gain, ducked ? .22 : .64, .12);
      ramp(soundMaster.gain, soundEnabled ? soundVolume : 0, .06);
      ramp(ambienceBus.gain, ducked ? .18 : .64, .12);
      if (bandBus) ramp(bandBus.gain, ducked ? .22 : .68, .1);
    }
    function forget(record) {
      if (!records.delete(record)) return;
      for (const node of record.nodes) { try { node.disconnect(); } catch (_) {} }
    }
    function stopRecord(record, fade = .025) {
      if (!context) return;
      const now = context.currentTime;
      try {
        record.gain.gain.cancelScheduledValues(now);
        record.gain.gain.setValueAtTime(record.start > now ? 0 : record.gain.gain.value, now);
        record.gain.gain.linearRampToValueAtTime(0, now + fade);
        record.source.stop(record.start > now ? now : now + fade);
      } catch (_) { forget(record); }
    }
    function stopCategory(category) {
      for (const record of Array.from(records)) if (record.category === category) stopRecord(record);
    }
    function stop() {
      resumeToken++;
      if (timer !== null && clear) clear(timer);
      timer = null;
      const wasPlaying = playing || soundPlaying || bandPlaying;
      playing = false; soundPlaying = false;
      bandQueue = null; bandPlaying = false; bandStep = -1;
      for (const record of Array.from(records)) stopRecord(record);
      pending = null;
      lastEffect.clear();
      if (wasPlaying) emit();
    }
    function noiseBuffer() {
      const buffer = context.createBuffer(1, Math.round(context.sampleRate * 2.4), context.sampleRate);
      const channel = buffer.getChannelData(0);
      let seed = 0x13572468;
      for (let index = 0; index < channel.length; index++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; channel[index] = seed / 2147483648 - 1; }
      return buffer;
    }
    function route(gain, bus, event, nodes, room=0) {
      // Both APIs are optional; older browsers and headless test contexts stay mono.
      let output = bus;
      if (context.createStereoPanner && Number.isFinite(event.pan)) {
        try { const panner = context.createStereoPanner(); panner.pan.setValueAtTime(Math.max(-.65,Math.min(.65,event.pan)), context.currentTime); panner.connect(bus); nodes.push(panner); output=panner; } catch (_) {}
      }
      gain.connect(output);
      if (room > 0 && context.createDelay) {
        try { const delay=context.createDelay(.2), echo=context.createGain(); delay.delayTime.value=Math.min(.12,room); echo.gain.value=.13; gain.connect(delay); delay.connect(echo); echo.connect(output); nodes.push(delay,echo); } catch (_) {}
      }
    }
    function schedule(event, at, secondsPerBeat, bus = musicBus) {
      if (!context || !bus || at < context.currentTime - .02) return;
      const isDrum = event.voice === 'drum';
      const source = isDrum ? context.createBufferSource() : context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      filter.type = 'lowpass';
      filter.Q.value = .5;
      filter.frequency.value = isDrum ? { kick: 190, snare: 1100, hat: 2300 }[event.drum] : event.voice === 'bass' ? 480 : event.voice === 'arp' ? 1200 : 1850;
      if (isDrum) { source.buffer = noise; source.playbackRate.value = event.drum === 'kick' ? .65 : 1; }
      else { source.type = event.voice === 'bass' ? 'triangle' : event.voice === 'ornament' ? 'sine' : 'square'; source.frequency.setValueAtTime(midiToFrequency(event.midi), at); }
      const duration = isDrum ? event.duration : Math.max(.055, event.duration * secondsPerBeat);
      const attack = Math.min(duration * .15, event.voice === 'lead' ? .014 : .009);
      const release = Math.min(.07, duration * .3);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(event.velocity, at + attack);
      gain.gain.setValueAtTime(event.velocity * .73, Math.max(at + attack, at + duration - release));
      gain.gain.linearRampToValueAtTime(0, at + duration);
      const nodes=[source,filter,gain];source.connect(filter);filter.connect(gain);
      const pan = event.voice==='bass'?0:event.voice==='arp'?(event.midi%2?-.18:.18):event.voice==='ornament'?.28:event.voice==='drum'?.1:-.08;
      route(gain,bus,{pan},nodes);
      const record = { source, gain, nodes, start: at, end: at + duration + .012, scene: activeScene, category: 'music' };
      records.add(record);
      source.onended = () => forget(record);
      source.start(at); source.stop(record.end);
    }
    function texture(event, at, category) {
      if (!canRun() || !soundWanted() || records.size >= 128 || at < context.currentTime - .02) return;
      const bus = category === 'ambience' ? ambienceBus : category === 'band' ? bandBus : effectsBus;
      const source = event.noise ? context.createBufferSource() : context.createOscillator();
      const filter = context.createBiquadFilter(), gain = context.createGain();
      filter.type = 'lowpass'; filter.Q.value = .45;
      const cutoff = event.cutoff || Math.min(3800, event.frequency * 3.2);
      filter.frequency.setValueAtTime(cutoff, at);
      if (event.cutoffEnd) filter.frequency.linearRampToValueAtTime(event.cutoffEnd, at + event.duration);
      if (event.noise) { source.buffer = noise; source.playbackRate.value = 1; }
      else {
        source.type = event.wave || 'sine';
        source.frequency.setValueAtTime(event.frequency, at);
        if (event.to) source.frequency.linearRampToValueAtTime(event.to, at + event.duration);
      }
      const attack = Math.min(event.duration * .45, event.attack || .009);
      const release = Math.min(event.duration * .5, event.release || .06);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(event.velocity, at + attack);
      gain.gain.setValueAtTime(event.velocity * .55, Math.max(at + attack, at + event.duration - release));
      gain.gain.linearRampToValueAtTime(0, at + event.duration);
      const nodes=[source,filter,gain];source.connect(filter);filter.connect(gain);
      const room=event.room ?? (category==='ambience'?({tavern:.04,lighthouse:.045,wreck:.055,vault:.09}[scene] || 0):0);
      route(gain,bus,event,nodes,room);
      const record = { source, gain, nodes, start: at, end: at + event.duration + .012, category, scene };
      records.add(record); source.onended = () => forget(record);
      if (event.noise) source.start(at, event.offset || 0); else source.start(at);
      source.stop(record.end);
    }
    function scheduleAmbience(now) {
      if (!soundPlaying || nextAmbienceAt > now + .12) return;
      // Skip expired atmospheres instead of replaying minutes of missed creaks.
      const profile = ambienceFor(scene, world), at = Math.max(nextAmbienceAt, now + .025);
      for (const event of profile.events) texture(event, at + (event.delay || 0), 'ambience');
      nextAmbienceAt = now + profile.interval + [0, .8, -.35, 1.25][ambienceCycle++ % 4];
    }
    function scheduleBand(now) {
      if (!bandPlaying || !bandQueue) return;
      const queue=bandQueue;
      if (!soundWanted() || !canRun() || (queue.index<queue.ids.length && now>queue.start+queue.index*queue.beat+.12)) { stopBandSequence(); return; }
      if(queue.index<queue.ids.length && queue.start+queue.index*queue.beat<=now+.1){
        const at=Math.max(now,queue.start+queue.index*queue.beat),id=queue.ids[queue.index];
        for(const event of bandEvents(id))texture(event,at+(event.delay || 0),'band');
        bandStep=queue.index++;emit();
      }
      if(queue.index>=queue.ids.length && now>=queue.end)stopBandSequence();
    }
    function changeScore(id, at) {
      activeScene = id;
      pending = null; cursor = 0; loopNumber = 0; loopStart = at;
      events = scoreEvents(scores[id]);
      arrangementWorld=world;pendingArrangement=null;ornamentBar='';
      emit();
    }
    function scheduler() {
      if (!canRun() || suspensionCount) return;
      const now = context.currentTime;
      scheduleAmbience(now);
      scheduleBand(now);
      if (!playing) return;
      const horizon = now + .15;
      let safety = 0;
      while (safety++ < 2000) {
        const score = scores[activeScene];
        const secondsPerBeat = 60 / score.bpm;
        let at = loopStart + loopNumber * loopSeconds(score) + events[cursor].beat * secondsPerBeat;
        if (pending && transitionAt <= Math.min(at, horizon)) { changeScore(pending, Math.max(transitionAt, now + .01)); continue; }
        if (pendingArrangement && arrangementAt <= Math.min(at,horizon)) { arrangementWorld=pendingArrangement;pendingArrangement=null; }
        if (at > horizon) break;
        if (at >= now - .02) {
          schedule(events[cursor], Math.max(at, now), secondsPerBeat);
          const index=Math.floor(events[cursor].beat/score.beatsPerBar),key=activeScene+':'+loopNumber+':'+index;
          if(events[cursor].beat%score.beatsPerBar===0 && ornamentBar!==key){
            ornamentBar=key;
            for(const event of arrangementEvents(score,index,arrangementWorld))schedule(event,Math.max(at,now)+event.beat*secondsPerBeat,secondsPerBeat);
          }
        }
        cursor++;
        if (cursor >= events.length) { cursor = 0; loopNumber++; }
      }
      // A stalled tab never dumps several bars of overdue notes at once.
      if (safety >= 2000) changeScore(scene, now + .025);
    }
    function start() {
      if (!canRun() || suspensionCount) return;
      let changed = false;
      if (musicWanted() && !playing) { playing = true; changeScore(scene, context.currentTime + .035); changed = true; }
      if (!musicWanted() && playing) { playing = false; pending = null; stopCategory('music'); changed = true; }
      if (soundWanted() && !soundPlaying) { soundPlaying = true; nextAmbienceAt = context.currentTime + .2; changed = true; }
      if (!soundWanted() && soundPlaying) { soundPlaying = false; stopCategory('ambience'); stopCategory('effect'); stopBandSequence(false); changed = true; }
      levels();
      if (playing || soundPlaying) {
        scheduler();
        if (timer === null && interval) timer = interval(scheduler, 25);
      } else if (timer !== null && clear) { clear(timer); timer = null; }
      if (changed) emit();
    }
    function suspendContext() {
      if (!context || disposed) return;
      const target = context;
      suspensionCount++;
      pendingSuspension = pendingSuspension.then(() => target.state === 'running' ? target.suspend() : undefined).catch(() => {}).then(() => { suspensionCount--; });
    }
    async function resume() {
      if (!context || !unlocked || !anyWanted() || disposed || hidden()) return getStatus();
      const token = ++resumeToken;
      try {
        await pendingSuspension;
        if (token !== resumeToken || !anyWanted() || hidden() || disposed) return getStatus();
        if (context.state !== 'running') await context.resume();
        if (token === resumeToken && anyWanted() && !hidden() && !disposed) { error = null; start(); }
      } catch (failure) { error = 'Audio konnte nicht starten: ' + (failure.message || String(failure)); emit(); }
      return getStatus();
    }
    function initialize(options = {}) {
      if (initialized || disposed) return getStatus();
      initialized = true;
      if (typeof options.enabled === 'boolean') enabled = options.enabled;
      if (Number.isFinite(options.volume)) volume = Math.max(0, Math.min(1, options.volume));
      if (typeof options.soundEnabled === 'boolean') soundEnabled = options.soundEnabled;
      if (Number.isFinite(options.soundVolume)) soundVolume = Math.max(0, Math.min(1, options.soundVolume));
      listen(doc, 'visibilitychange', () => {
        if (hidden()) { stop(); suspendContext(); }
        else resume();
      });
      listen(win, 'pagehide', () => { pageHidden = true; stop(); suspendContext(); });
      listen(win, 'pageshow', () => { pageHidden = false; resume(); });
      emit(); return getStatus();
    }
    async function unlock() {
      initialize();
      if (disposed) return getStatus();
      if (!context) {
        if (!Audio) { error = 'Dieser Browser unterstützt Web Audio nicht.'; emit(); return getStatus(); }
        try {
          context = new Audio();
          master = context.createGain(); musicBus = context.createGain(); effectsBus = context.createGain();
          soundMaster = context.createGain(); ambienceBus = context.createGain();
          bandBus = context.createGain();
          master.gain.value = 0; soundMaster.gain.value = 0; musicBus.gain.value = .64; effectsBus.gain.value = .68; ambienceBus.gain.value = .64;
          bandBus.gain.value=.68;
          musicBus.connect(master); effectsBus.connect(soundMaster); ambienceBus.connect(soundMaster);bandBus.connect(soundMaster);
          soundMaster.connect(context.destination); master.connect(context.destination);
          noise = noiseBuffer(); ready = true;
          listen(context, 'statechange', () => {
            if (disposed) return;
            if (context.state === 'running') start();
            else if (playing || soundPlaying) stop();
            emit();
          });
        } catch (failure) { error = 'Audio ist nicht verfügbar: ' + (failure.message || String(failure)); emit(); return getStatus(); }
      }
      unlocked = true;
      levels();
      if (anyWanted()) return resume();
      emit(); return getStatus();
    }
    function setScene(id) {
      if (!scores[id]) return getStatus();
      if (scene === id) return getStatus();
      stopBandSequence(false);
      scene = id;
      stopCategory('ambience');
      nextAmbienceAt = context ? context.currentTime + .18 : 0;
      ambienceCycle = 0;
      if (playing && context) {
        const barSeconds = scores[activeScene].beatsPerBar * 60 / scores[activeScene].bpm;
        const elapsed = Math.max(0, context.currentTime - loopStart);
        transitionAt = loopStart + (Math.floor(elapsed / barSeconds) + 1) * barSeconds;
        pending = id;
        for (const record of Array.from(records)) if (record.category === 'music' && record.scene !== id && record.start >= transitionAt) stopRecord(record, .01);
      } else activeScene = id;
      emit(); return getStatus();
    }
    function preferencesChanged() {
      persist(); levels(); start();
      if (!anyWanted()) { stop(); suspendContext(); }
      else if (unlocked && context) resume();
      emit(); return getStatus();
    }
    function setEnabled(value) {
      enabled = !!value;
      return preferencesChanged();
    }
    function setVolume(value) {
      const amount = Number(value);
      if (Number.isFinite(amount)) volume = Math.max(0, Math.min(1, amount));
      return preferencesChanged();
    }
    function setSoundEnabled(value) { soundEnabled = !!value; return preferencesChanged(); }
    function setSoundVolume(value) {
      const amount = Number(value);
      if (Number.isFinite(amount)) soundVolume = Math.max(0, Math.min(1, amount));
      return preferencesChanged();
    }
    function setWorldState(input) {
      const next = worldSnapshot(input), signature = JSON.stringify(next);
      if (signature === worldSignature) return getStatus();
      world = next; worldSignature = signature;
      if(playing && context){const seconds=scores[activeScene].beatsPerBar*60/scores[activeScene].bpm;arrangementAt=loopStart+(Math.floor(Math.max(0,context.currentTime-loopStart)/seconds)+1)*seconds;pendingArrangement=world;}
      else arrangementWorld=world;
      stopCategory('ambience'); ambienceCycle = 0;
      nextAmbienceAt = context ? context.currentTime + .22 : 0;
      emit(); return getStatus();
    }
    function duck(value) { ducked = !!value; levels(); emit(); return getStatus(); }
    function trigger(type, eventsToPlay, cooldown, category='effect') {
      if (!canRun() || !soundWanted() || !eventsToPlay.length) return false;
      const now = context.currentTime + .005;
      if (now - (lastEffect.get(type) ?? -Infinity) < cooldown) return false;
      if (Array.from(records).filter(record => record.category === category).length >= 24) return false;
      lastEffect.set(type, now);
      for (const event of eventsToPlay) texture(event, now + (event.delay || 0), category);
      return true;
    }
    function effect(type) {
      if (!effectTypes.includes(type)) return false;
      const cooldown = type === 'step' ? .24 : type === 'error' || type === 'travel' ? .12 : .035;
      const played = trigger(type, soundEvents(type, scene, stepSequence), cooldown);
      if (played && type === 'step') stepSequence++;
      return played;
    }
    function playTone(id) {
      const tone = String(id || '').replace(/^tone_/, '');
      return trigger('tone_' + tone, toneEvents(tone), .16);
    }
    function stopBandSequence(notify=true) {
      const stopped=bandPlaying;bandQueue=null;bandPlaying=false;bandStep=-1;
      stopCategory('band');
      if(stopped && notify)emit();return stopped;
    }
    function playBandNote(id) {
      if(!bandIds.includes(id) || !canRun() || !soundWanted())return false;
      if(bandPlaying)stopBandSequence();
      return trigger('band_'+id,bandEvents(id),.065,'band');
    }
    function playBandSequence(ids,options={}) {
      if(!Array.isArray(ids) || !ids.length || ids.length>16 || !ids.every(id=>bandIds.includes(id)) || !canRun() || !soundWanted())return false;
      stopBandSequence(false);
      const requested=Number(options?.beat),beat=Number.isFinite(requested)?Math.max(.18,Math.min(.8,requested)):.38;
      const startAt=context.currentTime+.025;
      bandQueue={ids:ids.slice(),beat,index:0,start:startAt,end:startAt+(ids.length-1)*beat+.44};bandPlaying=true;bandStep=-1;
      emit();scheduleBand(context.currentTime);return true;
    }
    async function destroy() {
      disposed = true; stop();
      for (const [target, event, handler] of listeners) target.removeEventListener(event, handler);
      listeners.length = 0;
      for (const record of Array.from(records)) { try { record.source.stop(); } catch (_) {} forget(record); }
      for (const bus of [musicBus, effectsBus, ambienceBus, bandBus, soundMaster, master]) { if (bus) try { bus.disconnect(); } catch (_) {} }
      if (context && context.close) await context.close();
      ready = false; emit();
    }
    return { initialize, unlock, setScene, toggle: () => setEnabled(!enabled), setEnabled, setVolume, setSoundEnabled, setSoundVolume, setWorldState, playTone, playBandNote, playBandSequence, stopBandSequence, duck, effect, getStatus, destroy };
  }

  const exported = { scores, noteMidi, midiToFrequency, buildBar, scoreEvents, loopSeconds, ambienceFor, soundEvents, toneEvents, effectTypes, bandEvents, bandIds, arrangementEvents, createPlayer, PREF_KEY };
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  if (root && root.document) root.FluestertideMusic = createPlayer({ window: root });
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
