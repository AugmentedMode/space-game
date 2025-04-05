import Phaser from 'phaser';
import { ResourceManager } from '../systems/ResourceManager';

export enum UITheme {
  // Core colors
  PRIMARY = 0x2563EB,      // Blue
  SECONDARY = 0x4F46E5,    // Indigo
  ACCENT = 0xF59E0B,       // Amber
  
  // Status colors
  SUCCESS = 0x10B981,      // Green
  WARNING = 0xF59E0B,      // Amber
  ERROR = 0xEF4444,        // Red
  
  // Neutral colors
  BACKGROUND_DARK = 0x111827,  // Very dark gray/blue
  BACKGROUND_LIGHT = 0x1F2937, // Dark gray/blue
  TEXT_PRIMARY = 0xFFFFFF,     // White
  TEXT_SECONDARY = 0xD1D5DB,   // Light gray
  
  // Special colors
  METAL = 0x64B5F6,        // Light blue
  CRYSTAL = 0xF06292,      // Pink
  
  // Button states
  BUTTON_DEFAULT = 0x1E3A8A,  // Dark blue
  BUTTON_HOVER = 0x2563EB,    // Medium blue
  BUTTON_ACTIVE = 0x3B82F6,   // Bright blue
  BUTTON_DISABLED = 0x4B5563, // Gray
  
  // Upgrade states
  UPGRADE_AVAILABLE = 0x10B981,   // Green
  UPGRADE_UNAVAILABLE = 0x6B7280, // Gray
  UPGRADE_LOCKED = 0x4B5563,      // Dark gray
}

// Define custom fonts (using web-safe fonts)
export enum UIFonts {
  HEADING = '"Chakra Petch", "Orbitron", sans-serif',
  BODY = '"Exo 2", "Roboto", sans-serif',
  MONOSPACE = '"JetBrains Mono", "Consolas", monospace'
}

// Define consistent sizes and spacing
export const UIConstants = {
  PADDING: {
    SMALL: 8,
    MEDIUM: 16,
    LARGE: 24,
    XLARGE: 32
  },
  BORDER_RADIUS: {
    SMALL: 4,
    MEDIUM: 8,
    LARGE: 12
  },
  FONT_SIZE: {
    SMALL: '14px',
    MEDIUM: '18px',
    LARGE: '24px',
    XLARGE: '32px'
  },
  TRANSITION_DURATION: 200,
  PANEL_OPACITY: 0.9,
  GLASS_EFFECT: true
};

export class UIManager {
  private scene: Phaser.Scene;
  private resourceManager: ResourceManager;
  private loadedCSSFonts: boolean = false;
  
  constructor(scene: Phaser.Scene, resourceManager: ResourceManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;
    this.loadFonts();
  }
  
  private loadFonts() {
    // Only load fonts once
    if (this.loadedCSSFonts) return;
    
    // Add web fonts via CSS
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;700&family=Exo+2:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Orbitron:wght@400;700&display=swap');
    `;
    document.head.appendChild(style);
    
    this.loadedCSSFonts = true;
  }
  
  // Helper methods for creating UI elements with the theme
  
  createPanel(x: number, y: number, width: number, height: number, color: UITheme = UITheme.BACKGROUND_DARK): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Create glass-like background panel
    const bg = this.scene.add.rectangle(0, 0, width, height, color, UIConstants.PANEL_OPACITY);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, UITheme.BACKGROUND_LIGHT);
    
    // Add a slight rounded rectangle if supported in the renderer
    if (bg.setRoundedRectangle) {
      (bg as any).setRoundedRectangle(width, height, UIConstants.BORDER_RADIUS.MEDIUM);
    }
    
    // Add a subtle inner glow effect with a graphics object
    const glow = this.scene.add.graphics();
    glow.fillStyle(UITheme.ACCENT, 0.1);
    glow.fillRect(2, 2, width - 4, height - 4);
    
    container.add([bg, glow]);
    return container;
  }
  
  createTitle(text: string, fontSize: string = UIConstants.FONT_SIZE.LARGE): Phaser.GameObjects.Text {
    const title = this.scene.add.text(0, 0, text.toUpperCase(), {
      fontFamily: UIFonts.HEADING,
      fontSize: fontSize,
      color: `#${UITheme.TEXT_PRIMARY.toString(16).padStart(6, '0')}`,
      stroke: `#${UITheme.ACCENT.toString(16).padStart(6, '0')}`,
      strokeThickness: 1,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 5,
        fill: true
      }
    });
    title.setOrigin(0.5, 0.5);
    return title;
  }
  
  createText(text: string, fontSize: string = UIConstants.FONT_SIZE.MEDIUM, color: UITheme = UITheme.TEXT_PRIMARY): Phaser.GameObjects.Text {
    return this.scene.add.text(0, 0, text, {
      fontFamily: UIFonts.BODY,
      fontSize: fontSize,
      color: `#${color.toString(16).padStart(6, '0')}`
    });
  }
  
  createButton(
    text: string,
    width: number,
    height: number,
    callback: () => void,
    enabled: boolean = true
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    
    // Create button background
    const bg = this.scene.add.rectangle(
      0, 0, 
      width, height, 
      enabled ? UITheme.BUTTON_DEFAULT : UITheme.BUTTON_DISABLED
    );
    bg.setOrigin(0.5, 0.5);
    
    // Create button text
    const buttonText = this.scene.add.text(0, 0, text.toUpperCase(), {
      fontFamily: UIFonts.HEADING,
      fontSize: UIConstants.FONT_SIZE.MEDIUM,
      color: `#${UITheme.TEXT_PRIMARY.toString(16).padStart(6, '0')}`,
      align: 'center'
    });
    buttonText.setOrigin(0.5, 0.5);
    
    // Add a highlight/glow effect
    const highlight = this.scene.add.rectangle(0, 0, width, height, UITheme.ACCENT, 0);
    highlight.setOrigin(0.5, 0.5);
    highlight.setStrokeStyle(2, UITheme.ACCENT, 0.8);
    
    container.add([bg, highlight, buttonText]);
    
    if (enabled) {
      // Make interactive
      bg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          bg.setFillStyle(UITheme.BUTTON_HOVER);
          highlight.setAlpha(0.3);
          this.scene.tweens.add({
            targets: highlight,
            alpha: 0.5,
            duration: UIConstants.TRANSITION_DURATION,
            ease: 'Power2'
          });
        })
        .on('pointerout', () => {
          bg.setFillStyle(UITheme.BUTTON_DEFAULT);
          this.scene.tweens.add({
            targets: highlight,
            alpha: 0,
            duration: UIConstants.TRANSITION_DURATION,
            ease: 'Power2'
          });
        })
        .on('pointerdown', () => {
          bg.setFillStyle(UITheme.BUTTON_ACTIVE);
          this.scene.tweens.add({
            targets: container,
            scaleX: 0.95,
            scaleY: 0.95,
            duration: 50,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => callback()
          });
        });
    }
    
    return container;
  }
  
  // Animation helpers
  fadeIn(gameObject: Phaser.GameObjects.GameObject, duration: number = 300): Phaser.Tweens.Tween {
    gameObject.setAlpha(0);
    return this.scene.tweens.add({
      targets: gameObject,
      alpha: 1,
      duration: duration,
      ease: 'Power2'
    });
  }
  
  fadeOut(gameObject: Phaser.GameObjects.GameObject, duration: number = 300): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: gameObject,
      alpha: 0,
      duration: duration,
      ease: 'Power2'
    });
  }
  
  slideIn(gameObject: Phaser.GameObjects.GameObject, fromX: number, toX: number, duration: number = 500): Phaser.Tweens.Tween {
    const currentY = (gameObject as any).y;
    (gameObject as any).x = fromX;
    
    return this.scene.tweens.add({
      targets: gameObject,
      x: toX,
      duration: duration,
      ease: 'Back.easeOut'
    });
  }
} 