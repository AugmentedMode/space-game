import Phaser from 'phaser';
import { ResourceManager, ShipUpgrade } from '../../systems/ResourceManager';
import { UIManager, UITheme, UIConstants } from '../UIManager';

export class UpgradesPanel {
  private scene: Phaser.Scene;
  private uiManager: UIManager;
  private resourceManager: ResourceManager;
  public container: Phaser.GameObjects.Container;
  
  private upgradeButtons: Record<string, Phaser.GameObjects.Container> = {};
  private upgradeCardsContainer: Phaser.GameObjects.Container;
  private connectionLines: Phaser.GameObjects.Graphics;
  private panelWidth: number = 700;
  private panelHeight: number = 600;
  
  // Tree visualization parameters
  private gridSize: number = 150;  // Distance between nodes in grid
  private nodeWidth: number = 120;
  private nodeHeight: number = 120;
  private scrollOffset: number = 0;
  private maxScroll: number = 0;
  
  constructor(scene: Phaser.Scene, uiManager: UIManager, resourceManager: ResourceManager, x: number, y: number) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.resourceManager = resourceManager;
    
    // Create main container
    this.container = this.scene.add.container(x, y);
    
    // Create panel background
    const panelBg = this.uiManager.createPanel(0, 0, this.panelWidth, this.panelHeight, UITheme.BACKGROUND_LIGHT);
    this.container.add(panelBg);
    
    // Create title
    const titleText = this.uiManager.createText('SHIP UPGRADES', UIConstants.FONT_SIZE.MEDIUM);
    titleText.setPosition(this.panelWidth / 2, 20);
    titleText.setFontStyle('bold');
    this.container.add(titleText);
    
    // Create scroll controls
    this.createScrollControls();
    
    // Create graphics for connection lines
    this.connectionLines = this.scene.add.graphics();
    
    // Create container for upgrade nodes
    this.upgradeCardsContainer = this.scene.add.container(0, 60);
    this.upgradeCardsContainer.add(this.connectionLines);
    
    // Create mask for scrolling
    const mask = this.scene.make.graphics({});
    mask.fillStyle(0xffffff);
    mask.fillRect(x, y + 60, this.panelWidth, this.panelHeight - 80);
    
    // Apply mask to the upgrades container
    this.upgradeCardsContainer.setMask(mask.createGeometryMask());
    
    this.container.add(this.upgradeCardsContainer);
    
    // Initial rendering of upgrade tree
    this.renderUpgradeTree();
  }
  
  private createScrollControls() {
    // Up button
    const upButton = this.uiManager.createButton('▲', 40, 40, () => {
      this.scroll(100); // Scroll up by 100 pixels
    });
    upButton.setPosition(this.panelWidth - 30, 80);
    
    // Down button
    const downButton = this.uiManager.createButton('▼', 40, 40, () => {
      this.scroll(-100); // Scroll down by 100 pixels
    });
    downButton.setPosition(this.panelWidth - 30, this.panelHeight - 80);
    
    this.container.add([upButton, downButton]);
  }
  
  private scroll(amount: number) {
    // Calculate new scroll position
    const newOffset = Math.min(0, Math.max(this.scrollOffset + amount, -this.maxScroll));
    
    // Only apply if changed
    if (newOffset !== this.scrollOffset) {
      this.scrollOffset = newOffset;
      this.upgradeCardsContainer.y = 60 + this.scrollOffset;
      
      // Update connection lines when scrolling
      this.renderConnectionLines();
    }
  }
  
  private renderUpgradeTree() {
    // Clear existing upgrade cards
    this.upgradeCardsContainer.removeAll(true);
    this.upgradeButtons = {};
    
    // Re-add the graphics object for connection lines
    this.connectionLines = this.scene.add.graphics();
    this.upgradeCardsContainer.add(this.connectionLines);
    
    // Get root upgrade(s)
    const rootUpgrades = this.resourceManager.getRootUpgrades();
    
    // Start recursive rendering from root nodes
    rootUpgrades.forEach(rootUpgrade => {
      this.renderUpgradeNode(rootUpgrade);
    });
    
    // Draw connections between nodes
    this.renderConnectionLines();
    
    // Calculate max scroll based on tree size
    this.calculateMaxScroll();
  }
  
  private renderConnectionLines() {
    // Clear previous lines
    this.connectionLines.clear();
    
    // Get all upgrades
    const upgrades = this.resourceManager.getUpgrades();
    
    // Draw lines for each upgrade that has children
    upgrades.forEach(upgrade => {
      if (upgrade.children && upgrade.children.length > 0 && upgrade.treePosition) {
        const parentPos = this.getNodePosition(upgrade.treePosition);
        const startX = parentPos.x + this.nodeWidth / 2;
        const startY = parentPos.y + this.nodeHeight / 2;
        
        // For each child, draw connection line
        upgrade.children.forEach(childId => {
          const childUpgrade = upgrades.find(u => u.id === childId);
          if (childUpgrade && childUpgrade.treePosition) {
            const childPos = this.getNodePosition(childUpgrade.treePosition);
            const endX = childPos.x + this.nodeWidth / 2;
            const endY = childPos.y + this.nodeHeight / 2;
            
            // Set line style based on purchase status
            if (upgrade.purchased && childUpgrade.purchased) {
              // Both nodes purchased - bright line
              this.connectionLines.lineStyle(3, UITheme.SUCCESS, 0.8);
            } else if (upgrade.purchased) {
              // Only parent purchased - available connection
              this.connectionLines.lineStyle(3, UITheme.PRIMARY, 0.8);
            } else {
              // Neither purchased - dimmed line
              this.connectionLines.lineStyle(2, UITheme.BUTTON_DEFAULT, 0.4);
            }
            
            // Draw line
            this.connectionLines.beginPath();
            this.connectionLines.moveTo(startX, startY);
            this.connectionLines.lineTo(endX, endY);
            this.connectionLines.closePath();
            this.connectionLines.strokePath();
          }
        });
      }
    });
  }
  
  private renderUpgradeNode(upgrade: ShipUpgrade) {
    if (!upgrade.treePosition) return;
    
    // Calculate position based on tree position
    const position = this.getNodePosition(upgrade.treePosition);
    
    // Create node at position
    const node = this.createUpgradeNode(upgrade, position.x, position.y);
    this.upgradeCardsContainer.add(node);
    
    // Store reference
    this.upgradeButtons[upgrade.id] = node;
    
    // Recursively render children
    if (upgrade.children) {
      upgrade.children.forEach(childId => {
        const childUpgrade = this.resourceManager.getUpgrades().find(u => u.id === childId);
        if (childUpgrade) {
          this.renderUpgradeNode(childUpgrade);
        }
      });
    }
  }
  
  private getNodePosition(treePosition: {x: number, y: number}) {
    // Center the origin point
    const centerX = this.panelWidth / 2;
    const centerY = 100;
    
    // Calculate position with grid spacing
    return {
      x: centerX + treePosition.x * this.gridSize,
      y: centerY + treePosition.y * this.gridSize
    };
  }
  
  private calculateMaxScroll() {
    // Find the lowest node in the tree
    const upgrades = this.resourceManager.getUpgrades();
    let maxY = 0;
    
    upgrades.forEach(upgrade => {
      if (upgrade.treePosition) {
        const position = this.getNodePosition(upgrade.treePosition);
        maxY = Math.max(maxY, position.y + this.nodeHeight);
      }
    });
    
    // Calculate how much we need to scroll to see all nodes
    this.maxScroll = Math.max(0, maxY - (this.panelHeight - 100));
  }
  
  private createUpgradeNode(upgrade: ShipUpgrade, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Determine node state
    let nodeState: 'purchased' | 'available' | 'locked' = 'locked';
    
    if (upgrade.purchased) {
      nodeState = 'purchased';
    } else if (upgrade.requires) {
      // Check if all requirements are purchased
      const canPurchase = upgrade.requires.every(requiredId => {
        const requiredUpgrade = this.resourceManager.getUpgrades().find(u => u.id === requiredId);
        return requiredUpgrade?.purchased === true;
      });
      
      if (canPurchase) {
        nodeState = 'available';
      }
    } else {
      nodeState = 'available';
    }
    
    // Set background color based on state
    let bgColor: number;
    let textAlpha = 1;
    
    switch (nodeState) {
      case 'purchased':
        bgColor = UITheme.SUCCESS;
        break;
      case 'available':
        bgColor = UITheme.PRIMARY;
        break;
      case 'locked':
      default:
        bgColor = UITheme.BUTTON_DEFAULT;
        textAlpha = 0.6;
        break;
    }
    
    // Create node background
    const nodeBg = this.scene.add.rectangle(0, 0, this.nodeWidth, this.nodeHeight, bgColor, 0.8);
    nodeBg.setOrigin(0, 0);
    nodeBg.setStrokeStyle(2, UITheme.ACCENT);
    
    // Create upgrade icon (placeholder)
    const iconBg = this.scene.add.circle(this.nodeWidth / 2, 30, 20, 0xffffff, 0.3);
    
    // Show upgrade name
    const nameText = this.uiManager.createText(upgrade.name, UIConstants.FONT_SIZE.SMALL);
    nameText.setPosition(this.nodeWidth / 2, 60);
    nameText.setOrigin(0.5, 0);
    nameText.setAlpha(textAlpha);
    nameText.setWordWrapWidth(this.nodeWidth - 10);
    
    // Show cost for available upgrades
    let costText: Phaser.GameObjects.Text | null = null;
    
    if (nodeState === 'available') {
      const canAfford = this.resourceManager.canAffordUpgrade(upgrade.id);
      const costColor = canAfford ? UITheme.TEXT_PRIMARY : UITheme.ERROR;
      
      costText = this.uiManager.createText(
        `M: ${upgrade.cost.metal} C: ${upgrade.cost.crystal}`,
        UIConstants.FONT_SIZE.SMALL,
        costColor
      );
      costText.setPosition(this.nodeWidth / 2, this.nodeHeight - 20);
      costText.setOrigin(0.5, 0.5);
    }
    
    // Add elements to container
    const elements = [nodeBg, iconBg, nameText];
    if (costText) elements.push(costText);
    
    container.add(elements);
    
    // Make interactive
    nodeBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        nodeBg.setStrokeStyle(3, UITheme.ACCENT);
        this.showUpgradeTooltip(upgrade, container);
      })
      .on('pointerout', () => {
        nodeBg.setStrokeStyle(2, UITheme.ACCENT);
        this.hideUpgradeTooltip();
      })
      .on('pointerdown', () => {
        if (nodeState === 'available') {
          this.purchaseUpgrade(upgrade);
        }
      });
    
    return container;
  }
  
  private tooltip: Phaser.GameObjects.Container | null = null;
  
  private showUpgradeTooltip(upgrade: ShipUpgrade, targetNode: Phaser.GameObjects.Container) {
    // Hide any existing tooltip
    this.hideUpgradeTooltip();
    
    // Create tooltip container
    this.tooltip = this.scene.add.container(0, 0);
    this.container.add(this.tooltip);
    
    // Build tooltip content
    const tooltipWidth = 250;
    const tooltipHeight = 150;
    
    // Background
    const bg = this.scene.add.rectangle(0, 0, tooltipWidth, tooltipHeight, UITheme.BACKGROUND_DARK, 0.95);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, UITheme.ACCENT);
    
    // Title
    const title = this.uiManager.createText(upgrade.name, UIConstants.FONT_SIZE.MEDIUM);
    title.setPosition(tooltipWidth / 2, 10);
    title.setOrigin(0.5, 0);
    
    // Description
    const description = this.uiManager.createText(upgrade.description, UIConstants.FONT_SIZE.SMALL);
    description.setPosition(10, 40);
    description.setOrigin(0, 0);
    description.setWordWrapWidth(tooltipWidth - 20);
    
    // Cost
    const costText = this.uiManager.createText(
      `Cost: ${upgrade.cost.metal} Metal, ${upgrade.cost.crystal} Crystal`,
      UIConstants.FONT_SIZE.SMALL
    );
    costText.setPosition(10, tooltipHeight - 30);
    costText.setOrigin(0, 0);
    
    // Add all elements to tooltip
    this.tooltip.add([bg, title, description, costText]);
    
    // Position tooltip next to the node
    const targetBounds = targetNode.getBounds();
    
    // Position to the right if there's space, otherwise to the left
    if (targetBounds.right + tooltipWidth < this.panelWidth - 50) {
      this.tooltip.x = targetBounds.right + 10;
    } else {
      this.tooltip.x = targetBounds.left - tooltipWidth - 10;
    }
    
    this.tooltip.y = targetBounds.y;
    
    // Make sure tooltip is fully visible
    if (this.tooltip.y + tooltipHeight > this.panelHeight - 20) {
      this.tooltip.y = this.panelHeight - tooltipHeight - 20;
    }
  }
  
  private hideUpgradeTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
  }
  
  private purchaseUpgrade(upgrade: ShipUpgrade) {
    const success = this.resourceManager.purchaseUpgrade(upgrade.id);
    if (success) {
      // Play success animation
      this.scene.cameras.main.flash(200, 255, 255, 255, false);
      
      // Re-render the upgrade tree
      this.renderUpgradeTree();
    }
  }
  
  update() {
    // Update the upgrade tree - re-render on change
    const availableUpgrades = this.resourceManager.getAvailableUpgrades();
    for (const upgrade of availableUpgrades) {
      const button = this.upgradeButtons[upgrade.id];
      if (button) {
        // Update button state if needed
        const canAfford = this.resourceManager.canAffordUpgrade(upgrade.id);
        // Find cost text if it exists
        const costText = button.getAll().find(obj => 
          obj.type === 'Text' && 
          (obj as Phaser.GameObjects.Text).text.includes('M:')
        ) as Phaser.GameObjects.Text;
        
        if (costText) {
          costText.setColor(canAfford ? '#ffffff' : '#ff0000');
        }
      }
    }
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