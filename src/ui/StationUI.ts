import Phaser from 'phaser';
import { ResourceManager } from '../systems/ResourceManager';
import { UIManager, UITheme, UIConstants } from './UIManager';
import { ResourcesPanel } from './components/ResourcesPanel';
import { UpgradesPanel } from './components/UpgradesPanel';
import { MinimapPanel } from './components/MinimapPanel';

export class StationUI {
  private scene: Phaser.Scene;
  private resourceManager: ResourceManager;
  private uiManager: UIManager;
  public container: Phaser.GameObjects.Container;
  
  // UI Components
  private resourcesPanel: ResourcesPanel;
  private upgradesPanel: UpgradesPanel;
  private minimapPanel: MinimapPanel;
  private saveManagementPanel: Phaser.GameObjects.Container;
  
  // State
  private visible: boolean = false;
  private gameScene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene, resourceManager: ResourceManager, gameScene: Phaser.Scene) {
    this.scene = scene;
    this.resourceManager = resourceManager;
    this.gameScene = gameScene;
    
    // Create UI manager
    this.uiManager = new UIManager(scene, resourceManager);
    
    // Create main container for all UI elements
    this.container = this.scene.add.container(0, 0);
    
    // Create overlay background
    const overlay = this.scene.add.rectangle(
      0, 0,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x000000, 0.7
    );
    overlay.setOrigin(0, 0);
    overlay.setInteractive(); // Catch inputs to prevent clicking through
    
    // Create terminal background
    const terminalBg = this.createTerminalBackground();
    
    // Create header
    const header = this.createHeader();
    
    // Create UI components
    this.resourcesPanel = new ResourcesPanel(scene, this.uiManager, resourceManager, 40, 100);
    this.upgradesPanel = new UpgradesPanel(scene, this.uiManager, resourceManager, 400, 100);
    this.minimapPanel = new MinimapPanel(scene, this.uiManager, this.scene.cameras.main.width - 220, 100);
    
    // Create save management panel
    this.saveManagementPanel = this.createSaveManagementPanel();
    
    // Add all elements to container
    this.container.add([overlay, terminalBg, header, this.saveManagementPanel]);
    
    // The panel objects will expose their containers
    if (this.resourcesPanel.container) {
      this.container.add(this.resourcesPanel.container);
    }
    
    if (this.upgradesPanel.container) {
      this.container.add(this.upgradesPanel.container);
    }
    
    if (this.minimapPanel.container) {
      this.container.add(this.minimapPanel.container);
    }
    
    // Try to load particle texture if it exists
    this.loadParticles();
    
    // Initially hide UI
    this.hide();
  }
  
  private createTerminalBackground(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    
    // Create a large panel for the terminal
    const terminalBg = this.uiManager.createPanel(
      20, 
      20, 
      this.scene.cameras.main.width - 40, 
      this.scene.cameras.main.height - 40,
      UITheme.BACKGROUND_DARK
    );
    
    // Add grid pattern
    const grid = this.scene.add.graphics();
    grid.lineStyle(1, UITheme.BACKGROUND_LIGHT, 0.2);
    
    // Draw vertical grid lines
    const spacing = 50;
    for (let x = 20; x < this.scene.cameras.main.width - 20; x += spacing) {
      grid.beginPath();
      grid.moveTo(x, 20);
      grid.lineTo(x, this.scene.cameras.main.height - 20);
      grid.closePath();
      grid.strokePath();
    }
    
    // Draw horizontal grid lines
    for (let y = 20; y < this.scene.cameras.main.height - 20; y += spacing) {
      grid.beginPath();
      grid.moveTo(20, y);
      grid.lineTo(this.scene.cameras.main.width - 20, y);
      grid.closePath();
      grid.strokePath();
    }
    
    // Add all elements to container
    container.add([terminalBg, grid]);
    
    return container;
  }
  
  private createHeader(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    
    // Create title
    const title = this.uiManager.createTitle('SPACE STATION TERMINAL', UIConstants.FONT_SIZE.LARGE);
    title.setPosition(this.scene.cameras.main.width / 2, 50);
    
    // Add animated circuit lines for sci-fi effect
    const circuitLines = this.scene.add.graphics();
    this.scene.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 3000,
      repeat: -1,
      onUpdate: (tween) => {
        const progress = tween.getValue();
        circuitLines.clear();
        
        // Draw animated circuit patterns
        circuitLines.lineStyle(2, UITheme.ACCENT, 0.7);
        
        // Left side
        const leftX = this.scene.cameras.main.width / 2 - 300 + (progress * 40 / 100);
        circuitLines.beginPath();
        circuitLines.moveTo(leftX, 50 - 15);
        circuitLines.lineTo(leftX + 80, 50 - 15);
        circuitLines.lineTo(leftX + 100, 50);
        circuitLines.lineTo(leftX + 120, 50);
        circuitLines.closePath();
        circuitLines.strokePath();
        
        // Right side
        const rightX = this.scene.cameras.main.width / 2 + 300 - (progress * 40 / 100);
        circuitLines.beginPath();
        circuitLines.moveTo(rightX, 50 - 15);
        circuitLines.lineTo(rightX - 80, 50 - 15);
        circuitLines.lineTo(rightX - 100, 50);
        circuitLines.lineTo(rightX - 120, 50);
        circuitLines.closePath();
        circuitLines.strokePath();
      }
    });
    
    // Create close button
    const closeButton = this.uiManager.createButton('CLOSE', 100, 40, () => this.hide());
    closeButton.setPosition(this.scene.cameras.main.width - 70, 50);
    
    // Add all elements to container
    container.add([title, circuitLines, closeButton]);
    
    return container;
  }
  
  private loadParticles() {
    // Check if the particle texture exists
    if (!this.scene.textures.exists('particle')) {
      // Create a simple particle texture if it doesn't exist
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(4, 4, 4);
      
      // Generate a texture from the graphics object
      graphics.generateTexture('particle', 8, 8);
      graphics.destroy();
    }
  }
  
  private addParticleEffects() {
    // Skip particles for now to avoid TypeScript issues
    // The particles would be a nice enhancement but aren't essential
    // for the core UI functionality
    console.log('Particles would be added here in a production build');
  }
  
  update() {
    if (!this.visible) return;
    
    // Update components
    this.resourcesPanel.update();
    this.upgradesPanel.update();
    
    // Update minimap with latest positions from game scene
    if (this.gameScene && (this.gameScene as any).ship && (this.gameScene as any).spaceStation) {
      const playerPosition = {
        x: (this.gameScene as any).ship.x,
        y: (this.gameScene as any).ship.y
      };
      
      const stationPosition = {
        x: (this.gameScene as any).spaceStation.x,
        y: (this.gameScene as any).spaceStation.y
      };
      
      const worldBounds = (this.gameScene as any).worldSize || { width: 3000, height: 3000 };
      
      // Collect resources positions
      const resources: Array<{ x: number, y: number, type: 'metal' | 'crystal' }> = [];
      
      // Add metal resources if they exist
      if ((this.gameScene as any).metalResources) {
        (this.gameScene as any).metalResources.getChildren().forEach((resource: any) => {
          resources.push({
            x: resource.x,
            y: resource.y,
            type: 'metal'
          });
        });
      }
      
      // Add crystal resources if they exist
      if ((this.gameScene as any).crystalResources) {
        (this.gameScene as any).crystalResources.getChildren().forEach((resource: any) => {
          resources.push({
            x: resource.x,
            y: resource.y,
            type: 'crystal'
          });
        });
      }
      
      this.minimapPanel.update(playerPosition, stationPosition, worldBounds, resources);
    }
  }
  
  show() {
    this.visible = true;
    this.container.setVisible(true);
    
    // Resize to current screen size
    this.resize(this.scene.game.canvas.width, this.scene.game.canvas.height);
    
    // Disable input in the game scene
    if (this.gameScene && this.gameScene.input && this.gameScene.input.keyboard) {
      this.gameScene.input.keyboard.enabled = false;
    }
    
    // Animation for showing
    this.scene.tweens.add({
      targets: this.container,
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Power2'
    });
  }
  
  hide() {
    this.visible = false;
    
    // Re-enable input in the game scene
    if (this.gameScene && this.gameScene.input && this.gameScene.input.keyboard) {
      this.gameScene.input.keyboard.enabled = true;
    }
    
    // Animation for hiding
    this.scene.tweens.add({
      targets: this.container,
      alpha: { from: 1, to: 0 },
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.container.setVisible(false);
      }
    });
  }
  
  isVisible(): boolean {
    return this.visible;
  }
  
  destroy() {
    this.container.destroy();
  }
  
  /**
   * Handles window resize events
   */
  resize(width: number, height: number): void {
    // Update overlay and terminal background sizes
    const overlay = this.container.getAt(0) as Phaser.GameObjects.Rectangle;
    if (overlay) {
      overlay.setSize(width, height);
    }
    
    // Update terminal background
    const terminalBg = this.container.getAt(1) as Phaser.GameObjects.Container;
    if (terminalBg && terminalBg.getAt(0)) {
      const panel = terminalBg.getAt(0) as Phaser.GameObjects.Rectangle;
      panel.setSize(width - 40, height - 40);
      
      // Redraw grid
      const grid = terminalBg.getAt(1) as Phaser.GameObjects.Graphics;
      if (grid) {
        grid.clear();
        grid.lineStyle(1, UITheme.BACKGROUND_LIGHT, 0.2);
        
        // Draw vertical grid lines
        const spacing = 50;
        for (let x = 20; x < width - 20; x += spacing) {
          grid.beginPath();
          grid.moveTo(x, 20);
          grid.lineTo(x, height - 20);
          grid.closePath();
          grid.strokePath();
        }
        
        // Draw horizontal grid lines
        for (let y = 20; y < height - 20; y += spacing) {
          grid.beginPath();
          grid.moveTo(20, y);
          grid.lineTo(width - 20, y);
          grid.closePath();
          grid.strokePath();
        }
      }
    }
    
    // Update header
    const header = this.container.getAt(2) as Phaser.GameObjects.Container;
    if (header) {
      // Update title position
      const title = header.getAt(0) as Phaser.GameObjects.Text;
      if (title) {
        title.setPosition(width / 2, 50);
      }
      
      // Update close button position
      const closeButton = header.getAt(2) as Phaser.GameObjects.Container;
      if (closeButton) {
        closeButton.setPosition(width - 70, 50);
      }
    }
    
    // Update save management panel position
    if (this.saveManagementPanel) {
      this.saveManagementPanel.setPosition(40, height - 120);
    }
    
    // Update minimap position
    if (this.minimapPanel && this.minimapPanel.container) {
      this.minimapPanel.container.setPosition(width - 220, 100);
    }
  }
  
  /**
   * Creates a panel with save/load/reset game options
   */
  private createSaveManagementPanel(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(40, this.scene.cameras.main.height - 120);
    
    // Create panel background
    const panel = this.uiManager.createPanel(0, 0, 320, 80, UITheme.BACKGROUND_LIGHT);
    container.add(panel);
    
    // Panel title
    const title = this.uiManager.createText('SAVE MANAGEMENT', UIConstants.FONT_SIZE.MEDIUM);
    title.setPosition(160, 15);
    container.add(title);
    
    // Save button
    const saveButton = this.uiManager.createButton('SAVE GAME', 120, 30, () => {
      this.resourceManager.saveGame();
      this.showSaveNotification('Game saved successfully!');
    });
    saveButton.setPosition(80, 50);
    container.add(saveButton);
    
    // Reset button
    const resetButton = this.uiManager.createButton('RESET GAME', 120, 30, () => {
      // Show confirmation dialog
      this.showResetConfirmation();
    });
    resetButton.setPosition(240, 50);
    container.add(resetButton);
    
    return container;
  }
  
  /**
   * Shows a temporary notification when game is saved
   */
  private showSaveNotification(message: string): void {
    const notification = this.scene.add.container(this.scene.cameras.main.width / 2, 100);
    this.container.add(notification);
    
    // Background
    const bg = this.scene.add.rectangle(0, 0, 300, 50, UITheme.ACCENT, 0.9);
    bg.setStrokeStyle(1, UITheme.TEXT_PRIMARY);
    notification.add(bg);
    
    // Message text
    const text = this.uiManager.createText(message, UIConstants.FONT_SIZE.MEDIUM);
    text.setPosition(0, 0);
    notification.add(text);
    
    // Animation
    notification.setAlpha(0);
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      y: 80,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.scene.time.delayedCall(1500, () => {
          this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            y: 60,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
              notification.destroy();
            }
          });
        });
      }
    });
  }
  
  /**
   * Shows a confirmation dialog before resetting the game
   */
  private showResetConfirmation(): void {
    const dialog = this.scene.add.container(this.scene.cameras.main.width / 2, this.scene.cameras.main.height / 2);
    this.container.add(dialog);
    
    // Darken background
    const overlay = this.scene.add.rectangle(
      0, 0,
      400, 200,
      UITheme.BACKGROUND_DARK, 0.95
    );
    overlay.setStrokeStyle(2, UITheme.ACCENT);
    dialog.add(overlay);
    
    // Warning text
    const title = this.uiManager.createText('WARNING', UIConstants.FONT_SIZE.MEDIUM);
    title.setPosition(0, -70);
    dialog.add(title);
    
    const text = this.uiManager.createText(
      'This will reset all progress.\nAre you sure you want to continue?', 
      UIConstants.FONT_SIZE.SMALL
    );
    text.setPosition(0, -30);
    dialog.add(text);
    
    // Confirm button
    const confirmButton = this.uiManager.createButton('YES, RESET', 120, 30, () => {
      this.resourceManager.resetGame();
      dialog.destroy();
      this.showSaveNotification('Game has been reset');
    });
    confirmButton.setPosition(-70, 40);
    dialog.add(confirmButton);
    
    // Cancel button
    const cancelButton = this.uiManager.createButton('CANCEL', 120, 30, () => {
      dialog.destroy();
    });
    cancelButton.setPosition(70, 40);
    dialog.add(cancelButton);
    
    // Animation
    dialog.setScale(0.8);
    dialog.setAlpha(0);
    this.scene.tweens.add({
      targets: dialog,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });
  }
} 