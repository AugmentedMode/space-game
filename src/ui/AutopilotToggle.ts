import Phaser from 'phaser';
import { ResourceManager } from '../systems/ResourceManager';

export class AutopilotToggle {
  private scene: Phaser.Scene;
  private resourceManager: ResourceManager;
  
  private toggleButton!: Phaser.GameObjects.Container;
  private toggleBackground!: Phaser.GameObjects.Rectangle;
  private toggleCircle!: Phaser.GameObjects.Arc;
  private toggleText!: Phaser.GameObjects.Text;
  
  // Position and size
  private x: number;
  private y: number;
  private width: number = 120;
  private height: number = 40;
  
  constructor(scene: Phaser.Scene, resourceManager: ResourceManager, x: number = 10, y: number = 10) {
    this.scene = scene;
    this.resourceManager = resourceManager;
    this.x = x;
    this.y = y;
    
    this.createToggle();
  }
  
  private createToggle() {
    // Create container for all elements
    this.toggleButton = this.scene.add.container(this.x, this.y);
    
    // Create background
    this.toggleBackground = this.scene.add.rectangle(0, 0, this.width, this.height, 0x333333)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    
    // Create toggle circle
    this.toggleCircle = this.scene.add.circle(10, this.height / 2, this.height / 2 - 5, 0xff0000)
      .setOrigin(0.5, 0.5);
    
    // Create text
    this.toggleText = this.scene.add.text(this.width / 2, this.height / 2, 'AUTOPILOT', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    
    // Add all elements to container
    this.toggleButton.add([this.toggleBackground, this.toggleCircle, this.toggleText]);
    
    // Set fixed to camera
    this.toggleButton.setScrollFactor(0);
    
    // Add interaction
    this.toggleBackground.on('pointerdown', this.toggleAutopilot, this);
    
    // Initialize state
    this.updateToggleVisuals();
  }
  
  private toggleAutopilot() {
    const playerStats = this.resourceManager.getPlayerStats();
    
    // Get current autopilot state
    const currentState = playerStats.autopilotEnabled;
    
    // Check if autopilot is available (autopilotRange > 0)
    if (!currentState && playerStats.autopilotRange <= 0) {
      // If trying to enable but not available, show message
      const errorText = this.scene.add.text(
        this.scene.cameras.main.centerX,
        this.scene.cameras.main.centerY - 50,
        'Autopilot not available!\nPurchase autopilot upgrades first.',
        {
          fontSize: '20px',
          color: '#ff0000',
          align: 'center'
        }
      ).setOrigin(0.5, 0.5).setScrollFactor(0);
      
      // Fade out the message after a few seconds
      this.scene.tweens.add({
        targets: errorText,
        alpha: 0,
        duration: 2000,
        delay: 1000,
        onComplete: () => {
          errorText.destroy();
        }
      });
      
      return;
    }
    
    // Toggle state - convert boolean to number (1 for true, 0 for false)
    this.resourceManager.setPlayerStat('autopilotEnabled', !currentState ? 1 : 0);
    
    // Update visuals
    this.updateToggleVisuals();
  }
  
  private updateToggleVisuals() {
    const playerStats = this.resourceManager.getPlayerStats();
    const isEnabled = playerStats.autopilotEnabled;
    const isAvailable = playerStats.autopilotRange > 0;
    
    if (isEnabled) {
      // Autopilot is on
      this.toggleCircle.setFillStyle(0x00ff00);
      this.toggleCircle.setX(this.width - 10);
      this.toggleBackground.setFillStyle(0x003300);
    } else {
      // Autopilot is off
      this.toggleCircle.setFillStyle(0xff0000);
      this.toggleCircle.setX(10);
      this.toggleBackground.setFillStyle(0x333333);
    }
    
    // If autopilot isn't available, disable the button
    if (!isAvailable) {
      this.toggleCircle.setFillStyle(0x888888);
      this.toggleBackground.setFillStyle(0x222222);
      this.toggleText.setColor('#888888');
      this.toggleText.setText('LOCKED');
    } else {
      this.toggleText.setColor('#ffffff');
      this.toggleText.setText('AUTOPILOT');
    }
  }
  
  public update() {
    // Update visuals in case player stats changed
    this.updateToggleVisuals();
  }
  
  public resize(gameWidth: number, gameHeight: number) {
    // If needed, adjust position based on new screen size
    // For example, to keep it in a corner
  }
} 