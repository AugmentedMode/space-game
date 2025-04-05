import Phaser from 'phaser';
import { SpaceStation } from '../objects/SpaceStation';
import { MiningSystem } from './MiningSystem';
import { GameConfig } from '../config/GameConfig';

export class TeleportSystem {
  private scene: Phaser.Scene;
  private ship: Phaser.Physics.Arcade.Sprite;
  private spaceStation: SpaceStation;
  private miningSystem: MiningSystem;
  
  // Teleport properties
  private teleportKey!: Phaser.Input.Keyboard.Key;
  private teleportHoldTime: number = 0;
  private teleportRequiredTime: number = GameConfig.TELEPORT_REQUIRED_TIME;
  private teleportCooldown: number = 0;
  private teleportCooldownTime: number = GameConfig.TELEPORT_COOLDOWN_TIME;
  private teleportText: Phaser.GameObjects.Text | null = null;

  constructor(
    scene: Phaser.Scene,
    ship: Phaser.Physics.Arcade.Sprite,
    spaceStation: SpaceStation,
    miningSystem: MiningSystem
  ) {
    this.scene = scene;
    this.ship = ship;
    this.spaceStation = spaceStation;
    this.miningSystem = miningSystem;
    
    this.initializeTeleport();
  }
  
  update(delta: number) {
    this.handleTeleport(delta);
    this.updateTeleportCooldown(delta);
  }
  
  private initializeTeleport() {
    // Set up teleport key
    if (this.scene.input && this.scene.input.keyboard) {
      this.teleportKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    } else {
      console.error('Keyboard input not available for teleport system');
      // Create a dummy key object to prevent errors
      this.teleportKey = {} as Phaser.Input.Keyboard.Key;
      this.teleportKey.isDown = false;
    }
    
    // Create teleport text (initially hidden)
    this.teleportText = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height - 50,
      '',
      { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
    ).setOrigin(0.5)
     .setScrollFactor(0)
     .setDepth(1000)
     .setVisible(false);
  }
  
  private handleTeleport(delta: number) {
    if (!this.teleportKey) return;
    
    // Can't teleport during cooldown
    if (this.teleportCooldown > 0) {
      return;
    }
    
    // Check if teleport key is being held
    if (this.teleportKey.isDown) {
      this.teleportHoldTime += delta;
      
      // Update the progress display
      if (this.teleportText) {
        const progress = Math.min(100, Math.floor((this.teleportHoldTime / this.teleportRequiredTime) * 100));
        this.teleportText.setText(`Hold to teleport: ${progress}%`);
        this.teleportText.setVisible(true);
      }
      
      // Check if held long enough
      if (this.teleportHoldTime >= this.teleportRequiredTime) {
        this.teleportToSpaceStation();
        this.teleportHoldTime = 0;
        this.teleportCooldown = this.teleportCooldownTime;
      }
    } else {
      // Reset when key is released
      this.teleportHoldTime = 0;
      if (this.teleportText && this.teleportCooldown <= 0) {
        this.teleportText.setVisible(false);
      }
    }
  }
  
  private updateTeleportCooldown(delta: number) {
    if (this.teleportCooldown > 0) {
      this.teleportCooldown -= delta;
      
      if (this.teleportText) {
        this.teleportText.setText(`Teleport cooldown: ${Math.ceil(this.teleportCooldown / 1000)}s`);
        this.teleportText.setVisible(true);
      }
      
      if (this.teleportCooldown <= 0) {
        if (this.teleportText) {
          this.teleportText.setVisible(false);
        }
      }
    }
  }
  
  private teleportToSpaceStation() {
    // Get space station position
    const stationPos = {
      x: this.spaceStation.x,
      y: this.spaceStation.y
    };
    
    // Add a teleport effect
    this.scene.cameras.main.flash(500, 0, 200, 255);
    
    // Stop any mining activity
    this.miningSystem.stopMining();
    
    // Move ship to space station with slight offset
    this.ship.setPosition(stationPos.x + 50, stationPos.y + 50);
    
    // Show teleport confirmation
    this.createFloatingText('Teleported!', 0x00ffff);
  }
  
  private createFloatingText(text: string, color: number) {
    // Ask the GameScene to create floating text
    if (this.scene.scene.key === 'game') {
      const gameScene = this.scene as any;
      if (gameScene.createFloatingText) {
        gameScene.createFloatingText(text, color);
      }
    }
  }
} 