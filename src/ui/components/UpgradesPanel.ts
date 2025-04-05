import Phaser from 'phaser';
import { ResourceManager, ShipUpgrade } from '../../systems/ResourceManager';
import { UIManager, UITheme, UIConstants } from '../UIManager';

export class UpgradesPanel {
  private scene: Phaser.Scene;
  private uiManager: UIManager;
  private resourceManager: ResourceManager;
  public container: Phaser.GameObjects.Container;
  
  private tabButtons: Phaser.GameObjects.Container[] = [];
  private currentTier: number = 1;
  private upgradeButtons: Record<string, Phaser.GameObjects.Container> = {};
  private upgradeCardsContainer: Phaser.GameObjects.Container;
  
  constructor(scene: Phaser.Scene, uiManager: UIManager, resourceManager: ResourceManager, x: number, y: number) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.resourceManager = resourceManager;
    
    // Create main container
    this.container = this.scene.add.container(x, y);
    
    // Create tabs panel
    this.createTabsPanel();
    
    // Create upgrades container
    this.upgradeCardsContainer = this.scene.add.container(0, 60);
    this.container.add(this.upgradeCardsContainer);
    
    // Initial display of tier 1 upgrades
    this.showTierUpgrades(1);
  }
  
  private createTabsPanel() {
    // Create tab panel background
    const tabPanel = this.uiManager.createPanel(0, 0, 700, 50, UITheme.BACKGROUND_LIGHT);
    this.container.add(tabPanel);
    
    // Create tabs
    const tabWidth = 120;
    const tabHeight = 40;
    const spacing = 10;
    
    for (let tier = 1; tier <= 3; tier++) {
      // Calculate position
      const x = tier * (tabWidth + spacing) - (tabWidth + spacing) + 30;
      const y = 5;
      
      // Create tab container
      const tabContainer = this.scene.add.container(x, y);
      
      // Create tab background
      const bgColor = tier === this.currentTier ? UITheme.PRIMARY : UITheme.BUTTON_DEFAULT;
      const tabBg = this.scene.add.rectangle(0, 0, tabWidth, tabHeight, bgColor);
      tabBg.setStrokeStyle(1, UITheme.ACCENT);
      
      // Create tab text
      const tabText = this.uiManager.createText(`TIER ${tier}`, UIConstants.FONT_SIZE.MEDIUM);
      tabText.setOrigin(0.5, 0.5);
      
      tabContainer.add([tabBg, tabText]);
      
      // Make interactive
      tabBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          if (tier !== this.currentTier) {
            tabBg.setFillStyle(UITheme.BUTTON_HOVER);
          }
        })
        .on('pointerout', () => {
          if (tier !== this.currentTier) {
            tabBg.setFillStyle(UITheme.BUTTON_DEFAULT);
          }
        })
        .on('pointerdown', () => {
          this.showTierUpgrades(tier);
        });
      
      this.tabButtons.push(tabContainer);
      tabPanel.add(tabContainer);
    }
    
    // Add title
    const tabTitle = this.uiManager.createText('UPGRADES', UIConstants.FONT_SIZE.MEDIUM);
    tabTitle.setOrigin(0, 0.5);
    tabTitle.setPosition(UIConstants.PADDING.MEDIUM, 25);
    tabTitle.setFontStyle('bold');
    tabPanel.add(tabTitle);
    
    // Add to main container
    this.container.add(tabPanel);
  }
  
  private showTierUpgrades(tier: number) {
    // Update current tier
    this.currentTier = tier;
    
    // Update tab visuals
    this.tabButtons.forEach((tab, index) => {
      const tabTier = index + 1;
      const tabBg = tab.getAt(0) as Phaser.GameObjects.Rectangle;
      tabBg.setFillStyle(tabTier === tier ? UITheme.PRIMARY : UITheme.BUTTON_DEFAULT);
    });
    
    // Clear existing upgrade cards
    this.upgradeCardsContainer.removeAll(true);
    this.upgradeButtons = {};
    
    // Get upgrades for this tier
    const upgrades = this.resourceManager.getUpgrades().filter(u => u.tier === tier);
    
    // Create upgrade cards
    const cardWidth = 220;
    const cardHeight = 200;
    const cardsPerRow = 3;
    const padding = 15;
    
    upgrades.forEach((upgrade, index) => {
      // Calculate card position
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;
      const x = col * (cardWidth + padding);
      const y = row * (cardHeight + padding);
      
      // Create card
      const card = this.createUpgradeCard(upgrade, x, y, cardWidth, cardHeight);
      this.upgradeCardsContainer.add(card);
      
      // Store reference for later updates
      this.upgradeButtons[upgrade.id] = card;
    });
  }
  
  private createUpgradeCard(upgrade: ShipUpgrade, x: number, y: number, width: number, height: number) {
    const container = this.scene.add.container(x, y);
    
    // Determine card state and appearance
    let cardState: 'purchased' | 'available' | 'locked' | 'unaffordable' = 'unaffordable';
    
    if (upgrade.purchased) {
      cardState = 'purchased';
    } else if (upgrade.requires) {
      const requiredUpgrade = this.resourceManager.getUpgrades().find(u => u.id === upgrade.requires);
      if (!requiredUpgrade?.purchased) {
        cardState = 'locked';
      } else if (this.resourceManager.canAffordUpgrade(upgrade.id)) {
        cardState = 'available';
      }
    } else if (this.resourceManager.canAffordUpgrade(upgrade.id)) {
      cardState = 'available';
    }
    
    // Set card background based on state
    let bgColor: number;
    let textAlpha = 1;
    
    switch (cardState) {
      case 'purchased':
        bgColor = UITheme.BUTTON_DISABLED;
        textAlpha = 0.7;
        break;
      case 'available':
        bgColor = UITheme.UPGRADE_AVAILABLE;
        break;
      case 'locked':
        bgColor = UITheme.UPGRADE_LOCKED;
        textAlpha = 0.6;
        break;
      case 'unaffordable':
      default:
        bgColor = UITheme.BUTTON_DEFAULT;
        break;
    }
    
    // Create card background
    const cardBg = this.scene.add.rectangle(0, 0, width, height, bgColor, 0.9);
    cardBg.setOrigin(0, 0);
    cardBg.setStrokeStyle(2, UITheme.ACCENT);
    
    // Add top accent bar
    const accentBar = this.scene.add.rectangle(0, 0, width, 6, UITheme.ACCENT);
    accentBar.setOrigin(0, 0);
    
    // Create upgrade title
    const titleText = this.uiManager.createText(upgrade.name, UIConstants.FONT_SIZE.MEDIUM);
    titleText.setPosition(width / 2, 20);
    titleText.setOrigin(0.5, 0);
    titleText.setFontStyle('bold');
    titleText.setAlpha(textAlpha);
    
    // Create description
    const descText = this.uiManager.createText(upgrade.description, UIConstants.FONT_SIZE.SMALL, UITheme.TEXT_SECONDARY);
    descText.setPosition(width / 2, 55);
    descText.setOrigin(0.5, 0);
    descText.setWordWrapWidth(width - 20);
    descText.setAlign('center');
    descText.setAlpha(textAlpha);
    
    // Add separator line
    const separator = this.scene.add.graphics();
    separator.lineStyle(1, UITheme.BACKGROUND_LIGHT, 0.8);
    separator.beginPath();
    separator.moveTo(10, 100);
    separator.lineTo(width - 10, 100);
    separator.closePath();
    separator.strokePath();
    
    // Add cost info
    let costText: Phaser.GameObjects.Text;
    
    if (cardState === 'purchased') {
      costText = this.uiManager.createText('PURCHASED', UIConstants.FONT_SIZE.SMALL, UITheme.SUCCESS);
    } else if (cardState === 'locked') {
      const requiredUpgrade = this.resourceManager.getUpgrades().find(u => u.id === upgrade.requires);
      costText = this.uiManager.createText(`REQUIRES: ${requiredUpgrade?.name || 'Unknown'}`, UIConstants.FONT_SIZE.SMALL, UITheme.ERROR);
    } else {
      costText = this.uiManager.createText(`COST:`, UIConstants.FONT_SIZE.SMALL, UITheme.TEXT_SECONDARY);
    }
    costText.setPosition(width / 2, 110);
    costText.setOrigin(0.5, 0);
    costText.setAlpha(textAlpha);
    
    // Only show resource costs if not purchased and not locked
    const elements = [cardBg, accentBar, titleText, descText, separator, costText];
    
    if (cardState !== 'purchased' && cardState !== 'locked') {
      // Create metal cost
      const metalIcon = this.createResourceCostIcon(width / 2 - 40, 135, UITheme.METAL);
      const metalCost = this.uiManager.createText(upgrade.cost.metal.toString(), UIConstants.FONT_SIZE.SMALL, UITheme.METAL);
      metalCost.setPosition(width / 2 - 40 + 15, 135);
      metalCost.setOrigin(0, 0.5);
      
      // Create crystal cost
      const crystalIcon = this.createResourceCostIcon(width / 2 + 20, 135, UITheme.CRYSTAL);
      const crystalCost = this.uiManager.createText(upgrade.cost.crystal.toString(), UIConstants.FONT_SIZE.SMALL, UITheme.CRYSTAL);
      crystalCost.setPosition(width / 2 + 20 + 15, 135);
      crystalCost.setOrigin(0, 0.5);
      
      elements.push(metalIcon, metalCost, crystalIcon, crystalCost);
    }
    
    // Add purchase button if not purchased and not locked
    if (cardState !== 'purchased' && cardState !== 'locked') {
      const canAfford = this.resourceManager.canAffordUpgrade(upgrade.id);
      const buttonText = canAfford ? 'PURCHASE' : 'CANNOT AFFORD';
      const buttonColor = canAfford ? UITheme.SUCCESS : UITheme.ERROR;
      
      const buttonBg = this.scene.add.rectangle(width / 2, height - 30, width - 20, 40, buttonColor);
      buttonBg.setOrigin(0.5, 0.5);
      
      const purchaseText = this.uiManager.createText(buttonText, UIConstants.FONT_SIZE.SMALL);
      purchaseText.setPosition(width / 2, height - 30);
      purchaseText.setOrigin(0.5, 0.5);
      
      elements.push(buttonBg, purchaseText);
      
      // Make button interactive
      if (canAfford) {
        buttonBg.setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
            buttonBg.setFillStyle(0x0da271); // Darker green
          })
          .on('pointerout', () => {
            buttonBg.setFillStyle(UITheme.SUCCESS);
          })
          .on('pointerdown', () => {
            this.purchaseUpgrade(upgrade);
          });
      }
    }
    
    // Add visual effects to specific card states
    if (cardState === 'available') {
      // Add pulsing effect for available upgrades
      this.scene.tweens.add({
        targets: accentBar,
        alpha: 0.6,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
    } else if (cardState === 'purchased') {
      // Add checkmark icon
      const checkmark = this.scene.add.graphics();
      checkmark.fillStyle(UITheme.SUCCESS, 1);
      checkmark.beginPath();
      checkmark.arc(width - 20, 20, 10, 0, Math.PI * 2);
      checkmark.closePath();
      checkmark.fillPath();
      
      // Draw checkmark
      checkmark.lineStyle(2, UITheme.TEXT_PRIMARY, 1);
      checkmark.beginPath();
      checkmark.moveTo(width - 25, 20);
      checkmark.lineTo(width - 20, 25);
      checkmark.lineTo(width - 15, 15);
      checkmark.closePath();
      checkmark.strokePath();
      
      elements.push(checkmark);
    }
    
    // Make the whole card interactive
    cardBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        // Highlight on hover
        if (cardState !== 'purchased' && cardState !== 'locked') {
          cardBg.setStrokeStyle(3, UITheme.ACCENT);
        }
      })
      .on('pointerout', () => {
        cardBg.setStrokeStyle(2, UITheme.ACCENT);
      });
    
    // Add all elements to container
    container.add(elements);
    
    return container;
  }
  
  private createResourceCostIcon(x: number, y: number, color: number): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    
    // Draw resource icon
    graphics.fillStyle(color, 1);
    graphics.lineStyle(1, 0xffffff, 0.8);
    
    // Draw circle
    graphics.fillCircle(x, y, 8);
    graphics.strokeCircle(x, y, 8);
    
    return graphics;
  }
  
  private purchaseUpgrade(upgrade: ShipUpgrade) {
    const success = this.resourceManager.purchaseUpgrade(upgrade.id);
    if (success) {
      // Play success animation
      this.scene.cameras.main.flash(200, 255, 255, 255, false);
      
      // Add success sound effect if available
      // this.scene.sound.play('purchase');
      
      // Update the card to reflect purchased state
      this.showTierUpgrades(this.currentTier);
    }
  }
  
  update() {
    // Refresh the current tier display in case affordability has changed
    this.showTierUpgrades(this.currentTier);
  }
  
  show() {
    this.container.setVisible(true);
  }
  
  hide() {
    this.container.setVisible(false);
  }
  
  destroy() {
    this.container.destroy();
  }
} 