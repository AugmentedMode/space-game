import Phaser from 'phaser';

export enum AsteroidType {
  METAL = 'metal',
  CRYSTAL = 'crystal'
}

export class Asteroid extends Phaser.Physics.Arcade.Sprite {
  private asteroidType: AsteroidType;
  private health: number;
  private maxHealth: number;
  private isMining: boolean = false;
  private hasBeenMined: boolean = false;
  private resourceAmount: number;
  private healthBar: Phaser.GameObjects.Graphics;
  private explosionEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    type: AsteroidType = AsteroidType.METAL
  ) {
    super(scene, x, y, 'asteroid');
    
    this.asteroidType = type;
    this.maxHealth = type === AsteroidType.METAL ? 5 : 8; // Crystal asteroids are tougher
    this.health = this.maxHealth;
    this.resourceAmount = type === AsteroidType.METAL ? 10 : 5; // Metal gives more resources, crystal less
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set size and physics properties
    this.setScale(1);
    this.setCircle(32, 0, 0); // Adjust collision circle
    this.setImmovable(true);
    
    // Create health bar
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();
    
    // Set asteroid appearance based on type
    this.setTint(type === AsteroidType.METAL ? 0x8c8c8c : 0x9c5ab8);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    
    // Update health bar position to follow asteroid
    this.updateHealthBar();
  }
  
  updateHealthBar() {
    this.healthBar.clear();
    
    // Draw background
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(this.x - 30, this.y - 50, 60, 8);
    
    // Calculate health percentage
    const healthPercentage = this.health / this.maxHealth;
    
    // Draw health
    this.healthBar.fillStyle(this.getHealthColor(), 1);
    this.healthBar.fillRect(this.x - 30, this.y - 50, 60 * healthPercentage, 8);
  }
  
  getHealthColor(): number {
    // Color ranges from green to red based on health percentage
    const healthPercentage = this.health / this.maxHealth;
    if (healthPercentage > 0.6) return 0x00ff00;
    if (healthPercentage > 0.3) return 0xffff00;
    return 0xff0000;
  }
  
  mine(damage: number = 1): boolean {
    if (this.health <= 0 || this.hasBeenMined) return false;
    
    this.health -= damage;
    this.updateHealthBar();
    
    // Play hit animation/feedback
    this.playHitFeedback();
    
    if (this.health <= 0) {
      this.explode();
      return true;
    }
    
    return false;
  }
  
  private playHitFeedback() {
    // Flash the asteroid
    this.scene.tweens.add({
      targets: this,
      alpha: 0.7,
      duration: 100,
      yoyo: true,
    });
    
    // Scale effect
    this.scene.tweens.add({
      targets: this,
      scaleX: this.scaleX * 1.1,
      scaleY: this.scaleY * 1.1,
      duration: 50,
      yoyo: true,
    });
  }
  
  explode() {
    this.hasBeenMined = true;
    if (this.body) this.body.enable = false;
    this.healthBar.destroy();
    
    // Play asteroid explosion animation
    this.play('asteroid_explode');
    
    // Listen for animation completion
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      // Create particle effect
      this.createExplosionEffect();
      
      // Remove after a delay
      this.scene.time.delayedCall(1000, () => {
        this.destroy();
      });
    });
  }
  
  private createExplosionEffect() {
    const particles = this.scene.add.particles(0, 0, this.asteroidType === AsteroidType.METAL ? 'metal' : 'crystal', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.5, end: 0 },
      lifespan: 1000,
      blendMode: 'ADD',
      emitting: false
    });
    
    particles.setPosition(this.x, this.y);
    particles.explode(20);
  }
  
  getResourceAmount(): number {
    return this.resourceAmount;
  }
  
  getType(): AsteroidType {
    return this.asteroidType;
  }
} 