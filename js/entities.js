// Game entities: Tower, Enemy, Projectile

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }
    
    subtract(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }
    
    multiply(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    }
    
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            return new Vector(this.x / mag, this.y / mag);
        }
        return new Vector(0, 0);
    }
    
    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Tower class
class Tower {
    constructor(x, y, type) {
        this.position = new Vector(x, y);
        this.type = type;
        this.level = 1;
        
        // Tower stats based on type
        switch(type) {
            case 'basic':
                this.range = 100;
                this.damage = 10;
                this.fireRate = 1.0; // shots per second
                this.cost = 50;
                this.color = '#ff0000';
                break;
            case 'slow':
                this.range = 80;
                this.damage = 5;
                this.fireRate = 2.0;
                this.slowAmount = 0.5; // 50% slow
                this.cost = 75;
                this.color = '#0000ff';
                break;
            case 'splash':
                this.range = 90;
                this.damage = 15;
                this.fireRate = 0.8;
                this.splashRadius = 30;
                this.cost = 100;
                this.color = '#ffa500';
                break;
            default:
                this.range = 100;
                this.damage = 10;
                this.fireRate = 1.0;
                this.cost = 50;
                this.color = '#ff0000';
        }
        
        this.lastShotTime = 0;
        this.target = null;
    }
    
    canShoot(currentTime) {
        return currentTime - this.lastShotTime >= 1000 / this.fireRate;
    }
    
    shoot(currentTime) {
        this.lastShotTime = currentTime;
        return {
            position: new Vector(this.position.x, this.position.y),
            target: this.target,
            damage: this.damage,
            type: this.type,
            tower: this
        };
    }
    
    findTarget(enemies) {
        let closestEnemy = null;
        let closestDistance = this.range;
        
        for (const enemy of enemies) {
            const distance = this.position.distanceTo(enemy.position);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }
        
        this.target = closestEnemy;
        return closestEnemy;
    }
}

// Enemy class
class Enemy {
    constructor(path, type = 'basic') {
        this.path = path;
        this.pathIndex = 0;
        this.position = new Vector(path[0].x, path[0].y);
        this.type = type;
        
        // Enemy stats based on type
        switch(type) {
            case 'basic':
                this.maxHealth = 50;
                this.speed = 50; // pixels per second
                this.reward = 10;
                this.color = '#00ff00';
                break;
            case 'fast':
                this.maxHealth = 30;
                this.speed = 100;
                this.reward = 15;
                this.color = '#00ffff';
                break;
            case 'tank':
                this.maxHealth = 150;
                this.speed = 25;
                this.reward = 25;
                this.color = '#ff00ff';
                break;
            default:
                this.maxHealth = 50;
                this.speed = 50;
                this.reward = 10;
                this.color = '#00ff00';
        }
        
        this.health = this.maxHealth;
        this.alive = true;
        this.reachedEnd = false;
    }
    
    update(deltaTime, enemies) {
        if (!this.alive || this.reachedEnd) return;
        
        // Move towards next path point
        if (this.pathIndex < this.path.length - 1) {
            const targetPoint = this.path[this.pathIndex + 1];
            const direction = new Vector(
                targetPoint.x - this.position.x,
                targetPoint.y - this.position.y
            );
            
            const distanceToTarget = direction.magnitude();
            if (distanceToTarget < 5) {
                // Reached this path point, move to next
                this.pathIndex++;
            } else {
                // Move towards target
                const normalized = direction.normalize();
                const moveAmount = this.speed * (deltaTime / 1000);
                this.position = this.position.add(normalized.multiply(moveAmount));
                
                // Apply slow effect from towers (simplified)
                // In a real game, we'd check for slow towers nearby
            }
        } else {
            // Reached the end
            this.reachedEnd = true;
            this.alive = false;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.alive = false;
            return this.reward;
        }
        return 0;
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.position.x - 15, this.position.y - 25, 30, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.position.x - 15, this.position.y - 25, 30 * (this.health / this.maxHealth), 5);
    }
}

// Projectile class
class Projectile {
    constructor(position, target, damage, type, tower) {
        this.position = new Vector(position.x, position.y);
        this.target = target;
        this.damage = damage;
        this.type = type;
        this.tower = tower;
        this.speed = 200; // pixels per second
        this.hit = false;
        
        // Visual properties based on tower type
        switch(type) {
            case 'basic':
                this.color = '#ff0000';
                this.radius = 3;
                break;
            case 'slow':
                this.color = '#0000ff';
                this.radius = 3;
                break;
            case 'splash':
                this.color = '#ffa500';
                this.radius = 4;
                break;
            default:
                this.color = '#ff0000';
                this.radius = 3;
        }
    }
    
    update(deltaTime) {
        if (this.hit || !this.target || !this.target.alive) {
            this.hit = true;
            return;
        }
        
        const direction = new Vector(
            this.target.position.x - this.position.x,
            this.target.position.y - this.position.y
        );
        
        const distance = direction.magnitude();
        if (distance < 5) {
            // Hit target
            this.hit = true;
            return;
        }
        
        const normalized = direction.normalize();
        const moveAmount = this.speed * (deltaTime / 1000);
        this.position = this.position.add(normalized.multiply(moveAmount));
    }
    
    draw(ctx) {
        if (this.hit) return;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Path definition
const createPath = () => [
    { x: 50, y: 300 },
    { x: 150, y: 300 },
    { x: 150, y: 200 },
    { x: 300, y: 200 },
    { x: 300, y: 400 },
    { x: 450, y: 400 },
    { x: 450, y: 100 },
    { x: 600, y: 100 },
    { x: 600, y: 500 },
    { x: 750, y: 500 }
];

export { Vector, Tower, Enemy, Projectile, createPath };