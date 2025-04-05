import Phaser from 'phaser';
import { Asteroid, AsteroidType } from '../objects/Asteroid';
import { ResourceManager } from './ResourceManager';
import { AsteroidBeltManager } from './AsteroidBeltManager';
import { GameConfig } from '../config/GameConfig';

export class MiningSystem {
  private scene: Phaser.Scene;
  private ship: Phaser.Physics.Arcade.Sprite;
  private asteroidBeltManager: AsteroidBeltManager;
  private resourceManager: ResourceManager;
  
  // Mining state
  private miningActive: boolean = false;
  private miningTargets: Asteroid[] = [];
  private miningBeam: Phaser.GameObjects.Graphics | null = null;
  private miningTimer: Phaser.Time.TimerEvent | null = null;
  private miningKey: Phaser.Input.Keyboard.Key = {} as Phaser.Input.Keyboard.Key;
  private nearbyAsteroids: Asteroid[] = [];
  private attackRangeIndicator: Phaser.GameObjects.Graphics | null = null;
  private miningText: Phaser.GameObjects.Text | null = null;

  constructor(
    scene: Phaser.Scene, 
    ship: Phaser.Physics.Arcade.Sprite, 
    asteroidBeltManager: AsteroidBeltManager,
    resourceManager: ResourceManager
  ) {
    this.scene = scene;
    this.ship = ship;
    this.asteroidBeltManager = asteroidBeltManager;
    this.resourceManager = resourceManager;
    
    // Initialize mining components
    this.initializeMiningSystem();
  }
  
  update(delta: number) {
    // Update nearby asteroids
    this.updateNearbyAsteroids();
    
    // Update attack range indicator
    this.updateAttackRangeIndicator();
    
    // Handle mining input
    this.handleMiningInput();
    
    // Update mining beam if active
    if (this.miningActive && this.miningTargets.length > 0 && this.miningBeam) {
      this.updateMiningBeam();
    } else if (this.miningBeam) {
      this.miningBeam.clear();
    }
  }
  
  public stopMining() {
    this.miningActive = false;
    
    // Clear targeting on all current targets
    this.miningTargets.forEach(target => {
      if (target && target.active) {
        target.setTargeted(false);
      }
    });
    
    this.miningTargets = [];
    
    if (this.miningTimer) {
      this.miningTimer.remove();
      this.miningTimer = null;
    }
    
    if (this.miningBeam) {
      this.miningBeam.clear();
    }
  }
  
  private initializeMiningSystem() {
    // Set up mining key
    if (this.scene.input && this.scene.input.keyboard) {
      this.miningKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    } else {
      console.error('Keyboard input not available for mining system');
      // Create a dummy key object to prevent errors
      this.miningKey = {} as Phaser.Input.Keyboard.Key;
      this.miningKey.isDown = false;
    }
    
    // Create mining beam graphics
    this.miningBeam = this.scene.add.graphics();
    
    // Create attack range indicator
    this.attackRangeIndicator = this.scene.add.graphics();
    
    // Ensure minimum stats are set
    this.resourceManager.ensureMinimumStats();
    
    // Set the attack range to a reasonable gameplay value
    this.resourceManager.setPlayerStat('attackRange', GameConfig.DEFAULT_ATTACK_RANGE);
  }
  
  private updateNearbyAsteroids() {
    const playerStats = this.resourceManager.getPlayerStats();
    let attackRange = playerStats.attackRange;
    
    // Use a reasonable fallback value if needed
    if (attackRange <= 0) {
      attackRange = GameConfig.DEFAULT_ATTACK_RANGE;
      this.resourceManager.setPlayerStat('attackRange', attackRange);
    }
    
    // Clear current nearby asteroids list
    this.nearbyAsteroids = [];
    
    // Get all asteroids from the group
    const asteroids = this.asteroidBeltManager.getAsteroids().getChildren() as Asteroid[];
    
    // Check each asteroid for distance
    asteroids.forEach(asteroid => {
      const distance = Phaser.Math.Distance.Between(
        this.ship.x, this.ship.y,
        asteroid.x, asteroid.y
      );
      
      // Add to nearby list if within range
      if (distance <= attackRange) {
        this.nearbyAsteroids.push(asteroid);
      }
    });
    
    // Show mining indicator
    this.updateNearbyAsteroidIndicator();
  }
  
  private updateAttackRangeIndicator() {
    // Get player stats for attack range
    const playerStats = this.resourceManager.getPlayerStats();
    let attackRange = playerStats.attackRange;
    
    // Ensure we have a reasonable range value - use fallback if needed
    if (attackRange <= 0) {
      attackRange = GameConfig.DEFAULT_ATTACK_RANGE;
      this.resourceManager.setPlayerStat('attackRange', attackRange);
    }
    
    // Create attack range indicator if it doesn't exist but keep it invisible
    if (!this.attackRangeIndicator) {
      this.attackRangeIndicator = this.scene.add.graphics();
    }
    
    // Clear any previous graphics (making it invisible)
    if (this.attackRangeIndicator) {
      this.attackRangeIndicator.clear();
    }
  }
  
  private updateNearbyAsteroidIndicator() {
    // Add some visual indicator if near an asteroid
    if (this.nearbyAsteroids.length > 0 && !this.miningActive) {
      // Show a "press SPACE to mine" tooltip without debug info
      const text = `Press SPACE to attack ${this.nearbyAsteroids.length} asteroid${this.nearbyAsteroids.length > 1 ? 's' : ''}`;
      
      // Add or update text (position it above the ship)
      if (!this.miningText) {
        this.miningText = this.scene.add.text(
          this.ship.x,
          this.ship.y - 70,
          text,
          { fontSize: '14px', color: '#ffffff' }
        ).setOrigin(0.5);
      } else {
        this.miningText.setText(text);
        this.miningText.setPosition(this.ship.x, this.ship.y - 70);
        this.miningText.setVisible(true);
      }
    } else if (this.miningText) {
      // Hide the text if not near any asteroids
      this.miningText.setVisible(false);
    }
  }
  
  private handleMiningInput() {
    if (!this.miningKey) return;
    
    // Start mining if spacebar is pressed and near asteroids
    if (Phaser.Input.Keyboard.JustDown(this.miningKey) && this.nearbyAsteroids.length > 0 && !this.miningActive) {
      this.startMining();
    }
    
    // Stop mining if spacebar is released
    if (this.miningActive && Phaser.Input.Keyboard.JustUp(this.miningKey)) {
      this.stopMining();
    }
    
    // Check if all targets have been destroyed or are out of range
    if (this.miningActive) {
      // Filter out destroyed asteroids and those out of range
      this.miningTargets = this.miningTargets.filter(target => {
        if (!target.active) return false; // Destroyed
        
        const distance = Phaser.Math.Distance.Between(
          this.ship.x, this.ship.y,
          target.x, target.y
        );
        
        const playerStats = this.resourceManager.getPlayerStats();
        return distance <= playerStats.attackRange;
      });
      
      // Stop mining if no targets left
      if (this.miningTargets.length === 0) {
        this.stopMining();
      }
    }
  }
  
  private startMining() {
    this.miningActive = true;
    
    // Get player stats for multiAttack
    const playerStats = this.resourceManager.getPlayerStats();
    const maxTargets = playerStats.multiAttack;
    
    // Clear any previous targets first
    this.miningTargets.forEach(target => {
      if (target && target.active) {
        target.setTargeted(false);
      }
    });
    
    // Sort asteroids by distance (closest first)
    const sortedAsteroids = [...this.nearbyAsteroids].sort((a, b) => {
      const distA = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, a.x, a.y);
      const distB = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, b.x, b.y);
      return distA - distB;
    });
    
    // Select asteroids to target (limited by multiAttack stat)
    this.miningTargets = sortedAsteroids.slice(0, maxTargets);
    
    // Set each target as targeted (for visual indicator)
    this.miningTargets.forEach(target => {
      if (target && target.active) {
        target.setTargeted(true);
      }
    });
    
    // Set mining timer to damage asteroids periodically
    const miningSpeed = playerStats.miningSpeed || 1;
    this.miningTimer = this.scene.time.addEvent({
      delay: 500 / miningSpeed, // Faster mining with upgrades
      callback: this.mineAsteroids,
      callbackScope: this,
      loop: true
    });
  }
  
  private mineAsteroids() {
    if (this.miningTargets.length === 0) return;
    
    // Get player stats for mining damage
    const playerStats = this.resourceManager.getPlayerStats();
    const miningDamage = playerStats.miningPower || 1;
    
    // Keep track of which targets were destroyed
    const destroyedTargets: Asteroid[] = [];
    
    // Apply damage to each target asteroid
    this.miningTargets.forEach(target => {
      if (!target || !target.active) return;
      
      const destroyed = target.mine(miningDamage);
      
      if (destroyed) {
        // Add to the destroyed list
        destroyedTargets.push(target);
        
        // Add resources based on asteroid type
        this.collectAsteroidResources(target);
      }
    });
    
    // Remove destroyed targets from the targets list
    if (destroyedTargets.length > 0) {
      this.miningTargets = this.miningTargets.filter(target => !destroyedTargets.includes(target));
      
      // If we have space for more targets, check if there are any more in range
      this.findAndAddNewTargets();
    }
    
    // Stop mining if no targets left
    if (this.miningTargets.length === 0) {
      this.stopMining();
    }
  }
  
  private collectAsteroidResources(target: Asteroid) {
    // Get resource amount from asteroid
    const resourceAmount = target.getResourceAmount();
    
    if (target.getType() === AsteroidType.METAL) {
      // Metal asteroid: gives full metal amount and 30% of that as crystal
      this.resourceManager.addResource('metal', resourceAmount);
      this.resourceManager.addResource('crystal', Math.floor(resourceAmount * 0.3));
      
      // Show resource gain feedback
      this.createFloatingText(`+${resourceAmount}`, 0xaaaaaa, '+metal');
      if (Math.floor(resourceAmount * 0.3) > 0) {
        this.createFloatingText(`+${Math.floor(resourceAmount * 0.3)}`, 0x9c5ab8, '+crystal', 30);
      }
      
      // Flash effect
      this.scene.cameras.main.flash(100, 0, 0, 255, false);
    } else {
      // Crystal asteroid: gives full crystal amount and 30% of that as metal
      this.resourceManager.addResource('crystal', resourceAmount);
      this.resourceManager.addResource('metal', Math.floor(resourceAmount * 0.3));
      
      // Show resource gain feedback
      this.createFloatingText(`+${resourceAmount}`, 0x9c5ab8, '+crystal');
      if (Math.floor(resourceAmount * 0.3) > 0) {
        this.createFloatingText(`+${Math.floor(resourceAmount * 0.3)}`, 0xaaaaaa, '+metal', 30);
      }
      
      // Flash effect
      this.scene.cameras.main.flash(100, 255, 0, 0, false);
    }
  }
  
  private findAndAddNewTargets() {
    const playerStats = this.resourceManager.getPlayerStats();
    
    if (this.miningTargets.length < playerStats.multiAttack && this.nearbyAsteroids.length > 0) {
      // Find asteroids in range that aren't already targeted
      const availableAsteroids = this.nearbyAsteroids.filter(asteroid => 
        !this.miningTargets.includes(asteroid) && asteroid.active);
      
      // Sort by distance
      const sortedAvailable = availableAsteroids.sort((a, b) => {
        const distA = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, a.x, a.y);
        const distB = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, b.x, b.y);
        return distA - distB;
      });
      
      // Add new targets up to the limit
      const newTargets = sortedAvailable.slice(0, playerStats.multiAttack - this.miningTargets.length);
      
      // Mark new targets as targeted
      newTargets.forEach(target => {
        target.setTargeted(true);
        this.miningTargets.push(target);
      });
    }
  }
  
  private updateMiningBeam() {
    if (!this.miningBeam) return;
    
    // Clear previous beams
    this.miningBeam.clear();
    
    // Draw beams to each target
    this.miningTargets.forEach(target => {
      if (!target || !target.active) return;
      
      // Calculate beam points
      const start = { x: this.ship.x, y: this.ship.y };
      const end = { x: target.x, y: target.y };
      
      // Draw a laser beam effect
      if (this.miningBeam) {
        this.miningBeam.lineStyle(2, 0x00ffff, 1);
        this.miningBeam.lineBetween(start.x, start.y, end.x, end.y);
        
        // Add beam particles for effect
        for (let i = 0; i < 3; i++) {
          const t = Math.random();
          const x = start.x + (end.x - start.x) * t;
          const y = start.y + (end.y - start.y) * t;
          
          // Draw a small circle along the beam
          this.miningBeam.fillStyle(0x00ffff, 0.8);
          this.miningBeam.fillCircle(x, y, 3);
        }
      }
    });
  }
  
  private createFloatingText(text: string, color: number, prefix: string = '', yOffset: number = 0) {
    // Ask the GameScene to create floating text
    if (this.scene.scene.key === 'game') {
      const gameScene = this.scene as any;
      if (gameScene.createFloatingText) {
        gameScene.createFloatingText(text, color, prefix, yOffset);
      }
    }
  }
} 