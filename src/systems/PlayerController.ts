import Phaser from 'phaser';
import { ResourceManager } from './ResourceManager';

export class PlayerController {
  private scene: Phaser.Scene;
  private ship: Phaser.Physics.Arcade.Sprite;
  private resourceManager: ResourceManager;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(scene: Phaser.Scene, ship: Phaser.Physics.Arcade.Sprite, resourceManager: ResourceManager) {
    this.scene = scene;
    this.ship = ship;
    this.resourceManager = resourceManager;

    // Setup keyboard controls
    if (this.scene.input && this.scene.input.keyboard) {
      this.cursors = this.scene.input.keyboard.createCursorKeys();
    } else {
      console.error('Keyboard input not available');
      // Create an empty object to prevent errors
      this.cursors = {} as Phaser.Types.Input.Keyboard.CursorKeys;
    }
  }

  update(delta: number) {
    this.handleShipMovement();
  }

  private handleShipMovement() {
    // Get player stats for speed
    const playerStats = this.resourceManager.getPlayerStats();
    const speed = playerStats.shipSpeed;
    
    // Stop any existing velocity
    this.ship.setVelocity(0);
    
    // Horizontal movement
    if (this.cursors.left?.isDown) {
      this.ship.setVelocityX(-speed);
      this.ship.setRotation(-Math.PI/2); // Left
    } else if (this.cursors.right?.isDown) {
      this.ship.setVelocityX(speed);
      this.ship.setRotation(Math.PI/2); // Right
    }
    
    // Vertical movement
    if (this.cursors.up?.isDown) {
      this.ship.setVelocityY(-speed);
      this.ship.setRotation(0); // Up
    } else if (this.cursors.down?.isDown) {
      this.ship.setVelocityY(speed);
      this.ship.setRotation(Math.PI); // Down
    }
    
    // Diagonal movement - adjust rotation accordingly
    if (this.cursors.up?.isDown && this.cursors.right?.isDown) {
      this.ship.setRotation(Math.PI/4); // Up-right
    } else if (this.cursors.up?.isDown && this.cursors.left?.isDown) {
      this.ship.setRotation(-Math.PI/4); // Up-left
    } else if (this.cursors.down?.isDown && this.cursors.right?.isDown) {
      this.ship.setRotation(3 * Math.PI/4); // Down-right
    } else if (this.cursors.down?.isDown && this.cursors.left?.isDown) {
      this.ship.setRotation(-3 * Math.PI/4); // Down-left
    }
    
    // Normalize diagonal movement to prevent faster speed
    if ((this.cursors.up?.isDown || this.cursors.down?.isDown) && 
        (this.cursors.left?.isDown || this.cursors.right?.isDown)) {
      const body = this.ship.body as Phaser.Physics.Arcade.Body;
      if (body?.velocity) {
        body.velocity.normalize().scale(speed);
      }
    }
  }
} 