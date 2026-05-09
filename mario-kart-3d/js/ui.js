// UI manager for the game
class UI {
    constructor(game) {
        this.game = game;
        this.elements = {
            loadingScreen: document.getElementById('loading-screen'),
            characterSelect: document.getElementById('character-select'),
            gameUI: document.getElementById('game-ui'),
            speedMeter: document.querySelector('.speed-value'),
            lapCounter: document.getElementById('lap-counter'),
            position: document.getElementById('position'),
            currentItem: document.getElementById('current-item'),
            minimap: document.getElementById('minimap'),
            gameOver: document.getElementById('game-over'),
            finalPosition: document.getElementById('final-position'),
            finalTime: document.getElementById('final-time'),
            restartButton: document.getElementById('restart-button'),
            controlsInfo: document.getElementById('controls-info')
        };
        
        // Initialize UI
        this.init();
    }
    
    // Initialize UI
    init() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize minimap
        this.initMinimap();
    }
    
    // Set up UI event listeners
    setupEventListeners() {
        // Restart button
        this.elements.restartButton.addEventListener('click', () => {
            location.reload();
        });
        
        // Character selection
        const characters = document.querySelectorAll('.character');
        characters.forEach(character => {
            character.addEventListener('click', () => {
                const selectedCharacter = character.getAttribute('data-character');
                this.game.selectedCharacter = selectedCharacter;
                this.hideCharacterSelect();
                this.game.startGame();
            });
        });
    }
    
    // Initialize minimap
    initMinimap() {
        // In a full implementation, we would create a 2D canvas for the minimap
        // For this demo, we'll just create a placeholder
        const minimapCanvas = document.createElement('canvas');
        minimapCanvas.width = 150;
        minimapCanvas.height = 150;
        
        this.elements.minimap.appendChild(minimapCanvas);
        this.minimapContext = minimapCanvas.getContext('2d');
        
        // Draw initial minimap
        this.updateMinimap();
    }
    
    // Show loading screen
    showLoadingScreen() {
        this.elements.loadingScreen.style.display = 'flex';
        this.elements.characterSelect.style.display = 'none';
        this.elements.gameUI.style.display = 'none';
        this.elements.gameOver.style.display = 'none';
    }
    
    // Update loading progress
    updateLoadingProgress(progress) {
        const loadingBar = document.querySelector('.loading-bar');
        const loadingText = document.querySelector('.loading-text');
        const percentage = Math.floor(progress * 100);
        
        loadingBar.style.width = percentage + '%';
        loadingText.textContent = `Loading game assets... ${percentage}%`;
    }
    
    // Show character select screen
    showCharacterSelect() {
        this.elements.loadingScreen.style.display = 'none';
        this.elements.characterSelect.style.display = 'flex';
        this.elements.gameUI.style.display = 'none';
        this.elements.gameOver.style.display = 'none';
    }
    
    // Hide character select screen
    hideCharacterSelect() {
        this.elements.characterSelect.style.display = 'none';
    }
    
    // Show game UI
    showGameUI() {
        this.elements.gameUI.style.display = 'block';
    }
    
    // Update speed meter
    updateSpeedMeter(speed) {
        const speedKmh = Math.round(speed * 3.6); // Convert m/s to km/h
        this.elements.speedMeter.textContent = speedKmh + ' km/h';
    }
    
    // Update lap counter
    updateLapCounter(currentLap, totalLaps) {
        this.elements.lapCounter.textContent = `LAP: ${currentLap}/${totalLaps}`;
    }
    
    // Update position
    updatePosition(position, totalRacers) {
        this.elements.position.textContent = `POSITION: ${position}/${totalRacers}`;
    }
    
    // Update current item display
    updateItemDisplay(item) {
        if (item) {
            this.elements.currentItem.innerHTML = `<img src="assets/${item}_icon.png" alt="${item}">`;
        } else {
            this.elements.currentItem.innerHTML = '';
        }
    }
    
    // Update minimap
    updateMinimap() {
        if (!this.minimapContext) return;
        
        // Clear minimap
        this.minimapContext.fillStyle = '#000';
        this.minimapContext.fillRect(0, 0, 150, 150);
        
        // In a full implementation, we would draw:
        // 1. Track outline
        // 2. Player position
        // 3. AI positions
        // 4. Item boxes
        
        // For this demo, just draw a placeholder track
        this.minimapContext.strokeStyle = '#fff';
        this.minimapContext.lineWidth = 2;
        this.minimapContext.beginPath();
        this.minimapContext.ellipse(75, 75, 50, 30, 0, 0, Math.PI * 2);
        this.minimapContext.stroke();
        
        // Draw player position (red dot)
        if (this.game.player) {
            // Convert 3D world position to 2D minimap position
            // This is a simplified placeholder calculation
            const x = 75 + Math.sin(this.game.player.rotation.y) * 50;
            const y = 75 + Math.cos(this.game.player.rotation.y) * 30;
            
            this.minimapContext.fillStyle = '#f00';
            this.minimapContext.beginPath();
            this.minimapContext.arc(x, y, 4, 0, Math.PI * 2);
            this.minimapContext.fill();
        }
    }
    
    // Show game over screen
    showGameOver(position, time) {
        this.elements.gameUI.style.display = 'none';
        this.elements.gameOver.style.display = 'flex';
        
        // Set final position and time
        this.elements.finalPosition.textContent = `POSITION: ${position}/8`;
        this.elements.finalTime.textContent = `TIME: ${this.formatTime(time)}`;
    }
    
    // Format time as MM:SS.ms
    formatTime(timeInSeconds) {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
    
    // Show countdown animation
    showCountdown(callback) {
        // Create countdown element
        const countdownElement = document.createElement('div');
        countdownElement.className = 'countdown';
        countdownElement.style.position = 'fixed';
        countdownElement.style.top = '50%';
        countdownElement.style.left = '50%';
        countdownElement.style.transform = 'translate(-50%, -50%)';
        countdownElement.style.fontSize = '10rem';
        countdownElement.style.color = '#fff';
        countdownElement.style.textShadow = '0 0 20px rgba(255, 0, 0, 0.7)';
        countdownElement.style.zIndex = '100';
        document.body.appendChild(countdownElement);
        
        // Countdown sequence
        const countdown = ['3', '2', '1', 'GO!'];
        let index = 0;
        
        const showNext = () => {
            if (index < countdown.length) {
                countdownElement.textContent = countdown[index];
                
                // Animate
                countdownElement.style.animation = 'none';
                void countdownElement.offsetWidth; // Trigger reflow
                countdownElement.style.animation = 'pulse 1s';
                
                index++;
                setTimeout(showNext, 1000);
            } else {
                // Remove countdown element
                document.body.removeChild(countdownElement);
                
                // Call callback
                if (callback) callback();
            }
        };
        
        // Start countdown
        showNext();
    }
    
    // Toggle controls info visibility
    toggleControlsInfo(visible) {
        this.elements.controlsInfo.style.display = visible ? 'block' : 'none';
    }
}
