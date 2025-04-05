import Phaser from 'phaser';
import { UIManager, UITheme, UIConstants } from '../UIManager';

export class MinimapPanel {
  private scene: Phaser.Scene;
  private uiManager: UIManager;
  public container: Phaser.GameObjects.Container;
  
  private mapSize: number = 180;
  private mapGraphics: Phaser.GameObjects.Graphics;
  private playerMarker: Phaser.GameObjects.Rectangle;
  private stationMarker: Phaser.GameObjects.Rectangle;
  private resourceMarkers: Phaser.GameObjects.Container;
  
  private worldBounds = { width: 0, height: 0 };
  
  constructor(scene: Phaser.Scene, uiManager: UIManager, x: number, y: number) {
    this.scene = scene;
    this.uiManager = uiManager;
    
    // Create main container
    this.container = this.uiManager.createPanel(x, y, this.mapSize + 20, this.mapSize + 40, UITheme.BACKGROUND_DARK);
    
    // Create minimap title
    const title = this.uiManager.createText('RADAR', UIConstants.FONT_SIZE.SMALL, UITheme.TEXT_PRIMARY);
    title.setPosition(this.mapSize / 2 + 10, 12);
    title.setOrigin(0.5, 0.5);
    title.setFontStyle('bold');
    
    // Create map border
    const mapBorder = this.scene.add.rectangle(10, 25, this.mapSize, this.mapSize, 0x000000, 0.3);
    mapBorder.setOrigin(0, 0);
    mapBorder.setStrokeStyle(1, UITheme.ACCENT);
    
    // Create grid lines for the map
    const grid = this.scene.add.graphics();
    grid.lineStyle(1, UITheme.BACKGROUND_LIGHT, 0.2);
    // Draw vertical lines
    for (let i = 0; i <= 4; i++) {
      grid.beginPath();
      grid.moveTo(10 + (i * (this.mapSize / 4)), 25);
      grid.lineTo(10 + (i * (this.mapSize / 4)), 25 + this.mapSize);
      grid.closePath();
      grid.strokePath();
    }
    // Draw horizontal lines
    for (let i = 0; i <= 4; i++) {
      grid.beginPath();
      grid.moveTo(10, 25 + (i * (this.mapSize / 4)));
      grid.lineTo(10 + this.mapSize, 25 + (i * (this.mapSize / 4)));
      grid.closePath();
      grid.strokePath();
    }
    
    // Create radar scan effect
    const radarScan = this.scene.add.graphics();
    this.scene.tweens.add({
      targets: radarScan,
      angle: 360,
      duration: 3000,
      repeat: -1,
      onUpdate: () => {
        radarScan.clear();
        radarScan.lineStyle(2, UITheme.ACCENT, 0.7);
        radarScan.beginPath();
        
        // Convert angle to radians
        const angle = Phaser.Math.DegToRad(radarScan.angle || 0);
        const centerX = 10 + this.mapSize / 2;
        const centerY = 25 + this.mapSize / 2;
        
        // Draw radar scan line
        radarScan.moveTo(centerX, centerY);
        radarScan.lineTo(
          centerX + Math.cos(angle) * (this.mapSize / 2),
          centerY + Math.sin(angle) * (this.mapSize / 2)
        );
        radarScan.closePath();
        radarScan.strokePath();
        
        // Draw fading arc/trail
        radarScan.lineStyle(2, UITheme.ACCENT, 0.2);
        radarScan.beginPath();
        radarScan.arc(
          centerX, centerY,
          this.mapSize / 2 - 2,
          angle - Math.PI / 2,
          angle,
          false
        );
        radarScan.closePath();
        radarScan.strokePath();
      }
    });
    
    // Create map area for points of interest
    this.mapGraphics = this.scene.add.graphics();
    
    // Container for resource markers
    this.resourceMarkers = this.scene.add.container(0, 0);
    
    // Create player marker (small white square)
    this.playerMarker = this.scene.add.rectangle(0, 0, 6, 6, UITheme.TEXT_PRIMARY);
    this.playerMarker.setStrokeStyle(1, UITheme.PRIMARY);
    
    // Create station marker (small blue diamond)
    this.stationMarker = this.scene.add.rectangle(0, 0, 8, 8, UITheme.PRIMARY);
    this.stationMarker.rotation = Math.PI / 4; // 45 degrees rotation for diamond shape
    
    // Pulsing effect for station marker
    this.scene.tweens.add({
      targets: this.stationMarker,
      alpha: 0.6,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    // Add all elements to container
    this.container.add([
      title,
      mapBorder,
      grid,
      radarScan,
      this.mapGraphics,
      this.resourceMarkers,
      this.playerMarker,
      this.stationMarker
    ]);
    
    // Set high depth to keep it on top
    this.container.setDepth(1000);
  }
  
  // Update minimap with latest positions
  update(
    playerPosition: { x: number, y: number },
    stationPosition: { x: number, y: number },
    worldBounds: { width: number, height: number },
    resources: Array<{ x: number, y: number, type: 'metal' | 'crystal' }> = []
  ) {
    this.worldBounds = worldBounds;
    
    // Calculate scale factor from world to minimap
    const scale = this.mapSize / Math.max(worldBounds.width, worldBounds.height);
    
    // Update player marker position
    const playerMapX = 10 + (playerPosition.x * scale) + (this.mapSize / 2) - 3;
    const playerMapY = 25 + (playerPosition.y * scale) + (this.mapSize / 2) - 3;
    this.playerMarker.setPosition(playerMapX, playerMapY);
    
    // Update station marker position
    const stationMapX = 10 + (stationPosition.x * scale) + (this.mapSize / 2) - 4;
    const stationMapY = 25 + (stationPosition.y * scale) + (this.mapSize / 2) - 4;
    this.stationMarker.setPosition(stationMapX, stationMapY);
    
    // Update resource markers
    this.updateResourceMarkers(resources, scale);
  }
  
  private updateResourceMarkers(
    resources: Array<{ x: number, y: number, type: 'metal' | 'crystal' }>,
    scale: number
  ) {
    // Clear old markers
    this.resourceMarkers.removeAll(true);
    
    // Add new markers
    resources.forEach(resource => {
      const color = resource.type === 'metal' ? UITheme.METAL : UITheme.CRYSTAL;
      const size = 4;
      
      const x = 10 + (resource.x * scale) + (this.mapSize / 2) - (size / 2);
      const y = 25 + (resource.y * scale) + (this.mapSize / 2) - (size / 2);
      
      const marker = this.scene.add.rectangle(x, y, size, size, color, 0.8);
      this.resourceMarkers.add(marker);
    });
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