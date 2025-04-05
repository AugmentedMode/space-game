import Phaser from 'phaser';
import { ResourceManager } from '../systems/ResourceManager';
import { StationUI } from '../ui/StationUI';
import { PlanetDialog } from '../ui/PlanetDialog';
import { AutopilotToggle } from '../ui/AutopilotToggle';
import { Planet } from '../objects/Planet';

export class UIScene extends Phaser.Scene {
  private resourceManager!: ResourceManager;
  private stationUI!: StationUI;
  private planetDialog!: PlanetDialog;
  private autopilotToggle!: AutopilotToggle;
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
      this.planetDialog = new PlanetDialog(this, this.resourceManager);
    } else {
      console.error('Game scene not found, cannot create station UI properly');
      // Create with a fallback empty scene to avoid errors
      this.stationUI = new StationUI(this, this.resourceManager, this);
      this.planetDialog = new PlanetDialog(this, this.resourceManager);
    }

    // Create autopilot toggle button in the top-right corner
    this.autopilotToggle = new AutopilotToggle(
      this, 
      this.resourceManager,
      this.cameras.main.width - 130, 
      10
    );
    
    // Listen for events from game scene
    this.events.on('openStationMenu', () => {
      this.showUI();
    });
    
    // Add keypress handler for ESC key to close UI elements
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.stationUI && this.stationUI.isVisible()) {
        this.hideUI();
      } else if (this.planetDialog) {
        this.planetDialog.hide();
      }
    });
  }
  
  update(time: number, delta: number) {
    // Update station UI if it exists
    if (this.stationUI) {
      this.stationUI.update();
      
      // Check if we need to resize UI based on window size
      if (this.cameras.main.width !== this.game.canvas.width || 
          this.cameras.main.height !== this.game.canvas.height) {
        this.stationUI.resize(this.game.canvas.width, this.game.canvas.height);
      }
    }

    // Update autopilot toggle
    if (this.autopilotToggle) {
      this.autopilotToggle.update();
    }
  }
  
  /**
   * Show the station UI
   * Public method called from other scenes
   */
  public showUI() {
    if (this.stationUI) {
      this.stationUI.show();
    }
  }
  
  /**
   * Hide the station UI
   * Public method called from other scenes
   */
  public hideUI() {
    if (this.stationUI) {
      this.stationUI.hide();
    }
  }
  
  /**
   * Show the planet dialog for a specific planet
   * @param planet The planet to show details for
   * @param callbacks Callback functions for planet actions
   */
  public showPlanetDialog(planet: Planet, callbacks: any) {
    if (this.planetDialog) {
      // Hide station UI if it's showing
      if (this.stationUI && this.stationUI.isVisible()) {
        this.stationUI.hide();
      }
      
      // Show planet dialog
      this.planetDialog.show(planet, callbacks);
    }
  }
} 