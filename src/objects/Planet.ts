import Phaser from 'phaser';

export enum PlanetType {
  ROCKY = 'rocky',
  ICY = 'icy',
  GASEOUS = 'gaseous',
  VOLCANIC = 'volcanic',
  OCEANIC = 'oceanic',
  TERRAN = 'terran'
}

export interface PlanetResources {
  metal: number;
  crystal: number;
}

export interface PlanetConfig {
  id: string;
  name: string;
  type: PlanetType;
  size: number;
  resourceYield: PlanetResources;
  position: { x: number, y: number };
  color: number;
  colonizationCost: PlanetResources;
}

export class Planet extends Phaser.GameObjects.Container {
  private planetBody: Phaser.GameObjects.Sprite | Phaser.GameObjects.Ellipse;
  private colonyIndicator: Phaser.GameObjects.Ellipse | null = null;
  private nameText: Phaser.GameObjects.Text;
  private interactionZone: Phaser.GameObjects.Ellipse;
  private interactionText: Phaser.GameObjects.Text;
  private oKey!: Phaser.Input.Keyboard.Key;
  private playerInRange: boolean = false;
  private interactionRadius: number;
  private playerShip: Phaser.Physics.Arcade.Sprite | null = null;
  
  public id: string;
  public name: string;
  public type: PlanetType;
  public resourceYield: PlanetResources;
  public isColonized: boolean = false;
  public colonyLevel: number = 0;
  public colonizationCost: PlanetResources;
  
  private interactionCallback: (() => void) | null = null;
  
  constructor(scene: Phaser.Scene, config: PlanetConfig) {  
    super(scene, config.position.x, config.position.y);
    
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.resourceYield = { ...config.resourceYield };
    this.colonizationCost = { ...config.colonizationCost };
    
    // Set interaction radius based on planet size
    this.interactionRadius = config.size * 2; // Twice the planet size
    
    // Create planet body - check if it's a Terran type to use image
    if (this.type === PlanetType.TERRAN) {
      // Make sure this texture is loaded in the LoadingScene
      this.planetBody = scene.add.sprite(0, 0, 'Terran');
      this.planetBody.setDisplaySize(config.size, config.size);
    } else {
      // Create ellipse for other planet types
      this.planetBody = scene.add.ellipse(0, 0, config.size, config.size, config.color);
      
      // Add visual effects based on planet type
      this.addPlanetTypeEffects(config);
    }
    
    this.add(this.planetBody);
    
    // Add name text
    this.nameText = scene.add.text(0, -(config.size / 2 + 20), config.name, {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.add(this.nameText);
    
    // Add interaction text
    this.interactionText = scene.add.text(
      0, 
      config.size / 2 + 20, 
      'Press O to visit planet surface',
      { 
        fontSize: '14px', 
        color: '#ffffff', 
        backgroundColor: '#000000',
        padding: { x: 5, y: 3 }
      }
    ).setOrigin(0.5);
    this.interactionText.setVisible(false);
    this.add(this.interactionText);
    
    // Add interaction zone (larger than planet for easier clicking)
    const interactionSize = config.size * 1.5;
    this.interactionZone = scene.add.ellipse(0, 0, interactionSize, interactionSize, 0xffffff, 0);
    this.interactionZone.setInteractive();
    this.interactionZone.on('pointerdown', this.onInteract, this);
    
    this.add(this.interactionZone);
    
    // Setup keyboard interaction
    this.setupKeyboardInteraction();
    
    // Get reference to player ship - we'll find it in the scene in setupShipReference
    this.setupShipReference();
    
    // Add to scene
    scene.add.existing(this);
    
    // Add update event to check ship distance
    this.scene.events.on('update', this.checkShipProximity, this);
  }
  
  private setupShipReference() {
    // We'll try to find the ship in the scene - assuming it's accessible via getPlayerShip
    this.scene.events.once('update', () => {
      // Find ship reference from the GameScene
      const gameScene = this.scene as any;
      if (gameScene && typeof gameScene.getPlayerShip === 'function') {
        this.playerShip = gameScene.getPlayerShip();
      }
    });
  }
  
  private checkShipProximity = () => {
    if (!this.playerShip) return;
    
    // Calculate distance between ship and planet
    const distance = Phaser.Math.Distance.Between(
      this.playerShip.x, this.playerShip.y,
      this.x, this.y
    );
    
    // Check if ship is within interaction radius
    const wasInRange = this.playerInRange;
    this.playerInRange = distance <= this.interactionRadius;
    
    // Show/hide interaction text based on range
    if (this.playerInRange !== wasInRange) {
      this.interactionText.setVisible(this.playerInRange);
    }
  }
  
  private setupKeyboardInteraction() {
    if (!this.scene || !this.scene.input || !this.scene.input.keyboard) {
      console.error('Cannot setup keyboard for planet: scene or input not available');
      return;
    }
    
    // Set up O key for entering the planet
    this.oKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    
    // Check for key presses in update
    this.scene.events.on('update', this.checkKeyPress, this);
  }
  
  private checkKeyPress = () => {
    // Only respond to O key if player is in range and key was just pressed (not held)
    if (this.playerInRange && Phaser.Input.Keyboard.JustDown(this.oKey)) {
      this.enterPlanetSurface();
    }
  }
  
  private onInteract = () => {
    // Show colonization options or other UI
    if (this.interactionCallback) {
      this.interactionCallback();
    }
  }
  
  private addPlanetTypeEffects(config: PlanetConfig): void {
    // Add visual effects based on planet type
    switch (this.type) {
      case PlanetType.ROCKY:
        // Add some surface texture
        for (let i = 0; i < 6; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * (config.size / 3);
          const craterSize = (Math.random() * (config.size / 8)) + (config.size / 12);
          
          const crater = this.scene.add.ellipse(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance,
            craterSize,
            craterSize,
            config.color - 0x222222
          );
          this.add(crater);
        }
        break;
        
      case PlanetType.ICY:
        // Add glimmer effect
        const glimmer = this.scene.add.ellipse(
          config.size / 5,
          -config.size / 5,
          config.size / 6,
          config.size / 6,
          0xffffff,
          0.7
        );
        this.add(glimmer);
        break;
        
      case PlanetType.GASEOUS:
        // Add rings like Saturn
        const ring = this.scene.add.ellipse(
          0, 0,
          config.size * 1.8,
          config.size / 4,
          config.color + 0x222222,
          0.6
        );
        this.add(ring);
        this.sendToBack(ring);
        break;
        
      case PlanetType.VOLCANIC:
        // Add lava spots
        for (let i = 0; i < 4; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * (config.size / 3);
          const spotSize = (Math.random() * (config.size / 10)) + (config.size / 15);
          
          const lavaSpot = this.scene.add.ellipse(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance,
            spotSize,
            spotSize,
            0xff3300
          );
          this.add(lavaSpot);
        }
        break;
      
      case PlanetType.OCEANIC:
        // Add water highlights
        const highlight1 = this.scene.add.ellipse(
          config.size / 6,
          -config.size / 6,
          config.size / 4,
          config.size / 8,
          0x66ccff,
          0.5
        );
        this.add(highlight1);
        
        // Add landmass
        const landSize = config.size / 3;
        const landX = -config.size / 6;
        const landY = config.size / 8;
        const land = this.scene.add.ellipse(
          landX, landY,
          landSize, landSize,
          0x00aa00,
          0.8
        );
        this.add(land);
        break;
    }
  }
  
  private enterPlanetSurface() {
    // Start the planet surface scene via transition
    this.scene.scene.start('loading-transition', { 
      nextScene: 'planet-surface',
      planetType: this.type,
      planetName: this.name
    });
  }
  
  // Set a callback to run when planet is clicked
  public setInteractionCallback(callback: () => void): void {
    this.interactionCallback = callback;
  }
  
  // Add a colony indicator to show the planet is colonized
  public setColonized(colonized: boolean, level: number = 1): void {
    this.isColonized = colonized;
    this.colonyLevel = level;
    
    // Remove existing indicator if present
    if (this.colonyIndicator) {
      this.colonyIndicator.destroy();
      this.colonyIndicator = null;
    }
    
    if (colonized) {
      // Add a glowing ring around the planet
      this.colonyIndicator = this.scene.add.ellipse(
        0, 0,
        this.planetBody.width + 15,
        this.planetBody.height + 15,
        0x00ffff,
        0.3
      );
      this.add(this.colonyIndicator);
      this.sendToBack(this.colonyIndicator);
    }
  }
  
  // Upgrade the colony level
  public upgradeColony(): boolean {
    if (this.isColonized) {
      this.colonyLevel += 1;
      return true;
    }
    return false;
  }
  
  // Get current resource output based on level
  public getResourceOutput(): PlanetResources {
    if (!this.isColonized) {
      return { metal: 0, crystal: 0 };
    }
    
    // Resources scale with colony level
    return {
      metal: this.resourceYield.metal * this.colonyLevel,
      crystal: this.resourceYield.crystal * this.colonyLevel
    };
  }
  
  // Calculate upgrade cost based on current level
  public getUpgradeCost(): PlanetResources {
    // Each level costs more than the last
    const multiplier = Math.pow(2, this.colonyLevel);
    return {
      metal: this.colonizationCost.metal * multiplier,
      crystal: this.colonizationCost.crystal * multiplier
    };
  }
  
  // Cleanup when destroyed
  destroy(fromScene?: boolean) {
    if (this.scene && this.scene.events) {
      this.scene.events.off('update', this.checkKeyPress, this);
      this.scene.events.off('update', this.checkShipProximity, this);
    }
    super.destroy(fromScene);
  }
} 