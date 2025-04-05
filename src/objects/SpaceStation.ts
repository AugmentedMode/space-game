import Phaser from 'phaser';

export class SpaceStation extends Phaser.Physics.Arcade.Sprite {
  private interactZone!: Phaser.GameObjects.Zone;
  private interactText!: Phaser.GameObjects.Text;
  private xKey!: Phaser.Input.Keyboard.Key;
  private oKey!: Phaser.Input.Keyboard.Key; // New key for entering the station
  private playerInRange: boolean = false;
  private interactionRadius: number = 300; // Radius around station where interaction is possible
  private playerShip: Phaser.Physics.Arcade.Sprite | null = null;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'space_station');
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static (non-moving)
    
    // Adjust scale for the new image
    this.setScale(0.5); // Reduce scale for the larger spacestation_v2.png
    this.setDepth(10); // Ensure the station is drawn on top of background elements
    
    // Set up interaction zone (visual only now)
    this.setupInteractionZone();
    
    // Set up keyboard interaction
    this.setupKeyboardInteraction();
    
    // Set up ship reference
    this.setupShipReference();

    // For debugging - make interaction zone visible - UNCOMMENT TO DEBUG
    // this.scene.add.rectangle(this.x, this.y, 200, 200).setStrokeStyle(2, 0xff0000, 0.5);
    
    // Add update event to check ship proximity
    this.scene.events.on('update', this.checkShipProximity, this);
  }
  
  private setupShipReference() {
    // We'll try to find the ship in the scene - assuming it's accessible via getPlayerShip
    this.scene.events.once('update', () => {
      // Find ship reference from the GameScene
      const gameScene = this.scene as any;
      if (gameScene && typeof gameScene.getPlayerShip === 'function') {
        this.playerShip = gameScene.getPlayerShip();
      }
    });
  }
  
  private checkShipProximity = () => {
    if (!this.playerShip) return;
    
    // Calculate distance between ship and station
    const distance = Phaser.Math.Distance.Between(
      this.playerShip.x, this.playerShip.y,
      this.x, this.y
    );
    
    // Check if ship is within interaction radius
    const wasInRange = this.playerInRange;
    this.playerInRange = distance <= this.interactionRadius;
    
    // Show/hide interaction text based on range
    if (this.playerInRange !== wasInRange) {
      this.interactText.setVisible(this.playerInRange);
    }
  }
  
  private setupInteractionZone() {
    // Create a larger zone around the station for visual reference
    this.interactZone = this.scene.add.zone(this.x, this.y, 200, 200);
    this.scene.physics.add.existing(this.interactZone, true);
    
    // Add "Press X to interact" text
    this.interactText = this.scene.add.text(
      this.x, 
      this.y + 50, 
      'Press X to open station menu\nPress O to enter station',
      { fontSize: '20px', color: '#ffffff', backgroundColor: '#000000' }
    ).setOrigin(0.5);
    
    // Hide text initially until player is in range
    this.interactText.setVisible(false);
    this.interactText.setDepth(100); // Make sure text is visible above other elements
    
    // Make the zone interactive for click events only
    this.interactZone.setInteractive({ useHandCursor: true });
    
    // When player clicks on the zone, trigger callback
    this.interactZone.on('pointerdown', () => {
      console.log('Space station clicked');
      // Only trigger click functionality if in range
      if (this.playerInRange) {
        this.onInteract(() => {
          console.log("Space station interaction callback");
        });
      }
    });
  }
  
  private setupKeyboardInteraction() {
    if (!this.scene || !this.scene.input || !this.scene.input.keyboard) {
      console.error('Cannot setup keyboard: scene or input not available');
      return;
    }
    
    // Set up X key for opening station menu
    this.xKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    
    // Set up O key for entering the station
    this.oKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    
    // Check for key presses directly in update method
    this.scene.events.on('update', this.checkKeyPress, this);
    
    console.log('Keyboard interaction set up for Space Station');
  }
  
  private checkKeyPress = () => {
    // Only respond to X key if player is in range and key was just pressed (not held)
    if (this.playerInRange && Phaser.Input.Keyboard.JustDown(this.xKey)) {
      console.log('X key pressed in update loop');
      this.openStationUI();
      
      // Prevent the event from being processed further
      if (this.scene && this.scene.input && this.scene.input.keyboard) {
        this.scene.input.keyboard.resetKeys();
      }
    }
    
    // Check for O key to enter the station
    if (this.playerInRange && Phaser.Input.Keyboard.JustDown(this.oKey)) {
      console.log('O key pressed - entering station');
      this.enterStation();
      
      // Prevent the event from being processed further
      if (this.scene && this.scene.input && this.scene.input.keyboard) {
        this.scene.input.keyboard.resetKeys();
      }
    }
  }
  
  private openStationUI() {
    console.log('Opening station UI menu');
    // Get direct reference to UIScene
    const uiScene = this.scene.scene.get('ui');
    
    // Call the showUI method directly using the correct method name
    if (uiScene && typeof (uiScene as any).showUI === 'function') {
      console.log('Calling UI scene showUI method');
      (uiScene as any).showUI();
    } else {
      console.error('UI scene or showUI method not found', uiScene);
    }
  }
  
  private enterStation() {
    console.log('Entering space station interior');
    
    // Start the transition loading scene
    this.scene.scene.start('loading-transition', { nextScene: 'station-interior' });
  }
  
  public onInteract(callback: Function) {
    callback();
  }
  
  // Clean up event listeners when the object is destroyed
  destroy(fromScene?: boolean) {
    if (this.scene && this.scene.events) {
      this.scene.events.off('update', this.checkKeyPress, this);
      this.scene.events.off('update', this.checkShipProximity, this);
    }
    if (this.scene && this.scene.input && this.scene.input.keyboard) {
      // No need to remove 'keydown-X' listener since we removed it
    }
    super.destroy(fromScene);
  }
} 