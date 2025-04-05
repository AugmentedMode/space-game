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
  private targetIndicator: Phaser.GameObjects.Graphics | null = null;
  private isTargeted: boolean = false;
  private explosionEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    type: AsteroidType = AsteroidType.METAL
  ) {
    // Use the first frame as the default texture
    super(scene, x, y, 'asteroid_frame_0');
    
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
    
    // Update target indicator if it exists
    if (this.targetIndicator && this.isTargeted) {
      this.updateTargetIndicator();
    }
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
    
    try {
      // Check if animation exists before trying to play it
      if (!this.scene.anims.exists('asteroid_explode')) {
        console.warn('Asteroid explosion animation not found, creating fallback');
        this.createFallbackExplosion();
        return;
      }
      
      // Play asteroid explosion animation
      this.play('asteroid_explode');
      
      // Listen for animation completion
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        try {
          // Create particle effect with fewer particles
          this.createExplosionEffect();
          
          // Remove immediately
          this.destroy();
        } catch (error) {
          console.error('Error in animation complete callback:', error);
          this.destroy();
        }
      });
      
      // Safety timeout in case animation doesn't complete
      this.scene.time.delayedCall(1000, () => {
        if (this.active) {
          console.warn('Animation did not complete, forcing destroy');
          this.destroy();
        }
      });
    } catch (error) {
      console.error('Error during explode sequence:', error);
      this.destroy();
    }
  }
  
  // Fallback method if animation isn't available
  private createFallbackExplosion() {
    // Simple animation using tweens instead of sprite animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 1.5,
      duration: 400,
      onComplete: () => {
        this.createExplosionEffect();
        this.destroy();
      }
    });
  }
  
  private createExplosionEffect() {
    // Further reduce particle count and complexity
    const particleCount = 5; // Reduced even more
    
    try {
      // Sometimes the particle texture might not be available
      // In that case, use a simple circle instead
      let particleTexture = this.asteroidType === AsteroidType.METAL ? 'metal' : 'crystal';
      
      // Check if the texture exists before using it
      if (!this.scene.textures.exists(particleTexture)) {
        // Create temporary particles with graphics objects instead
        for (let i = 0; i < particleCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Phaser.Math.Between(40, 100);
          const distance = Phaser.Math.Between(20, 50);
          
          const x = this.x + Math.cos(angle) * distance;
          const y = this.y + Math.sin(angle) * distance;
          
          const color = this.asteroidType === AsteroidType.METAL ? 0x8c8c8c : 0x9c5ab8;
          const particle = this.scene.add.circle(x, y, 3, color, 0.8);
          
          // Animate the particle
          this.scene.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed,
            alpha: 0,
            scale: 0.1,
            duration: 600,
            onComplete: () => particle.destroy()
          });
        }
        return;
      }
      
      // If texture exists, use the particle system
      const particles = this.scene.add.particles(this.x, this.y, particleTexture, {
        speed: { min: 40, max: 100 },
        scale: { start: 0.3, end: 0 },
        lifespan: 600, // Even shorter lifespan
        blendMode: 'ADD',
        emitting: false
      });
      
      particles.explode(particleCount);
      
      // Clean up particles after a short time
      this.scene.time.delayedCall(600, () => {
        if (particles && particles.active) {
          particles.destroy();
        }
      });
    } catch (error) {
      console.error('Error creating explosion effect:', error);
    }
  }
  
  getResourceAmount(): number {
    return this.resourceAmount;
  }
  
  getType(): AsteroidType {
    return this.asteroidType;
  }

  // New method to set targeting status
  setTargeted(targeted: boolean): void {
    this.isTargeted = targeted;
    
    if (targeted) {
      this.createTargetIndicator();
    } else if (this.targetIndicator) {
      this.targetIndicator.destroy();
      this.targetIndicator = null;
    }
  }
  
  // New method to create a visual indicator that this asteroid is targeted
  private createTargetIndicator(): void {
    if (!this.targetIndicator) {
      this.targetIndicator = this.scene.add.graphics();
    }
    
    this.updateTargetIndicator();
  }
  
  // New method to update the visual target indicator
  private updateTargetIndicator(): void {
    if (!this.targetIndicator) return;
    
    this.targetIndicator.clear();
    this.targetIndicator.lineStyle(2, 0xff0000, 0.8);
    
    // Draw a pulsing circle around the asteroid
    const time = this.scene.time.now;
    const scale = 1 + Math.sin(time / 200) * 0.1; // Pulsing effect
    
    // Draw target indicator circle
    this.targetIndicator.strokeCircle(this.x, this.y, 40 * scale);
    
    // Add crosshair lines
    const size = 10;
    this.targetIndicator.beginPath();
    // Top line
    this.targetIndicator.moveTo(this.x, this.y - 40 * scale - size);
    this.targetIndicator.lineTo(this.x, this.y - 40 * scale + size);
    // Bottom line
    this.targetIndicator.moveTo(this.x, this.y + 40 * scale - size);
    this.targetIndicator.lineTo(this.x, this.y + 40 * scale + size);
    // Left line
    this.targetIndicator.moveTo(this.x - 40 * scale - size, this.y);
    this.targetIndicator.lineTo(this.x - 40 * scale + size, this.y);
    // Right line
    this.targetIndicator.moveTo(this.x + 40 * scale - size, this.y);
    this.targetIndicator.lineTo(this.x + 40 * scale + size, this.y);
    this.targetIndicator.strokePath();
  }

  destroy(fromScene?: boolean) {
    // Clean up graphics objects
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    if (this.targetIndicator) {
      this.targetIndicator.destroy();
      this.targetIndicator = null;
    }
    
    super.destroy(fromScene);
  }
} 