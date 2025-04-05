import Phaser from 'phaser';
import { ResourceManager } from '../systems/ResourceManager';
import { SpaceStation } from '../objects/SpaceStation';
import { AsteroidBeltManager, AsteroidBeltConfig } from '../systems/AsteroidBeltManager';
import { Asteroid, AsteroidType } from '../objects/Asteroid';

export class GameScene extends Phaser.Scene {
  private ship!: Phaser.Physics.Arcade.Sprite;
  private resourceManager: ResourceManager;
  private lastSpawnTime: number = 0;
  private worldSize = { width: 3000, height: 3000 }; // Large world size
  private magnetField: Phaser.GameObjects.Graphics | null = null;
  private backgroundTiles: Phaser.GameObjects.TileSprite | null = null;
  private stars: Phaser.GameObjects.Group | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceStation!: SpaceStation;
  private asteroidBeltManager!: AsteroidBeltManager;
  private miningActive: boolean = false;
  private miningTarget: Asteroid | null = null;
  private miningBeam: Phaser.GameObjects.Graphics | null = null;
  private miningTimer: Phaser.Time.TimerEvent | null = null;
  private miningKey!: Phaser.Input.Keyboard.Key;
  private nearbyAsteroid: Asteroid | null = null;
  private miningRange: number = 150;
  private miningText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('game');
    this.resourceManager = new ResourceManager();
  }

  preload() {
    // Load space station texture if not preloaded elsewhere
    if (!this.textures.exists('space_station')) {
      this.load.image('space_station', 'src/assets/space_station.png');
    }
    
    // Load asteroid spritesheet
    this.load.spritesheet('asteroid', 'src/assets/Asteroid 01 - Explode.png', {
      frameWidth: 128,
      frameHeight: 128
    });
    
    // Load resource images if needed
    if (!this.textures.exists('metal')) {
      this.load.image('metal', 'src/assets/metal.png');
    }
    if (!this.textures.exists('crystal')) {
      this.load.image('crystal', 'src/assets/crystal.png');
    }
  }

  create() {
    // Create asteroid explosion animation
    this.createAnimations();
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, this.worldSize.width, this.worldSize.height);
    
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
    
    // Create the space station (fixed position in the world)
    this.createSpaceStation();
    
    // Create the ship (in the center of the world)
    this.ship = this.physics.add.sprite(
      this.worldSize.width / 2,
      this.worldSize.height / 2,
      'ship'
    );
    this.ship.setCollideWorldBounds(true);
    
    // Camera follows the ship
    this.cameras.main.startFollow(this.ship, true);
    this.cameras.main.setZoom(1);
    
    // Setup keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.miningKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Initialize asteroid belt manager
    this.asteroidBeltManager = new AsteroidBeltManager(this);
    this.setupAsteroidBelts();
    
    // Create mining beam graphics
    this.miningBeam = this.add.graphics();
    
    // Add collision detection between ship and asteroids
    this.physics.add.overlap(
      this.ship,
      this.asteroidBeltManager.getAsteroids(),
      this.handleAsteroidProximity,
      undefined,
      this
    );
    
    // Create magnetic field visual (for collection radius upgrade)
    this.magnetField = this.add.graphics();
    this.updateMagneticField();
    
    // Start UI scene but don't show its container
    // The UI will be shown when interacting with the space station
    this.scene.launch('ui', { resourceManager: this.resourceManager });
  }

  update(time: number, delta: number) {
    // Move background slightly for parallax effect
    if (this.backgroundTiles) {
      this.backgroundTiles.setTilePosition(
        this.cameras.main.scrollX * 0.1,
        this.cameras.main.scrollY * 0.1
      );
    }
    
    // Handle keyboard movement
    this.handleShipMovement();
    
    // Check for mining input
    this.handleMiningInput();
    
    // Update mining beam if active
    if (this.miningActive && this.miningTarget && this.miningBeam) {
      this.updateMiningBeam();
    } else if (this.miningBeam) {
      this.miningBeam.clear();
    }
    
    // Update magnetic field visual if needed
    this.updateMagneticField();
    
    // Update resource collection (idle progression)
    this.resourceManager.update(delta);
    
    // Update the minimap in UI scene
    const uiScene = this.scene.get('ui') as any;
    if (uiScene && typeof uiScene.updateMinimap === 'function') {
      uiScene.updateMinimap();
    }
    
    // Show mining indicator when near an asteroid
    this.updateNearbyAsteroidIndicator();
  }

  private createAnimations() {
    // Create asteroid explosion animation
    this.anims.create({
      key: 'asteroid_explode',
      frames: this.anims.generateFrameNumbers('asteroid', { start: 0, end: 6 }),
      frameRate: 10,
      repeat: 0
    });
  }

  private setupAsteroidBelts() {
    // Create metal-rich asteroid belts
    const metalBelt1: AsteroidBeltConfig = {
      x: 300,
      y: 300,
      width: 800,
      height: 400,
      density: 0.5,
      type: AsteroidType.METAL,
      name: 'Iron Belt Alpha'
    };
    
    const metalBelt2: AsteroidBeltConfig = {
      x: 1800,
      y: 1800,
      width: 600,
      height: 900,
      density: 0.3,
      type: AsteroidType.METAL,
      name: 'Iron Belt Beta'
    };
    
    // Create crystal-rich asteroid belts
    const crystalBelt1: AsteroidBeltConfig = {
      x: 400,
      y: 1800,
      width: 500,
      height: 500,
      density: 0.2,
      type: AsteroidType.CRYSTAL,
      name: 'Crystal Nebula'
    };
    
    const crystalBelt2: AsteroidBeltConfig = {
      x: 2000,
      y: 500,
      width: 700,
      height: 300,
      density: 0.15,
      type: AsteroidType.CRYSTAL,
      name: 'Crystal Formation'
    };
    
    // Add belts to manager
    this.asteroidBeltManager.addBelt(metalBelt1);
    this.asteroidBeltManager.addBelt(metalBelt2);
    this.asteroidBeltManager.addBelt(crystalBelt1);
    this.asteroidBeltManager.addBelt(crystalBelt2);
    
    // Show belt visuals
    this.asteroidBeltManager.createBeltVisuals();
  }

  private handleAsteroidProximity(_ship: any, asteroid: any) {
    // Set the nearby asteroid for mining if within range
    const distance = Phaser.Math.Distance.Between(
      this.ship.x, this.ship.y,
      asteroid.x, asteroid.y
    );
    
    if (distance <= this.miningRange) {
      this.nearbyAsteroid = asteroid as Asteroid;
    }
  }

  private updateNearbyAsteroidIndicator() {
    // Clear current nearby asteroid if it's too far
    if (this.nearbyAsteroid) {
      const distance = Phaser.Math.Distance.Between(
        this.ship.x, this.ship.y,
        this.nearbyAsteroid.x, this.nearbyAsteroid.y
      );
      
      if (distance > this.miningRange) {
        this.nearbyAsteroid = null;
      }
    }
    
    // Add some visual indicator if near an asteroid
    if (this.nearbyAsteroid && !this.miningActive) {
      // Show a "press SPACE to mine" tooltip or highlight the asteroid
      const text = 'Press SPACE to mine';
      
      // Add or update text 
      if (!this.miningText) {
        this.miningText = this.add.text(
          this.nearbyAsteroid.x,
          this.nearbyAsteroid.y - 70,
          text,
          { fontSize: '14px', color: '#ffffff' }
        ).setOrigin(0.5);
      } else {
        this.miningText.setText(text);
        this.miningText.setPosition(this.nearbyAsteroid.x, this.nearbyAsteroid.y - 70);
        this.miningText.setVisible(true);
      }
    } else if (this.miningText) {
      // Hide the text if not near an asteroid
      this.miningText.setVisible(false);
    }
  }

  private handleMiningInput() {
    // Start mining if spacebar is pressed and near an asteroid
    if (Phaser.Input.Keyboard.JustDown(this.miningKey) && this.nearbyAsteroid && !this.miningActive) {
      this.startMining(this.nearbyAsteroid);
    }
    
    // Stop mining if spacebar is released or too far from asteroid
    if (this.miningActive && this.miningTarget) {
      const distance = Phaser.Math.Distance.Between(
        this.ship.x, this.ship.y,
        this.miningTarget.x, this.miningTarget.y
      );
      
      if (distance > this.miningRange || Phaser.Input.Keyboard.JustUp(this.miningKey)) {
        this.stopMining();
      }
    }
  }

  private startMining(asteroid: Asteroid) {
    this.miningActive = true;
    this.miningTarget = asteroid;
    
    // Set mining timer to damage asteroid periodically
    const playerStats = this.resourceManager.getPlayerStats();
    const miningSpeed = (playerStats as any).miningSpeed || 1;
    this.miningTimer = this.time.addEvent({
      delay: 500 / miningSpeed, // Faster mining with upgrades
      callback: this.mineAsteroid,
      callbackScope: this,
      loop: true
    });
    
    // Play mining sound or effect
    // TODO: Add mining sound
  }

  private stopMining() {
    this.miningActive = false;
    this.miningTarget = null;
    
    if (this.miningTimer) {
      this.miningTimer.remove();
      this.miningTimer = null;
    }
    
    if (this.miningBeam) {
      this.miningBeam.clear();
    }
    
    // Stop mining sound or effect
    // TODO: Stop mining sound
  }

  private mineAsteroid() {
    if (!this.miningTarget) return;
    
    // Apply damage to asteroid and check if it's destroyed
    const playerStats = this.resourceManager.getPlayerStats();
    const miningDamage = (playerStats as any).miningPower || 1;
    const destroyed = this.miningTarget.mine(miningDamage);
    
    if (destroyed) {
      // Add resources based on asteroid type
      const resourceAmount = this.miningTarget.getResourceAmount();
      const resources = this.resourceManager.getResources();
      
      if (this.miningTarget.getType() === AsteroidType.METAL) {
        resources.metal += resourceAmount;
        this.cameras.main.flash(300, 0, 0, 255);
      } else {
        resources.crystal += resourceAmount;
        this.cameras.main.flash(300, 255, 0, 0);
      }
      
      // Stop mining since the asteroid is destroyed
      this.stopMining();
    }
  }

  private updateMiningBeam() {
    if (!this.miningBeam || !this.miningTarget) return;
    
    // Draw mining beam
    this.miningBeam.clear();
    
    // Calculate beam points
    const start = { x: this.ship.x, y: this.ship.y };
    const end = { x: this.miningTarget.x, y: this.miningTarget.y };
    
    // Draw a laser beam effect
    this.miningBeam.lineStyle(2, 0x00ffff, 1);
    this.miningBeam.lineBetween(start.x, start.y, end.x, end.y);
    
    // Add beam particles for effect
    for (let i = 0; i < 3; i++) {
      const t = Math.random();
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;
      
      // Draw a small circle along the beam
      this.miningBeam.fillStyle(0x00ffff, 0.8);
      this.miningBeam.fillCircle(x, y, 3);
    }
  }

  private handleShipMovement() {
    // Get player stats for speed
    const playerStats = this.resourceManager.getPlayerStats();
    const speed = playerStats.shipSpeed;
    
    // Stop any existing velocity
    this.ship.setVelocity(0);
    
    // Horizontal movement
    if (this.cursors.left.isDown) {
      this.ship.setVelocityX(-speed);
      this.ship.setRotation(-Math.PI/2); // Left
    } else if (this.cursors.right.isDown) {
      this.ship.setVelocityX(speed);
      this.ship.setRotation(Math.PI/2); // Right
    }
    
    // Vertical movement
    if (this.cursors.up.isDown) {
      this.ship.setVelocityY(-speed);
      this.ship.setRotation(0); // Up
    } else if (this.cursors.down.isDown) {
      this.ship.setVelocityY(speed);
      this.ship.setRotation(Math.PI); // Down
    }
    
    // Diagonal movement - adjust rotation accordingly
    if (this.cursors.up.isDown && this.cursors.right.isDown) {
      this.ship.setRotation(Math.PI/4); // Up-right
    } else if (this.cursors.up.isDown && this.cursors.left.isDown) {
      this.ship.setRotation(-Math.PI/4); // Up-left
    } else if (this.cursors.down.isDown && this.cursors.right.isDown) {
      this.ship.setRotation(3 * Math.PI/4); // Down-right
    } else if (this.cursors.down.isDown && this.cursors.left.isDown) {
      this.ship.setRotation(-3 * Math.PI/4); // Down-left
    }
    
    // Normalize diagonal movement to prevent faster speed
    if ((this.cursors.up.isDown || this.cursors.down.isDown) && 
        (this.cursors.left.isDown || this.cursors.right.isDown)) {
      this.ship.body!.velocity.normalize().scale(speed);
    }
  }

  private createStars() {
    // Create a group for stars
    this.stars = this.add.group();
    const starColors = [0xffffff, 0xccccff, 0xffcccc, 0xccffcc];
    
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, this.worldSize.width);
      const y = Phaser.Math.Between(0, this.worldSize.height);
      const color = Phaser.Math.RND.pick(starColors);
      
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 3), color);
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
      this.stars!.add(star);
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

  private createSpaceStation() {
    // Place it at a fixed location in the world
    const stationX = this.worldSize.width / 2 - 500;
    const stationY = this.worldSize.height / 2 - 500;
    
    // Create the space station
    this.spaceStation = new SpaceStation(this, stationX, stationY);
    this.spaceStation.setScale(2); // Make it bigger if needed
    
    // Add a glow effect to make it more visible
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
    const guideText = this.add.text(
      stationX,
      stationY - 100,
      'Space Station',
      { fontSize: '18px', color: '#ffffff' }
    ).setOrigin(0.5);
    
    // Setup the interaction
    this.spaceStation.onInteract(() => {
      this.openSpaceStationTerminal();
    });
  }
  
  private openSpaceStationTerminal() {
    // Get the UI scene
    const uiScene = this.scene.get('ui') as Phaser.Scene;
    
    // Check if it has the showUI method (from our UIScene class)
    if (uiScene && (uiScene as any).showUI) {
      (uiScene as any).showUI();
    }
  }
} 