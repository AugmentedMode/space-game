import Phaser from 'phaser';
import { ResourceManager } from '../../systems/ResourceManager';
import { UIManager, UITheme, UIConstants } from '../UIManager';

export class ResourcesPanel {
  private scene: Phaser.Scene;
  private uiManager: UIManager;
  private resourceManager: ResourceManager;
  public container: Phaser.GameObjects.Container;
  
  // Resource displays
  private metalValue!: Phaser.GameObjects.Text;
  private crystalValue!: Phaser.GameObjects.Text;
  private metalRateValue!: Phaser.GameObjects.Text;
  private crystalRateValue!: Phaser.GameObjects.Text;
  
  // Stats displays
  private shipSpeedValue!: Phaser.GameObjects.Text;
  private collectionRadiusValue!: Phaser.GameObjects.Text;
  private autoCollectValue!: Phaser.GameObjects.Text;
  
  constructor(scene: Phaser.Scene, uiManager: UIManager, resourceManager: ResourceManager, x: number, y: number) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.resourceManager = resourceManager;
    
    // Create main container
    this.container = this.uiManager.createPanel(x, y, 330, 220, UITheme.BACKGROUND_DARK);
    
    this.createResourcesSection();
    this.createStatsSection();
    
    // Initial update
    this.update();
  }
  
  private createResourcesSection() {
    // Resources section title
    const resourcesTitle = this.uiManager.createText('RESOURCES', UIConstants.FONT_SIZE.MEDIUM, UITheme.TEXT_PRIMARY);
    resourcesTitle.setPosition(UIConstants.PADDING.MEDIUM, UIConstants.PADDING.MEDIUM);
    resourcesTitle.setFontStyle('bold');
    
    // Create resource icons and labels
    const iconSize = 24;
    const startY = resourcesTitle.y + resourcesTitle.height + UIConstants.PADDING.MEDIUM;
    const col1X = UIConstants.PADDING.MEDIUM;
    const col2X = 170;
    
    // Metal resources
    const metalIcon = this.createResourceIcon(col1X, startY, UITheme.METAL);
    const metalLabel = this.uiManager.createText('Metal:', UIConstants.FONT_SIZE.MEDIUM, UITheme.TEXT_SECONDARY);
    metalLabel.setPosition(col1X + iconSize + 8, startY + iconSize/2 - 2);
    this.metalValue = this.uiManager.createText('0', UIConstants.FONT_SIZE.MEDIUM, UITheme.METAL);
    this.metalValue.setPosition(metalLabel.x + metalLabel.width + 8, metalLabel.y);
    
    // Crystal resources
    const crystalIcon = this.createResourceIcon(col1X, startY + iconSize + 8, UITheme.CRYSTAL);
    const crystalLabel = this.uiManager.createText('Crystal:', UIConstants.FONT_SIZE.MEDIUM, UITheme.TEXT_SECONDARY);
    crystalLabel.setPosition(col1X + iconSize + 8, startY + iconSize + 8 + iconSize/2 - 2);
    this.crystalValue = this.uiManager.createText('0', UIConstants.FONT_SIZE.MEDIUM, UITheme.CRYSTAL);
    this.crystalValue.setPosition(crystalLabel.x + crystalLabel.width + 8, crystalLabel.y);
    
    // Metal rate
    const metalRateIcon = this.createRateIcon(col2X, startY, UITheme.METAL);
    const metalRateLabel = this.uiManager.createText('/sec:', UIConstants.FONT_SIZE.SMALL, UITheme.TEXT_SECONDARY);
    metalRateLabel.setPosition(col2X + iconSize + 8, startY + iconSize/2 - 2);
    this.metalRateValue = this.uiManager.createText('0.0', UIConstants.FONT_SIZE.SMALL, UITheme.METAL);
    this.metalRateValue.setPosition(metalRateLabel.x + metalRateLabel.width + 8, metalRateLabel.y);
    
    // Crystal rate
    const crystalRateIcon = this.createRateIcon(col2X, startY + iconSize + 8, UITheme.CRYSTAL);
    const crystalRateLabel = this.uiManager.createText('/sec:', UIConstants.FONT_SIZE.SMALL, UITheme.TEXT_SECONDARY);
    crystalRateLabel.setPosition(col2X + iconSize + 8, startY + iconSize + 8 + iconSize/2 - 2);
    this.crystalRateValue = this.uiManager.createText('0.0', UIConstants.FONT_SIZE.SMALL, UITheme.CRYSTAL);
    this.crystalRateValue.setPosition(crystalRateLabel.x + crystalRateLabel.width + 8, crystalRateLabel.y);
    
    // Add separator line
    const separator = this.scene.add.graphics();
    separator.lineStyle(2, UITheme.BACKGROUND_LIGHT, 0.8);
    separator.beginPath();
    separator.moveTo(UIConstants.PADDING.MEDIUM, startY + iconSize*2 + 24);
    separator.lineTo(330 - UIConstants.PADDING.MEDIUM, startY + iconSize*2 + 24);
    separator.closePath();
    separator.strokePath();
    
    this.container.add([
      resourcesTitle, 
      metalIcon, metalLabel, this.metalValue,
      crystalIcon, crystalLabel, this.crystalValue,
      metalRateIcon, metalRateLabel, this.metalRateValue,
      crystalRateIcon, crystalRateLabel, this.crystalRateValue,
      separator
    ]);
  }
  
  private createStatsSection() {
    // Stats section title
    const statsTitle = this.uiManager.createText('SHIP STATS', UIConstants.FONT_SIZE.MEDIUM, UITheme.TEXT_PRIMARY);
    statsTitle.setPosition(UIConstants.PADDING.MEDIUM, 130);
    statsTitle.setFontStyle('bold');
    
    // Ship speed
    const speedIcon = this.createStatIcon(UIConstants.PADDING.MEDIUM, statsTitle.y + statsTitle.height + UIConstants.PADDING.MEDIUM, 0x3B82F6);
    const speedLabel = this.uiManager.createText('Speed:', UIConstants.FONT_SIZE.SMALL, UITheme.TEXT_SECONDARY);
    speedLabel.setPosition(speedIcon.x + speedIcon.width + 8, speedIcon.y + speedIcon.height/2 - 2);
    this.shipSpeedValue = this.uiManager.createText('200', UIConstants.FONT_SIZE.SMALL, UITheme.TEXT_PRIMARY);
    this.shipSpeedValue.setPosition(160, speedLabel.y);
    
    // Collection radius
    const radiusIcon = this.createStatIcon(UIConstants.PADDING.MEDIUM, speedIcon.y + speedIcon.height + 8, 0x10B981);
    const radiusLabel = this.uiManager.createText('Collection Radius:', UIConstants.FONT_SIZE.SMALL, UITheme.TEXT_SECONDARY);
    radiusLabel.setPosition(radiusIcon.x + radiusIcon.width + 8, radiusIcon.y + radiusIcon.height/2 - 2);
    this.collectionRadiusValue = this.uiManager.createText('0', UIConstants.FONT_SIZE.SMALL, UITheme.TEXT_PRIMARY);
    this.collectionRadiusValue.setPosition(160, radiusLabel.y);
    
    // Auto collect chance
    const autoIcon = this.createStatIcon(UIConstants.PADDING.MEDIUM, radiusIcon.y + radiusIcon.height + 8, 0xF59E0B);
    const autoLabel = this.uiManager.createText('Auto-Collection:', UIConstants.FONT_SIZE.SMALL, UITheme.TEXT_SECONDARY);
    autoLabel.setPosition(autoIcon.x + autoIcon.width + 8, autoIcon.y + autoIcon.height/2 - 2);
    this.autoCollectValue = this.uiManager.createText('0%', UIConstants.FONT_SIZE.SMALL, UITheme.TEXT_PRIMARY);
    this.autoCollectValue.setPosition(160, autoLabel.y);
    
    this.container.add([
      statsTitle,
      speedIcon, speedLabel, this.shipSpeedValue,
      radiusIcon, radiusLabel, this.collectionRadiusValue,
      autoIcon, autoLabel, this.autoCollectValue
    ]);
  }
  
  private createResourceIcon(x: number, y: number, color: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Create hexagon shape for resource icon
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.lineStyle(2, 0xffffff, 0.8);
    
    // Draw hexagon
    const size = 12;
    graphics.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.DegToRad(60 * i - 30);
      const px = Math.cos(angle) * size;
      const py = Math.sin(angle) * size;
      if (i === 0) {
        graphics.moveTo(px, py);
      } else {
        graphics.lineTo(px, py);
      }
    }
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    
    // Add glow effect
    const glowGraphics = this.scene.add.graphics();
    glowGraphics.fillStyle(color, 0.4);
    glowGraphics.fillCircle(0, 0, size + 4);
    
    container.add([glowGraphics, graphics]);
    return container;
  }
  
  private createRateIcon(x: number, y: number, color: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Create circle shape with arrow
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.lineStyle(2, 0xffffff, 0.8);
    
    // Draw circle
    const size = 10;
    graphics.fillCircle(0, 0, size);
    graphics.strokeCircle(0, 0, size);
    
    // Draw arrow (clock-like hand)
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(size * 0.7, -size * 0.7);
    graphics.closePath();
    graphics.strokePath();
    
    container.add(graphics);
    return container;
  }
  
  private createStatIcon(x: number, y: number, color: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Create square shape with diagonal line
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.lineStyle(1, 0xffffff, 0.8);
    
    // Draw square
    const size = 12;
    graphics.fillRect(-size/2, -size/2, size, size);
    graphics.strokeRect(-size/2, -size/2, size, size);
    
    container.add(graphics);
    return container;
  }
  
  update() {
    // Update resource values
    const resources = this.resourceManager.getResources();
    this.metalValue.setText(Math.floor(resources.metal).toString());
    this.crystalValue.setText(Math.floor(resources.crystal).toString());
    
    // Update rate values
    const rates = this.resourceManager.getRates();
    this.metalRateValue.setText(rates.metalRate.toFixed(1));
    this.crystalRateValue.setText(rates.crystalRate.toFixed(1));
    
    // Update player stats
    const stats = this.resourceManager.getPlayerStats();
    this.shipSpeedValue.setText(stats.shipSpeed.toString());
    this.collectionRadiusValue.setText(stats.collectionRadius.toString());
    this.autoCollectValue.setText(`${(stats.autoCollectChance * 100).toFixed(0)}%`);
  }
  
  show() {
    this.container.setVisible(true);
  }
  
  hide() {
    this.container.setVisible(false);
  }
  
  destroy() {
    this.container.destroy();
  }
} 