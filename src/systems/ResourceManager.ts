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
  attackRange: number;
  attackPower: number;
  multiAttack: number;
}

export interface ShipUpgrade {
  id: string;
  name: string;
  description: string;
  cost: Resources;
  effect: (resources: Resources, rates: ResourceRates, playerStats?: PlayerStats) => void;
  purchased: boolean;
  requires?: string[];
  children?: string[];
  treePosition?: {x: number, y: number};
  icon?: string;
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
    miningPower: 1,
    attackRange: 100,
    attackPower: 1,
    multiAttack: 1
  };

  private upgrades: ShipUpgrade[] = [
    // Root upgrade - Ship Core
    {
      id: 'ship_core',
      name: 'Ship Core',
      description: 'Basic ship systems. Upgrade to improve attack capabilities.',
      cost: { metal: 0, crystal: 0 },
      effect: (_resources, _rates, _playerStats) => {
        // Already applied by default
      },
      purchased: true, // Player starts with this
      children: ['basic_attack_range', 'basic_multi_target'],
      treePosition: {x: 0, y: 0},
      icon: 'core'
    },
    
    // --- ATTACK RANGE BRANCH ---
    {
      id: 'basic_attack_range',
      name: 'Basic Targeting',
      description: 'Increases attack range by 50%. Attack asteroids from further away.',
      cost: { metal: 15, crystal: 10 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.attackRange *= 1.5;
      },
      purchased: false,
      requires: ['ship_core'],
      children: ['improved_attack_range'],
      treePosition: {x: -1, y: 1},
      icon: 'targeting'
    },
    {
      id: 'improved_attack_range',
      name: 'Advanced Targeting',
      description: 'Doubles your attack range. Blast asteroids from even further away.',
      cost: { metal: 40, crystal: 25 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.attackRange *= 2;
      },
      purchased: false,
      requires: ['basic_attack_range'],
      children: ['superior_attack_range'],
      treePosition: {x: -1, y: 2},
      icon: 'targeting2'
    },
    {
      id: 'superior_attack_range',
      name: 'Long-Range Targeting',
      description: 'Triples your attack range. Destroy asteroids from across the sector.',
      cost: { metal: 100, crystal: 75 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.attackRange *= 3;
      },
      purchased: false,
      requires: ['improved_attack_range'],
      children: [],
      treePosition: {x: -1, y: 3},
      icon: 'targeting3'
    },
    
    // --- MULTI-TARGET BRANCH ---
    {
      id: 'basic_multi_target',
      name: 'Dual Targeting',
      description: 'Attack 2 asteroids simultaneously with split beam technology.',
      cost: { metal: 20, crystal: 15 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.multiAttack = 2;
      },
      purchased: false,
      requires: ['ship_core'],
      children: ['improved_multi_target'],
      treePosition: {x: 1, y: 1},
      icon: 'multi1'
    },
    {
      id: 'improved_multi_target',
      name: 'Quad Targeting',
      description: 'Attack 4 asteroids simultaneously with advanced beam arrays.',
      cost: { metal: 60, crystal: 45 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.multiAttack = 4;
      },
      purchased: false,
      requires: ['basic_multi_target'],
      children: ['superior_multi_target'],
      treePosition: {x: 1, y: 2},
      icon: 'multi2'
    },
    {
      id: 'superior_multi_target',
      name: 'Omni Targeting',
      description: 'Attack 8 asteroids simultaneously with omni-directional beam technology.',
      cost: { metal: 150, crystal: 120 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) playerStats.multiAttack = 8;
      },
      purchased: false,
      requires: ['improved_multi_target'],
      children: [],
      treePosition: {x: 1, y: 3},
      icon: 'multi3'
    },
    
    // --- BONUS COMBO UPGRADE ---
    {
      id: 'attack_mastery',
      name: 'Attack Mastery',
      description: 'Combines the benefits of range and multi-targeting. Doubles attack power too.',
      cost: { metal: 300, crystal: 250 },
      effect: (_resources, _rates, playerStats) => {
        if (playerStats) {
          playerStats.attackRange *= 1.5;
          playerStats.multiAttack *= 2;
          playerStats.attackPower *= 2;
        }
      },
      purchased: false,
      requires: ['superior_attack_range', 'superior_multi_target'],
      children: [],
      treePosition: {x: 0, y: 4},
      icon: 'mastery'
    }
  ];

  private autosaveInterval: number = 30000; // Save every 30 seconds
  private lastSaveTime: number = 0;

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
      miningPower: 1, // Default mining power
      attackRange: 100, // Default attack range
      attackPower: 1, // Default attack power
      multiAttack: 1 // Default number of targets (only attack 1 at the start)
    };

    // Try to load saved game data
    this.loadGame();
    
    // Add starting resources for testing
    this.resources.metal = 500;
    this.resources.crystal = 500;
  }

  update(deltaTime: number): void {
    // Convert deltaTime from ms to seconds
    const deltaSeconds = deltaTime / 1000;
    
    // Update resources based on rates and time passed
    this.resources.metal += this.rates.metalRate * deltaSeconds;
    this.resources.crystal += this.rates.crystalRate * deltaSeconds;

    // Handle autosave
    this.lastSaveTime += deltaTime;
    if (this.lastSaveTime >= this.autosaveInterval) {
      this.saveGame();
      this.lastSaveTime = 0;
    }
  }

  /**
   * Save game data to localStorage
   */
  saveGame(): void {
    try {
      const saveData = {
        resources: this.resources,
        rates: this.rates,
        playerStats: this.playerStats,
        upgrades: this.upgrades.map(upgrade => ({
          id: upgrade.id,
          purchased: upgrade.purchased
        }))
      };
      
      localStorage.setItem('idleGameSave', JSON.stringify(saveData));
      console.log('Game saved successfully');
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  /**
   * Load game data from localStorage
   */
  loadGame(): void {
    try {
      const savedData = localStorage.getItem('idleGameSave');
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Restore resources
        if (parsedData.resources) {
          this.resources = parsedData.resources;
        }
        
        // Restore rates
        if (parsedData.rates) {
          this.rates = parsedData.rates;
        }
        
        // Restore player stats
        if (parsedData.playerStats) {
          this.playerStats = parsedData.playerStats;
        }
        
        // Restore upgrades purchased status
        if (parsedData.upgrades) {
          // For each saved upgrade, find the matching upgrade and set its purchased status
          parsedData.upgrades.forEach((savedUpgrade: {id: string, purchased: boolean}) => {
            const upgrade = this.upgrades.find(u => u.id === savedUpgrade.id);
            if (upgrade) {
              upgrade.purchased = savedUpgrade.purchased;
              
              // Re-apply the effect if it was purchased
              if (savedUpgrade.purchased) {
                upgrade.effect(this.resources, this.rates, this.playerStats);
              }
            }
          });
        }
        
        console.log('Game loaded successfully');
      } else {
        console.log('No saved game found, starting new game');
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  }

  /**
   * Reset game data (clear save)
   */
  resetGame(): void {
    try {
      localStorage.removeItem('idleGameSave');
      
      // Reset to default values
      this.resources = {
        metal: 0,
        crystal: 0
      };
      
      this.rates = {
        metalRate: 0.5,
        crystalRate: 0.2
      };
      
      this.playerStats = {
        shipSpeed: 200,
        collectionRadius: 0,
        autoCollectChance: 0,
        miningSpeed: 1,
        miningPower: 1,
        attackRange: 100,
        attackPower: 1,
        multiAttack: 1
      };
      
      // Reset all upgrades to not purchased
      this.upgrades.forEach(upgrade => {
        upgrade.purchased = false;
      });
      
      console.log('Game reset successfully');
    } catch (error) {
      console.error('Failed to reset game:', error);
    }
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

  /**
   * Adds the specified amount to a resource
   * @param resourceType The resource type ('metal' or 'crystal')
   * @param amount The amount to add
   */
  addResource(resourceType: keyof Resources, amount: number): void {
    if (resourceType in this.resources) {
      this.resources[resourceType] += amount;
    }
  }

  getUpgrades(): ShipUpgrade[] {
    return [...this.upgrades];
  }
  
  /**
   * Returns all available upgrades that can be purchased based on requirements
   */
  getAvailableUpgrades(): ShipUpgrade[] {
    return this.upgrades.filter(upgrade => {
      // If already purchased, it's not available
      if (upgrade.purchased) return false;
      
      // If it has requirements, check if ALL required upgrades are purchased
      if (upgrade.requires && upgrade.requires.length > 0) {
        return upgrade.requires.every(requiredId => {
          const requiredUpgrade = this.upgrades.find(u => u.id === requiredId);
          return requiredUpgrade?.purchased === true;
        });
      }
      
      // No requirements, so it's available
      return true;
    });
  }

  canAffordUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return false;
    
    // Check if required upgrades are purchased
    if (upgrade.requires && upgrade.requires.length > 0) {
      const allRequirementsMet = upgrade.requires.every(requiredId => {
        const requiredUpgrade = this.upgrades.find(u => u.id === requiredId);
        return requiredUpgrade?.purchased === true;
      });
      
      if (!allRequirementsMet) return false;
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
    
    // Check if required upgrades are purchased
    if (upgrade.requires && upgrade.requires.length > 0) {
      const allRequirementsMet = upgrade.requires.every(requiredId => {
        const requiredUpgrade = this.upgrades.find(u => u.id === requiredId);
        return requiredUpgrade?.purchased === true;
      });
      
      if (!allRequirementsMet) return false;
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

  // Other upgrade helper methods
  getRootUpgrades(): ShipUpgrade[] {
    return this.upgrades.filter(u => !u.requires || u.requires.length === 0);
  }

  getChildUpgrades(parentId: string): ShipUpgrade[] {
    const parent = this.upgrades.find(u => u.id === parentId);
    if (!parent || !parent.children || parent.children.length === 0) {
      return [];
    }
    
    return this.upgrades.filter(u => parent.children?.includes(u.id));
  }
} 