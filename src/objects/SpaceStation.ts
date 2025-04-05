import Phaser from 'phaser';

export class SpaceStation extends Phaser.Physics.Arcade.Sprite {
  private interactZone!: Phaser.GameObjects.Zone;
  private interactText!: Phaser.GameObjects.Text;
  private xKey!: Phaser.Input.Keyboard.Key;
  private playerInRange: boolean = false;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'space_station');
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static (non-moving)
    
    // Adjust scale for the new image
    this.setScale(0.5); // Reduce scale for the larger spacestation_v2.png
    this.setDepth(10); // Ensure the station is drawn on top of background elements
    
    // Set up interaction zone
    this.setupInteractionZone();
    
    // Set up keyboard interaction
    this.setupKeyboardInteraction();

    // For debugging - make interaction zone visible - UNCOMMENT TO DEBUG
    // this.scene.add.rectangle(this.x, this.y, 200, 200).setStrokeStyle(2, 0xff0000, 0.5);
  }
  
  private setupInteractionZone() {
    // Create a larger zone around the station for easier interaction
    this.interactZone = this.scene.add.zone(this.x, this.y, 200, 200);
    this.scene.physics.add.existing(this.interactZone, true);
    
    // Add "Press X to interact" text (always visible for now for debugging)
    this.interactText = this.scene.add.text(
      this.x, 
      this.y + 50, 
      'Press X to open station menu',
      { fontSize: '20px', color: '#ffffff', backgroundColor: '#000000' }
    ).setOrigin(0.5);
    // Make text always visible for debugging
    this.interactText.setVisible(true);
    this.interactText.setDepth(100); // Make sure text is visible above other elements
    
    // Make the zone interactive
    this.interactZone.setInteractive({ useHandCursor: true });
    
    // Show text on pointer over
    this.interactZone.on('pointerover', () => {
      console.log('Player in range of space station');
      this.interactText.setVisible(true);
      this.playerInRange = true;
    });
    
    // Hide text on pointer out
    this.interactZone.on('pointerout', () => {
      console.log('Player out of range of space station');
      // Keep text visible for debugging
      // this.interactText.setVisible(false);
      this.playerInRange = false;
    });

    // Directly set player in range for debugging
    this.playerInRange = true;
  }
  
  private setupKeyboardInteraction() {
    if (!this.scene || !this.scene.input || !this.scene.input.keyboard) {
      console.error('Cannot setup keyboard: scene or input not available');
      return;
    }
    
    // Set up X key for opening station menu
    this.xKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    
    // Check for X key press directly in update method
    this.scene.events.on('update', this.checkKeyPress, this);
    
    console.log('Keyboard interaction set up for Space Station');
  }
  
  private checkKeyPress() {
    // Only respond to X key if player is in range and key was just pressed (not held)
    if (this.playerInRange && Phaser.Input.Keyboard.JustDown(this.xKey)) {
      console.log('X key pressed in update loop');
      this.openStationUI();
      
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
  
  public onInteract(callback: Function) {
    // When player clicks on the zone
    this.interactZone.on('pointerdown', () => {
      console.log('Space station clicked');
      callback();
    });
  }
  
  // Clean up event listeners when the object is destroyed
  destroy(fromScene?: boolean) {
    if (this.scene && this.scene.events) {
      this.scene.events.off('update', this.checkKeyPress, this);
    }
    if (this.scene && this.scene.input && this.scene.input.keyboard) {
      // No need to remove 'keydown-X' listener since we removed it
    }
    super.destroy(fromScene);
  }
} 