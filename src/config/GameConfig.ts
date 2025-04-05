import { AsteroidBeltConfig } from '../systems/AsteroidBeltManager';
import { AsteroidType } from '../objects/Asteroid';
import { PlanetConfig, PlanetType } from '../objects/Planet';

/**
 * Game configuration constants
 * This centralizes all configuration values that might need to be tweaked
 */
export const GameConfig = {
  // World settings
  WORLD_SIZE: { width: 10000, height: 10000 },
  
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
  ] as AsteroidBeltConfig[],
  
  // Planets
  PLANETS: [
    {
      id: 'rocky1',
      name: 'Mineralis',
      type: PlanetType.ROCKY,
      size: 80,
      resourceYield: { metal: 2, crystal: 0.5 },
      position: { x: 2500, y: 3000 },
      color: 0xCC9966,
      colonizationCost: { metal: 50, crystal: 20 }
    },
    {
      id: 'icy1',
      name: 'Glacius',
      type: PlanetType.ICY,
      size: 70,
      resourceYield: { metal: 0.5, crystal: 2 },
      position: { x: 8000, y: 2500 },
      color: 0xAADDFF,
      colonizationCost: { metal: 40, crystal: 30 }
    },
    {
      id: 'volcanic1',
      name: 'Ignius',
      type: PlanetType.VOLCANIC,
      size: 90,
      resourceYield: { metal: 3, crystal: 1 },
      position: { x: 3000, y: 7000 },
      color: 0xFF6633,
      colonizationCost: { metal: 80, crystal: 40 }
    },
    {
      id: 'gaseous1',
      name: 'Nebulos',
      type: PlanetType.GASEOUS,
      size: 120,
      resourceYield: { metal: 1, crystal: 3 },
      position: { x: 7000, y: 6000 },
      color: 0xFFCC33,
      colonizationCost: { metal: 60, crystal: 60 }
    },
    {
      id: 'oceanic1',
      name: 'Aquarius',
      type: PlanetType.OCEANIC,
      size: 100,
      resourceYield: { metal: 1.5, crystal: 1.5 },
      position: { x: 1500 , y: 1550 },
      color: 0x3399FF,
      colonizationCost: { metal: 50, crystal: 50 }
    }
  ] as PlanetConfig[]
}; 