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

  const PREF_KEY = 'fluestertide.music.v1';
  function createPlayer(environment = {}) {
    const win = environment.window || root || {};
    const doc = environment.document || win.document;
    const storage = environment.storage || (() => { try { return win.localStorage; } catch (_) { return null; } })();
    const Audio = environment.AudioContext || win.AudioContext || win.webkitAudioContext;
    const interval = environment.setInterval || win.setInterval && win.setInterval.bind(win);
    const clear = environment.clearInterval || win.clearInterval && win.clearInterval.bind(win);
    let enabled = true, volume = .35, scene = 'title', activeScene = 'title';
    let context = null, master = null, musicBus = null, effectsBus = null, noise = null;
    let initialized = false, unlocked = false, playing = false, ready = false, error = null, ducked = false, disposed = false, pageHidden = false;
    let timer = null, cursor = 0, loopStart = 0, loopNumber = 0, pending = null, transitionAt = 0, events = scoreEvents(scores.title), resumeToken = 0;
    let pendingSuspension = Promise.resolve();
    const records = new Set();
    const listeners = [];
    try {
      const saved = storage && JSON.parse(storage.getItem(PREF_KEY));
      if (saved && typeof saved.enabled === 'boolean') enabled = saved.enabled;
      if (saved && Number.isFinite(saved.volume)) volume = Math.max(0, Math.min(1, saved.volume));
    } catch (_) { /* Storage is optional, including file:// private windows. */ }
    const hidden = () => pageHidden || !!(doc && doc.hidden);
    const getStatus = () => ({ enabled, playing, scene, activeScene, title: scores[scene].title, volume, ready, error, ducked });
    function emit() {
      const detail = getStatus();
      if (typeof environment.onStatus === 'function') environment.onStatus(detail);
      if (win.dispatchEvent && win.CustomEvent) win.dispatchEvent(new win.CustomEvent('fluestertide:music', { detail }));
    }
    function persist() { try { if (storage) storage.setItem(PREF_KEY, JSON.stringify({ enabled, volume })); } catch (_) {} }
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
    function stop() {
      resumeToken++;
      if (timer !== null && clear) clear(timer);
      timer = null;
      const wasPlaying = playing;
      playing = false;
      for (const record of Array.from(records)) stopRecord(record);
      pending = null;
      if (wasPlaying) emit();
    }
    function noiseBuffer() {
      const buffer = context.createBuffer(1, Math.round(context.sampleRate * .4), context.sampleRate);
      const channel = buffer.getChannelData(0);
      let seed = 0x13572468;
      for (let index = 0; index < channel.length; index++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; channel[index] = seed / 2147483648 - 1; }
      return buffer;
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
      else { source.type = event.voice === 'bass' ? 'triangle' : event.voice === 'arp' ? 'square' : 'square'; source.frequency.setValueAtTime(midiToFrequency(event.midi), at); }
      const duration = isDrum ? event.duration : Math.max(.055, event.duration * secondsPerBeat);
      const attack = Math.min(duration * .15, event.voice === 'lead' ? .014 : .009);
      const release = Math.min(.07, duration * .3);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(event.velocity, at + attack);
      gain.gain.setValueAtTime(event.velocity * .73, Math.max(at + attack, at + duration - release));
      gain.gain.linearRampToValueAtTime(0, at + duration);
      source.connect(filter); filter.connect(gain); gain.connect(bus);
      const record = { source, gain, nodes: [source, filter, gain], start: at, end: at + duration + .012, scene: activeScene };
      records.add(record);
      source.onended = () => forget(record);
      source.start(at); source.stop(record.end);
    }
    function changeScore(id, at) {
      activeScene = id;
      pending = null; cursor = 0; loopNumber = 0; loopStart = at;
      events = scoreEvents(scores[id]);
      emit();
    }
    function scheduler() {
      if (!playing || !context || context.state !== 'running' || hidden()) return;
      const now = context.currentTime;
      const horizon = now + .15;
      let safety = 0;
      while (safety++ < 2000) {
        const score = scores[activeScene];
        const secondsPerBeat = 60 / score.bpm;
        let at = loopStart + loopNumber * loopSeconds(score) + events[cursor].beat * secondsPerBeat;
        if (pending && transitionAt <= Math.min(at, horizon)) { changeScore(pending, Math.max(transitionAt, now + .01)); continue; }
        if (at > horizon) break;
        if (at >= now - .02) schedule(events[cursor], Math.max(at, now), secondsPerBeat);
        cursor++;
        if (cursor >= events.length) { cursor = 0; loopNumber++; }
      }
      // A stalled tab never dumps several bars of overdue notes at once.
      if (safety >= 2000) changeScore(scene, now + .025);
    }
    function start() {
      if (disposed || playing || !enabled || !unlocked || hidden() || !context || context.state !== 'running') return;
      playing = true;
      changeScore(scene, context.currentTime + .035);
      levels(); scheduler();
      if (interval) timer = interval(scheduler, 25);
      emit();
    }
    function suspendContext() {
      if (!context || disposed) return;
      const target = context;
      pendingSuspension = pendingSuspension.then(() => target.state === 'running' ? target.suspend() : undefined).catch(() => {});
    }
    async function resume() {
      if (!context || !unlocked || !enabled || disposed || hidden()) return getStatus();
      const token = ++resumeToken;
      try {
        await pendingSuspension;
        if (token !== resumeToken || !enabled || hidden() || disposed) return getStatus();
        if (context.state !== 'running') await context.resume();
        if (token === resumeToken && enabled && !hidden() && !disposed) { error = null; start(); }
      } catch (failure) { error = 'Audio konnte nicht starten: ' + (failure.message || String(failure)); emit(); }
      return getStatus();
    }
    function initialize(options = {}) {
      if (initialized || disposed) return getStatus();
      initialized = true;
      if (typeof options.enabled === 'boolean') enabled = options.enabled;
      if (Number.isFinite(options.volume)) volume = Math.max(0, Math.min(1, options.volume));
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
          master.gain.value = 0; musicBus.gain.value = .64; effectsBus.gain.value = .35;
          musicBus.connect(master); effectsBus.connect(master); master.connect(context.destination);
          noise = noiseBuffer(); ready = true;
          listen(context, 'statechange', () => {
            if (disposed) return;
            if (context.state === 'running') start();
            else if (playing) stop();
            emit();
          });
        } catch (failure) { error = 'Audio ist nicht verfügbar: ' + (failure.message || String(failure)); emit(); return getStatus(); }
      }
      unlocked = true;
      levels();
      if (enabled) return resume();
      emit(); return getStatus();
    }
    function setScene(id) {
      if (!scores[id]) return getStatus();
      if (scene === id) return getStatus();
      scene = id;
      if (playing && context) {
        const barSeconds = scores[activeScene].beatsPerBar * 60 / scores[activeScene].bpm;
        const elapsed = Math.max(0, context.currentTime - loopStart);
        transitionAt = loopStart + (Math.floor(elapsed / barSeconds) + 1) * barSeconds;
        pending = id;
        for (const record of Array.from(records)) if (record.scene !== id && record.start >= transitionAt) stopRecord(record, .01);
      } else activeScene = id;
      emit(); return getStatus();
    }
    function setEnabled(value) {
      enabled = !!value; persist();
      if (!enabled) stop();
      levels();
      if (enabled) resume();
      emit(); return getStatus();
    }
    function setVolume(value) {
      const amount = Number(value);
      if (Number.isFinite(amount)) volume = Math.max(0, Math.min(1, amount));
      persist(); levels(); emit(); return getStatus();
    }
    function duck(value) { ducked = !!value; levels(); emit(); return getStatus(); }
    function effect(type) {
      if (!enabled || !unlocked || !context || context.state !== 'running' || hidden() || disposed) return;
      const now = context.currentTime + .005;
      if (type === 'success') [74, 78, 81].forEach((midi, index) => schedule({ voice: 'lead', midi, duration: .11, velocity: .075 }, now + index * .085, 1, effectsBus));
      else if (type === 'click') schedule({ voice: 'arp', midi: 69, duration: .035, velocity: .025 }, now, 1, effectsBus);
    }
    async function destroy() {
      disposed = true; stop();
      for (const [target, event, handler] of listeners) target.removeEventListener(event, handler);
      listeners.length = 0;
      for (const record of Array.from(records)) { try { record.source.stop(); } catch (_) {} forget(record); }
      for (const bus of [musicBus, effectsBus, master]) { if (bus) try { bus.disconnect(); } catch (_) {} }
      if (context && context.close) await context.close();
      ready = false; emit();
    }
    return { initialize, unlock, setScene, toggle: () => setEnabled(!enabled), setEnabled, setVolume, duck, effect, getStatus, destroy };
  }

  const exported = { scores, noteMidi, midiToFrequency, buildBar, scoreEvents, loopSeconds, createPlayer, PREF_KEY };
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  if (root && root.document) root.FluestertideMusic = createPlayer({ window: root });
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
