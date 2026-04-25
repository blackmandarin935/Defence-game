// Wave system for spawning enemies

class WaveManager {
    constructor() {
        this.waves = [];
        this.currentWaveIndex = 0;
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1000; // ms between enemy spawns
        this.enemiesToSpawn = 0;
        this.spawnedInCurrentWave = 0;
        this.isSpawning = false;
        this.waveComplete = false;
        
        // Define waves
        this.setupWaves();
    }
    
    setupWaves() {
        // Wave format: { enemies: [{ type: 'basic', count: 10 }, ...], delayBetweenWaves: 5000 }
        this.waves = [
            {
                enemies: [
                    { type: 'basic', count: 5 }
                ],
                delayBetweenWaves: 3000
            },
            {
                enemies: [
                    { type: 'basic', count: 8 },
                    { type: 'fast', count: 2 }
                ],
                delayBetweenWaves: 4000
            },
            {
                enemies: [
                    { type: 'basic', count: 10 },
                    { type: 'tank', count: 2 }
                ],
                delayBetweenWaves: 5000
            },
            {
                enemies: [
                    { type: 'fast', count: 8 },
                    { type: 'tank', count: 3 }
                ],
                delayBetweenWaves: 5000
            },
            {
                enemies: [
                    { type: 'basic', count: 15 },
                    { type: 'fast', count: 5 },
                    { type: 'tank', count: 3 }
                ],
                delayBetweenWaves: 7000
            }
        ];
        
        // Add more waves for higher difficulty
        for (let i = 5; i < 20; i++) {
            const basicCount = 5 + Math.floor(i * 1.5);
            const fastCount = Math.floor(i * 0.5);
            const tankCount = Math.floor(i * 0.3);
            
            this.waves.push({
                enemies: [
                    { type: 'basic', count: basicCount },
                    { type: 'fast', count: fastCount },
                    { type: 'tank', count: tankCount }
                ],
                delayBetweenWaves: Math.max(2000, 8000 - i * 200)
            });
        }
    }
    
    startWave(waveIndex) {
        if (waveIndex >= this.waves.length) {
            // Loop or end game
            waveIndex = this.waves.length - 1;
        }
        
        this.currentWaveIndex = waveIndex;
        this.enemiesToSpawn = 0;
        this.spawnedInCurrentWave = 0;
        
        // Calculate total enemies to spawn
        for (const enemyGroup of this.waves[waveIndex].enemies) {
            this.enemiesToSpawn += enemyGroup.count;
        }
        
        this.isSpawning = true;
        this.waveComplete = false;
        this.spawnTimer = 0;
        
        // Clear previous enemies (in case of restart)
        this.enemies = [];
    }
    
    update(deltaTime, currentTime, path) {
        if (!this.isSpawning) return [];
        
        // Update existing enemies
        for (const enemy of this.enemies) {
            enemy.update(deltaTime, this.enemies);
        }
        
        // Remove dead enemies
        this.enemies = this.enemies.filter(enemy => enemy.alive && !enemy.reachedEnd);
        
        // Spawn new enemies
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval && this.spawnedInCurrentWave < this.enemiesToSpawn) {
            this.spawnEnemy(path);
            this.spawnTimer = 0;
            this.spawnedInCurrentWave++;
        }
        
        // Check if wave is complete
        if (this.spawnedInCurrentWave >= this.enemiesToSpawn && this.enemies.length === 0) {
            this.isSpawning = false;
            this.waveComplete = true;
        }
        
        return this.enemies;
    }
    
    spawnEnemy(path) {
        if (this.spawnedInCurrentWave >= this.enemiesToSpawn) return;
        
        // Determine which enemy type to spawn based on remaining counts
        let remainingSpawns = this.enemiesToSpawn - this.spawnedInCurrentWave;
        const wave = this.waves[this.currentWaveIndex];
        
        // Simple distribution: spawn in order of definition
        for (const enemyGroup of wave.enemies) {
            if (enemyGroup.count > 0) {
                // We've spawned some of this type already
                const spawnedOfThisType = this.spawnedInCurrentWave - 
                    wave.enemies.slice(0, wave.enemies.indexOf(enemyGroup))
                        .reduce((sum, g) => sum + g.count, 0);
                
                 if (spawnedOfThisType < enemyGroup.count) {
                    // Still need to spawn more of this type
                    const enemy = new Enemy(path, enemyGroup.type);
                    this.enemies.push(enemy);
                    return;
                }
            }
        }
        
        // Fallback: spawn basic
        const enemy = new Enemy(path, 'basic');
        this.enemies.push(enemy);
    }
    
    getCurrentWaveInfo() {
        if (this.currentWaveIndex >= this.waves.length) {
            return { wave: this.waves.length, totalWaves: this.waves.length };
        }
        return {
            wave: this.currentWaveIndex + 1,
            totalWaves: this.waves.length,
            enemiesRemaining: this.enemiesToSpawn - this.spawnedInCurrentWave,
            enemiesAlive: this.enemies.length
        };
    }
    
    isWaveComplete() {
        return this.waveComplete;
    }
    
    getEnemies() {
        return this.enemies;
    }
}

export { WaveManager };