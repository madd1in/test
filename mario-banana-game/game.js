/**
 * Super Mario "Nano Banana" Adventure - Core Game Engine
 * Highly polished procedural HD vector graphic engine, physics, state machine
 */

// Game States
const STATES = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER',
    VICTORY: 'VICTORY'
};

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Match high-DPI screens for crisp HD rendering
        this.setupCanvasDPI();

        this.state = STATES.MENU;
        this.score = 0;
        this.bananas = 0;
        this.lives = 3;
        this.currentLevel = 0;
        this.maxLevels = 3;
        this.highScore = parseInt(localStorage.getItem('banana_highscore')) || 0;

        // Viewport camera
        this.camera = { x: 0, y: 0, width: 800, height: 480 };

        // Control flags
        this.keys = { left: false, right: false, up: false, down: false };
        this.touchControls = { left: false, right: false, jump: false };

        // Lists of objects
        this.particles = [];
        this.blocks = [];
        this.enemies = [];
        this.collectibles = [];
        this.decorations = []; // Scrolling background trees, stars, fireflies

        // Tile specifications
        this.tileSize = 40;
        
        // Physics constants
        this.gravity = 0.65;
        this.friction = 0.85;

        // Initialize keyboard listeners
        this.initControls();
        
        // Load high score to UI
        this.updateLeaderboard();

        // Level Map layout templates
        // 0: Air, 1: Ground, 2: Brick, 3: Mystery Block, 4: Solid Hit Block, 5/6/7/8: Pipe tiles, 9: Hazard Spikes, 10: Goal Banana
        this.levelLayouts = [
            // Level 1: Jungle Canopy
            [
                "                                                                                                                      ",
                "                                                                                                                      ",
                "                                                                                                                      ",
                "          3  232  3                                          3 2 3                                                    ",
                "                                                           222222222                                                  ",
                "                                                          2         2                                                 ",
                "                                   3  232                2           2                                                ",
                "                                                        2             2                                 10            ",
                "       3   232   3                                    22               22                               1             ",
                "                                                     2                   2                             11             ",
                "                                  56                2                     2                           111             ",
                "                     56           78               2                       2                         1111             ",
                "    1111111111119999178111111111111111111111999911112                         211111111111111111111111111111111111111",
                "    1111111111111111111111111111111111111111111111111                         111111111111111111111111111111111111111"
            ],
            // Level 2: Cyber Temple
            [
                "                                                                                                                      ",
                "                                                                                                                      ",
                "                                                                                                                      ",
                "                                     333                                                                              ",
                "                                                                                                                      ",
                "                3 2 3             3       3                56   56                     56                             ",
                "                                                           78   78                     78                             ",
                "              222222222         3     3     3             11111111199991111          111111111          10            ",
                "                                                                                    1         1         1             ",
                "       56                      3  23232  3                                         11         11       11             ",
                "       78                                                                         111         111     111             ",
                "    111111111199991111111111111111111111111111111111111111111111111999911111111111111         11111111111             ",
                "    111111111111111111111111111111111111111111111111111111111111111111111111111111111         11111111111             "
            ],
            // Level 3: Space Banana (Hard)
            [
                "                                                                                                                      ",
                "                                                                                                                      ",
                "                                                                                                                      ",
                "                                  3  2  3                                                                             ",
                "                                                                                                                      ",
                "              3  3  3                                          3 3 3                                                  ",
                "                                                                                                                      ",
                "                                                                                                        10            ",
                "                                  9999999                    9999999999                                11             ",
                "         3                     111111111111                11111111111111                             111             ",
                "                                                                                                     1111             ",
                "       56                                                                                           11111             ",
                "    111781111111999911111111111            1111111199991111             1111111111111199991111111111111111111111111111",
                "    111111111111111111111111111            1111111111111111             1111111111111111111111111111111111111111111111"
            ]
        ];

        this.initLevel(this.currentLevel);

        // Start game loop
        this.lastTime = 0;
        requestAnimationFrame((t) => this.loop(t));
    }

    setupCanvasDPI() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = 800 * dpr;
        this.canvas.height = 480 * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = '100%';
        this.canvas.style.height = 'auto';
    }

    initLevel(lvlIdx) {
        this.particles = [];
        this.blocks = [];
        this.enemies = [];
        this.collectibles = [];
        this.decorations = [];

        const layout = this.levelLayouts[lvlIdx];
        this.levelWidth = layout[0].length * this.tileSize;
        this.levelHeight = layout.length * this.tileSize;

        // Initialize Background Stars and Fireflies
        for (let i = 0; i < 40; i++) {
            this.decorations.push({
                x: Math.random() * this.levelWidth,
                y: Math.random() * 250,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.15 + 0.05,
                opacity: Math.random(),
                pulseDir: Math.random() > 0.5 ? 0.02 : -0.02,
                color: Math.random() > 0.6 ? '#FFDE43' : '#a7f3d0' // Banana or neon mint
            });
        }

        // Parse visual blocks
        for (let row = 0; row < layout.length; row++) {
            for (let col = 0; col < layout[row].length; col++) {
                const char = layout[row][col];
                const x = col * this.tileSize;
                const y = row * this.tileSize;

                if (char === '0' && col > 0 && layout[row][col - 1] === '1') { // second half of a 10 goal marker
                    continue;
                } else if (char === '1' && col + 1 < layout[row].length && layout[row][col + 1] === '0') { // Goal Golden Banana
                    this.collectibles.push({ x, y, type: 'goal', width: 32, height: 32, rotation: 0, floatOffset: 0 });
                    col++;
                } else if (char === '1') { // Ground
                    this.blocks.push({ x, y, type: 'ground', solid: true });
                } else if (char === '2') { // Brick
                    this.blocks.push({ x, y, type: 'brick', solid: true, bounceY: 0, targetBounceY: 0 });
                } else if (char === '3') { // Mystery Block
                    this.blocks.push({ x, y, type: 'mystery', solid: true, content: 'banana', bounceY: 0, targetBounceY: 0, state: 'active' });
                } else if (char === '4') { // Hit Block
                    this.blocks.push({ x, y, type: 'hit', solid: true });
                } else if (char === '5') {
                    this.blocks.push({ x, y, type: 'pipe-tl', solid: true });
                } else if (char === '6') {
                    this.blocks.push({ x, y, type: 'pipe-tr', solid: true });
                } else if (char === '7') {
                    this.blocks.push({ x, y, type: 'pipe-bl', solid: true });
                } else if (char === '8') {
                    this.blocks.push({ x, y, type: 'pipe-br', solid: true });
                } else if (char === '9') { // Hazard Spikes
                    this.blocks.push({ x, y, type: 'spikes', solid: false });
                }
            }
        }

        // Player starting position & properties
        this.player = {
            x: 100,
            y: 300,
            width: 32,
            height: 48,
            vx: 0,
            vy: 0,
            speed: 5.5,
            jumpStrength: -13.0,
            onGround: false,
            invincible: 0, // Frame count
            isBig: false,
            scale: 1.0,
            facingRight: true,
            runningFrame: 0,
            isJumping: false,
            squishY: 1.0 // Squash and stretch factor
        };

        // Populate Level Enemies based on level difficulty
        const enemySpacing = [
            [400, 750, 1100, 1500, 2200], // Level 1
            [350, 600, 900, 1200, 1600, 2000, 2500], // Level 2
            [300, 550, 800, 1050, 1400, 1850, 2300, 2600, 3100] // Level 3
        ];
        
        enemySpacing[lvlIdx].forEach(ex => {
            this.enemies.push({
                x: ex,
                y: 300,
                vx: -1.6 - (lvlIdx * 0.4), // enemies speed up at higher levels
                width: 32,
                height: 32,
                state: 'walking', // 'walking', 'squashed'
                squishTimer: 0,
                facingRight: false,
                hopTimer: Math.random() * Math.PI // Offset for bounce animation
            });
        });

        // Camera init
        this.camera.x = 0;
        this.camera.y = 0;
    }

    initControls() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
            if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
                this.keys.up = true;
                if (this.state === STATES.MENU) this.startGame();
                if (this.state === STATES.GAMEOVER || this.state === STATES.VICTORY) this.restartGame();
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = true;
            if (e.code === 'KeyP') this.togglePause();
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
            if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') this.keys.up = false;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
        });

        // Connect touch button elements to touch flags
        const leftBtn = document.getElementById('touch-left');
        const rightBtn = document.getElementById('touch-right');
        const jumpBtn = document.getElementById('touch-jump');

        if (leftBtn) {
            leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.touchControls.left = true; });
            leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.touchControls.left = false; });
        }
        if (rightBtn) {
            rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.touchControls.right = true; });
            rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.touchControls.right = false; });
        }
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchControls.jump = true;
                if (this.state === STATES.MENU) this.startGame();
                if (this.state === STATES.GAMEOVER || this.state === STATES.VICTORY) this.restartGame();
            });
            jumpBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.touchControls.jump = false; });
        }
    }

    startGame() {
        this.state = STATES.PLAYING;
        this.score = 0;
        this.bananas = 0;
        this.lives = 3;
        this.currentLevel = 0;
        this.initLevel(this.currentLevel);
        window.audioEngine.playBGM('bgm_banana');
        
        // Hide/Show overlay elements
        document.getElementById('start-overlay').style.display = 'none';
        document.getElementById('pause-overlay').style.display = 'none';
        document.getElementById('game-over-overlay').style.display = 'none';
        document.getElementById('victory-overlay').style.display = 'none';
        this.updateScoreboard();
    }

    restartGame() {
        this.startGame();
    }

    togglePause() {
        if (this.state === STATES.PLAYING) {
            this.state = STATES.PAUSED;
            document.getElementById('pause-overlay').style.display = 'flex';
        } else if (this.state === STATES.PAUSED) {
            this.state = STATES.PLAYING;
            document.getElementById('pause-overlay').style.display = 'none';
        }
    }

    loop(time) {
        let dt = time - this.lastTime;
        if (dt > 100) dt = 16.66; // Capped to avoid extreme jumps during lag spikes
        this.lastTime = time;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    /* ==========================================
       PHYSICS & OBJECTS UPDATES
       ========================================== */

    update(dt) {
        if (this.state !== STATES.PLAYING) {
            // Update float animations even on menu screen
            this.decorations.forEach(d => {
                d.opacity += d.pulseDir;
                if (d.opacity >= 1.0 || d.opacity <= 0.2) d.pulseDir = -d.pulseDir;
                d.x -= d.speed;
                if (d.x < 0) d.x = this.levelWidth || 800;
            });
            return;
        }

        // Invincibility frame decay
        if (this.player.invincible > 0) this.player.invincible--;

        // Decaying squash animation
        this.player.squishY += (1.0 - this.player.squishY) * 0.15;

        // Decaying character scale size transition (Big powerup)
        const targetScale = this.player.isBig ? 1.4 : 1.0;
        this.player.scale += (targetScale - this.player.scale) * 0.1;
        this.player.width = 32 * this.player.scale;
        this.player.height = (this.player.isBig ? 60 : 48);

        // --- KEYBOARD & TOUCH MOVEMENT INPUT ---
        let moveLeft = this.keys.left || this.touchControls.left;
        let moveRight = this.keys.right || this.touchControls.right;
        let jumpPressed = this.keys.up || this.touchControls.jump;

        if (moveLeft) {
            this.player.vx -= 0.45;
            if (this.player.vx < -this.player.speed) this.player.vx = -this.player.speed;
            this.player.facingRight = false;
            
            // Running frame increments
            this.player.runningFrame += 0.22;
        } else if (moveRight) {
            this.player.vx += 0.45;
            if (this.player.vx > this.player.speed) this.player.vx = this.player.speed;
            this.player.facingRight = true;
            
            this.player.runningFrame += 0.22;
        } else {
            // Friction slow down
            this.player.vx *= this.friction;
            if (Math.abs(this.player.vx) < 0.15) this.player.vx = 0;
            this.player.runningFrame = 0; // idle frame
        }

        // Apply Gravity
        this.player.vy += this.gravity;
        if (this.player.vy > 12) this.player.vy = 12; // cap falling speed

        // --- JUMPING MECHANIC ---
        if (jumpPressed && this.player.onGround) {
            this.player.vy = this.player.jumpStrength;
            this.player.onGround = false;
            this.player.squishY = 1.35; // stretch when jumping
            window.audioEngine.playSFX('jump');
            
            // Jump dust particles
            this.createDust(this.player.x + this.player.width/2, this.player.y + this.player.height, 6);
        }

        // --- X AXIS PHYSICS COLLISION ---
        this.player.x += this.player.vx;
        this.checkBlockCollision('x');

        // --- Y AXIS PHYSICS COLLISION ---
        this.player.y += this.player.vy;
        this.player.onGround = false;
        this.checkBlockCollision('y');

        // Level boundary constraints
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.levelWidth - this.player.width) this.player.x = this.levelWidth - this.player.width;
        
        // Death by falling down pits
        if (this.player.y > this.levelHeight + 80) {
            this.handlePlayerDeath();
        }

        // --- CAMERA VIEWPORT PARALLAX FOLLOW ---
        // Centers player horizontally
        this.camera.x = this.player.x - this.camera.width / 2 + this.player.width / 2;
        // Bind camera to level boundaries
        if (this.camera.x < 0) this.camera.x = 0;
        if (this.camera.x > this.levelWidth - this.camera.width) this.camera.x = this.levelWidth - this.camera.width;

        // --- UPDATE HAZARDS (Spikes) & OBJECTS ---
        this.blocks.forEach(b => {
            // Animated block compression/bounce
            if (b.bounceY !== 0) {
                b.bounceY += (0 - b.bounceY) * 0.25;
                if (Math.abs(b.bounceY) < 0.2) b.bounceY = 0;
            }
        });

        // --- UPDATE COLLECTIBLES ---
        this.collectibles.forEach((item, idx) => {
            // Goal floating movement
            item.floatOffset += 0.05;
            item.rotation += 0.02;

            if (this.checkAABB(this.player, item)) {
                if (item.type === 'goal') {
                    this.handleVictory();
                } else if (item.type === 'banana_item') {
                    // Collect standard banana
                    this.bananas++;
                    this.score += 150;
                    this.updateScoreboard();
                    window.audioEngine.playSFX('coin');
                    
                    // Shiny sparkles
                    this.createSparkles(item.x + 16, item.y + 16, '#FFDE43');
                    
                    this.collectibles.splice(idx, 1);
                } else if (item.type === 'powerup_item') {
                    // Collect large banana powerup
                    this.player.isBig = true;
                    this.score += 500;
                    this.updateScoreboard();
                    window.audioEngine.playSFX('powerup');
                    
                    this.createSparkles(item.x + 16, item.y + 16, '#a7f3d0');
                    
                    this.collectibles.splice(idx, 1);
                }
            }
        });

        // --- UPDATE ENEMIES ---
        this.enemies.forEach((enemy, idx) => {
            if (enemy.state === 'squashed') {
                enemy.squishTimer--;
                if (enemy.squishTimer <= 0) {
                    this.enemies.splice(idx, 1);
                }
                return;
            }

            enemy.x += enemy.vx;
            
            // Turn back at level limits
            if (enemy.x <= 0 || enemy.x >= this.levelWidth - enemy.width) {
                enemy.vx = -enemy.vx;
            }

            // Patrol boundary block turnarounds
            this.blocks.forEach(b => {
                if (b.solid && this.checkAABB(enemy, b)) {
                    enemy.x -= enemy.vx; // step back
                    enemy.vx = -enemy.vx; // inverse
                }
            });

            // Player intersection
            if (this.checkAABB(this.player, enemy)) {
                // Determine if stomping from above
                const isFalling = (this.player.vy > 0);
                const playerBottom = this.player.y + this.player.height - this.player.vy;
                const enemyTop = enemy.y + 5;

                if (isFalling && playerBottom <= enemyTop) {
                    // Stomp enemy!
                    enemy.state = 'squashed';
                    enemy.squishTimer = 30; // Frames to display squashed minion
                    this.player.vy = -8.5; // bounce up
                    this.player.squishY = 1.2;
                    this.score += 200;
                    this.updateScoreboard();
                    window.audioEngine.playSFX('stomp');
                    this.createSparkles(enemy.x + 16, enemy.y + 16, '#9333ea');
                } else {
                    // Hit player
                    this.handlePlayerHit();
                }
            }
        });

        // --- UPDATE PARTICLES ---
        this.particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0;
            p.life--;
            if (p.life <= 0) this.particles.splice(idx, 1);
        });

        // --- DECORATIONS (Parallax Fireflies/Stars) ---
        this.decorations.forEach(d => {
            d.opacity += d.pulseDir;
            if (d.opacity >= 1.0 || d.opacity <= 0.2) d.pulseDir = -d.pulseDir;
            d.x -= d.speed;
            if (d.x < 0) d.x = this.levelWidth;
        });
    }

    checkBlockCollision(axis) {
        for (let i = 0; i < this.blocks.length; i++) {
            const b = this.blocks[i];
            
            // Spikes hit detection
            if (b.type === 'spikes') {
                if (this.checkAABB(this.player, b)) {
                    this.handlePlayerHit();
                }
                continue;
            }

            if (!b.solid) continue;

            if (this.checkAABB(this.player, b)) {
                if (axis === 'x') {
                    if (this.player.vx > 0) {
                        this.player.x = b.x - this.player.width;
                    } else if (this.player.vx < 0) {
                        this.player.x = b.x + this.tileSize;
                    }
                    this.player.vx = 0;
                } else {
                    if (this.player.vy > 0) {
                        // Land on block
                        this.player.y = b.y - this.player.height;
                        this.player.onGround = true;
                        this.player.vy = 0;
                    } else if (this.player.vy < 0) {
                        // Hit block ceiling from below
                        this.player.y = b.y + this.tileSize;
                        this.player.vy = 0.5;
                        this.handleCeilingHit(b);
                    }
                }
            }
        }
    }

    handleCeilingHit(block) {
        block.bounceY = -12; // compressing trigger

        if (block.type === 'mystery' && block.state === 'active') {
            block.state = 'empty';
            block.type = 'hit';
            
            if (block.content === 'banana') {
                this.bananas++;
                this.score += 100;
                this.updateScoreboard();
                window.audioEngine.playSFX('coin');
                
                // Spawn a visual banana flying up
                this.collectibles.push({
                    x: block.x + 4,
                    y: block.y - 36,
                    type: 'banana_item',
                    width: 32,
                    height: 32,
                    floatOffset: Math.random(),
                    rotation: 0
                });

                // Sparkle burst
                this.createSparkles(block.x + 20, block.y - 10, '#FFDE43');
            }
        } else if (block.type === 'brick') {
            if (this.player.isBig) {
                // Break block!
                window.audioEngine.playSFX('stomp');
                this.createBrickDebris(block.x, block.y);
                
                // Remove block
                const idx = this.blocks.indexOf(block);
                if (idx !== -1) this.blocks.splice(idx, 1);
            } else {
                // Mild bump
                window.audioEngine.playSFX('stomp');
            }
        }
    }

    handlePlayerHit() {
        if (this.player.invincible > 0) return;

        if (this.player.isBig) {
            // shrink
            this.player.isBig = false;
            this.player.invincible = 90; // 1.5 seconds invincibility frames
            window.audioEngine.playSFX('powerup');
            this.player.squishY = 0.7; // squish transition
        } else {
            this.handlePlayerDeath();
        }
    }

    handlePlayerDeath() {
        this.lives--;
        window.audioEngine.playSFX('death');
        this.updateScoreboard();

        if (this.lives <= 0) {
            this.state = STATES.GAMEOVER;
            window.audioEngine.stopBGM();
            document.getElementById('game-over-overlay').style.display = 'flex';
            
            // Check HighScore
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('banana_highscore', this.highScore);
                this.updateLeaderboard();
            }
        } else {
            // Reload level
            this.initLevel(this.currentLevel);
        }
    }

    handleVictory() {
        window.audioEngine.playSFX('victory');
        
        // Progress level or finish game
        if (this.currentLevel < this.maxLevels - 1) {
            this.currentLevel++;
            this.initLevel(this.currentLevel);
            // Change music slightly
            window.audioEngine.playBGM(this.currentLevel % 2 === 0 ? 'bgm_banana' : 'bgm_mario');
        } else {
            this.state = STATES.VICTORY;
            window.audioEngine.stopBGM();
            document.getElementById('victory-overlay').style.display = 'flex';
            
            // Check HighScore
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('banana_highscore', this.highScore);
                this.updateLeaderboard();
            }
        }
    }

    /* ==========================================
       PARTICLE BURSTS CREATORS
       ========================================== */

    createSparkles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                size: Math.random() * 4 + 2,
                color,
                life: Math.random() * 25 + 15,
                gravity: 0.1
            });
        }
    }

    createDust(x, y, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y: y - 5,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 1.5,
                size: Math.random() * 6 + 3,
                color: 'rgba(255,255,255,0.4)',
                life: Math.random() * 15 + 10,
                gravity: -0.02
            });
        }
    }

    createBrickDebris(x, y) {
        const colors = ['#b45309', '#78350f', '#f59e0b']; // deep orange/brick brown
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x + 16,
                y: y + 16,
                vx: (Math.random() - 0.5) * 7,
                vy: -Math.random() * 8 - 3,
                size: Math.random() * 6 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 45,
                gravity: 0.45
            });
        }
    }

    /* ==========================================
       UI TEXT UPDATE WRAPPERS
       ========================================== */

    updateScoreboard() {
        document.getElementById('hud-score').innerText = this.score.toString().padStart(6, '0');
        document.getElementById('hud-bananas').innerText = this.bananas.toString().padStart(3, '0');
        document.getElementById('hud-lives').innerText = this.lives.toString();
        document.getElementById('hud-level').innerText = (this.currentLevel + 1).toString();
    }

    updateLeaderboard() {
        document.getElementById('highscore-val').innerText = this.highScore.toString().padStart(6, '0');
    }

    checkAABB(r1, r2) {
        return (
            r1.x < r2.x + (r2.width || this.tileSize) &&
            r1.x + r1.width > r2.x &&
            r1.y < r2.y + (r2.height || this.tileSize) &&
            r1.y + r1.height > r2.y
        );
    }

    /* ==========================================
       PROCEDURAL HD VECTOR RENDER ENGINE
       ========================================== */

    draw() {
        this.ctx.clearRect(0, 0, 800, 480);

        // 1. Draw premium background gradient parallax sky
        this.drawParallaxBackground();

        this.ctx.save();
        // Camera shift transform offset
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // 2. Draw static decorations (Scrolled backgrounds stars)
        this.decorations.forEach(d => {
            this.ctx.fillStyle = d.color;
            this.ctx.globalAlpha = d.opacity;
            this.ctx.beginPath();
            this.ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;

        // 3. Draw map blocks
        this.blocks.forEach(b => {
            this.drawTile(b);
        });

        // 4. Draw collectibles
        this.collectibles.forEach(item => {
            this.drawCollectible(item);
        });

        // 5. Draw enemies
        this.enemies.forEach(enemy => {
            this.drawEnemy(enemy);
        });

        // 6. Draw player (Banana-hood Mario)
        this.drawPlayer();

        // 7. Draw particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.restore();

        // If Menu state, draw title screen overlays
        if (this.state === STATES.MENU) {
            this.drawMenuTitle();
        }
    }

    drawParallaxBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 480);
        if (this.currentLevel === 0) {
            // Level 1 Sunset Purple/Orange
            gradient.addColorStop(0, '#1e1b4b'); // deep midnight indigo
            gradient.addColorStop(0.5, '#4c1d95'); // royal violet
            gradient.addColorStop(1, '#ea580c'); // fiery orange sunset
        } else if (this.currentLevel === 1) {
            // Level 2 Cyber Temple Navy/Mint
            gradient.addColorStop(0, '#020617'); // obsidian black
            gradient.addColorStop(0.6, '#0f172a'); // steel navy
            gradient.addColorStop(1, '#064e3b'); // emerald green cyber
        } else {
            // Level 3 Deep Nebula Space
            gradient.addColorStop(0, '#090514');
            gradient.addColorStop(0.5, '#11052C');
            gradient.addColorStop(1, '#3D087B');
        }
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, 800, 480);

        // Draw parallax mountains/trees silhouettes in background
        this.ctx.save();
        this.ctx.fillStyle = this.currentLevel === 0 ? '#311005' : (this.currentLevel === 1 ? '#022c22' : '#18022c');
        this.ctx.globalAlpha = 0.35;
        const speedRatio = 0.2; // camera scroll ratio
        const shiftX = -(this.camera.x * speedRatio) % 800;

        for (let i = 0; i < 2; i++) {
            const baseX = shiftX + i * 800;
            this.ctx.beginPath();
            // Draw hills outline
            this.ctx.moveTo(baseX, 480);
            this.ctx.lineTo(baseX, 350);
            this.ctx.quadraticCurveTo(baseX + 150, 280, baseX + 300, 340);
            this.ctx.quadraticCurveTo(baseX + 500, 250, baseX + 650, 360);
            this.ctx.quadraticCurveTo(baseX + 720, 320, baseX + 800, 350);
            this.ctx.lineTo(baseX + 800, 480);
            this.ctx.closePath();
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawTile(b) {
        this.ctx.save();
        
        // Bounce offset animation
        this.ctx.translate(0, b.bounceY || 0);

        if (b.type === 'ground') {
            // HD Cyber Ground tile
            const grad = this.ctx.createLinearGradient(b.x, b.y, b.x, b.y + this.tileSize);
            grad.addColorStop(0, '#10b981'); // neon emerald grass top
            grad.addColorStop(0.15, '#059669'); // grass shadow
            grad.addColorStop(1, '#064e3b'); // dirt deep forest green
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(b.x, b.y, this.tileSize, this.tileSize);

            // Glowing neon top border
            this.ctx.strokeStyle = '#34d399';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(b.x, b.y);
            this.ctx.lineTo(b.x + this.tileSize, b.y);
            this.ctx.stroke();

            // Geometric soil markings
            this.ctx.strokeStyle = 'rgba(52, 211, 153, 0.15)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(b.x + 8, b.y + 12, 10, 10);
            this.ctx.strokeRect(b.x + 22, b.y + 22, 10, 10);

        } else if (b.type === 'brick') {
            // HD 3D Glossy brick red block
            this.ctx.fillStyle = '#b45309'; // brick body
            this.ctx.fillRect(b.x, b.y, this.tileSize, this.tileSize);

            // Shading edges
            this.ctx.strokeStyle = '#f59e0b'; // light highlights
            this.ctx.strokeRect(b.x + 1, b.y + 1, this.tileSize - 2, this.tileSize - 2);

            this.ctx.fillStyle = '#78350f'; // shadow borders
            this.ctx.fillRect(b.x + 1, b.y + this.tileSize - 4, this.tileSize - 2, 3);
            this.ctx.fillRect(b.x + this.tileSize - 4, b.y + 1, 3, this.tileSize - 2);

            // Brick mortar lines
            this.ctx.fillStyle = '#f59e0b';
            this.ctx.fillRect(b.x, b.y + 18, this.tileSize, 2);
            this.ctx.fillRect(b.x + 18, b.y, 2, 18);
            this.ctx.fillRect(b.x + 8, b.y + 20, 2, 20);
            this.ctx.fillRect(b.x + 28, b.y + 20, 2, 20);

        } else if (b.type === 'mystery') {
            // Glowing neon banana golden mystery box
            const grad = this.ctx.createLinearGradient(b.x, b.y, b.x, b.y + this.tileSize);
            grad.addColorStop(0, '#fef08a'); // soft bright gold
            grad.addColorStop(0.5, '#eab308'); // gold
            grad.addColorStop(1, '#ca8a04'); // dark bronze
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(b.x, b.y, this.tileSize, this.tileSize);

            // Glow outlines
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(b.x + 2, b.y + 2, this.tileSize - 4, this.tileSize - 4);
            
            this.ctx.strokeStyle = '#f87171'; // secondary orange/red border glow
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(b.x + 4, b.y + 4, this.tileSize - 8, this.tileSize - 8);

            // Corner rivets
            this.ctx.fillStyle = '#ca8a04';
            this.ctx.fillRect(b.x + 6, b.y + 6, 3, 3);
            this.ctx.fillRect(b.x + 31, b.y + 6, 3, 3);
            this.ctx.fillRect(b.x + 6, b.y + 31, 3, 3);
            this.ctx.fillRect(b.x + 31, b.y + 31, 3, 3);

            // Draw a cute question mark symbol
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 22px Outfit, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('?', b.x + 20, b.y + 21);

        } else if (b.type === 'hit') {
            // Emptied solid block
            this.ctx.fillStyle = '#475569'; // cold slate gray
            this.ctx.fillRect(b.x, b.y, this.tileSize, this.tileSize);
            this.ctx.strokeStyle = '#1e293b';
            this.ctx.strokeRect(b.x, b.y, this.tileSize, this.tileSize);
            
            // Corner bolts
            this.ctx.fillStyle = '#1e293b';
            this.ctx.beginPath();
            this.ctx.arc(b.x + 6, b.y + 6, 2, 0, Math.PI * 2);
            this.ctx.arc(b.x + 34, b.y + 6, 2, 0, Math.PI * 2);
            this.ctx.arc(b.x + 6, b.y + 34, 2, 0, Math.PI * 2);
            this.ctx.arc(b.x + 34, b.y + 34, 2, 0, Math.PI * 2);
            this.ctx.fill();

        } else if (b.type.startsWith('pipe-')) {
            // Premium Green glossy pipes
            const isLeft = b.type.endsWith('-tl') || b.type.endsWith('-bl');
            const isTop = b.type.includes('-t');
            
            const grad = this.ctx.createLinearGradient(b.x, b.y, b.x + this.tileSize, b.y);
            grad.addColorStop(0, '#065f46');
            grad.addColorStop(0.3, '#10b981'); // bright glossy highlight
            grad.addColorStop(0.7, '#047857');
            grad.addColorStop(1, '#064e3b');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(b.x, b.y, this.tileSize, this.tileSize);

            // Shading stripes
            this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(b.x + 12, b.y);
            this.ctx.lineTo(b.x + 12, b.y + this.tileSize);
            this.ctx.stroke();

            // Edge pipes rims
            this.ctx.strokeStyle = '#022c22';
            this.ctx.lineWidth = 2;
            if (isTop) {
                // Top flange bottom edge
                this.ctx.beginPath();
                this.ctx.moveTo(b.x, b.y + this.tileSize - 1);
                this.ctx.lineTo(b.x + this.tileSize, b.y + this.tileSize - 1);
                this.ctx.stroke();
            }
            if (isLeft) {
                this.ctx.beginPath();
                this.ctx.moveTo(b.x, b.y);
                this.ctx.lineTo(b.x, b.y + this.tileSize);
                this.ctx.stroke();
            } else {
                this.ctx.beginPath();
                this.ctx.moveTo(b.x + this.tileSize, b.y);
                this.ctx.lineTo(b.x + this.tileSize, b.y + this.tileSize);
                this.ctx.stroke();
            }

        } else if (b.type === 'spikes') {
            // Glowing neon spiky hazard triangles
            this.ctx.fillStyle = '#6366f1'; // electric indigo spikes
            this.ctx.strokeStyle = '#a5b4fc';
            this.ctx.lineWidth = 1.5;
            
            const numSpikes = 3;
            const w = this.tileSize / numSpikes;

            for (let i = 0; i < numSpikes; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(b.x + i * w, b.y + this.tileSize);
                this.ctx.lineTo(b.x + i * w + w / 2, b.y + 12); // point
                this.ctx.lineTo(b.x + (i + 1) * w, b.y + this.tileSize);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    drawCollectible(item) {
        this.ctx.save();
        
        // Dynamic float hover math
        const floatY = Math.sin(item.floatOffset) * 6;
        this.ctx.translate(item.x + 16, item.y + 16 + floatY);

        if (item.type === 'goal') {
            // Rotating huge glowing Golden Goal Banana
            this.ctx.rotate(item.rotation);
            
            // Golden halo aura glow
            const glowRad = 24 + Math.sin(item.floatOffset) * 4;
            const glow = this.ctx.createRadialGradient(0, 0, 2, 0, 0, glowRad);
            glow.addColorStop(0, 'rgba(253, 224, 71, 0.45)');
            glow.addColorStop(1, 'rgba(253, 224, 71, 0)');
            this.ctx.fillStyle = glow;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, glowRad, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw vector golden banana
            this.ctx.strokeStyle = '#facc15';
            this.ctx.lineWidth = 5;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 16, 0.2, Math.PI - 0.2); // Golden curve shape
            this.ctx.stroke();

            // Crown tip
            this.ctx.fillStyle = '#78350f';
            this.ctx.beginPath();
            this.ctx.arc(-15, 6, 3, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (item.type === 'banana_item') {
            // Standard Glowing Nano Banana
            this.ctx.rotate(Math.sin(item.floatOffset * 1.5) * 0.4);

            // Glowing outline shadow
            this.ctx.shadowColor = '#FFDE43';
            this.ctx.shadowBlur = 10;

            // Draw banana shape
            this.ctx.strokeStyle = '#FFDE43';
            this.ctx.lineWidth = 3.5;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 10, 0.3, Math.PI - 0.3);
            this.ctx.stroke();

            // Black/brown tip
            this.ctx.shadowBlur = 0; // disable glow shadow for tip
            this.ctx.fillStyle = '#451a03';
            this.ctx.fillRect(-9, 3, 2, 2);
        } else if (item.type === 'powerup_item') {
            // Glowing green emerald banana (Powerup)
            this.ctx.rotate(item.rotation * 1.5);
            this.ctx.shadowColor = '#34d399';
            this.ctx.shadowBlur = 14;

            this.ctx.strokeStyle = '#34d399';
            this.ctx.lineWidth = 5;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 12, 0.3, Math.PI - 0.3);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawEnemy(enemy) {
        this.ctx.save();

        if (enemy.state === 'squashed') {
            // Squashed grape monster flat shape
            this.ctx.fillStyle = '#7c3aed';
            this.ctx.fillRect(enemy.x, enemy.y + enemy.height - 8, enemy.width, 8);
            
            this.ctx.fillStyle = '#a78bfa'; // squashed highlights
            this.ctx.fillRect(enemy.x + 6, enemy.y + enemy.height - 8, 8, 3);
            this.ctx.restore();
            return;
        }

        // Bouncing animation shift based on hopTimer math
        const hopY = Math.abs(Math.sin(enemy.hopTimer)) * 6;
        enemy.hopTimer += 0.08;
        
        this.ctx.translate(enemy.x + 16, enemy.y + 16 - hopY);

        // HD Spiky Grape enemy vector drawing
        this.ctx.fillStyle = '#6d28d9'; // deep violet grape body
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 16, 0, Math.PI * 2);
        this.ctx.fill();

        // Glowing spiky details on head
        this.ctx.fillStyle = '#9333ea';
        this.ctx.beginPath();
        this.ctx.moveTo(-10, -12);
        this.ctx.lineTo(-2, -22); // left spike
        this.ctx.lineTo(6, -12);
        this.ctx.closePath();
        this.ctx.fill();

        // Bouncing angry eyes
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(-6, -4, 4, 0, Math.PI * 2); // left eye
        this.ctx.arc(6, -4, 4, 0, Math.PI * 2);  // right eye
        this.ctx.fill();

        this.ctx.fillStyle = '#ef4444'; // angry pupils
        this.ctx.beginPath();
        this.ctx.arc(-5, -4, 2, 0, Math.PI * 2);
        this.ctx.arc(5, -4, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Angry brow lines
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1.8;
        this.ctx.beginPath();
        this.ctx.moveTo(-10, -9);
        this.ctx.lineTo(-3, -7);
        this.ctx.moveTo(10, -9);
        this.ctx.lineTo(3, -7);
        this.ctx.stroke();

        // Funny feet
        this.ctx.fillStyle = '#3730a3';
        this.ctx.fillRect(-12, 12, 8, 5); // left foot
        this.ctx.fillRect(4, 12, 8, 5);   // right foot

        this.ctx.restore();
    }

    drawPlayer() {
        this.ctx.save();

        // Setup transparency flash effect on invincibility frames
        if (this.player.invincible > 0 && Math.floor(this.player.invincible / 4) % 2 === 0) {
            this.ctx.globalAlpha = 0.2;
        }

        // Translate to player center pivot for scaling/rotation
        this.ctx.translate(this.player.x + this.player.width / 2, this.player.y + this.player.height);
        
        // Squash and stretch scale factors
        const sqX = 2 - this.player.squishY;
        const sqY = this.player.squishY;
        this.ctx.scale(sqX * (this.player.facingRight ? 1 : -1), sqY);

        // --- DRAW HD VECTOR BANANA HERO (MARIO BANANA SUIT) ---
        const colorBody = '#eab308'; // Glowing yellow suit body
        const colorGlow = '#FFDE43'; // Neon highlight yellow
        
        // 1. Draw glowing banana outer silhouette hood
        this.ctx.fillStyle = colorBody;
        this.ctx.beginPath();
        this.ctx.arc(0, -32, 16, Math.PI, 0); // top arc
        this.ctx.lineTo(16, 0);
        this.ctx.quadraticCurveTo(0, 10, -16, 0);
        this.ctx.lineTo(-16, -32);
        this.ctx.closePath();
        this.ctx.fill();

        // Banana hood top curved tip
        this.ctx.strokeStyle = colorBody;
        this.ctx.lineWidth = 7;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.arc(-8, -32, 10, Math.PI, Math.PI * 1.6);
        this.ctx.stroke();
        
        // Black tip peel stalk
        this.ctx.fillStyle = '#451a03';
        this.ctx.fillRect(-17, -42, 4, 4);

        // 2. Draw skin face opening
        this.ctx.fillStyle = '#fed7aa'; // soft peach skin
        this.ctx.beginPath();
        this.ctx.arc(0, -25, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // 3. Draw cute mustache, cap rim and eyes
        this.ctx.fillStyle = '#7c2d12'; // rich auburn mustache
        this.ctx.beginPath();
        this.ctx.ellipse(0, -21, 6, 2.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000'; // eyes
        this.ctx.beginPath();
        this.ctx.arc(-3, -25, 1.8, 0, Math.PI * 2);
        this.ctx.arc(3, -25, 1.8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#dc2626'; // red mini cap inside hood
        this.ctx.fillRect(-8, -34, 16, 3);

        // 4. Draw hanging banana peel overalls/suit sides
        this.ctx.fillStyle = colorGlow;
        this.ctx.beginPath();
        this.ctx.moveTo(-16, -15);
        this.ctx.lineTo(-20, -2);
        this.ctx.lineTo(-10, -8);
        this.ctx.moveTo(16, -15);
        this.ctx.lineTo(20, -2);
        this.ctx.lineTo(10, -8);
        this.ctx.fill();

        // 5. Draw running/jumping feet
        this.ctx.fillStyle = '#991b1b'; // brown-red boots
        let leftFootY = 0;
        let rightFootY = 0;
        
        if (Math.abs(this.player.vx) > 0.5) {
            // Bouncing legs while running
            leftFootY = Math.sin(this.player.runningFrame) * 4;
            rightFootY = Math.cos(this.player.runningFrame) * 4;
        }

        if (!this.player.onGround) {
            // Floating feet in jump
            leftFootY = -4;
            rightFootY = -2;
        }

        this.ctx.fillRect(-14, -3 + leftFootY, 8, 4); // left boot
        this.ctx.fillRect(6, -3 + rightFootY, 8, 4);  // right boot

        this.ctx.restore();
    }

    drawMenuTitle() {
        // Floating visual title screen decoration purely on canvas
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 222, 67, 0.05)';
        this.ctx.fillRect(0, 0, 800, 480);
        this.ctx.restore();
    }
}

// Robust game engine initialization supporting all DOM loading states
function initGame() {
    if (!window.gameEngine) {
        window.gameEngine = new Game('game-canvas');
    }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initGame();
} else {
    window.addEventListener('DOMContentLoaded', initGame);
}
