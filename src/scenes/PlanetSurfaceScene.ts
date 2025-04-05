import Phaser from 'phaser';
import { ResourceManager } from '../systems/ResourceManager';
import { PlanetType } from '../objects/Planet';

export class PlanetSurfaceScene extends Phaser.Scene {
  private resourceManager!: ResourceManager;
  private exitButton!: Phaser.GameObjects.Text;
  private planetType!: PlanetType;
  private planetName!: string;
  
  // Character and movement
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  
  // Map elements
  private ground!: Phaser.GameObjects.TileSprite;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private decorations!: Phaser.GameObjects.Group;

  constructor() {
    super('planet-surface');
  }

  init(data: { 
    resourceManager: ResourceManager, 
    planetType: PlanetType,
    planetName: string 
  }) {
    this.resourceManager = data.resourceManager;
    this.planetType = data.planetType;
    this.planetName = data.planetName;
  }
  
  preload() {
    // Load character sprite if it doesn't exist
    if (!this.textures.exists('astronaut')) {
      this.load.spritesheet('astronaut', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/sprites/spaceman.png', {
        frameWidth: 16,
        frameHeight: 16
      });
    }
  }

  create() {
    // Create the planet surface based on the planet type
    this.createBackground();
    this.createTerrainElements();
    this.createPlayer();
    this.createUI();
    
    // Setup physics and collisions
    this.setupPhysics();
    
    // Show player resources
    this.showPlayerResources();
  }
  
  update() {
    // Handle player movement
    this.handlePlayerMovement();
  }

  private createBackground() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create different backgrounds based on planet type
    switch (this.planetType) {
      case PlanetType.ROCKY:
        this.createRockyBackground(width, height);
        break;
      case PlanetType.ICY:
        this.createIcyBackground(width, height);
        break;
      case PlanetType.GASEOUS:
        this.createGaseousBackground(width, height);
        break;
      case PlanetType.VOLCANIC:
        this.createVolcanicBackground(width, height);
        break;
      case PlanetType.OCEANIC:
        this.createOceanicBackground(width, height);
        break;
      default:
        this.createRockyBackground(width, height);
    }
  }
  
  private createRockyBackground(width: number, height: number) {
    // Rocky planet with brownish surface
    this.ground = this.add.tileSprite(0, 0, width, height, 'particle')
      .setOrigin(0, 0);
    
    // Create a rocky texture with craters
    const graphics = this.add.graphics();
    
    // Base ground color
    graphics.fillStyle(0xCC9966, 1);
    graphics.fillRect(0, 0, width, height);
    
    // Add rocky texture pattern
    for (let x = 0; x < width; x += 32) {
      for (let y = 0; y < height; y += 32) {
        // Add some variation to the ground
        const shade = Phaser.Math.Between(-20, 20);
        graphics.fillStyle(0xCC9966 + shade * 0x000100, 1);
        graphics.fillRect(x, y, 32, 32);
        
        // Add occasional craters
        if (Phaser.Math.Between(0, 20) === 0) {
          graphics.fillStyle(0xAA7744, 1);
          graphics.fillCircle(x + 16, y + 16, Phaser.Math.Between(8, 20));
        }
      }
    }
    
    // Add distant mountains
    for (let x = 0; x < width; x += 200) {
      const mountainHeight = Phaser.Math.Between(50, 100);
      const mountainWidth = Phaser.Math.Between(150, 250);
      
      graphics.fillStyle(0xAA7755, 1);
      graphics.fillTriangle(
        x, height - 150,
        x + mountainWidth/2, height - 150 - mountainHeight,
        x + mountainWidth, height - 150
      );
    }
    
    // Planet name
    this.add.text(
      width / 2,
      50,
      this.planetName.toUpperCase() + ' - ROCKY PLANET',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
  }
  
  private createIcyBackground(width: number, height: number) {
    // Icy planet with blue-white surface
    this.ground = this.add.tileSprite(0, 0, width, height, 'particle')
      .setOrigin(0, 0);
    
    // Create an icy texture
    const graphics = this.add.graphics();
    
    // Base ice color
    graphics.fillStyle(0xDDEEFF, 1);
    graphics.fillRect(0, 0, width, height);
    
    // Add ice texture pattern
    for (let x = 0; x < width; x += 32) {
      for (let y = 0; y < height; y += 32) {
        // Add some variation to the ground
        const shade = Phaser.Math.Between(-10, 10);
        graphics.fillStyle(0xDDEEFF + shade * 0x000100, 1);
        graphics.fillRect(x, y, 32, 32);
        
        // Add occasional ice cracks
        if (Phaser.Math.Between(0, 30) === 0) {
          graphics.lineStyle(1, 0xFFFFFF, 0.8);
          const startX = x + Phaser.Math.Between(0, 32);
          const startY = y + Phaser.Math.Between(0, 32);
          graphics.lineBetween(
            startX, startY,
            startX + Phaser.Math.Between(-32, 32),
            startY + Phaser.Math.Between(-32, 32)
          );
        }
      }
    }
    
    // Add distant ice formations
    for (let x = 0; x < width; x += 150) {
      const iceHeight = Phaser.Math.Between(40, 80);
      
      graphics.fillStyle(0xFFFFFF, 0.7);
      graphics.fillRect(
        x,
        height - 150 - iceHeight,
        Phaser.Math.Between(20, 60),
        iceHeight
      );
    }
    
    // Add snowfall particles
    const particles = this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: width },
      y: -10,
      quantity: 1,
      frequency: 200,
      lifespan: 5000,
      gravityY: 20,
      scale: { min: 0.1, max: 0.3 },
      alpha: { min: 0.3, max: 0.7 },
      tint: 0xFFFFFF,
      speed: { min: 20, max: 50 }
    });
    
    // Planet name
    this.add.text(
      width / 2,
      50,
      this.planetName.toUpperCase() + ' - ICY PLANET',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
  }
  
  private createGaseousBackground(width: number, height: number) {
    // Gas giant with swirling clouds
    this.ground = this.add.tileSprite(0, 0, width, height, 'particle')
      .setOrigin(0, 0);
    
    // Create a gaseous texture
    const graphics = this.add.graphics();
    
    // Base gas color
    graphics.fillStyle(0xFFCC33, 1);
    graphics.fillRect(0, 0, width, height);
    
    // Add cloud bands
    for (let y = 0; y < height; y += 50) {
      const bandHeight = Phaser.Math.Between(30, 70);
      const cloudColor = Phaser.Math.Between(0, 1) ? 0xFFAA22 : 0xEEBB44;
      
      graphics.fillStyle(cloudColor, 0.7);
      graphics.fillRect(0, y, width, bandHeight);
    }
    
    // Add swirling cloud details
    for (let i = 0; i < 30; i++) {
      const cloudX = Phaser.Math.Between(0, width);
      const cloudY = Phaser.Math.Between(0, height);
      const cloudSize = Phaser.Math.Between(100, 300);
      
      graphics.fillStyle(0xFFDD55, 0.3);
      graphics.fillEllipse(cloudX, cloudY, cloudSize, cloudSize / 3);
    }
    
    // Animate gas clouds
    this.tweens.add({
      targets: this.ground,
      tilePositionX: { from: 0, to: 1000 },
      ease: 'Linear',
      duration: 50000,
      repeat: -1
    });
    
    // Add floating platforms
    this.createFloatingPlatforms();
    
    // Planet name
    this.add.text(
      width / 2,
      50,
      this.planetName.toUpperCase() + ' - GAS GIANT',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
  }
  
  private createVolcanicBackground(width: number, height: number) {
    // Volcanic planet with lava flows
    this.ground = this.add.tileSprite(0, 0, width, height, 'particle')
      .setOrigin(0, 0);
    
    // Create a volcanic texture
    const graphics = this.add.graphics();
    
    // Base volcanic rock color
    graphics.fillStyle(0x333333, 1);
    graphics.fillRect(0, 0, width, height);
    
    // Add volcanic rock texture
    for (let x = 0; x < width; x += 32) {
      for (let y = 0; y < height; y += 32) {
        // Add some variation to the ground
        const shade = Phaser.Math.Between(-5, 5);
        graphics.fillStyle(0x333333 + shade * 0x000100, 1);
        graphics.fillRect(x, y, 32, 32);
      }
    }
    
    // Add lava flows
    for (let i = 0; i < 5; i++) {
      const lavaX = Phaser.Math.Between(0, width);
      const lavaWidth = Phaser.Math.Between(20, 60);
      
      graphics.fillStyle(0xFF3300, 1);
      graphics.fillRect(lavaX, 0, lavaWidth, height);
      
      // Add lava glow
      graphics.fillStyle(0xFF5500, 0.3);
      graphics.fillRect(lavaX - 10, 0, lavaWidth + 20, height);
    }
    
    // Add lava particles
    const particles = this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: width },
      y: height,
      quantity: 1,
      frequency: 300,
      lifespan: 3000,
      gravityY: -50,
      scale: { start: 0.2, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xFF0000, 0xFF6600],
      speed: { min: 30, max: 60 }
    });
    
    // Planet name
    this.add.text(
      width / 2,
      50,
      this.planetName.toUpperCase() + ' - VOLCANIC PLANET',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
  }
  
  private createOceanicBackground(width: number, height: number) {
    // Oceanic planet with water and islands
    this.ground = this.add.tileSprite(0, 0, width, height, 'particle')
      .setOrigin(0, 0);
    
    // Create an oceanic texture
    const graphics = this.add.graphics();
    
    // Base ocean color
    graphics.fillStyle(0x3399FF, 1);
    graphics.fillRect(0, 0, width, height);
    
    // Add water texture pattern
    for (let x = 0; x < width; x += 64) {
      for (let y = 0; y < height; y += 64) {
        // Add some variation to the water
        const shade = Phaser.Math.Between(-10, 10);
        graphics.fillStyle(0x3399FF + shade * 0x000100, 0.5);
        graphics.fillRect(x, y, 64, 64);
      }
    }
    
    // Add islands
    for (let i = 0; i < 8; i++) {
      const islandX = Phaser.Math.Between(0, width);
      const islandY = Phaser.Math.Between(0, height);
      const islandSize = Phaser.Math.Between(50, 150);
      
      graphics.fillStyle(0x008800, 1);
      graphics.fillCircle(islandX, islandY, islandSize);
      
      // Add beach around island
      graphics.fillStyle(0xEEDD99, 1);
      graphics.fillCircle(islandX, islandY, islandSize + 10);
      graphics.fillStyle(0x008800, 1);
      graphics.fillCircle(islandX, islandY, islandSize);
      
      // Add trees to island
      for (let j = 0; j < 5; j++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (islandSize * 0.7);
        
        graphics.fillStyle(0x006600, 1);
        graphics.fillCircle(
          islandX + Math.cos(angle) * distance,
          islandY + Math.sin(angle) * distance,
          10
        );
      }
    }
    
    // Animate water
    this.tweens.add({
      targets: this.ground,
      tilePositionX: { from: 0, to: 200 },
      tilePositionY: { from: 0, to: 200 },
      ease: 'Sine.easeInOut',
      duration: 10000,
      yoyo: true,
      repeat: -1
    });
    
    // Planet name
    this.add.text(
      width / 2,
      50,
      this.planetName.toUpperCase() + ' - OCEANIC PLANET',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
  }
  
  private createFloatingPlatforms() {
    // Only create floating platforms for gas giant
    if (this.planetType !== PlanetType.GASEOUS) return;
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.obstacles = this.physics.add.staticGroup();
    
    // Add floating platforms
    for (let i = 0; i < 10; i++) {
      const platformX = Phaser.Math.Between(100, width - 100);
      const platformY = Phaser.Math.Between(150, height - 150);
      const platformWidth = Phaser.Math.Between(100, 250);
      const platformHeight = Phaser.Math.Between(20, 40);
      
      // Create platform
      const platform = this.add.rectangle(
        platformX, platformY,
        platformWidth, platformHeight,
        0xCCAA66
      ).setStrokeStyle(2, 0xFFDD88, 1);
      
      this.obstacles.add(platform);
    }
  }

  private createTerrainElements() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create obstacles and decorations specific to planet type
    this.obstacles = this.physics.add.staticGroup();
    this.decorations = this.add.group();
    
    switch (this.planetType) {
      case PlanetType.ROCKY:
        this.createRockyElements(width, height);
        break;
      case PlanetType.ICY:
        this.createIcyElements(width, height);
        break;
      case PlanetType.GASEOUS:
        // Already created in createGaseousBackground
        break;
      case PlanetType.VOLCANIC:
        this.createVolcanicElements(width, height);
        break;
      case PlanetType.OCEANIC:
        this.createOceanicElements(width, height);
        break;
    }
  }
  
  private createRockyElements(width: number, height: number) {
    // Add boulders and rock formations
    for (let i = 0; i < 15; i++) {
      const rockX = Phaser.Math.Between(50, width - 50);
      const rockY = Phaser.Math.Between(150, height - 50);
      const rockSize = Phaser.Math.Between(15, 40);
      
      // Create rock
      const rock = this.add.circle(rockX, rockY, rockSize, 0xAA8855)
        .setStrokeStyle(2, 0x886644, 1);
      
      this.obstacles.add(rock);
    }
    
    // Add research equipment
    const researchStation = this.add.rectangle(
      width * 0.7, height * 0.6,
      80, 60, 0x666699
    ).setStrokeStyle(2, 0x8888cc, 1);
    
    this.add.text(
      width * 0.7, height * 0.6 - 40,
      "Research Station",
      {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#333366',
        padding: { x: 5, y: 3 }
      }
    ).setOrigin(0.5);
  }
  
  private createIcyElements(width: number, height: number) {
    // Add ice formations
    for (let i = 0; i < 12; i++) {
      const iceX = Phaser.Math.Between(50, width - 50);
      const iceY = Phaser.Math.Between(150, height - 50);
      const iceWidth = Phaser.Math.Between(20, 50);
      const iceHeight = Phaser.Math.Between(30, 70);
      
      // Create ice formation
      const ice = this.add.rectangle(iceX, iceY, iceWidth, iceHeight, 0xCCEEFF)
        .setStrokeStyle(2, 0xFFFFFF, 0.8);
      
      this.obstacles.add(ice);
    }
    
    // Add thermal generator
    const thermalGen = this.add.rectangle(
      width * 0.3, height * 0.4,
      70, 70, 0x994433
    ).setStrokeStyle(2, 0xdd6644, 1);
    
    this.add.text(
      width * 0.3, height * 0.4 - 50,
      "Thermal Generator",
      {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#662222',
        padding: { x: 5, y: 3 }
      }
    ).setOrigin(0.5);
  }
  
  private createVolcanicElements(width: number, height: number) {
    // Add volcanic rocks
    for (let i = 0; i < 10; i++) {
      const rockX = Phaser.Math.Between(50, width - 50);
      const rockY = Phaser.Math.Between(150, height - 50);
      const rockSize = Phaser.Math.Between(20, 50);
      
      // Create volcanic rock
      const rock = this.add.circle(rockX, rockY, rockSize, 0x554444)
        .setStrokeStyle(2, 0x775555, 1);
      
      this.obstacles.add(rock);
    }
    
    // Add small volcanoes
    for (let i = 0; i < 3; i++) {
      const volcanoX = Phaser.Math.Between(100, width - 100);
      const volcanoY = Phaser.Math.Between(150, height - 100);
      const volcanoSize = Phaser.Math.Between(40, 80);
      
      // Create volcano cone
      const volcano = this.add.triangle(
        volcanoX, volcanoY,
        0, volcanoSize,
        volcanoSize, volcanoSize,
        volcanoSize/2, 0,
        0x664444
      ).setStrokeStyle(2, 0x775555, 1);
      
      // Create lava on top
      this.add.circle(volcanoX, volcanoY - volcanoSize/4, volcanoSize/5, 0xFF3300);
      
      this.obstacles.add(volcano);
    }
    
    // Add heat shield generator
    const heatShield = this.add.rectangle(
      width * 0.5, height * 0.2,
      100, 60, 0x446688
    ).setStrokeStyle(2, 0x6688aa, 1);
    
    this.add.text(
      width * 0.5, height * 0.2 - 40,
      "Heat Shield Generator",
      {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#334455',
        padding: { x: 5, y: 3 }
      }
    ).setOrigin(0.5);
  }
  
  private createOceanicElements(width: number, height: number) {
    // Add floating platforms (small islands)
    for (let i = 0; i < 8; i++) {
      const islandX = Phaser.Math.Between(50, width - 50);
      const islandY = Phaser.Math.Between(150, height - 50);
      const islandSize = Phaser.Math.Between(30, 60);
      
      // Create island
      const island = this.add.circle(islandX, islandY, islandSize, 0x008800)
        .setStrokeStyle(2, 0xEEDD99, 1);
      
      this.obstacles.add(island);
      
      // Add a tree to island
      if (Phaser.Math.Between(0, 1) === 0) {
        this.add.circle(islandX, islandY - 10, 15, 0x006600);
      }
    }
    
    // Add floating research platform
    const platform = this.add.rectangle(
      width * 0.6, height * 0.3,
      120, 80, 0x888899
    ).setStrokeStyle(3, 0xaaaacc, 1);
    
    this.obstacles.add(platform);
    
    this.add.text(
      width * 0.6, height * 0.3 - 50,
      "Marine Research Platform",
      {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#445566',
        padding: { x: 5, y: 3 }
      }
    ).setOrigin(0.5);
  }

  private createPlayer() {
    // Create player character at the center of the room
    const startX = this.cameras.main.width * 0.3;
    const startY = this.cameras.main.height * 0.5;
    
    this.player = this.physics.add.sprite(startX, startY, 'astronaut');
    this.player.setScale(3); // Make the small sprite bigger
    this.player.setDepth(10); // Ensure player is drawn on top
    this.player.setCollideWorldBounds(true);
    
    // Set up animation
    if (!this.anims.exists('astronaut_walk')) {
      this.anims.create({
        key: 'astronaut_walk',
        frames: this.anims.generateFrameNumbers('astronaut', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });
      
      this.anims.create({
        key: 'astronaut_idle',
        frames: this.anims.generateFrameNumbers('astronaut', { start: 0, end: 0 }),
        frameRate: 10
      });
    }
    
    // Setup keyboard controls
    this.cursors = this.input.keyboard?.createCursorKeys() || {
      up: { isDown: false },
      down: { isDown: false },
      left: { isDown: false },
      right: { isDown: false },
      space: { isDown: false },
      shift: { isDown: false }
    } as Phaser.Types.Input.Keyboard.CursorKeys;
  }
  
  private setupPhysics() {
    // Set up collisions
    this.physics.add.collider(this.player, this.obstacles);
  }
  
  private handlePlayerMovement() {
    const speed = 150;
    
    // Reset velocity
    this.player.setVelocity(0);
    
    // Handle movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.flipX = true;
      this.player.anims.play('astronaut_walk', true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.flipX = false;
      this.player.anims.play('astronaut_walk', true);
    }
    
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
      if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
        this.player.anims.play('astronaut_walk', true);
      }
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
      if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
        this.player.anims.play('astronaut_walk', true);
      }
    }
    
    // If no keys are pressed, show idle animation
    if (!this.cursors.left.isDown && 
        !this.cursors.right.isDown && 
        !this.cursors.up.isDown && 
        !this.cursors.down.isDown) {
      this.player.anims.play('astronaut_idle', true);
    }
  }

  private showPlayerResources() {
    const resources = this.resourceManager.getResources();
    
    // Create a resource display in the top-left corner
    const resourcePanel = this.add.rectangle(10, 10, 150, 70, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0xffffff, 0.8);
    
    this.add.text(
      20,
      20,
      'RESOURCES',
      {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    
    this.add.text(
      20,
      40,
      `Metal: ${Math.floor(resources.metal)}`,
      {
        fontSize: '12px',
        color: '#aaaaff'
      }
    );
    
    this.add.text(
      20,
      60,
      `Crystal: ${Math.floor(resources.crystal)}`,
      {
        fontSize: '12px',
        color: '#ffaaaa'
      }
    );
  }

  private createUI() {
    // Create exit button
    this.exitButton = this.add.text(
      this.cameras.main.width - 20,
      this.cameras.main.height - 20,
      'Exit Planet [O]',
      {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#660000',
        padding: { x: 10, y: 5 }
      }
    )
    .setOrigin(1, 1)
    .setInteractive({ useHandCursor: true });
    
    // Add click handler
    this.exitButton.on('pointerdown', () => {
      this.exitPlanet();
    });
    
    // Add keyboard handler for O key
    this.input.keyboard?.on('keydown-O', () => {
      this.exitPlanet();
    });
  }
  
  private exitPlanet() {
    // Create a loading scene transition effect
    this.createExitTransition();
  }
  
  private createExitTransition() {
    // Create a fullscreen rectangle for the transition
    const transitionRect = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0
    );
    
    // Fade in the black rectangle
    this.tweens.add({
      targets: transitionRect,
      alpha: 1,
      duration: 1000,
      onComplete: () => {
        // Switch back to the game scene
        this.scene.start('loading-transition', { nextScene: 'game' });
      }
    });
  }
} 