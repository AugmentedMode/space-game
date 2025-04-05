import Phaser from 'phaser';
import { Planet, PlanetType } from '../objects/Planet';
import { ResourceManager } from '../systems/ResourceManager';

interface DialogCallbacks {
  onColonize: () => boolean;
  onUpgrade: () => boolean;
  onClose?: () => void;
}

export class PlanetDialog {
  private scene: Phaser.Scene;
  private resourceManager: ResourceManager;
  private container: Phaser.GameObjects.Container;
  private currentPlanet: Planet | null = null;
  private callbacks: DialogCallbacks | null = null;
  
  constructor(scene: Phaser.Scene, resourceManager: ResourceManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(1000);
    this.container.setVisible(false);
    
    // Setup initial UI (will be populated when shown)
    this.setupUI();
  }
  
  private setupUI(): void {
    // Background panel
    const { width, height } = this.scene.cameras.main;
    const panelWidth = Math.min(width * 0.8, 500);
    const panelHeight = Math.min(height * 0.7, 400);
    
    // Create background with rounded corners
    const background = this.scene.add.graphics();
    background.fillStyle(0x222222, 0.9);
    background.fillRoundedRect(0, 0, panelWidth, panelHeight, 20);
    background.lineStyle(2, 0x4488ff, 1);
    background.strokeRoundedRect(0, 0, panelWidth, panelHeight, 20);
    
    // Close button
    const closeBtn = this.scene.add.text(
      panelWidth - 25, 15, 
      'X', 
      { fontSize: '24px', color: '#ffffff' }
    ).setOrigin(0.5).setInteractive();
    closeBtn.on('pointerdown', () => this.hide());
    
    // Add to container
    this.container.add(background);
    this.container.add(closeBtn);
    
    // Position the container in the center of the screen
    this.container.setPosition(
      width / 2 - panelWidth / 2,
      height / 2 - panelHeight / 2
    );
  }
  
  public show(planet: Planet, callbacks: DialogCallbacks): void {
    this.currentPlanet = planet;
    this.callbacks = callbacks;
    
    // Clear existing content
    this.clearContent();
    
    // Build content for this planet
    this.buildPlanetContent(planet);
    
    // Show the container
    this.container.setVisible(true);
  }
  
  public hide(): void {
    this.container.setVisible(false);
    if (this.callbacks && this.callbacks.onClose) {
      this.callbacks.onClose();
    }
  }
  
  private clearContent(): void {
    // Remove all children except background and close button
    this.container.each((child: Phaser.GameObjects.GameObject, index: number) => {
      if (index >= 2) { // Skip background and close button
        child.destroy();
      }
    });
  }
  
  private buildPlanetContent(planet: Planet): void {
    const { width } = this.scene.cameras.main;
    const panelWidth = Math.min(width * 0.8, 500);
    const centerX = panelWidth / 2;
    
    // Planet name header
    const planetName = this.scene.add.text(
      centerX, 30,
      planet.name,
      { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }
    ).setOrigin(0.5);
    this.container.add(planetName);
    
    // Planet type
    const planetType = this.scene.add.text(
      centerX, 65,
      `Type: ${this.formatPlanetType(planet.type)}`,
      { fontSize: '18px', color: '#aaccff' }
    ).setOrigin(0.5);
    this.container.add(planetType);
    
    // Planet icon/visualization
    const planetVisual = this.createPlanetVisual(planet, centerX, 130);
    this.container.add(planetVisual);
    
    // Colonization status
    let statusText = planet.isColonized 
      ? `Colony Level: ${planet.colonyLevel}` 
      : 'Not Colonized';
    
    const statusColor = planet.isColonized ? '#00ffcc' : '#ffaa44';
    
    const colonyStatus = this.scene.add.text(
      centerX, 195,
      statusText,
      { fontSize: '20px', color: statusColor, fontStyle: 'bold' }
    ).setOrigin(0.5);
    this.container.add(colonyStatus);
    
    // Resource production
    if (planet.isColonized) {
      const output = planet.getResourceOutput();
      
      // Production header
      const productionHeader = this.scene.add.text(
        centerX, 230,
        'Resource Production:',
        { fontSize: '18px', color: '#ffffff' }
      ).setOrigin(0.5);
      this.container.add(productionHeader);
      
      // Metal production
      const metalText = this.scene.add.text(
        centerX - 60, 255,
        `Metal: ${output.metal.toFixed(1)}/s`,
        { fontSize: '16px', color: '#cccccc' }
      ).setOrigin(0.5);
      this.container.add(metalText);
      
      // Crystal production
      const crystalText = this.scene.add.text(
        centerX + 60, 255,
        `Crystal: ${output.crystal.toFixed(1)}/s`,
        { fontSize: '16px', color: '#cccccc' }
      ).setOrigin(0.5);
      this.container.add(crystalText);
      
      // Upgrade section
      this.addUpgradeSection(planet, centerX, 300);
    } else {
      // Potential production if colonized
      const potentialOutput = planet.getResourceOutput();
      potentialOutput.metal = planet.resourceYield.metal;
      potentialOutput.crystal = planet.resourceYield.crystal;
      
      // Production header
      const potentialHeader = this.scene.add.text(
        centerX, 230,
        'Potential Production:',
        { fontSize: '18px', color: '#aaaaaa' }
      ).setOrigin(0.5);
      this.container.add(potentialHeader);
      
      // Metal production
      const metalText = this.scene.add.text(
        centerX - 60, 255,
        `Metal: ${potentialOutput.metal.toFixed(1)}/s`,
        { fontSize: '16px', color: '#aaaaaa' }
      ).setOrigin(0.5);
      this.container.add(metalText);
      
      // Crystal production
      const crystalText = this.scene.add.text(
        centerX + 60, 255,
        `Crystal: ${potentialOutput.crystal.toFixed(1)}/s`,
        { fontSize: '16px', color: '#aaaaaa' }
      ).setOrigin(0.5);
      this.container.add(crystalText);
      
      // Colonization section
      this.addColonizationSection(planet, centerX, 300);
    }
  }
  
  private createPlanetVisual(planet: Planet, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Create a simplified visual of the planet
    let color = 0xaaaaaa;
    
    switch (planet.type) {
      case PlanetType.ROCKY:
        color = 0xCC9966;
        break;
      case PlanetType.ICY:
        color = 0xAADDFF;
        break;
      case PlanetType.GASEOUS:
        color = 0xFFCC33;
        break;
      case PlanetType.VOLCANIC:
        color = 0xFF6633;
        break;
      case PlanetType.OCEANIC:
        color = 0x3399FF;
        break;
    }
    
    // Create planet orb
    const planetOrb = this.scene.add.circle(0, 0, 40, color);
    container.add(planetOrb);
    
    // Add type-specific details
    switch (planet.type) {
      case PlanetType.ROCKY:
        // Add craters
        for (let i = 0; i < 4; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 25;
          const size = Math.random() * 8 + 4;
          const crater = this.scene.add.circle(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance,
            size,
            color - 0x222222
          );
          container.add(crater);
        }
        break;
        
      case PlanetType.GASEOUS:
        // Add ring
        const ring = this.scene.add.ellipse(0, 0, 90, 20, color + 0x111111, 0.6);
        container.add(ring);
        container.sendToBack(ring);
        break;
        
      case PlanetType.VOLCANIC:
        // Add lava spots
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 20;
          const size = Math.random() * 6 + 3;
          const spot = this.scene.add.circle(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance,
            size,
            0xff3300
          );
          container.add(spot);
        }
        break;
        
      case PlanetType.OCEANIC:
        // Add land masses
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 20;
          const size = Math.random() * 10 + 5;
          const land = this.scene.add.circle(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance,
            size,
            0x008800
          );
          container.add(land);
        }
        break;
    }
    
    // Add colony indicator if colonized
    if (planet.isColonized) {
      const colonyRing = this.scene.add.circle(0, 0, 48, 0x00ffff, 0.3);
      container.add(colonyRing);
      container.sendToBack(colonyRing);
    }
    
    return container;
  }
  
  private addColonizationSection(planet: Planet, centerX: number, y: number): void {
    // Colonization cost header
    const costHeader = this.scene.add.text(
      centerX, y,
      'Colonization Cost:',
      { fontSize: '18px', color: '#ffffff' }
    ).setOrigin(0.5);
    this.container.add(costHeader);
    
    // Cost items
    const metalCost = this.scene.add.text(
      centerX - 60, y + 25,
      `Metal: ${planet.colonizationCost.metal}`,
      { fontSize: '16px', color: '#cccccc' }
    ).setOrigin(0.5);
    this.container.add(metalCost);
    
    const crystalCost = this.scene.add.text(
      centerX + 60, y + 25,
      `Crystal: ${planet.colonizationCost.crystal}`,
      { fontSize: '16px', color: '#cccccc' }
    ).setOrigin(0.5);
    this.container.add(crystalCost);
    
    // Colonize button
    const canAfford = this.checkCanAfford(planet.colonizationCost);
    
    // Create button background
    const btnWidth = 160;
    const btnHeight = 40;
    const btnColor = canAfford ? 0x4488ff : 0x666666;
    
    const colonizeBtnBg = this.scene.add.graphics();
    colonizeBtnBg.fillStyle(btnColor, 1);
    colonizeBtnBg.fillRoundedRect(centerX - btnWidth / 2, y + 50, btnWidth, btnHeight, 10);
    
    // Button text
    const btnText = this.scene.add.text(
      centerX, y + 70,
      'Colonize',
      { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }
    ).setOrigin(0.5);
    
    // Make interactive
    const btnZone = this.scene.add.zone(
      centerX, y + 70,
      btnWidth, btnHeight
    ).setOrigin(0.5).setInteractive();
    
    btnZone.on('pointerdown', () => {
      if (canAfford && this.callbacks && this.callbacks.onColonize) {
        const success = this.callbacks.onColonize();
        if (success) {
          this.refreshContent();
        }
      }
    });
    
    // Add all elements to container
    this.container.add(colonizeBtnBg);
    this.container.add(btnText);
    this.container.add(btnZone);
  }
  
  private addUpgradeSection(planet: Planet, centerX: number, y: number): void {
    // Get upgrade cost
    const upgradeCost = planet.getUpgradeCost();
    
    // Upgrade cost header
    const costHeader = this.scene.add.text(
      centerX, y,
      'Upgrade Cost:',
      { fontSize: '18px', color: '#ffffff' }
    ).setOrigin(0.5);
    this.container.add(costHeader);
    
    // Cost items
    const metalCost = this.scene.add.text(
      centerX - 60, y + 25,
      `Metal: ${upgradeCost.metal}`,
      { fontSize: '16px', color: '#cccccc' }
    ).setOrigin(0.5);
    this.container.add(metalCost);
    
    const crystalCost = this.scene.add.text(
      centerX + 60, y + 25,
      `Crystal: ${upgradeCost.crystal}`,
      { fontSize: '16px', color: '#cccccc' }
    ).setOrigin(0.5);
    this.container.add(crystalCost);
    
    // Next level preview
    const nextLevelPreview = this.scene.add.text(
      centerX, y + 50,
      `Next Level Production:`,
      { fontSize: '16px', color: '#aaddff' }
    ).setOrigin(0.5);
    this.container.add(nextLevelPreview);
    
    const nextLevelOutput = {
      metal: planet.resourceYield.metal * (planet.colonyLevel + 1),
      crystal: planet.resourceYield.crystal * (planet.colonyLevel + 1)
    };
    
    const nextLevelMetal = this.scene.add.text(
      centerX - 60, y + 70,
      `Metal: ${nextLevelOutput.metal.toFixed(1)}/s`,
      { fontSize: '14px', color: '#aaddff' }
    ).setOrigin(0.5);
    this.container.add(nextLevelMetal);
    
    const nextLevelCrystal = this.scene.add.text(
      centerX + 60, y + 70,
      `Crystal: ${nextLevelOutput.crystal.toFixed(1)}/s`,
      { fontSize: '14px', color: '#aaddff' }
    ).setOrigin(0.5);
    this.container.add(nextLevelCrystal);
    
    // Upgrade button
    const canAfford = this.checkCanAfford(upgradeCost);
    
    // Create button background
    const btnWidth = 160;
    const btnHeight = 40;
    const btnColor = canAfford ? 0x44dd88 : 0x666666;
    
    const upgradeBtnBg = this.scene.add.graphics();
    upgradeBtnBg.fillStyle(btnColor, 1);
    upgradeBtnBg.fillRoundedRect(centerX - btnWidth / 2, y + 95, btnWidth, btnHeight, 10);
    
    // Button text
    const btnText = this.scene.add.text(
      centerX, y + 115,
      'Upgrade Colony',
      { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }
    ).setOrigin(0.5);
    
    // Make interactive
    const btnZone = this.scene.add.zone(
      centerX, y + 115,
      btnWidth, btnHeight
    ).setOrigin(0.5).setInteractive();
    
    btnZone.on('pointerdown', () => {
      if (canAfford && this.callbacks && this.callbacks.onUpgrade) {
        const success = this.callbacks.onUpgrade();
        if (success) {
          this.refreshContent();
        }
      }
    });
    
    // Add all elements to container
    this.container.add(upgradeBtnBg);
    this.container.add(btnText);
    this.container.add(btnZone);
  }
  
  private refreshContent(): void {
    if (this.currentPlanet) {
      this.clearContent();
      this.buildPlanetContent(this.currentPlanet);
    }
  }
  
  private checkCanAfford(cost: { metal: number, crystal: number }): boolean {
    const resources = this.resourceManager.getResources();
    return resources.metal >= cost.metal && resources.crystal >= cost.crystal;
  }
  
  private formatPlanetType(type: PlanetType): string {
    // Convert enum value to a nice display string
    switch (type) {
      case PlanetType.ROCKY:
        return 'Rocky';
      case PlanetType.ICY:
        return 'Icy';
      case PlanetType.GASEOUS:
        return 'Gas Giant';
      case PlanetType.VOLCANIC:
        return 'Volcanic';
      case PlanetType.OCEANIC:
        return 'Oceanic';
      default:
        return 'Unknown';
    }
  }
} 