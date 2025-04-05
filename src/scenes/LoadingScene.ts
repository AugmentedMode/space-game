import Phaser from 'phaser';

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super('loading');
  }

  preload() {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    
    // Loading event handlers
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x9933ff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      this.scene.start('game');
    });
    
    // Load assets
    this.load.image('ship', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/sprites/thrust_ship.png');
    this.load.image('metal', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/sprites/orb-blue.png');
    this.load.image('crystal', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/sprites/orb-red.png');
    this.load.image('background', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/skies/space3.png');
    
    // Load space station asset
    this.load.image('space_station', 'src/assets/spacestation_v2.png');
    
    // Load planet assets
    this.load.image('Terran', 'src/assets/Terran.png');
    
    // Load particle for effects
    this.load.image('particle', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/particles/white.png');
  }
} 