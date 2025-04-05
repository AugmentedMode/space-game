import Phaser from 'phaser';
import { LoadingScene } from './scenes/LoadingScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { StationInteriorScene } from './scenes/StationInteriorScene';
import { TransitionLoadingScene } from './scenes/TransitionLoadingScene';
import { PlanetSurfaceScene } from './scenes/PlanetSurfaceScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false
    }
  },
  scene: [
    LoadingScene, 
    GameScene, 
    UIScene, 
    StationInteriorScene, 
    TransitionLoadingScene,
    PlanetSurfaceScene
  ],
  backgroundColor: '#000000',
  render: {
    pixelArt: true
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);

// Handle window resize events
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

export default game; 