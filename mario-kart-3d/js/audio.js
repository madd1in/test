// Audio manager for the game
class Audio {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.musicVolume = 0.5;
        this.soundVolume = 0.7;
        this.muted = false;
        
        // Initialize audio
        this.init();
    }
    
    // Initialize audio system
    init() {
        // Load audio files
        this.loadSounds();
    }
    
    // Load sound effects and music
    loadSounds() {
        // Create audio elements for each sound
        this.createSound('engine', 'assets/sounds/engine.mp3', true);
        this.createSound('drift', 'assets/sounds/drift.mp3', true);
        this.createSound('item_box', 'assets/sounds/item_box.mp3', false);
        this.createSound('mushroom', 'assets/sounds/mushroom.mp3', false);
        this.createSound('star', 'assets/sounds/star.mp3', true);
        this.createSound('shell', 'assets/sounds/shell.mp3', false);
        this.createSound('banana', 'assets/sounds/banana.mp3', false);
        this.createSound('crash', 'assets/sounds/crash.mp3', false);
        this.createSound('countdown', 'assets/sounds/countdown.mp3', false);
        this.createSound('finish', 'assets/sounds/finish.mp3', false);
        
        // Load background music
        this.music = new Audio('assets/sounds/neon_skyway_theme.mp3');
        this.music.loop = true;
        this.music.volume = this.musicVolume;
    }
    
    // Create a sound effect
    createSound(name, src, loop = false) {
        // In a real implementation, we would load actual audio files
        // For this demo, we'll create placeholder audio elements
        this.sounds[name] = {
            element: new Audio(),
            loop: loop,
            playing: false,
            volume: this.soundVolume
        };
        
        // Set audio properties
        this.sounds[name].element.loop = loop;
        this.sounds[name].element.volume = this.soundVolume;
        
        // Add event listeners
        this.sounds[name].element.addEventListener('ended', () => {
            this.sounds[name].playing = false;
        });
        
        // In a real implementation, we would set the src here
        // this.sounds[name].element.src = src;
        
        console.log(`Sound loaded: ${name}`);
    }
    
    // Play a sound effect
    playSound(name) {
        if (this.muted) return;
        
        const sound = this.sounds[name];
        if (!sound) return;
        
        // If the sound is already playing and it's not a looping sound, restart it
        if (sound.playing && !sound.loop) {
            sound.element.currentTime = 0;
        } else if (!sound.playing) {
            sound.element.play().catch(e => console.log(`Error playing sound ${name}:`, e));
            sound.playing = true;
        }
    }
    
    // Stop a sound effect
    stopSound(name) {
        const sound = this.sounds[name];
        if (!sound || !sound.playing) return;
        
        sound.element.pause();
        sound.element.currentTime = 0;
        sound.playing = false;
    }
    
    // Play background music
    playMusic() {
        if (this.muted) return;
        
        this.music.play().catch(e => console.log('Error playing music:', e));
    }
    
    // Stop background music
    stopMusic() {
        this.music.pause();
        this.music.currentTime = 0;
    }
    
    // Set music volume
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.music.volume = this.musicVolume;
    }
    
    // Set sound effects volume
    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
        
        // Update all sound volumes
        for (const name in this.sounds) {
            this.sounds[name].volume = this.soundVolume;
            this.sounds[name].element.volume = this.soundVolume;
        }
    }
    
    // Mute all audio
    mute() {
        this.muted = true;
        
        // Mute music
        this.music.volume = 0;
        
        // Mute all sounds
        for (const name in this.sounds) {
            this.sounds[name].element.volume = 0;
        }
    }
    
    // Unmute all audio
    unmute() {
        this.muted = false;
        
        // Restore music volume
        this.music.volume = this.musicVolume;
        
        // Restore sound volumes
        for (const name in this.sounds) {
            this.sounds[name].element.volume = this.sounds[name].volume;
        }
    }
    
    // Update engine sound based on speed
    updateEngineSound(speed) {
        if (!this.sounds.engine || this.muted) return;
        
        // Adjust playback rate based on speed
        const minRate = 0.5;
        const maxRate = 2.0;
        const normalizedSpeed = Math.min(1, speed / 45); // 45 is max speed
        const rate = minRate + normalizedSpeed * (maxRate - minRate);
        
        this.sounds.engine.element.playbackRate = rate;
        
        // Ensure engine sound is playing
        if (!this.sounds.engine.playing) {
            this.playSound('engine');
        }
    }
}
