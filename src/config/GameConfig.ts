import { AsteroidBeltConfig } from '../systems/AsteroidBeltManager';
import { AsteroidType } from '../objects/Asteroid';

/**
 * Game configuration constants
 * This centralizes all configuration values that might need to be tweaked
 */
export const GameConfig = {
  // World settings
  WORLD_SIZE: { width: 3000, height: 3000 },
  
  // Space station
  STATION_POSITION: { x: 1000, y: 1000 }, // Middle left part of the world
  
  // Player settings
  DEFAULT_ATTACK_RANGE: 200,
  
  // Teleport settings
  TELEPORT_REQUIRED_TIME: 1000, // Hold for 1 second to teleport
  TELEPORT_COOLDOWN_TIME: 5000, // 5 seconds cooldown
  
  // Visuals
  PARALLAX_FACTOR: 0.1,
  STAR_COLORS: [0xffffff, 0xccccff, 0xffcccc, 0xccffcc],
  STAR_COUNT: 100,
  
  // Physics
  ASTEROID_COLLISION_FORCE: 50,
  
  // Asteroid belts
  ASTEROID_BELTS: [
    // Metal-rich belts
    {
      x: 300,
      y: 300,
      width: 800,
      height: 400,
      density: 0.5,
      type: AsteroidType.METAL,
      name: 'Iron Belt Alpha'
    },
    {
      x: 1800,
      y: 1800,
      width: 600,
      height: 900,
      density: 0.3,
      type: AsteroidType.METAL,
      name: 'Iron Belt Beta'
    },
    // Crystal-rich belts
    {
      x: 400,
      y: 1800,
      width: 500,
      height: 500,
      density: 0.2,
      type: AsteroidType.CRYSTAL,
      name: 'Crystal Nebula'
    },
    {
      x: 2000,
      y: 500,
      width: 700,
      height: 300,
      density: 0.15,
      type: AsteroidType.CRYSTAL,
      name: 'Crystal Formation'
    }
  ] as AsteroidBeltConfig[]
}; 