import Phaser from 'phaser';
import { ResourceManager } from '../systems/ResourceManager';
import { StationUI } from '../ui/StationUI';

export class UIScene extends Phaser.Scene {
  private resourceManager!: ResourceManager;
  private stationUI!: StationUI;
  private gameScene: Phaser.Scene | null = null;
  
  constructor() {
    super({ key: 'ui', active: false });
  }
  
  init(data: { resourceManager: ResourceManager }) {
    this.resourceManager = data.resourceManager;
    
    // Get reference to the game scene
    this.gameScene = this.scene.get('game');
  }
  
  create() {
    // Create station UI with appropriate null check
    if (this.gameScene) {
      this.stationUI = new StationUI(this, this.resourceManager, this.gameScene);
    } else {
      console.error('Game scene not found, cannot create station UI properly');
      // Create with a fallback empty scene to avoid errors
      this.stationUI = new StationUI(this, this.resourceManager, this);
    }
    
    // Listen for events from game scene
    this.events.on('openStationMenu', () => {
      this.showUI();
    });
    
    // Add keypress handler for ESC key to close the UI
    this.input.keyboard.on('keydown-ESC', () => {
      this.hideUI();
    });
  }
  
  update(time: number, delta: number) {
    // Update station UI if it exists
    if (this.stationUI) {
      this.stationUI.update();
    }
  }
  
  /**
   * Show the UI
   * Public method called from other scenes
   */
  public showUI() {
    if (this.stationUI) {
      this.stationUI.show();
    }
  }
  
  /**
   * Hide the UI
   * Public method called from other scenes
   */
  public hideUI() {
    if (this.stationUI) {
      this.stationUI.hide();
    }
  }
} 