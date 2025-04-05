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
  private miningTargets: Asteroid[] = []; // Changed to array for multiple targets
  private miningBeam: Phaser.GameObjects.Graphics | null = null;
  private miningTimer: Phaser.Time.TimerEvent | null = null;
  private miningKey!: Phaser.Input.Keyboard.Key;
  private teleportKey!: Phaser.Input.Keyboard.Key; // New teleport key
  private teleportHoldTime: number = 0; // Track how long teleport key is held
  private teleportRequiredTime: number = 1000; // Hold for 1 second to teleport
  private teleportCooldown: number = 0; // Cooldown timer
  private teleportCooldownTime: number = 5000; // 5 seconds cooldown
  private teleportText: Phaser.GameObjects.Text | null = null; // Teleport status text
  private nearbyAsteroids: Asteroid[] = []; // Changed to array for multiple targets
  private attackRangeIndicator: Phaser.GameObjects.Graphics | null = null; // New attack range indicator
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
    
    try {
      // Load individual asteroid animation frames instead of spritesheet
      for (let i = 0; i < 7; i++) {
        const frameKey = `asteroid_frame_${i}`;
        if (!this.textures.exists(frameKey)) {
          this.load.image(frameKey, `src/assets/asteroid_frames/asteroid_frame_${i}.png`);
          console.log(`Loading asteroid frame: ${frameKey}`);
        }
      }
      
      // Load resource images if needed
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
    } catch (error) {
      console.error('Error loading assets:', error);
    }
    
    // Add loading progress indicator
    this.load.on('progress', (value: number) => {
      console.log(`Loading: ${Math.round(value * 100)}%`);
    });
    
    this.load.on('complete', () => {
      console.log('All assets loaded');
    });
    
    this.load.on('loaderror', (file: any) => {
      console.error('Error loading asset:', file.src);
    });
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
    
    // Create the ship (near the space station)
    const stationX = this.worldSize.width / 2 - 500;
    const stationY = this.worldSize.height / 2 - 500;
    this.ship = this.physics.add.sprite(
      stationX + 50, // Slight offset to avoid overlap
      stationY + 50,
      'ship'
    );
    this.ship.setCollideWorldBounds(true);
    
    // Camera follows the ship
    this.cameras.main.startFollow(this.ship, true);
    this.cameras.main.setZoom(1);
    
    // Setup keyboard controls - fix for null check errors
    if (this.input && this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.miningKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.teleportKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T); // Use 'T' for teleport
    } else {
      console.error('Keyboard input not available');
    }
    
    // Create teleport text (initially hidden)
    this.teleportText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 50,
      '',
      { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
    ).setOrigin(0.5)
     .setScrollFactor(0)
     .setDepth(1000)
     .setVisible(false);
    
    // Initialize asteroid belt manager
    this.asteroidBeltManager = new AsteroidBeltManager(this);
    this.setupAsteroidBelts();
    
    // Create mining beam graphics
    this.miningBeam = this.add.graphics();
    
    // We no longer need the overlap for proximity detection as we're checking distances directly
    this.physics.add.collider(
      this.ship,
      this.asteroidBeltManager.getAsteroids(),
      this.handleShipAsteroidCollision,
      undefined,
      this
    );
    
    // Create magnetic field visual (for collection radius upgrade)
    this.magnetField = this.add.graphics();
    this.updateMagneticField();
    
    // Initialize the attack system
    this.initializeAttackSystem();
    
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
    
    // Handle teleport functionality
    this.handleTeleport(delta);
    
    // Update attack range indicator - ensure this runs every frame
    this.updateAttackRangeIndicator();
    
    // Check for mining input
    this.handleMiningInput();
    
    // Update mining beam if active
    if (this.miningActive && this.miningTargets.length > 0 && this.miningBeam) {
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
    
    // Update nearby asteroids
    this.updateNearbyAsteroids();
    
    // Update teleport cooldown
    if (this.teleportCooldown > 0) {
      this.teleportCooldown -= delta;
      if (this.teleportCooldown <= 0) {
        if (this.teleportText) {
          this.teleportText.setVisible(false);
        }
      }
    }
  }

  private createAnimations() {
    try {
      // Check if we already have the animation
      if (this.anims.exists('asteroid_explode')) {
        console.log('Animation already exists, skipping creation');
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
      
      console.log('Successfully created asteroid_explode animation with individual frames');
    } catch (error) {
      console.error('Failed to create animation:', error);
    }
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

  private handleShipAsteroidCollision(
    shipObj: any, 
    asteroidObj: any
  ) {
    // Handle any collision effects (e.g., damage to ship, bounce effect, etc.)
    // For now we'll just implement a simple bounce
    const ship = shipObj as Phaser.Physics.Arcade.Sprite;
    const asteroid = asteroidObj as Asteroid;
    
    // Calculate bounce direction
    const angle = Phaser.Math.Angle.Between(
        asteroid.x, asteroid.y,
        ship.x, ship.y
    );
    
    // Apply a small push to the ship
    const pushForce = 50;
    ship.setVelocity(
        Math.cos(angle) * pushForce,
        Math.sin(angle) * pushForce
    );
  }

  private updateNearbyAsteroids() {
    const playerStats = this.resourceManager.getPlayerStats();
    let attackRange = playerStats.attackRange;
    
    // Use a reasonable fallback value if needed
    if (attackRange <= 0) {
        attackRange = 200;
        this.resourceManager.setPlayerStat('attackRange', attackRange);
    }
    
    // Clear current nearby asteroids list
    this.nearbyAsteroids = [];
    
    // Get all asteroids from the group
    const asteroids = this.asteroidBeltManager.getAsteroids().getChildren() as Asteroid[];
    
    // Check each asteroid for distance
    asteroids.forEach(asteroid => {
        const distance = Phaser.Math.Distance.Between(
            this.ship.x, this.ship.y,
            asteroid.x, asteroid.y
        );
        
        // Add to nearby list if within range
        if (distance <= attackRange) {
            this.nearbyAsteroids.push(asteroid);
        }
    });
    
    // Show mining indicator if there are asteroids in range
    this.updateNearbyAsteroidIndicator();
  }

  private updateAttackRangeIndicator() {
    // Get player stats for attack range
    const playerStats = this.resourceManager.getPlayerStats();
    let attackRange = playerStats.attackRange;
    
    // Ensure we have a reasonable range value - use fallback if needed
    if (attackRange <= 0) {
        attackRange = 200;
        this.resourceManager.setPlayerStat('attackRange', attackRange);
    }
    
    // For normal gameplay, we don't need to display the attack range indicator
    // Only update internal state without visual elements
    
    // Create attack range indicator if it doesn't exist but keep it invisible
    if (!this.attackRangeIndicator) {
        this.attackRangeIndicator = this.add.graphics();
    }
    
    // Clear any previous graphics (making it invisible)
    if (this.attackRangeIndicator) {
        this.attackRangeIndicator.clear();
    }
  }

  private updateNearbyAsteroidIndicator() {
    // Add some visual indicator if near an asteroid
    if (this.nearbyAsteroids.length > 0 && !this.miningActive) {
        // Show a "press SPACE to mine" tooltip without debug info
        const text = `Press SPACE to attack ${this.nearbyAsteroids.length} asteroid${this.nearbyAsteroids.length > 1 ? 's' : ''}`;
        
        // Add or update text (position it above the ship)
        if (!this.miningText) {
            this.miningText = this.add.text(
                this.ship.x,
                this.ship.y - 70,
                text,
                { fontSize: '14px', color: '#ffffff' }
            ).setOrigin(0.5);
        } else {
            this.miningText.setText(text);
            this.miningText.setPosition(this.ship.x, this.ship.y - 70);
            this.miningText.setVisible(true);
        }
    } else if (this.miningText) {
        // Hide the text if not near any asteroids
        this.miningText.setVisible(false);
    }
  }

  private handleMiningInput() {
    if (!this.miningKey) return;
    
    // Start mining if spacebar is pressed and near asteroids
    if (Phaser.Input.Keyboard.JustDown(this.miningKey) && this.nearbyAsteroids.length > 0 && !this.miningActive) {
        this.startMining();
    }
    
    // Stop mining if spacebar is released
    if (this.miningActive && Phaser.Input.Keyboard.JustUp(this.miningKey)) {
        this.stopMining();
    }
    
    // Check if all targets have been destroyed or are out of range
    if (this.miningActive) {
        // Filter out destroyed asteroids and those out of range
        this.miningTargets = this.miningTargets.filter(target => {
            if (!target.active) return false; // Destroyed
            
            const distance = Phaser.Math.Distance.Between(
                this.ship.x, this.ship.y,
                target.x, target.y
            );
            
            const playerStats = this.resourceManager.getPlayerStats();
            return distance <= playerStats.attackRange;
        });
        
        // Stop mining if no targets left
        if (this.miningTargets.length === 0) {
            this.stopMining();
        }
    }
  }

  private startMining() {
    this.miningActive = true;
    
    // Get player stats for multiAttack
    const playerStats = this.resourceManager.getPlayerStats();
    const maxTargets = playerStats.multiAttack;
    
    // Clear any previous targets first
    this.miningTargets.forEach(target => {
        if (target && target.active) {
            target.setTargeted(false);
        }
    });
    
    // Sort asteroids by distance (closest first)
    const sortedAsteroids = [...this.nearbyAsteroids].sort((a, b) => {
        const distA = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, a.x, a.y);
        const distB = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, b.x, b.y);
        return distA - distB;
    });
    
    // Select asteroids to target (limited by multiAttack stat)
    this.miningTargets = sortedAsteroids.slice(0, maxTargets);
    
    // Set each target as targeted (for visual indicator)
    this.miningTargets.forEach(target => {
        if (target && target.active) {
            target.setTargeted(true);
        }
    });
    
    // Set mining timer to damage asteroids periodically
    const miningSpeed = playerStats.miningSpeed || 1;
    this.miningTimer = this.time.addEvent({
        delay: 500 / miningSpeed, // Faster mining with upgrades
        callback: this.mineAsteroids,
        callbackScope: this,
        loop: true
    });
    
    // Play mining sound or effect
    // TODO: Add mining sound
  }

  private stopMining() {
    this.miningActive = false;
    
    // Clear targeting on all current targets
    this.miningTargets.forEach(target => {
        if (target && target.active) {
            target.setTargeted(false);
        }
    });
    
    this.miningTargets = [];
    
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

  private mineAsteroids() {
    if (this.miningTargets.length === 0) return;
    
    // Get player stats for mining damage
    const playerStats = this.resourceManager.getPlayerStats();
    const miningDamage = playerStats.miningPower || 1;
    
    // Keep track of which targets were destroyed
    const destroyedTargets: Asteroid[] = [];
    
    // Apply damage to each target asteroid
    this.miningTargets.forEach(target => {
        if (!target || !target.active) return;
        
        const destroyed = target.mine(miningDamage);
        
        if (destroyed) {
            // Add to the destroyed list
            destroyedTargets.push(target);
            
            // Add resources based on asteroid type
            const resourceAmount = target.getResourceAmount();
            
            if (target.getType() === AsteroidType.METAL) {
                // Metal asteroid: gives full metal amount and 30% of that as crystal
                this.resourceManager.addResource('metal', resourceAmount);
                this.resourceManager.addResource('crystal', Math.floor(resourceAmount * 0.3));
                
                // Show resource gain feedback
                this.createFloatingText(`+${resourceAmount}`, 0xaaaaaa, '+metal');
                if (Math.floor(resourceAmount * 0.3) > 0) {
                    this.createFloatingText(`+${Math.floor(resourceAmount * 0.3)}`, 0x9c5ab8, '+crystal', 30);
                }
            } else {
                // Crystal asteroid: gives full crystal amount and 30% of that as metal
                this.resourceManager.addResource('crystal', resourceAmount);
                this.resourceManager.addResource('metal', Math.floor(resourceAmount * 0.3));
                
                // Show resource gain feedback
                this.createFloatingText(`+${resourceAmount}`, 0x9c5ab8, '+crystal');
                if (Math.floor(resourceAmount * 0.3) > 0) {
                    this.createFloatingText(`+${Math.floor(resourceAmount * 0.3)}`, 0xaaaaaa, '+metal', 30);
                }
            }
            
            // Flash based on asteroid type
            if (target.getType() === AsteroidType.METAL) {
                this.cameras.main.flash(100, 0, 0, 255, false);
            } else {
                this.cameras.main.flash(100, 255, 0, 0, false);
            }
        }
    });
    
    // Remove destroyed targets from the targets list
    if (destroyedTargets.length > 0) {
        this.miningTargets = this.miningTargets.filter(target => !destroyedTargets.includes(target));
        
        // If we have space for more targets, check if there are any more in range
        if (this.miningTargets.length < playerStats.multiAttack && this.nearbyAsteroids.length > 0) {
            // Find asteroids in range that aren't already targeted
            const availableAsteroids = this.nearbyAsteroids.filter(asteroid => 
                !this.miningTargets.includes(asteroid) && asteroid.active);
            
            // Sort by distance
            const sortedAvailable = availableAsteroids.sort((a, b) => {
                const distA = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, a.x, a.y);
                const distB = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, b.x, b.y);
                return distA - distB;
            });
            
            // Add new targets up to the limit
            const newTargets = sortedAvailable.slice(0, playerStats.multiAttack - this.miningTargets.length);
            
            // Mark new targets as targeted
            newTargets.forEach(target => {
                target.setTargeted(true);
                this.miningTargets.push(target);
            });
        }
    }
    
    // Stop mining if no targets left
    if (this.miningTargets.length === 0) {
        this.stopMining();
    }
  }

  /**
   * Creates animated floating text that appears above the ship
   * @param text The text to display
   * @param color The color of the text
   * @param prefix Optional prefix text (like "+metal")
   * @param yOffset Optional vertical offset for staggered text
   */
  private createFloatingText(text: string, color: number, prefix: string = '', yOffset: number = 0) {
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

  private updateMiningBeam() {
    if (!this.miningBeam) return;
    
    // Clear previous beams
    this.miningBeam.clear();
    
    // Draw beams to each target
    this.miningTargets.forEach(target => {
        if (!target || !target.active) return;
        
        // Calculate beam points
        const start = { x: this.ship.x, y: this.ship.y };
        const end = { x: target.x, y: target.y };
        
        // Draw a laser beam effect
        if (this.miningBeam) {
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
    });
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

  private initializeAttackSystem() {
    // Ensure minimum stats are set properly
    this.resourceManager.ensureMinimumStats();
    
    // Set the attack range to a reasonable gameplay value
    this.resourceManager.setPlayerStat('attackRange', 200);
    
    // Initialize the graphics object but don't show debug visuals
    this.attackRangeIndicator = this.add.graphics();
  }

  private handleTeleport(delta: number) {
    if (!this.teleportKey) return;
    
    // Update the teleport cooldown
    if (this.teleportCooldown > 0) {
      if (this.teleportText) {
        this.teleportText.setText(`Teleport cooldown: ${Math.ceil(this.teleportCooldown / 1000)}s`);
        this.teleportText.setVisible(true);
      }
      return; // Can't teleport during cooldown
    }
    
    // Check if teleport key is being held
    if (this.teleportKey.isDown) {
      this.teleportHoldTime += delta;
      
      // Update the progress display
      if (this.teleportText) {
        const progress = Math.min(100, Math.floor((this.teleportHoldTime / this.teleportRequiredTime) * 100));
        this.teleportText.setText(`Hold to teleport: ${progress}%`);
        this.teleportText.setVisible(true);
      }
      
      // Check if held long enough
      if (this.teleportHoldTime >= this.teleportRequiredTime) {
        this.teleportToSpaceStation();
        this.teleportHoldTime = 0;
        this.teleportCooldown = this.teleportCooldownTime;
      }
    } else {
      // Reset when key is released
      this.teleportHoldTime = 0;
      if (this.teleportText && this.teleportCooldown <= 0) {
        this.teleportText.setVisible(false);
      }
    }
  }
  
  private teleportToSpaceStation() {
    // Get space station position
    const stationX = this.worldSize.width / 2 - 500;
    const stationY = this.worldSize.height / 2 - 500;
    
    // Add a teleport effect
    this.cameras.main.flash(500, 0, 200, 255);
    
    // Stop any mining activity
    if (this.miningActive) {
      this.stopMining();
    }
    
    // Move ship to space station with slight offset
    this.ship.setPosition(stationX + 50, stationY + 50);
    
    // Show teleport confirmation
    this.createFloatingText('Teleported!', 0x00ffff);
  }
} 