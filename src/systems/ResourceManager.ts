import Phaser from 'phaser';

export interface Resources {
  metal: number;
  crystal: number;
}

export interface ResourceRates {
  metalRate: number;
  crystalRate: number;
}

export interface PlayerStats {
  shipSpeed: number;
  collectionRadius: number;
  autoCollectChance: number;
  miningSpeed: number;
  miningPower: number;
}

export interface ShipUpgrade {
  id: string;
  name: string;
  description: string;
  cost: Resources;
  effect: (resources: Resources, rates: ResourceRates, playerStats?: PlayerStats) => void;
  purchased: boolean;
  tier: number;
  requires?: string;
}

export class ResourceManager {
  private resources: Resources = {
    metal: 0,
    crystal: 0
  };

  private rates: ResourceRates = {
    metalRate: 0.5, // per second
    crystalRate: 0.2  // per second
  };
  
  private playerStats: PlayerStats = {
    shipSpeed: 200,
    collectionRadius: 0,
    autoCollectChance: 0,
    miningSpeed: 1,
    miningPower: 1
  };

  private upgrades: ShipUpgrade[] = [
    // Resource Collection - Tier 1
    {
      id: 'mining_laser',
      name: 'Basic Mining Laser',
      description: 'Improves metal collection rate by 0.5/s',
      cost: { metal: 10, crystal: 5 },
      effect: (_resources, rates) => {
        rates.metalRate += 0.5;
      },
      purchased: false,
      tier: 1
    },
    {
      id: 'crystal_scanner',
      name: 'Basic Crystal Scanner',
      description: 'Improves crystal collection rate by 0.3/s',
      cost: { metal: 15, crystal: 8 },
      effect: (_resources, rates) => {
        rates.crystalRate += 0.3;
      },
      purchased: false,
      tier: 1
    },
    
    // Mining - Tier 1
    {
      id: 'asteroid_drill',
      name: 'Asteroid Drill',
      description: 'Increases mining power by 1, breaking asteroids faster',
      cost: { metal: 20, crystal: 10 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.miningPower += 1;
      },
      purchased: false,
      tier: 1
    },
    {
      id: 'mining_efficiency',
      name: 'Mining Efficiency',
      description: 'Increases mining speed by 50%',
      cost: { metal: 25, crystal: 15 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.miningSpeed += 0.5;
      },
      purchased: false,
      tier: 1
    },
    
    // Ship Improvements - Tier 1
    {
      id: 'engine_boost',
      name: 'Engine Boost',
      description: 'Increases ship speed by 50 units',
      cost: { metal: 20, crystal: 10 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.shipSpeed += 50;
      },
      purchased: false,
      tier: 1
    },
    {
      id: 'cargo_bay',
      name: 'Expanded Cargo Bay',
      description: 'Adds 20 metal and 10 crystal instantly',
      cost: { metal: 25, crystal: 15 },
      effect: (resources, _rates) => {
        resources.metal += 20;
        resources.crystal += 10;
      },
      purchased: false,
      tier: 1
    },
    
    // Resource Collection - Tier 2
    {
      id: 'advanced_mining',
      name: 'Advanced Mining System',
      description: 'Doubles your metal collection rate',
      cost: { metal: 50, crystal: 30 },
      effect: (_resources, rates) => {
        rates.metalRate *= 2;
      },
      purchased: false,
      tier: 2,
      requires: 'mining_laser'
    },
    {
      id: 'crystal_refinery',
      name: 'Crystal Refinery',
      description: 'Doubles your crystal collection rate',
      cost: { metal: 75, crystal: 45 },
      effect: (_resources, rates) => {
        rates.crystalRate *= 2;
      },
      purchased: false,
      tier: 2,
      requires: 'crystal_scanner'
    },
    
    // Mining - Tier 2
    {
      id: 'heavy_drill',
      name: 'Heavy Duty Drill',
      description: 'Doubles mining power, making asteroids break faster',
      cost: { metal: 65, crystal: 35 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.miningPower *= 2;
      },
      purchased: false,
      tier: 2,
      requires: 'asteroid_drill'
    },
    {
      id: 'beam_focus',
      name: 'Mining Beam Focus',
      description: 'Increases mining speed by 100%',
      cost: { metal: 70, crystal: 40 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.miningSpeed += 1;
      },
      purchased: false,
      tier: 2,
      requires: 'mining_efficiency'
    },
    
    // Ship Improvements - Tier 2
    {
      id: 'collection_field',
      name: 'Magnetic Collection Field',
      description: 'Resources within 50 units are automatically collected',
      cost: { metal: 60, crystal: 40 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.collectionRadius = 50;
      },
      purchased: false,
      tier: 2,
      requires: 'engine_boost'
    },
    {
      id: 'fusion_drive',
      name: 'Fusion Drive',
      description: 'Increases ship speed by another 100 units',
      cost: { metal: 80, crystal: 50 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.shipSpeed += 100;
      },
      purchased: false,
      tier: 2,
      requires: 'engine_boost'
    },
    
    // Resource Collection - Tier 3
    {
      id: 'quantum_mining',
      name: 'Quantum Mining Array',
      description: 'Triples metal collection rate',
      cost: { metal: 200, crystal: 120 },
      effect: (_resources, rates) => {
        rates.metalRate *= 3;
      },
      purchased: false,
      tier: 3,
      requires: 'advanced_mining'
    },
    {
      id: 'crystal_synthesizer',
      name: 'Crystal Synthesizer',
      description: 'Converts excess metal to crystal: +75% crystal rate',
      cost: { metal: 150, crystal: 100 },
      effect: (_resources, rates) => {
        rates.crystalRate += rates.metalRate * 0.75;
      },
      purchased: false,
      tier: 3,
      requires: 'crystal_refinery'
    },
    
    // Mining - Tier 3
    {
      id: 'asteroid_disruptor',
      name: 'Asteroid Disruptor',
      description: 'Mining instantly shatters small asteroids and triples mining power',
      cost: { metal: 180, crystal: 150 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.miningPower *= 3;
      },
      purchased: false,
      tier: 3,
      requires: 'heavy_drill'
    },
    {
      id: 'multi_beam',
      name: 'Multi-Beam Mining System',
      description: 'Fires multiple beams at once, tripling mining speed',
      cost: { metal: 220, crystal: 180 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.miningSpeed *= 3;
      },
      purchased: false,
      tier: 3,
      requires: 'beam_focus'
    },
    
    // Ship Improvements - Tier 3
    {
      id: 'auto_collector',
      name: 'Automated Collection Drones',
      description: '25% chance to automatically collect resources as they spawn',
      cost: { metal: 180, crystal: 120 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.autoCollectChance = 0.25;
      },
      purchased: false,
      tier: 3,
      requires: 'collection_field'
    },
    {
      id: 'warp_drive',
      name: 'Warp Drive',
      description: 'Doubles ship speed and triples collection radius',
      cost: { metal: 250, crystal: 150 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) {
          playerStats.shipSpeed *= 2;
          playerStats.collectionRadius *= 3;
        }
      },
      purchased: false,
      tier: 3,
      requires: 'fusion_drive'
    }
  ];

  constructor() {
    // Initialize resources
    this.resources = {
      metal: 0,
      crystal: 0
    };
    
    // Initialize player stats with default values
    this.playerStats = {
      shipSpeed: 200,
      collectionRadius: 0, // No magnetic collection at start
      autoCollectChance: 0, // No auto-collection at start
      miningSpeed: 1, // Default mining speed
      miningPower: 1 // Default mining power
    };
  }

  update(deltaTime: number): void {
    // Convert deltaTime from ms to seconds
    const deltaSeconds = deltaTime / 1000;
    
    // Update resources based on rates and time passed
    this.resources.metal += this.rates.metalRate * deltaSeconds;
    this.resources.crystal += this.rates.crystalRate * deltaSeconds;
  }

  getResources(): Resources {
    return { ...this.resources };
  }

  getRates(): ResourceRates {
    return { ...this.rates };
  }
  
  getPlayerStats(): PlayerStats {
    return { ...this.playerStats };
  }

  getUpgrades(): ShipUpgrade[] {
    return [...this.upgrades];
  }
  
  getAvailableUpgrades(): ShipUpgrade[] {
    return this.upgrades.filter(upgrade => {
      // If it has a requirement, check if the required upgrade is purchased
      if (upgrade.requires) {
        const requiredUpgrade = this.upgrades.find(u => u.id === upgrade.requires);
        if (!requiredUpgrade?.purchased) return false;
      }
      
      return !upgrade.purchased;
    });
  }

  canAffordUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return false;
    
    // Check if required upgrade is purchased
    if (upgrade.requires) {
      const requiredUpgrade = this.upgrades.find(u => u.id === upgrade.requires);
      if (!requiredUpgrade?.purchased) return false;
    }
    
    return this.resources.metal >= upgrade.cost.metal && 
           this.resources.crystal >= upgrade.cost.crystal;
  }

  purchaseUpgrade(upgradeId: string): boolean {
    const upgradeIndex = this.upgrades.findIndex(u => u.id === upgradeId);
    if (upgradeIndex === -1) return false;
    
    const upgrade = this.upgrades[upgradeIndex];
    
    // Check if already purchased
    if (upgrade.purchased) return false;
    
    // Check if required upgrade is purchased
    if (upgrade.requires) {
      const requiredUpgrade = this.upgrades.find(u => u.id === upgrade.requires);
      if (!requiredUpgrade?.purchased) return false;
    }
    
    // Check if can afford
    if (!this.canAffordUpgrade(upgradeId)) return false;
    
    // Deduct resources
    this.resources.metal -= upgrade.cost.metal;
    this.resources.crystal -= upgrade.cost.crystal;
    
    // Apply effect
    upgrade.effect(this.resources, this.rates, this.playerStats);
    
    // Mark as purchased
    this.upgrades[upgradeIndex].purchased = true;
    
    return true;
  }

  setPlayerStat(statName: keyof PlayerStats, value: number): void {
    this.playerStats[statName] = value;
  }

  // Upgrade functions
  upgradeShipSpeed(amount: number): void {
    this.playerStats.shipSpeed += amount;
  }
  
  upgradeCollectionRadius(amount: number): void {
    this.playerStats.collectionRadius += amount;
  }
  
  upgradeAutoCollectChance(amount: number): void {
    this.playerStats.autoCollectChance += amount;
    // Cap at 100%
    if (this.playerStats.autoCollectChance > 1) {
      this.playerStats.autoCollectChance = 1;
    }
  }
  
  upgradeMiningSpeed(amount: number): void {
    this.playerStats.miningSpeed += amount;
  }
  
  upgradeMiningPower(amount: number): void {
    this.playerStats.miningPower += amount;
  }
} 