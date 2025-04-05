import Phaser from 'phaser';

export interface SpriteSheetConfig {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  startFrame?: number;
  endFrame?: number;
  margin?: number;
  spacing?: number;
}

export interface AnimationConfig {
  key: string;
  frames?: number[] | string[];
  frameRate?: number;
  duration?: number;
  repeat?: number;
  delay?: number;
  yoyo?: boolean;
  showOnStart?: boolean;
  hideOnComplete?: boolean;
}

export class AnimationManager {
  private scene: Phaser.Scene;
  private loadedSheets: Set<string> = new Set();
  private createdAnimations: Set<string> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Loads a sprite sheet if it's not already loaded
   */
  loadSpriteSheet(config: SpriteSheetConfig): void {
    if (this.scene.textures.exists(config.key) || this.loadedSheets.has(config.key)) {
      return; // Already loaded
    }

    this.scene.load.spritesheet(config.key, config.path, {
      frameWidth: config.frameWidth,
      frameHeight: config.frameHeight,
      margin: config.margin || 0,
      spacing: config.spacing || 0
    });

    this.loadedSheets.add(config.key);

    // Make sure the scene is aware that we're adding assets after preload
    if (this.scene.load.isLoading()) {
      this.scene.load.start();
    }
  }

  /**
   * Creates an animation from a sprite sheet
   */
  createAnimation(spriteSheetKey: string, animConfig: AnimationConfig): void {
    const animKey = `${spriteSheetKey}_${animConfig.key}`;
    
    if (this.createdAnimations.has(animKey) || 
        this.scene.anims.exists(animKey)) {
      return; // Already created
    }

    // Generate frame numbers if not provided
    if (!animConfig.frames) {
      // Get the spritesheet and determine number of frames
      const texture = this.scene.textures.get(spriteSheetKey);
      const frameCount = texture.frameTotal;
      
      // Create sequential frame numbers 0 to frameCount-1
      const frames = this.scene.anims.generateFrameNumbers(spriteSheetKey, {
        start: 0,
        end: frameCount - 1
      });

      this.scene.anims.create({
        key: animKey,
        frames: frames,
        frameRate: animConfig.frameRate || 24,
        repeat: animConfig.repeat !== undefined ? animConfig.repeat : 0,
        yoyo: animConfig.yoyo || false
      });
    } else if (typeof animConfig.frames[0] === 'number') {
      // Specific frame numbers were provided
      const frames = this.scene.anims.generateFrameNumbers(spriteSheetKey, {
        frames: animConfig.frames as number[]
      });

      this.scene.anims.create({
        key: animKey,
        frames: frames,
        frameRate: animConfig.frameRate || 24,
        repeat: animConfig.repeat !== undefined ? animConfig.repeat : 0,
        yoyo: animConfig.yoyo || false
      });
    } else {
      // Frame names were provided (string array)
      const frameNames = animConfig.frames as string[];
      
      this.scene.anims.create({
        key: animKey,
        frames: this.scene.anims.generateFrameNames(spriteSheetKey, {
          prefix: frameNames[0] || '',
          start: 0,
          end: frameNames.length - 1,
          suffix: ''
        }),
        frameRate: animConfig.frameRate || 24,
        repeat: animConfig.repeat !== undefined ? animConfig.repeat : 0,
        yoyo: animConfig.yoyo || false
      });
    }

    this.createdAnimations.add(animKey);
  }

  /**
   * Get full animation key that combines spritesheet key and animation name
   */
  getAnimationKey(spriteSheetKey: string, animationName: string): string {
    return `${spriteSheetKey}_${animationName}`;
  }

  /**
   * Play an animation on a sprite
   */
  playAnimation(
    sprite: Phaser.GameObjects.Sprite,
    spriteSheetKey: string,
    animationName: string,
    options: { ignoreIfPlaying?: boolean; callback?: () => void } = {}
  ): void {
    const animKey = this.getAnimationKey(spriteSheetKey, animationName);

    if (options.ignoreIfPlaying && sprite.anims.isPlaying && sprite.anims.currentAnim?.key === animKey) {
      return;
    }

    if (options.callback) {
      sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, options.callback);
    }

    sprite.play(animKey);
  }
} 