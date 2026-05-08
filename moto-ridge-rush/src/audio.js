(function () {
  const MotoRidge = (window.MotoRidge = window.MotoRidge || {});

  function createAudio() {
    let context = null;
    let master = null;
    let engineOsc = null;
    let engineGain = null;
    let noiseBuffer = null;
    let enabled = false;

    function ensure() {
      if (context) return context;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.32;
      master.connect(context.destination);
      noiseBuffer = makeNoiseBuffer(context);
      return context;
    }

    function unlock() {
      const ctx = ensure();
      if (!ctx) return;
      enabled = true;
      if (ctx.state === "suspended") ctx.resume();
      if (!engineOsc) {
        engineOsc = ctx.createOscillator();
        engineOsc.type = "sawtooth";
        engineGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 420;
        engineGain.gain.value = 0.0001;
        engineOsc.connect(filter);
        filter.connect(engineGain);
        engineGain.connect(master);
        engineOsc.start();
      }
    }

    function update(state) {
      if (!enabled || !context || !engineOsc || !state) return;
      const bike = state.bike;
      const speed = Math.min(1, Math.abs(bike.vx) / 900);
      const throttle = bike.throttleActive || bike.turboActive ? 1 : 0.35;
      const heat = Math.max(0, bike.heat || 0);
      const targetFreq = 62 + speed * 126 + throttle * 34 + heat * 35;
      const targetGain = bike.crashTimer > 0 ? 0.02 : 0.035 + speed * 0.085 + throttle * 0.025;
      engineOsc.frequency.setTargetAtTime(targetFreq, context.currentTime, 0.045);
      engineGain.gain.setTargetAtTime(targetGain, context.currentTime, 0.06);
    }

    function playEvent(event) {
      if (!enabled || !ensure()) return;
      if (event.type === "pickup") blip(720, 0.08, "triangle", 0.14);
      if (event.type === "checkpoint") blip(520, 0.11, "square", 0.12);
      if (event.type === "stunt") {
        blip(640, 0.08, "triangle", 0.13);
        setTimeout(() => blip(900, 0.08, "triangle", 0.1), 70);
      }
      if (event.type === "boost") whoosh(0.16, 0.12);
      if (event.type === "crash") {
        thud();
        burstNoise(0.18, 0.18);
      }
      if (event.type === "finish") {
        blip(540, 0.12, "triangle", 0.16);
        setTimeout(() => blip(720, 0.12, "triangle", 0.14), 95);
        setTimeout(() => blip(960, 0.18, "triangle", 0.12), 190);
      }
      if (event.type === "overheat") burstNoise(0.12, 0.14);
    }

    function blip(freq, duration, type, gainValue) {
      const ctx = context;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(gainValue, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.02);
    }

    function whoosh(duration, gainValue) {
      const ctx = context;
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      source.buffer = noiseBuffer;
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + duration);
      gain.gain.setValueAtTime(gainValue, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start();
      source.stop(ctx.currentTime + duration + 0.02);
    }

    function thud() {
      const ctx = context;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(96, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }

    function burstNoise(duration, gainValue) {
      const ctx = context;
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      source.buffer = noiseBuffer;
      filter.type = "lowpass";
      filter.frequency.value = 900;
      gain.gain.setValueAtTime(gainValue, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start();
      source.stop(ctx.currentTime + duration + 0.02);
    }

    function makeNoiseBuffer(ctx) {
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      return buffer;
    }

    return { unlock, update, playEvent };
  }

  MotoRidge.createAudio = createAudio;
})();
