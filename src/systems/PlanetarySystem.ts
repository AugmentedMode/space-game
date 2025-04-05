import Phaser from 'phaser';
import { Planet, PlanetType, PlanetConfig } from '../objects/Planet';
import { ResourceManager } from './ResourceManager';
import { GameConfig } from '../config/GameConfig';

export class PlanetarySystem {
  private scene: Phaser.Scene;
  private resourceManager: ResourceManager;
  private planets: Planet[] = [];
  private lastResourceCollectionTime: number = 0;
  private resourceCollectionInterval: number = 1000; // 1 second
  
  constructor(scene: Phaser.Scene, resourceManager: ResourceManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;
  }
  
  public initialize(): void {
    // Generate planets based on configuration
    this.generatePlanets();
    
    // Set up callbacks for each planet
    this.planets.forEach(planet => {
      planet.setInteractionCallback(() => this.onPlanetInteraction(planet));
    });
  }
  
  private generatePlanets(): void {
    // Clear existing planets if any
    this.planets.forEach(planet => planet.destroy());
    this.planets = [];
    
    // Generate planets based on predefined configurations
    const planetConfigs = GameConfig.PLANETS || this.getDefaultPlanetConfigs();
    
    planetConfigs.forEach((config: PlanetConfig) => {
      const planet = new Planet(this.scene, config);
      this.planets.push(planet);
    });
  }
  
  private getDefaultPlanetConfigs(): PlanetConfig[] {
    // Default planet configurations if none are set in GameConfig
    const worldSize = GameConfig.WORLD_SIZE;
    
    return [
      {
        id: 'rocky1',
        name: 'Mineralis',
        type: PlanetType.ROCKY,
        size: 80,
        resourceYield: { metal: 2, crystal: 0.5 },
        position: { 
          x: worldSize.width * 0.2, 
          y: worldSize.height * 0.3 
        },
        color: 0xCC9966,
        colonizationCost: { metal: 50, crystal: 20 }
      },
      {
        id: 'icy1',
        name: 'Glacius',
        type: PlanetType.ICY,
        size: 70,
        resourceYield: { metal: 0.5, crystal: 2 },
        position: { 
          x: worldSize.width * 0.8, 
          y: worldSize.height * 0.25 
        },
        color: 0xAADDFF,
        colonizationCost: { metal: 40, crystal: 30 }
      },
      {
        id: 'volcanic1',
        name: 'Ignius',
        type: PlanetType.VOLCANIC,
        size: 90,
        resourceYield: { metal: 3, crystal: 1 },
        position: { 
          x: worldSize.width * 0.3, 
          y: worldSize.height * 0.7 
        },
        color: 0xFF6633,
        colonizationCost: { metal: 80, crystal: 40 }
      },
      {
        id: 'gaseous1',
        name: 'Nebulos',
        type: PlanetType.GASEOUS,
        size: 120,
        resourceYield: { metal: 1, crystal: 3 },
        position: { 
          x: worldSize.width * 0.7, 
          y: worldSize.height * 0.6 
        },
        color: 0xFFCC33,
        colonizationCost: { metal: 60, crystal: 60 }
      },
      {
        id: 'oceanic1',
        name: 'Aquarius',
        type: PlanetType.OCEANIC,
        size: 100,
        resourceYield: { metal: 1.5, crystal: 1.5 },
        position: { 
          x: worldSize.width * 0.5, 
          y: worldSize.height * 0.4 
        },
        color: 0x3399FF,
        colonizationCost: { metal: 50, crystal: 50 }
      }
    ];
  }
  
  public update(time: number, delta: number): void {
    // Collect resources from colonized planets at the set interval
    if (time - this.lastResourceCollectionTime >= this.resourceCollectionInterval) {
      this.collectResourcesFromColonies();
      this.lastResourceCollectionTime = time;
    }
  }
  
  private collectResourcesFromColonies(): void {
    // Get resources from all colonized planets
    this.planets.forEach(planet => {
      if (planet.isColonized) {
        const output = planet.getResourceOutput();
        
        // Add resources to the player's stockpile
        if (output.metal > 0) {
          this.resourceManager.addResource('metal', output.metal);
        }
        
        if (output.crystal > 0) {
          this.resourceManager.addResource('crystal', output.crystal);
        }
      }
    });
  }
  
  private onPlanetInteraction(planet: Planet): void {
    // Show planet details and colonization options
    this.showPlanetDialog(planet);
  }
  
  private showPlanetDialog(planet: Planet): void {
    // Get UI scene for dialog display
    const uiScene = this.scene.scene.get('ui') as any;
    
    if (uiScene && uiScene.showPlanetDialog) {
      uiScene.showPlanetDialog(planet, {
        onColonize: () => this.colonizePlanet(planet),
        onUpgrade: () => this.upgradePlanetColony(planet)
      });
    }
  }
  
  private colonizePlanet(planet: Planet): boolean {
    if (planet.isColonized) {
      return false;
    }
    
    // Check if player has enough resources
    const resources = this.resourceManager.getResources();
    const cost = planet.colonizationCost;
    
    if (resources.metal < cost.metal || resources.crystal < cost.crystal) {
      // Not enough resources
      return false;
    }
    
    // Deduct resources
    this.resourceManager.addResource('metal', -cost.metal);
    this.resourceManager.addResource('crystal', -cost.crystal);
    
    // Colonize the planet
    planet.colonize();
    
    // Show floating text effect
    this.showColonizationEffect(planet);
    
    return true;
  }
  
  private upgradePlanetColony(planet: Planet): boolean {
    if (!planet.isColonized) {
      return false;
    }
    
    // Get upgrade cost
    const upgradeCost = planet.getUpgradeCost();
    
    // Check if player has enough resources
    const resources = this.resourceManager.getResources();
    
    if (resources.metal < upgradeCost.metal || resources.crystal < upgradeCost.crystal) {
      // Not enough resources
      return false;
    }
    
    // Deduct resources
    this.resourceManager.addResource('metal', -upgradeCost.metal);
    this.resourceManager.addResource('crystal', -upgradeCost.crystal);
    
    // Upgrade the colony
    planet.upgradeColony();
    
    // Show floating text effect
    this.showUpgradeEffect(planet);
    
    return true;
  }
  
  private showColonizationEffect(planet: Planet): void {
    // Add visual effect for colonization
    const gameScene = this.scene as any;
    
    if (gameScene.createFloatingText) {
      gameScene.createFloatingText('Planet Colonized!', 0x00ffff, '', 0);
    }
    
    // Add particle effect
    this.createColonizationParticles(planet);
  }
  
  private showUpgradeEffect(planet: Planet): void {
    // Add visual effect for upgrade
    const gameScene = this.scene as any;
    
    if (gameScene.createFloatingText) {
      gameScene.createFloatingText(`Colony Upgraded to Level ${planet.colonyLevel}!`, 0x00ffff, '', 0);
    }
    
    // Add particle effect
    this.createUpgradeParticles(planet);
  }
  
  private createColonizationParticles(planet: Planet): void {
    // Get particle texture key
    const particleKey = 'particle';
    
    // Check if particles exist in the scene
    if (!this.scene.textures.exists(particleKey)) {
      return;
    }
    
    // Create particles to show colonization
    const emitter = this.scene.add.particles(planet.x, planet.y, particleKey, {
      speed: { min: 50, max: 100 },
      scale: { start: 0.2, end: 0 },
      lifespan: 1000,
      blendMode: 'ADD',
      emitting: false
    });
    
    // Explode effect
    emitter.explode(30);
    
    // Auto-destroy after effect completes
    this.scene.time.delayedCall(1500, () => {
      emitter.destroy();
    });
  }
  
  private createUpgradeParticles(planet: Planet): void {
    // Get particle texture key
    const particleKey = 'particle';
    
    // Check if particles exist in the scene
    if (!this.scene.textures.exists(particleKey)) {
      return;
    }
    
    // Create particles to show upgrade
    const emitter = this.scene.add.particles(planet.x, planet.y, particleKey, {
      speed: { min: 30, max: 80 },
      scale: { start: 0.1, end: 0 },
      lifespan: 800,
      blendMode: 'ADD',
      emitting: false,
      tint: 0x00ffff
    });
    
    // Explode effect
    emitter.explode(20);
    
    // Auto-destroy after effect completes
    this.scene.time.delayedCall(1200, () => {
      emitter.destroy();
    });
  }
  
  // Public methods for external access
  
  public getPlanets(): Planet[] {
    return [...this.planets];
  }
  
  public getPlanetById(id: string): Planet | undefined {
    return this.planets.find(planet => planet.id === id);
  }
} 