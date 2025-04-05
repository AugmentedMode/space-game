import Phaser from 'phaser';

export class TransitionLoadingScene extends Phaser.Scene {
  private nextScene: string = '';
  
  constructor() {
    super('loading-transition');
  }
  
  init(data: { nextScene: string }) {
    this.nextScene = data.nextScene;
  }
  
  create() {
    // Create loading animation
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Background
    this.add.rectangle(width/2, height/2, width, height, 0x000000);
    
    // Loading text
    const loadingText = this.add.text(
      width / 2,
      height / 2 - 50,
      'LOADING...',
      {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // Animated dots
    const dots = this.add.text(
      width / 2,
      height / 2,
      '...',
      {
        fontSize: '48px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Animate the dots
    this.tweens.add({
      targets: dots,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        // After animation completes, transition to the next scene
        this.startNextScene();
      }
    });
    
    // Additional visual effect - moving particles
    this.createParticles();
  }
  
  private createParticles() {
    // Create particle effect if we have the particle texture
    if (this.textures.exists('particle')) {
      const particles = this.add.particles(0, 0, 'particle', {
        x: this.cameras.main.width / 2,
        y: this.cameras.main.height + 10,
        angle: { min: 250, max: 290 },
        speed: 300,
        gravityY: -300,
        lifespan: 4000,
        quantity: 2,
        scale: { start: 0.1, end: 0 },
        blendMode: 'ADD'
      });
    }
  }
  
  private startNextScene() {
    // Add some additional delay for effect
    this.time.delayedCall(500, () => {
      // Pass any needed data to the next scene
      const sceneData: any = {};
      
      // If we're transitioning to the station, pass the resource manager
      if (this.nextScene === 'station-interior') {
        const gameScene = this.scene.get('game');
        if (gameScene && typeof (gameScene as any).getResourceManager === 'function') {
          sceneData.resourceManager = (gameScene as any).getResourceManager();
        }
      }
      
      // Start the next scene
      this.scene.start(this.nextScene, sceneData);
    });
  }
} 