// Main game file - initializes and runs the game

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size to match container
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.path = createPath();
        this.towers = [];
        this.projectiles = [];
        this.waveManager = new WaveManager();
        this.ui = new UI();
        
        // Audio
        this.bgm = document.getElementById('bgm');
        this.bgm.volume = 0.5; // Set volume to 50%
        
        this.lastTime = 0;
        this.gold = 100;
        this.lives = 20;
        
        // Bind events
        this.ui.setStartWaveCallback(() => this.startNextWave());
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Start first wave
        this.startNextWave();
        
        // Start game loop
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        
        // Start BGM when user interacts with the page (required by browsers)
        this.unlockAudioOnInteraction();
    }
    
    unlockAudioOnInteraction() {
        // Unlock audio on user interaction (required by most browsers)
        const unlock = () => {
            this.bgm.play().catch(e => console.log('Audio play failed:', e));
            document.removeEventListener('touchstart', unlock);
            document.removeEventListener('click', unlock);
            document.removeEventListener('keydown', unlock);
        };
        
        document.addEventListener('touchstart', unlock);
        document.addEventListener('click', unlock);
        document.addEventListener('keydown', unlock);
        
        // Also try to play immediately (might work if user already interacted)
        this.bgm.play().catch(e => {});
    }
    
    resizeCanvas() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }
    
    startNextWave() {
        if (this.waveManager.isWaveComplete()) {
            const waveInfo = this.waveManager.getCurrentWaveInfo();
            this.waveManager.startWave(waveInfo.wave); // wave is 0-indexed in manager
            this.ui.updateWave(waveInfo.wave + 1, waveInfo.totalWaves);
            this.ui.setStartWaveButtonState(false);
        } else {
            // If current wave is not complete, we might want to warn or just not allow
            this.ui.showMessage('현재 웨이브가 끝나지 않았습니다!', true);
        }
    }
    
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const selectedTowerType = this.ui.getSelectedTowerType();
        if (!selectedTowerType) {
            this.ui.showMessage('타워를 선택해주세요!', true);
            return;
        }
        
        // Check if we can afford the tower
        let towerCost = 0;
        switch(selectedTowerType) {
            case 'basic': towerCost = 50; break;
            case 'slow': towerCost = 75; break;
            case 'splash': towerCost = 100; break;
        }
        
        if (this.gold < towerCost) {
            this.ui.showMessage('골드가 부족합니다!', true);
            return;
        }
        
        // Place tower
        this.towers.push(new Tower(x, y, selectedTowerType));
        this.gold -= towerCost;
        this.ui.updateGold(this.gold);
        
        // Clear selection
        this.ui.selectTowerType(null);
    }
    
    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }
    
    update(deltaTime) {
        // Update wave manager (spawn enemies)
        const enemies = this.waveManager.update(deltaTime, this.lastTime, this.path);
        
        // Update towers (find targets and shoot)
        for (const tower of this.towers) {
            tower.findTarget(enemies);
            if (tower.canShoot(this.lastTime) && tower.target) {
                const projectile = tower.shoot(this.lastTime);
                this.projectiles.push(projectile);
            }
        }
        
        // Update projectiles
        for (const projectile of this.projectiles) {
            projectile.update(deltaTime);
        }
        
        // Remove hit projectiles and apply damage
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            if (projectile.hit && projectile.target) {
                // Apply damage
                const reward = projectile.target.takeDamage(projectile.damage);
                if (reward > 0) {
                    this.gold += reward;
                    this.ui.updateGold(this.gold);
                }
                
                // Apply slow effect (simplified - in reality we'd have a debuff system)
                if (projectile.type === 'slow' && projectile.target.alive) {
                    // For simplicity, we'll just reduce speed temporarily
                    // A proper implementation would have a speed modifier on the enemy
                    projectile.target.speed = Math.max(10, projectile.target.speed * 0.5);
                }
                
                // Apply splash damage
                if (projectile.type === 'splash') {
                    for (const enemy of enemies) {
                        if (enemy.alive && 
                            enemy.position.distanceTo(projectile.target.position) < 
                            (projectile.tower.splashRadius || 30)) {
                            const splashReward = enemy.takeDamage(projectile.damage * 0.5); // 50% splash damage
                            if (splashReward > 0) {
                                this.gold += splashReward;
                                this.ui.updateGold(this.gold);
                            }
                        }
                    }
                }
                
                // Remove projectile
                this.projectiles.splice(i, 1);
            }
        }
        
        // Check for enemies reaching the end
        for (const enemy of enemies) {
            if (enemy.reachedEnd && enemy.alive) {
                this.lives--;
                this.ui.updateLives(this.lives);
                enemy.alive = false; // Prevent multiple life loss
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // Remove dead enemies (already done in wave manager update, but double-check)
        // Actually, wave manager already filters for alive and not reachedEnd
        
        // Check if wave is complete and we can start next wave
        if (this.waveManager.isWaveComplete()) {
            this.ui.setStartWaveButtonState(true);
            this.ui.showMessage('웨이브 완료! 다음 웨이브를 시작하세요.');
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw path
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 30;
        this.ctx.beginPath();
        this.ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            this.ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        this.ctx.stroke();
        
        // Draw towers
        for (const tower of this.towers) {
            this.ctx.fillStyle = tower.color;
            this.ctx.beginPath();
            this.ctx.arc(tower.position.x, tower.position.y, 20, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw range (optional)
            this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            this.ctx.beginPath();
            this.ctx.arc(tower.position.x, tower.position.y, tower.range, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw enemies
        const enemies = this.waveManager.getEnemies();
        for (const enemy of enemies) {
            enemy.draw(this.ctx);
        }
        
        // Draw projectiles
        for (const projectile of this.projectiles) {
            projectile.draw(this.ctx);
        }
    }
    
    gameOver() {
        // Stop game loop (in a real game we'd have a proper state machine)
        this.ui.showMessage('게임 오버! 생명이 모두 소진되었습니다.', true);
        this.ui.setStartWaveButtonState(false);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});