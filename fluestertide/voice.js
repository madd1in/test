/* Bundled ElevenLabs recordings. No service calls or credentials in the game. */
(() => {
  'use strict';
  const PREFERENCE_KEY = 'fluestertide.speech.v1';
  let enabled = true, volume = .95, lastLine = null, request = null;
  let status = 'idle';
  try { enabled = localStorage.getItem(PREFERENCE_KEY) !== 'off'; } catch {}

  const canonicalSpeaker = speaker => /^(?:Mira|Motte)$/.test(speaker) ? 'Mira' : speaker;
  function normalizeLine(line) {
    if (!line || typeof line.text !== 'string') return null;
    const text = line.text.normalize('NFC').trim();
    const speaker = canonicalSpeaker(String(line.speaker || 'Motte').normalize('NFC').trim());
    return text ? { speaker, text } : null;
  }
  function clipFor(line) {
    const clip = window.FluestertideVoices?.clips?.[`${line.speaker}\n${line.text}`];
    // Only bundled relative assets belong in this manifest.
    if (!clip || clip.silent || typeof clip.src !== 'string' || !/^audio\/[\w./-]+\.(?:mp3|m4a|ogg|wav)$/i.test(clip.src) || clip.src.includes('..')) return null;
    // Every authored line uses its own file; bank ranges are deliberately unsupported.
    if (clip.start !== undefined || clip.end !== undefined) return null;
    return { src:clip.src };
  }
  function isSilent(line) {
    return !!(line && window.FluestertideVoices?.clips?.[`${line.speaker}\n${line.text}`]?.silent);
  }
  function hasRecordings() {
    return Object.keys(window.FluestertideVoices?.clips || {}).some(key => {
      const boundary = key.indexOf('\n');
      return boundary > 0 && !!clipFor({speaker:key.slice(0,boundary),text:key.slice(boundary+1)});
    });
  }
  function getStatus() {
    return {
      enabled, status, playing:status === 'playing',
      hasRecordings:hasRecordings(),
      available:!!(lastLine && clipFor(lastLine)),
      speaker:lastLine?.speaker || '', text:lastLine?.text || '',
      provider:'ElevenLabs'
    };
  }
  function notify() {
    window.dispatchEvent(new CustomEvent('fluestertide:speech', { detail:getStatus() }));
  }
  function changeStatus(next) { status = next; notify(); }
  function stop(next = 'idle') {
    const previous = request;
    request = null; // Invalidate listeners before pause or pending play promises settle.
    if (previous) {
      for (const [name, listener] of previous.listeners) previous.audio.removeEventListener(name, listener);
      previous.audio.pause();
      previous.audio.removeAttribute('src');
      previous.audio.load();
    }
    changeStatus(enabled ? next : 'disabled');
  }
  function speak(input) {
    const line = normalizeLine(input);
    stop();
    lastLine = line;
    if (!line) { notify(); return false; }
    if (isSilent(line)) { changeStatus('silent'); return false; }
    if (!enabled) { changeStatus('disabled'); return false; }
    const clip = clipFor(line);
    if (!clip || typeof window.Audio !== 'function') { changeStatus('unavailable'); return false; }

    const audio = new window.Audio();
    const current = { audio, listeners:[] };
    request = current;
    audio.preload = 'auto'; audio.volume = volume;
    audio.src = clip.src;
    function live() { return request === current; }
    function listen(name, fn) {
      const guarded = () => { if (live()) fn(); };
      current.listeners.push([name, guarded]); audio.addEventListener(name, guarded);
    }
    listen('playing', () => changeStatus('playing'));
    listen('waiting', () => changeStatus('loading'));
    listen('ended', () => stop('ended'));
    listen('error', () => stop('unavailable'));
    changeStatus('loading');
    try {
      // Call play in the original click stack, preserving mobile autoplay consent.
      const playing = audio.play();
      if (playing?.then) playing.catch(() => { if (live()) stop('blocked'); });
    } catch { if (live()) stop('blocked'); }
    return true;
  }
  function toggle() {
    enabled = !enabled;
    try { localStorage.setItem(PREFERENCE_KEY, enabled ? 'on' : 'off'); } catch {}
    stop();
    if (enabled && lastLine) speak(lastLine);
    return enabled;
  }
  function repeat() { return lastLine ? speak(lastLine) : false; }
  function setVolume(next) {
    const value = Number(next);
    if (!Number.isFinite(value)) return volume;
    volume = Math.max(0, Math.min(1, value));
    if (request) request.audio.volume = volume;
    return volume;
  }
  window.FluestertideSpeech = {
    get enabled() { return enabled; }, speak, stop, toggle, repeat, setVolume, getStatus
  };
  window.addEventListener('pagehide', () => stop());
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
})();
