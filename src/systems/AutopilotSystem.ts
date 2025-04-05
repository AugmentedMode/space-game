import Phaser from 'phaser';
import { Asteroid } from '../objects/Asteroid';
import { ResourceManager } from './ResourceManager';
import { AsteroidBeltManager } from './AsteroidBeltManager';
import { MiningSystem } from './MiningSystem';

export class AutopilotSystem {
  private scene: Phaser.Scene;
  private ship: Phaser.Physics.Arcade.Sprite;
  private resourceManager: ResourceManager;
  private asteroidBeltManager: AsteroidBeltManager;
  private miningSystem: MiningSystem;
  
  // Autopilot state
  private enabled: boolean = false;
  private active: boolean = false;
  private targetAsteroid: Asteroid | null = null;
  private pathGraphics: Phaser.GameObjects.Graphics | null = null;
  private autopilotText: Phaser.GameObjects.Text | null = null;
  private autopilotStatusText: Phaser.GameObjects.Text | null = null;
  
  // Timer for finding new targets
  private findTargetTimer: Phaser.Time.TimerEvent | null = null;
  
  constructor(
    scene: Phaser.Scene,
    ship: Phaser.Physics.Arcade.Sprite,
    resourceManager: ResourceManager,
    asteroidBeltManager: AsteroidBeltManager,
    miningSystem: MiningSystem
  ) {
    this.scene = scene;
    this.ship = ship;
    this.resourceManager = resourceManager;
    this.asteroidBeltManager = asteroidBeltManager;
    this.miningSystem = miningSystem;
    
    // Initialize autopilot components
    this.initializeAutopilot();
  }
  
  update(delta: number) {
    // Check if autopilot should be enabled based on player stats
    const playerStats = this.resourceManager.getPlayerStats();
    this.enabled = playerStats.autopilotEnabled;
    
    // Update UI indicators
    this.updateAutopilotUI();
    
    // If not enabled, do nothing
    if (!this.enabled) {
      this.deactivateAutopilot();
      return;
    }
    
    // If enabled but not active, try to activate
    if (this.enabled && !this.active) {
      this.activateAutopilot();
    }
    
    // If active, handle autopilot movement and mining
    if (this.active) {
      this.handleAutopilotMovement(delta);
    }
  }
  
  private initializeAutopilot() {
    // Create path graphics for visualization
    this.pathGraphics = this.scene.add.graphics();
    
    // Create autopilot status text
    this.autopilotText = this.scene.add.text(
      10, 10,
      'AUTOPILOT: DISABLED',
      { fontSize: '14px', color: '#ff0000' }
    );
    this.autopilotText.setScrollFactor(0); // Fixed to camera
    this.autopilotText.setDepth(100); // Make sure it's visible on top
    
    // Create detailed status text
    this.autopilotStatusText = this.scene.add.text(
      10, 30,
      '',
      { fontSize: '12px', color: '#ffffff' }
    );
    this.autopilotStatusText.setScrollFactor(0); // Fixed to camera
    this.autopilotStatusText.setDepth(100); // Make sure it's visible on top
    
    // Initialize find target timer
    this.startFindTargetTimer();
  }
  
  private startFindTargetTimer() {
    // Clean up existing timer if there is one
    if (this.findTargetTimer) {
      this.findTargetTimer.remove();
    }
    
    // Create new timer that periodically looks for targets
    this.findTargetTimer = this.scene.time.addEvent({
      delay: 1000, // Check every second
      callback: this.findNewTarget,
      callbackScope: this,
      loop: true
    });
  }
  
  private activateAutopilot() {
    this.active = true;
    
    // Find a target if we don't have one
    if (!this.targetAsteroid || !this.targetAsteroid.active) {
      this.findNewTarget();
    }
    
    // Update UI
    if (this.autopilotText) {
      this.autopilotText.setText('AUTOPILOT: ACTIVE');
      this.autopilotText.setColor('#00ff00');
    }
  }
  
  private deactivateAutopilot() {
    this.active = false;
    this.targetAsteroid = null;
    
    // Clear path visualization
    if (this.pathGraphics) {
      this.pathGraphics.clear();
    }
    
    // Update UI
    if (this.autopilotText) {
      this.autopilotText.setText('AUTOPILOT: DISABLED');
      this.autopilotText.setColor('#ff0000');
    }
    
    if (this.autopilotStatusText) {
      this.autopilotStatusText.setText('');
    }
  }
  
  private findNewTarget() {
    // If autopilot is not enabled or active, don't find a new target
    if (!this.enabled || !this.active) {
      return;
    }
    
    const playerStats = this.resourceManager.getPlayerStats();
    const autopilotRange = playerStats.autopilotRange;
    
    // Get all asteroids
    const asteroids = this.asteroidBeltManager.getAsteroids().getChildren() as Asteroid[];
    
    // Filter to those within autopilot range
    const inRangeAsteroids = asteroids.filter(asteroid => {
      const distance = Phaser.Math.Distance.Between(
        this.ship.x, this.ship.y,
        asteroid.x, asteroid.y
      );
      return distance <= autopilotRange && asteroid.active;
    });
    
    // If no asteroids in range, update status and return
    if (inRangeAsteroids.length === 0) {
      if (this.autopilotStatusText) {
        this.autopilotStatusText.setText('No asteroids in range. Searching...');
      }
      this.targetAsteroid = null;
      return;
    }
    
    // Sort by distance (closest first)
    const sortedAsteroids = inRangeAsteroids.sort((a, b) => {
      const distA = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, a.x, a.y);
      const distB = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, b.x, b.y);
      return distA - distB;
    });
    
    // Select the closest asteroid as target
    this.targetAsteroid = sortedAsteroids[0];
    
    // Update status
    if (this.autopilotStatusText) {
      const distance = Phaser.Math.Distance.Between(
        this.ship.x, this.ship.y,
        this.targetAsteroid.x, this.targetAsteroid.y
      );
      
      this.autopilotStatusText.setText(
        `Target: Asteroid (Distance: ${Math.round(distance)} units)\n` +
        `Status: Navigating to target`
      );
    }
    
    // Visualize path to target
    this.visualizePathToTarget();
  }
  
  private handleAutopilotMovement(delta: number) {
    // If no target, find one
    if (!this.targetAsteroid || !this.targetAsteroid.active) {
      this.findNewTarget();
      return;
    }
    
    // Calculate distance to target
    const distance = Phaser.Math.Distance.Between(
      this.ship.x, this.ship.y,
      this.targetAsteroid.x, this.targetAsteroid.y
    );
    
    // Get player stats
    const playerStats = this.resourceManager.getPlayerStats();
    const attackRange = playerStats.attackRange;
    const speed = playerStats.shipSpeed * playerStats.autopilotEfficiency;
    
    // If within attack range, start mining
    if (distance <= attackRange) {
      // Stop movement
      this.ship.setVelocity(0);
      
      // Update status
      if (this.autopilotStatusText) {
        this.autopilotStatusText.setText(
          `Target: Asteroid (Distance: ${Math.round(distance)} units)\n` +
          `Status: Mining target`
        );
      }
      
      // Try to call the public methods of MiningSystem to start mining
      this.mineTarget();
    } else {
      // Move towards target
      this.moveTowardsTarget(speed);
      
      // Update status
      if (this.autopilotStatusText) {
        this.autopilotStatusText.setText(
          `Target: Asteroid (Distance: ${Math.round(distance)} units)\n` +
          `Status: Moving to target`
        );
      }
    }
  }
  
  private moveTowardsTarget(speed: number) {
    if (!this.targetAsteroid) return;
    
    // Calculate angle to target
    const angle = Phaser.Math.Angle.Between(
      this.ship.x, this.ship.y,
      this.targetAsteroid.x, this.targetAsteroid.y
    );
    
    // Set ship rotation to face target
    this.ship.setRotation(angle + Math.PI/2);
    
    // Calculate velocity components
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    // Apply movement
    this.ship.setVelocity(vx, vy);
  }
  
  private mineTarget() {
    // We need to simulate pressing the space key to trigger mining
    if (!this.scene.input || !this.scene.input.keyboard) {
      return; // Exit if keyboard input is not available
    }
    
    // Method 1: Try to emulate a keypress event
    try {
      // Create a KeyboardEvent
      const keyEvent = new KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
        keyCode: 32,
        which: 32,
        bubbles: true
      });
      
      // Dispatch the event on the canvas
      const canvas = this.scene.sys.game.canvas;
      if (canvas) {
        canvas.dispatchEvent(keyEvent);
      }
    } catch (e) {
      console.error('Failed to simulate key press:', e);
    }
    
    // Method 2: Access mining system directly as fallback
    // This is a safer approach if the methods are exposed
    if (this.miningSystem) {
      // Check if the mining system has a startMining method
      const miningSystemAny = this.miningSystem as any;
      if (typeof miningSystemAny.startMining === 'function') {
        miningSystemAny.startMining();
      }
    }
  }
  
  private visualizePathToTarget() {
    if (!this.pathGraphics || !this.targetAsteroid) return;
    
    // Clear previous path
    this.pathGraphics.clear();
    
    // Draw line to target
    this.pathGraphics.lineStyle(1, 0x00ff00, 0.5);
    this.pathGraphics.lineBetween(
      this.ship.x, this.ship.y,
      this.targetAsteroid.x, this.targetAsteroid.y
    );
    
    // Draw circle at target
    this.pathGraphics.strokeCircle(
      this.targetAsteroid.x, this.targetAsteroid.y, 20
    );
  }
  
  private updateAutopilotUI() {
    // Check if player stats indicate autopilot is available
    const playerStats = this.resourceManager.getPlayerStats();
    
    // Update main autopilot text
    if (this.autopilotText) {
      if (playerStats.autopilotEnabled) {
        this.autopilotText.setText(this.active ? 'AUTOPILOT: ACTIVE' : 'AUTOPILOT: ENABLED');
        this.autopilotText.setColor(this.active ? '#00ff00' : '#ffff00');
      } else {
        this.autopilotText.setText('AUTOPILOT: DISABLED');
        this.autopilotText.setColor('#ff0000');
      }
    }
    
    // Visualize path if we have a target
    if (this.active && this.targetAsteroid && this.targetAsteroid.active) {
      this.visualizePathToTarget();
    } else if (this.pathGraphics) {
      this.pathGraphics.clear();
    }
  }
} 