/**
 * Super Mario "Nano Banana" Adventure - Audio Engine
 * Dual-mode: HTML5 Local Audio Loader + Web Audio API Chiptune Synthesizer
 */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.volume = 0.5;
        this.synthMode = false; // Toggle for procedural retro sounds vs real files
        this.currentBgm = null;
        this.activeBgmName = '';
        this.bgmPlaying = false;
        
        // Audio buffers/elements
        this.sounds = {
            coin: null,
            stomp: null,
            powerup: null,
            jump: null,
            death: null,
            victory: null,
            bgm_banana: null,
            bgm_mario: null
        };

        // Initialize user interaction listener to resume AudioContext
        window.addEventListener('click', () => this.initContext());
        window.addEventListener('keydown', () => this.initContext());
        window.addEventListener('touchstart', () => this.initContext());
    }

    initContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.loadLocalAssets();
        } else if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Attempts to load the local MP3 files.
     * If opened via file:// CORS rules might block, so we catch and enable Synth Mode automatically!
     */
    loadLocalAssets() {
        const audioPath = './assets/audio/';
        const files = {
            coin: 'sfx_coin.mp3',
            stomp: 'sfx_stomp.mp3',
            powerup: 'sfx_powerup.mp3',
            footstep: 'sfx_footstep.mp3',
            bgm_banana: 'bgm_banana.mp3',
            bgm_mario: 'bgm_mario.mp3'
        };

        let loadedCount = 0;
        let failCount = 0;
        const total = Object.keys(files).length;

        for (const [key, filename] of Object.entries(files)) {
            const audio = new Audio();
            audio.src = audioPath + filename;
            audio.volume = this.volume;
            
            // Handle cross-origin or local file restrictions
            audio.addEventListener('canplaythrough', () => {
                loadedCount++;
                this.sounds[key] = audio;
                console.log(`Audio loaded: ${key}`);
            }, { once: true });

            audio.addEventListener('error', () => {
                failCount++;
                console.warn(`Local audio failed to load: ${key}. Enabling Synth Fallback.`);
                if (failCount === total) {
                    this.synthMode = true;
                    // Trigger UI update if exists
                    const toggleBtn = document.getElementById('synth-toggle');
                    if (toggleBtn) toggleBtn.checked = true;
                }
            }, { once: true });
        }
    }

    setVolume(val) {
        this.volume = val;
        // Update all active HTML audio elements
        for (const sound of Object.values(this.sounds)) {
            if (sound && sound instanceof Audio) {
                sound.volume = this.volume;
            }
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            if (this.currentBgm && !this.synthMode) {
                this.currentBgm.pause();
            }
        } else {
            if (this.bgmPlaying && this.currentBgm && !this.synthMode) {
                this.currentBgm.play().catch(e => console.log(e));
            }
        }
        return this.muted;
    }

    toggleSynthMode(enabled) {
        this.synthMode = enabled;
        if (this.synthMode) {
            // Pause HTML BGM
            if (this.currentBgm) {
                this.currentBgm.pause();
            }
            if (this.bgmPlaying) {
                this.startSynthBGM();
            }
        } else {
            // Stop synth BGM
            this.stopSynthBGM();
            // Resume HTML BGM
            if (this.bgmPlaying) {
                this.playBGM(this.activeBgmName);
            }
        }
    }

    /* ==========================================
       SOUND EFFECTS (SFX)
       ========================================== */
    
    playSFX(name) {
        if (this.muted) return;
        this.initContext();

        // Synth Mode or Fallback
        if (this.synthMode || !this.sounds[name]) {
            this.playSynthSFX(name);
            return;
        }

        // Standard HTML5 Audio replay
        try {
            const snd = this.sounds[name];
            snd.currentTime = 0;
            snd.volume = this.volume;
            snd.play().catch(() => {
                // If standard playing fails (CORS or secure-context), fallback to synth
                this.playSynthSFX(name);
            });
        } catch (e) {
            this.playSynthSFX(name);
        }
    }

    /* ==========================================
       WEB AUDIO API CHIPTUNE RETRO SYNTHESIZER
       ========================================== */

    playSynthSFX(name) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;

        switch (name) {
            case 'jump':
                this.synthJump(now);
                break;
            case 'coin':
                this.synthCoin(now);
                break;
            case 'stomp':
                this.synthStomp(now);
                break;
            case 'powerup':
                this.synthPowerup(now);
                break;
            case 'death':
                this.synthDeath(now);
                break;
            case 'victory':
                this.synthVictory(now);
                break;
            default:
                break;
        }
    }

    synthJump(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle'; // Mario sound is round triangle
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(700, t + 0.17);

        gain.gain.setValueAtTime(this.volume * 0.4, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.17);

        osc.start(t);
        osc.stop(t + 0.18);
    }

    synthCoin(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'square'; // Classic retro chiptune square wave
        osc.frequency.setValueAtTime(987.77, t); // B5
        osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6

        gain.gain.setValueAtTime(this.volume * 0.25, t);
        gain.gain.setValueAtTime(0.25, t + 0.08);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.35);

        osc.start(t);
        osc.stop(t + 0.36);
    }

    synthStomp(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.linearRampToValueAtTime(30, t + 0.15);

        gain.gain.setValueAtTime(this.volume * 0.6, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.15);

        osc.start(t);
        osc.stop(t + 0.16);
    }

    synthPowerup(t) {
        // Quick ascending scale
        const freqs = [330, 392, 659, 523, 587, 784];
        const step = 0.06;

        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + idx * step);

            gain.gain.setValueAtTime(this.volume * 0.3, t + idx * step);
            gain.gain.linearRampToValueAtTime(0.01, t + idx * step + 0.1);

            osc.start(t + idx * step);
            osc.stop(t + idx * step + 0.11);
        });
    }

    synthDeath(t) {
        // Tragic descending scales
        const freqs = [500, 480, 460, 440, 400, 350, 300, 200, 100];
        const step = 0.08;

        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t + idx * step);

            gain.gain.setValueAtTime(this.volume * 0.4, t + idx * step);
            gain.gain.linearRampToValueAtTime(0.01, t + idx * step + 0.12);

            osc.start(t + idx * step);
            osc.stop(t + idx * step + 0.13);
        });
    }

    synthVictory(t) {
        // Upbeat victory tune
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        const steps = [0, 0.1, 0.2, 0.3, 0.45, 0.6, 0.8];
        const durs = [0.08, 0.08, 0.08, 0.12, 0.12, 0.12, 0.4];

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, t + steps[idx]);

            gain.gain.setValueAtTime(this.volume * 0.25, t + steps[idx]);
            gain.gain.linearRampToValueAtTime(0.01, t + steps[idx] + durs[idx]);

            osc.start(t + steps[idx]);
            osc.stop(t + steps[idx] + durs[idx]);
        });
    }

    /* ==========================================
       BACKGROUND MUSIC (BGM)
       ========================================== */

    playBGM(name) {
        this.initContext();
        this.activeBgmName = name;
        this.bgmPlaying = true;

        if (this.muted) return;

        // Synth mode
        if (this.synthMode) {
            this.startSynthBGM();
            return;
        }

        // HTML5 Audio Mode
        if (this.currentBgm) {
            this.currentBgm.pause();
        }

        const snd = this.sounds[name];
        if (snd) {
            this.currentBgm = snd;
            this.currentBgm.loop = true;
            this.currentBgm.volume = this.volume * 0.8; // slightly softer background music
            this.currentBgm.currentTime = 0;
            this.currentBgm.play().catch(e => {
                console.warn("HTML BGM blocked. Playing Synth BGM.");
                this.startSynthBGM();
            });
        } else {
            this.startSynthBGM();
        }
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.currentBgm) {
            this.currentBgm.pause();
        }
        this.stopSynthBGM();
    }

    /* PROCEDURAL BGM LOOP (CHIPTUNE) */
    startSynthBGM() {
        this.stopSynthBGM();
        if (!this.ctx) return;

        console.log("Playing Procedural Retro BGM Loop...");
        let beatCount = 0;
        
        // Simple cheery Mario-style chord progression loop
        // C Major -> G Major -> A Minor -> F Major
        const progressions = [
            [261.63, 329.63, 392.00], // C
            [293.66, 392.00, 493.88], // G
            [220.00, 261.63, 329.63], // Am
            [174.61, 220.00, 261.63]  // F
        ];
        
        // Cheery lead melody
        const melody = [
            329.63, 329.63, 0, 329.63, 0, 261.63, 329.63, 0, 392.00, 0, 0, 0, 196.00, 0, 0, 0,
            261.63, 0, 0, 196.00, 0, 0, 164.81, 0, 220.00, 0, 246.94, 0, 233.08, 220.00, 0, 0
        ];

        this.bgmInterval = setInterval(() => {
            if (this.muted || !this.synthMode || !this.bgmPlaying) return;
            const now = this.ctx.currentTime;
            
            // Bass beat (quarter note)
            if (beatCount % 2 === 0) {
                const progIdx = Math.floor(beatCount / 8) % progressions.length;
                const bassNote = progressions[progIdx][0] / 2; // Octave lower

                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(bassNote, now);
                gain.gain.setValueAtTime(this.volume * 0.35, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.18);

                osc.start(now);
                osc.stop(now + 0.19);
            }

            // Lead Melody (eighth notes)
            const melodyNote = melody[beatCount % melody.length];
            if (melodyNote > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.type = 'square';
                osc.frequency.setValueAtTime(melodyNote, now);
                gain.gain.setValueAtTime(this.volume * 0.12, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.09);

                osc.start(now);
                osc.stop(now + 0.1);
            }

            beatCount = (beatCount + 1) % 32;
        }, 150); // 150ms step = upbeat tempo
    }

    stopSynthBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }
}

// Export single instance
window.audioEngine = new AudioEngine();
