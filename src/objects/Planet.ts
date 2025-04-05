import Phaser from 'phaser';

export enum PlanetType {
  ROCKY = 'rocky',
  ICY = 'icy',
  GASEOUS = 'gaseous',
  VOLCANIC = 'volcanic',
  OCEANIC = 'oceanic'
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
  private planetBody: Phaser.GameObjects.Ellipse;
  private colonyIndicator: Phaser.GameObjects.Ellipse | null = null;
  private nameText: Phaser.GameObjects.Text;
  private interactionZone: Phaser.GameObjects.Ellipse;
  
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
    
    // Create planet body
    this.planetBody = scene.add.ellipse(0, 0, config.size, config.size, config.color);
    this.add(this.planetBody);
    
    // Add visual effects based on planet type
    this.addPlanetTypeEffects(config);
    
    // Add name text
    this.nameText = scene.add.text(0, -(config.size / 2 + 20), config.name, {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.add(this.nameText);
    
    // Add interaction zone (larger than planet for easier clicking)
    const interactionSize = config.size * 1.5;
    this.interactionZone = scene.add.ellipse(0, 0, interactionSize, interactionSize, 0xffffff, 0);
    this.interactionZone.setInteractive();
    this.interactionZone.on('pointerdown', this.onInteract, this);
    this.add(this.interactionZone);
    
    // Add to scene
    scene.add.existing(this);
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
        // Add "continents"
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * (config.size / 4);
          const landSize = (Math.random() * (config.size / 6)) + (config.size / 8);
          
          const continent = this.scene.add.ellipse(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance,
            landSize,
            landSize,
            0x008800
          );
          this.add(continent);
        }
        break;
    }
  }
  
  public onInteract(): void {
    if (this.interactionCallback) {
      this.interactionCallback();
    }
  }
  
  public setInteractionCallback(callback: () => void): void {
    this.interactionCallback = callback;
  }
  
  public colonize(): void {
    if (this.isColonized) {
      return;
    }
    
    this.isColonized = true;
    this.colonyLevel = 1;
    
    // Show colonization visual
    this.showColonyIndicator();
  }
  
  public upgradeColony(): void {
    if (!this.isColonized) {
      return;
    }
    
    this.colonyLevel++;
    
    // Update colony indicator
    this.updateColonyIndicator();
  }
  
  private showColonyIndicator(): void {
    // Remove existing indicator if any
    if (this.colonyIndicator) {
      this.colonyIndicator.destroy();
    }
    
    // Create a pulsing ring around the planet
    const planetSize = this.planetBody.width;
    this.colonyIndicator = this.scene.add.ellipse(
      0, 0,
      planetSize + 20,
      planetSize + 20,
      0x00ffff,
      0.4
    );
    this.add(this.colonyIndicator);
    this.sendToBack(this.colonyIndicator);
    
    // Add pulsing animation
    this.scene.tweens.add({
      targets: this.colonyIndicator,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Update text to show level
    this.updateLevelText();
  }
  
  private updateColonyIndicator(): void {
    // Just update the text, the indicator is already created
    this.updateLevelText();
  }
  
  private updateLevelText(): void {
    // Remove existing level text if any
    const existingText = this.getAll('name', 'levelText');
    existingText.forEach(text => text.destroy());
    
    // Add level text
    const levelText = this.scene.add.text(
      0,
      this.planetBody.height / 2 + 10,
      `Colony Lv.${this.colonyLevel}`,
      {
        fontSize: '14px',
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5);
    levelText.setName('levelText');
    this.add(levelText);
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
} 