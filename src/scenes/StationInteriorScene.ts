import Phaser from 'phaser';
import { ResourceManager } from '../systems/ResourceManager';

export class StationInteriorScene extends Phaser.Scene {
  private resourceManager!: ResourceManager;
  private exitButton!: Phaser.GameObjects.Text;
  
  // Character and movement
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  
  // Room elements
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private furniture!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super('station-interior');
  }

  init(data: { resourceManager: ResourceManager }) {
    this.resourceManager = data.resourceManager;
  }
  
  preload() {
    // Load character sprite if it doesn't exist
    if (!this.textures.exists('astronaut')) {
      this.load.spritesheet('astronaut', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/sprites/spaceman.png', {
        frameWidth: 16,
        frameHeight: 16
      });
    }
    
    // Load simple furniture/ship sprites
    if (!this.textures.exists('ship_hangar')) {
      this.load.image('ship_hangar', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/sprites/ship.png');
    }
  }

  create() {
    // Create the space station interior
    this.createBackground();
    this.createRoom();
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
    // Add a dark metallic background with a grid pattern
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Base floor
    this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x222233
    );
    
    // Create tile pattern for floor
    const tileSize = 32;
    const graphics = this.add.graphics();
    
    // Draw floor tiles
    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const color = (x + y) % (tileSize * 2) === 0 ? 0x2a2a3a : 0x252535;
        graphics.fillStyle(color, 1);
        graphics.fillRect(x, y, tileSize, tileSize);
        graphics.lineStyle(1, 0x333366, 0.3);
        graphics.strokeRect(x, y, tileSize, tileSize);
      }
    }
  }

  private createRoom() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create walls as physics objects
    this.walls = this.physics.add.staticGroup();
    
    // Room boundaries with padding from edges
    const padding = 40;
    const wallThickness = 20;
    
    // Top wall
    this.walls.add(
      this.add.rectangle(width/2, padding/2, width, wallThickness, 0x666699)
        .setOrigin(0.5, 0.5)
    );
    
    // Bottom wall
    this.walls.add(
      this.add.rectangle(width/2, height - padding/2, width, wallThickness, 0x666699)
        .setOrigin(0.5, 0.5)
    );
    
    // Left wall
    this.walls.add(
      this.add.rectangle(padding/2, height/2, wallThickness, height, 0x666699)
        .setOrigin(0.5, 0.5)
    );
    
    // Right wall
    this.walls.add(
      this.add.rectangle(width - padding/2, height/2, wallThickness, height, 0x666699)
        .setOrigin(0.5, 0.5)
    );
    
    // Create hangar area
    this.createHangarArea();
    
    // Create furniture
    this.createFurniture();
    
    // Add title
    this.add.text(
      width / 2,
      padding + 20,
      'SPACE STATION INTERIOR',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
  }
  
  private createHangarArea() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create a hangar area on the right side
    const hangarWidth = width * 0.35;
    const hangarX = width - hangarWidth/2 - 60;
    const hangarY = height/2;
    
    // Hangar platform
    this.add.rectangle(hangarX, hangarY, hangarWidth, height * 0.5, 0x333355)
      .setStrokeStyle(3, 0x99aaff, 1);
      
    // Add ship in hangar
    const ship = this.add.image(hangarX, hangarY, 'ship_hangar')
      .setScale(2)
      .setTint(0xbbbbff);
      
    // Add hangar label
    this.add.text(
      hangarX,
      hangarY - 100,
      'HANGAR BAY',
      {
        fontSize: '18px',
        color: '#99aaff',
        fontStyle: 'bold',
        backgroundColor: '#333355',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5);
    
    // Add some hangar decorations
    const warningLight1 = this.add.circle(hangarX - 100, hangarY - 50, 10, 0xff0000, 0.7); // Warning light
    const warningLight2 = this.add.circle(hangarX + 100, hangarY - 50, 10, 0xff0000, 0.7); // Warning light
    
    // Blinking animation for warning lights
    this.tweens.add({
      targets: [warningLight1, warningLight2],
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }
  
  private createFurniture() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.furniture = this.physics.add.staticGroup();
    
    // Add a console on the left side
    const consoleX = width * 0.2;
    const consoleY = height * 0.3;
    
    // Console base
    this.furniture.add(
      this.add.rectangle(consoleX, consoleY, 120, 60, 0x444466)
        .setStrokeStyle(2, 0x99aaff, 1)
    );
    
    // Console screen
    this.add.rectangle(consoleX, consoleY - 15, 100, 30, 0x225588)
      .setStrokeStyle(1, 0x66ccff, 1);
      
    // Console buttons
    for (let i = 0; i < 3; i++) {
      this.add.circle(consoleX - 30 + i * 30, consoleY + 15, 8, 0x66ccff, 0.8);
    }
    
    // Add a table
    const tableX = width * 0.3;
    const tableY = height * 0.6;
    
    this.furniture.add(
      this.add.rectangle(tableX, tableY, 100, 60, 0x886644)
        .setStrokeStyle(2, 0xaa9955, 1)
    );
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
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.furniture);
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
      'Exit Station [O]',
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
      this.exitStation();
    });
    
    // Add keyboard handler for O key
    this.input.keyboard?.on('keydown-O', () => {
      this.exitStation();
    });
  }
  
  private exitStation() {
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