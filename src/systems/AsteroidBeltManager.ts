import Phaser from 'phaser';
import { Asteroid, AsteroidType } from '../objects/Asteroid';

export interface AsteroidBeltConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  density: number; // Number of asteroids per unit area
  type: AsteroidType; // Primary type of asteroid in this belt
  name: string; // Name for the belt (like "Iron Belt", "Crystal Nebula", etc.)
}

export class AsteroidBeltManager {
  private scene: Phaser.Scene;
  private asteroidBelts: Map<string, AsteroidBeltConfig>;
  private asteroids: Phaser.GameObjects.Group;
  private minDistance: number = 100; // Minimum distance between asteroids
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.asteroidBelts = new Map<string, AsteroidBeltConfig>();
    this.asteroids = scene.add.group({
      classType: Asteroid,
      runChildUpdate: true
    });
  }
  
  addBelt(config: AsteroidBeltConfig): void {
    this.asteroidBelts.set(config.name, config);
    this.populateBelt(config);
  }
  
  private populateBelt(config: AsteroidBeltConfig): void {
    // Calculate number of asteroids based on area and density
    const area = config.width * config.height;
    const numAsteroids = Math.floor(area * config.density / 100000); // Adjust as needed
    
    for (let i = 0; i < numAsteroids; i++) {
      // Generate random position within the belt area
      const x = Phaser.Math.Between(config.x, config.x + config.width);
      const y = Phaser.Math.Between(config.y, config.y + config.height);
      
      // Don't place asteroids too close to each other
      if (this.isTooCloseToOtherAsteroids(x, y)) {
        continue;
      }
      
      // Determine asteroid type (80% chance of belt's primary type, 20% chance of other type)
      const type = Math.random() < 0.8 
        ? config.type 
        : (config.type === AsteroidType.METAL ? AsteroidType.CRYSTAL : AsteroidType.METAL);
      
      // Create asteroid and add to group
      const asteroid = new Asteroid(this.scene, x, y, type);
      this.asteroids.add(asteroid);
    }
  }
  
  private isTooCloseToOtherAsteroids(x: number, y: number): boolean {
    let tooClose = false;
    this.asteroids.getChildren().forEach((asteroid: any) => {
      const distance = Phaser.Math.Distance.Between(x, y, asteroid.x, asteroid.y);
      if (distance < this.minDistance) {
        tooClose = true;
      }
    });
    return tooClose;
  }
  
  getAsteroids(): Phaser.GameObjects.Group {
    return this.asteroids;
  }
  
  update(): void {
    // This could handle respawning asteroids over time
    // or other dynamic behaviors for the asteroid belts
  }
  
  getBeltAt(x: number, y: number): AsteroidBeltConfig | null {
    for (const [_, belt] of this.asteroidBelts) {
      if (
        x >= belt.x && 
        x <= belt.x + belt.width &&
        y >= belt.y && 
        y <= belt.y + belt.height
      ) {
        return belt;
      }
    }
    return null;
  }
  
  // Add visual indicators for the belt regions (for debugging or UI)
  createBeltVisuals(): void {
    for (const [_, belt] of this.asteroidBelts) {
      // Create a zone rectangle with a stroke to visualize the belt
      const graphics = this.scene.add.graphics();
      graphics.lineStyle(2, 0xffff00, 0.3);
      graphics.strokeRect(belt.x, belt.y, belt.width, belt.height);
      
      // Add belt name
      this.scene.add.text(
        belt.x + belt.width / 2,
        belt.y - 20,
        belt.name,
        { fontSize: '16px', color: '#ffffff' }
      ).setOrigin(0.5);
    }
  }
} 