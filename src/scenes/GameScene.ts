import Phaser from 'phaser';
import { ResourceManager } from '../systems/ResourceManager';
import { SpaceStation } from '../objects/SpaceStation';
import { AsteroidBeltManager, AsteroidBeltConfig } from '../systems/AsteroidBeltManager';
import { Asteroid, AsteroidType } from '../objects/Asteroid';
import { PlayerController } from '../systems/PlayerController';
import { MiningSystem } from '../systems/MiningSystem';
import { TeleportSystem } from '../systems/TeleportSystem';
import { PlanetarySystem } from '../systems/PlanetarySystem';
import { GameConfig } from '../config/GameConfig';

export class GameScene extends Phaser.Scene {
  // Core game systems
  private resourceManager: ResourceManager;
  private playerController!: PlayerController;
  private miningSystem!: MiningSystem;
  private teleportSystem!: TeleportSystem;
  private asteroidBeltManager!: AsteroidBeltManager;
  private planetarySystem!: PlanetarySystem;
  
  // Game objects
  private ship!: Phaser.Physics.Arcade.Sprite;
  private spaceStation!: SpaceStation;
  
  // Visual elements
  private magnetField: Phaser.GameObjects.Graphics | null = null;
  private backgroundTiles: Phaser.GameObjects.TileSprite | null = null;
  private stars: Phaser.GameObjects.Group | null = null;
  private miningText: Phaser.GameObjects.Text | null = null;
  
  // World settings
  private worldSize = GameConfig.WORLD_SIZE;

  constructor() {
    super('game');
    this.resourceManager = new ResourceManager();
  }

  preload() {
    this.loadAssets();
  }

  create() {
    // Set up the world and visual elements
    this.setupWorld();
    this.createAnimations();
    this.createBackgroundElements();
    
    // Create main game objects
    this.createSpaceStation();
    this.createPlayerShip();
    
    // Initialize game systems
    this.initializeGameSystems();
    
    // Set up collisions and physics
    this.setupCollisions();
    
    // Start UI
    this.startUI();
  }

  update(time: number, delta: number) {
    // Update all game systems
    this.playerController.update(delta);
    this.miningSystem.update(delta);
    this.teleportSystem.update(delta);
    this.planetarySystem.update(time, delta);
    
    // Update visuals
    this.updateBackgroundParallax();
    this.updateMagneticField();
    
    // Update game state
    this.resourceManager.update(delta);
    this.updateMinimap();
  }

  private loadAssets() {
    // Load space station texture if not preloaded elsewhere
    if (!this.textures.exists('space_station')) {
      this.load.image('space_station', 'src/assets/spacestation_v2.png');
    }
    
    try {
      // Load individual asteroid animation frames
      for (let i = 0; i < 7; i++) {
        const frameKey = `asteroid_frame_${i}`;
        if (!this.textures.exists(frameKey)) {
          this.load.image(frameKey, `src/assets/asteroid_frames/asteroid_frame_${i}.png`);
        }
      }
      
      // Load resource images
      this.loadResourceImages();
      
    } catch (error) {
      console.error('Error loading assets:', error);
    }
    
    this.setupLoadingProgressEvents();
  }
  
  private loadResourceImages() {
    if (!this.textures.exists('metal')) {
      this.load.image('metal', 'src/assets/metal.png');
    }
    if (!this.textures.exists('crystal')) {
      this.load.image('crystal', 'src/assets/crystal.png');
    }
    
    // Also load the original asteroid for the non-animated state
    if (!this.textures.exists('asteroid')) {
      this.load.image('asteroid', 'src/assets/asteroid_frames/asteroid_frame_0.png');
    }
  }
  
  private setupLoadingProgressEvents() {
    this.load.on('progress', (value: number) => {
      console.log(`Loading: ${Math.round(value * 100)}%`);
    });
    
    this.load.on('complete', () => {
      console.log('All assets loaded');
    });
    
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error('Error loading asset:', file.src);
    });
  }

  private setupWorld() {
    // Set world bounds
    this.physics.world.setBounds(0, 0, this.worldSize.width, this.worldSize.height);
    
    // Handle resizing
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      // Adjust camera zoom if needed based on new size
      if (this.cameras.main) {
        const originalZoom = this.cameras.main.zoom;
        this.cameras.main.setSize(gameSize.width, gameSize.height);
        this.cameras.main.setZoom(originalZoom);
      }
    });
  }

  private createAnimations() {
    try {
      // Check if we already have the animation
      if (this.anims.exists('asteroid_explode')) {
        return;
      }
      
      // Create asteroid explosion animation using individual frame keys
      const frames = [];
      for (let i = 0; i < 7; i++) {
        frames.push({ key: `asteroid_frame_${i}` });
      }
      
      this.anims.create({
        key: 'asteroid_explode',
        frames: frames,
        frameRate: 10,
        repeat: 0
      });
      
    } catch (error) {
      console.error('Failed to create animation:', error);
    }
  }

  private createBackgroundElements() {
    // Create a repeating background
    this.backgroundTiles = this.add.tileSprite(
      0, 0,
      this.cameras.main.width,
      this.cameras.main.height,
      'background'
    );
    this.backgroundTiles.setOrigin(0, 0);
    this.backgroundTiles.setScrollFactor(0); // Fixed to camera
    
    // Add some distant stars (parallax effect)
    this.createStars();
  }

  private createStars() {
    // Create a group for stars
    this.stars = this.add.group();
    const starColors = GameConfig.STAR_COLORS;
    
    for (let i = 0; i < GameConfig.STAR_COUNT; i++) {
      const x = Phaser.Math.Between(0, this.worldSize.width);
      const y = Phaser.Math.Between(0, this.worldSize.height);
      const color = Phaser.Math.RND.pick(starColors);
      
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 3), color);
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
      this.stars!.add(star);
    }
  }

  private createSpaceStation() {
    // Place it at a fixed location in the world
    const stationX = GameConfig.STATION_POSITION.x;
    const stationY = GameConfig.STATION_POSITION.y;
    
    // Create the space station
    this.spaceStation = new SpaceStation(this, stationX, stationY);
    // Scale is now handled in the SpaceStation class
    
    this.createStationEffects(stationX, stationY);
    
    // Setup the interaction
    this.spaceStation.onInteract(() => {
      this.openSpaceStationTerminal();
    });
  }
  
  private createStationEffects(stationX: number, stationY: number) {
    // Add a glow effect to make the station more visible
    const glow = this.add.circle(stationX, stationY, 100, 0x6666ff, 0.2);
    glow.setDepth(-1); // Place behind the station
    
    // Add a simple animation to the glow
    if (this.tweens) {
      this.tweens.add({
        targets: glow,
        alpha: 0.4,
        duration: 2000,
        yoyo: true,
        repeat: -1
      });
    }
    
    // Add a guidance text above the station
    this.add.text(
      stationX,
      stationY - 100,
      'Space Station',
      { fontSize: '18px', color: '#ffffff' }
    ).setOrigin(0.5);
  }

  private createPlayerShip() {
    // Create the ship near the space station
    const stationPos = GameConfig.STATION_POSITION;
    
    this.ship = this.physics.add.sprite(
      stationPos.x + 50, // Slight offset to avoid overlap
      stationPos.y + 50,
      'ship'
    );
    this.ship.setCollideWorldBounds(true);
    
    // Camera follows the ship
    this.cameras.main.startFollow(this.ship, true);
    this.cameras.main.setZoom(1);
  }

  private initializeGameSystems() {
    // Create player controller for ship movement
    this.playerController = new PlayerController(this, this.ship, this.resourceManager);
    
    // Initialize asteroid belt manager and create belts
    this.asteroidBeltManager = new AsteroidBeltManager(this);
    this.setupAsteroidBelts();
    
    // Initialize mining system
    this.miningSystem = new MiningSystem(
      this, 
      this.ship, 
      this.asteroidBeltManager,
      this.resourceManager
    );
    
    // Initialize teleport system
    this.teleportSystem = new TeleportSystem(
      this,
      this.ship,
      this.spaceStation,
      this.miningSystem
    );
    
    // Initialize planetary system
    this.planetarySystem = new PlanetarySystem(this, this.resourceManager);
    this.planetarySystem.initialize();
    
    // Create magnetic field visual (for collection radius upgrade)
    this.magnetField = this.add.graphics();
    this.updateMagneticField();
  }

  private setupAsteroidBelts() {
    // Set up the asteroid belts from config
    GameConfig.ASTEROID_BELTS.forEach((beltConfig: AsteroidBeltConfig) => {
      this.asteroidBeltManager.addBelt(beltConfig);
    });
    
    // Show belt visuals
    this.asteroidBeltManager.createBeltVisuals();
  }

  private setupCollisions() {
    // Set up collisions between ship and asteroids
    this.physics.add.collider(
      this.ship,
      this.asteroidBeltManager.getAsteroids(),
      this.handleShipAsteroidCollision,
      undefined,
      this
    );
  }

  private handleShipAsteroidCollision(
    shipObj: any, 
    asteroidObj: any
  ) {
    // Handle collision effects (e.g., damage to ship, bounce effect, etc.)
    const ship = shipObj as Phaser.Physics.Arcade.Sprite;
    const asteroid = asteroidObj as Asteroid;
    
    // Calculate bounce direction
    const angle = Phaser.Math.Angle.Between(
        asteroid.x, asteroid.y,
        ship.x, ship.y
    );
    
    // Apply a small push to the ship
    const pushForce = GameConfig.ASTEROID_COLLISION_FORCE;
    ship.setVelocity(
        Math.cos(angle) * pushForce,
        Math.sin(angle) * pushForce
    );
  }

  private startUI() {
    // Start UI scene but don't show its container
    this.scene.launch('ui', { resourceManager: this.resourceManager });
  }

  private updateBackgroundParallax() {
    // Move background slightly for parallax effect
    if (this.backgroundTiles) {
      this.backgroundTiles.setTilePosition(
        this.cameras.main.scrollX * GameConfig.PARALLAX_FACTOR,
        this.cameras.main.scrollY * GameConfig.PARALLAX_FACTOR
      );
    }
  }

  private updateMagneticField() {
    if (!this.magnetField) return;
    
    const playerStats = this.resourceManager.getPlayerStats();
    if (playerStats.collectionRadius <= 0) {
      this.magnetField.clear();
      return;
    }
    
    this.magnetField.clear();
    this.magnetField.lineStyle(2, 0x00ffff, 0.3);
    this.magnetField.strokeCircle(this.ship.x, this.ship.y, playerStats.collectionRadius);
    this.magnetField.setDepth(100);
  }

  private updateMinimap() {
    // Update the minimap in UI scene
    const uiScene = this.scene.get('ui') as any;
    if (uiScene && typeof uiScene.updateMinimap === 'function') {
      uiScene.updateMinimap();
    }
  }
  
  private openSpaceStationTerminal() {
    // Get the UI scene
    const uiScene = this.scene.get('ui') as Phaser.Scene;
    
    // Check if it has the showUI method (from our UIScene class)
    if (uiScene && (uiScene as any).showUI) {
      (uiScene as any).showUI();
    }
  }
  
  // Public methods that can be called by other systems
  
  public createFloatingText(text: string, color: number, prefix: string = '', yOffset: number = 0) {
    // Position the text above the ship
    const floatingText = this.add.text(
      this.ship.x,
      this.ship.y - 50 - yOffset,
      prefix ? `${text} ${prefix}` : text,
      { 
        fontSize: '20px', 
        color: `#${color.toString(16)}`,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, stroke: true, fill: true }
      }
    ).setOrigin(0.5);
    
    // Add scale effect
    this.tweens.add({
      targets: floatingText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
    
    // Animate the text floating upward and fading out
    this.tweens.add({
      targets: floatingText,
      y: floatingText.y - 80,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        floatingText.destroy();
      }
    });
  }

  // Add a getter to expose the resource manager to other scenes
  public getResourceManager(): ResourceManager {
    return this.resourceManager;
  }

  // Add a getter to expose the player ship to other components
  public getPlayerShip(): Phaser.Physics.Arcade.Sprite {
    return this.ship;
  }
} 