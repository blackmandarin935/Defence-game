// UI handling for the game

class UI {
    constructor() {
        console.log('UI constructor called');
        this.goldElement = document.getElementById('gold');
        this.livesElement = document.getElementById('lives');
        this.waveElement = document.getElementById('wave');
        this.messageElement = document.getElementById('message');
        this.startWaveButton = document.getElementById('start-wave');
        this.towerOptions = document.querySelectorAll('.tower-option');
        
        console.log('UI elements found:', {
            gold: !!this.goldElement,
            lives: !!this.livesElement,
            wave: !!this.waveElement,
            message: !!this.messageElement,
            startWave: !!this.startWaveButton,
            towerOptions: this.towerOptions.length
        });
        
        this.selectedTowerType = null;
        this.gold = 100;
        this.lives = 20;
        this.currentWave = 0;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        console.log('Setting up UI event listeners');
        // Tower selection
        this.towerOptions.forEach(option => {
            option.addEventListener('click', () => {
                console.log('Tower option clicked:', option.dataset.towerType);
                this.selectTowerType(option.dataset.towerType);
            });
        });
        
        // Start wave button
        this.startWaveButton.addEventListener('click', () => {
            console.log('Start wave button clicked');
            this.onStartWave();
        });
    }
    
    selectTowerType(type) {
        console.log('Selecting tower type:', type);
        // Update visual selection
        this.towerOptions.forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`.tower-option[data-tower-type="${type}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
            this.selectedTowerType = type;
            console.log('Selected tower type set to:', this.selectedTowerType);
        } else {
            console.warn('Could not find tower option for type:', type);
        }
    }
    
    getSelectedTowerType() {
        return this.selectedTowerType;
    }
    
    onStartWave() {
        // This will be called from main.js
        console.log('onStartWave called');
        if (typeof this.startWaveCallback === 'function') {
            this.startWaveCallback();
        }
    }
    
    setStartWaveCallback(callback) {
        this.startWaveCallback = callback;
    }
    
    updateGold(amount) {
        this.gold = amount;
        this.goldElement.textContent = this.gold;
    }
    
    updateLives(amount) {
        this.lives = amount;
        this.livesElement.textContent = this.lives;
    }
    
    updateWave(wave, totalWaves) {
        this.currentWave = wave;
        this.waveElement.textContent = `${wave}/${totalWaves}`;
    }
    
    showMessage(text, isError = false) {
        this.messageElement.textContent = text;
        this.messageElement.className = isError ? 'error' : '';
        this.messageElement.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            this.messageElement.classList.remove('show');
        }, 3000);
    }
    
    setStartWaveButtonState(enabled) {
        this.startWaveButton.disabled = !enabled;
    }
}

// Attach to window
window.UI = UI;