/**
 * COFFEECHATSCENE — Coffee Chat Activity
 *
 * A casual conversation activity with an NPC
 * Triggered from NPC dialogue when relationship is strong enough
 * 
 * Mechanics:
 * - Player chooses conversation topics
 * - NPC responds based on player stats
 * - Increases relationship trust
 * - Returns to location after ~5 minutes game time
 */

import * as Phaser from 'phaser';
import type { SeedStats } from '@/server/src/engine/stat-seeder';
import { UI_LAYERS, DIALOGUE_UI_CONFIG } from '@/game/GameConfig';

// Placeholder types and data
interface WorldNPC {
  npcId: string;
  name: string;
  location: string;
  x: number;
  y: number;
  sprite: string;
}

const NPC_DATABASE: { [key: string]: WorldNPC } = {
  sarah: { npcId: 'sarah', name: 'Sarah', location: 'downtown', x: 300, y: 300, sprite: 'npc_recruiter' },
  alex: { npcId: 'alex', name: 'Alex', location: 'library', x: 400, y: 250, sprite: 'npc_mentor' },
  casey: { npcId: 'casey', name: 'Casey', location: 'tech-office', x: 350, y: 350, sprite: 'npc_hr' },
  jordan: { npcId: 'jordan', name: 'Jordan', location: 'downtown', x: 500, y: 200, sprite: 'npc_peer' },
  family: { npcId: 'family', name: 'Family', location: 'home', x: 250, y: 300, sprite: 'npc_family' },
};

export class CoffeeChatScene extends Phaser.Scene {
  private npcId: string = '';
  private returnScene: string = '';
  private gameState: any = {};
  private elapsedTime: number = 0;
  private chatPanel: ChatPanel | null = null;

  constructor() {
    super('CoffeeChatScene');
  }

  init(data: any) {
    this.npcId = data.npcId;
    this.returnScene = data.returnScene || 'DowntownScene';
    this.gameState = data.gameState || {};
  }

  create() {
    // Create simple cafe background
    this.createBackground();

    // Create chat panel
    this.chatPanel = new ChatPanel(this, DIALOGUE_UI_CONFIG);

    // Get NPC data
    const npcDb = NPC_DATABASE[this.npcId as keyof typeof NPC_DATABASE];
    if (!npcDb) {
      console.error(`NPC not found: ${this.npcId}`);
      this.returnToLocation();
      return;
    }

    // Start chat
    this.startChat();

    // Timer to auto-return after 2 real seconds (5 game minutes)
    this.time.delayedCall(2000, () => {
      this.returnToLocation();
    });
  }

  update(time: number, delta: number) {
    this.elapsedTime += delta;
  }

  private createBackground() {
    // Cafe background
    const graphics = this.make.graphics({ x: 0, y: 0, add: true });
    graphics.fillStyle(0x8b7355);
    graphics.fillRect(0, 0, 1024, 768);
    graphics.setDepth(UI_LAYERS.world);

    // Title
    this.add
      .text(512, 50, '☕ Coffee Shop', {
        fontSize: '28px',
        color: '#d4a574',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);

    // Instructions
    this.add
      .text(512, 700, 'Enjoy a coffee break...', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);
  }

  private startChat() {
    const npcDb = NPC_DATABASE[this.npcId as keyof typeof NPC_DATABASE];
    if (!npcDb || !this.chatPanel) return;

    // Simple coffee chat options
    const chatOptions = [
      { id: 'work', text: 'How is your work going?' },
      { id: 'life', text: 'Tell me about your life...' },
      { id: 'advice', text: 'Any advice for me?' },
    ];

    this.chatPanel.show(npcDb.name, 'We sit down at a cozy cafe...', chatOptions, (option) => {
      this.handleChatOption(option);
    });
  }

  private handleChatOption(option: string) {
    // Apply minimal stat changes for engagement
    this.gameState.stats = this.gameState.stats || {};
    this.gameState.stats.stress = Math.max(0, (this.gameState.stats.stress || 50) - 10);
    this.gameState.stats.confidence = Math.min(
      100,
      (this.gameState.stats.confidence || 50) + 5
    );

    // Return to location
    this.returnToLocation();
  }

  private returnToLocation() {
    console.log(`✨ Returning to ${this.returnScene}`);
    this.scene.stop('CoffeeChatScene');
    this.scene.resume(this.returnScene);
  }
}

/**
 * Simple chat panel for coffee chat activities
 */
class ChatPanel {
  private scene: Phaser.Scene;
  private config: any;
  private panel!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private contentText!: Phaser.GameObjects.Text;
  private optionButtons: Array<{ bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> =
    [];

  constructor(scene: Phaser.Scene, config: any) {
    this.scene = scene;
    this.config = config;
    this.createPanel();
  }

  private createPanel() {
    // Background
    this.panel = this.scene.add.rectangle(512, 400, 800, 300, 0xf5e6d3);
    this.panel.setStrokeStyle(3, 0x8b7355);
    this.panel.setDepth(UI_LAYERS.modal);
    this.panel.setVisible(false);

    // Title
    this.titleText = this.scene.add.text(512, 200, '', {
      fontSize: '18px',
      color: '#000000',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setDepth(UI_LAYERS.modal);
    this.titleText.setVisible(false);

    // Content
    this.contentText = this.scene.add.text(512, 260, '', {
      fontSize: '14px',
      color: '#333333',
      wordWrap: { width: 700 },
      fontFamily: 'Arial',
    });
    this.contentText.setOrigin(0.5);
    this.contentText.setDepth(UI_LAYERS.modal);
    this.contentText.setVisible(false);
  }

  show(npcName: string, content: string, options: Array<any>, onSelect: (option: string) => void) {
    this.titleText.setText(`☕ ${npcName}`);
    this.titleText.setVisible(true);

    this.contentText.setText(content);
    this.contentText.setVisible(true);

    this.panel.setVisible(true);

    // Create option buttons
    let yOffset = 360;
    options.forEach((option) => {
      const bgRect = this.scene.add.rectangle(512, yOffset, 700, 35, 0xd4a574);
      bgRect.setStrokeStyle(2, 0x8b7355);
      bgRect.setInteractive();
      bgRect.setDepth(UI_LAYERS.modal);

      const text = this.scene.add.text(512, yOffset, option.text, {
        fontSize: '13px',
        color: '#000000',
        fontFamily: 'Arial',
      });
      text.setOrigin(0.5);
      text.setDepth(UI_LAYERS.modal);

      bgRect.on('pointerdown', () => {
        this.hide();
        onSelect(option.id);
      });

      this.optionButtons.push({ bg: bgRect, text });
      yOffset += 45;
    });
  }

  hide() {
    this.panel.setVisible(false);
    this.titleText.setVisible(false);
    this.contentText.setVisible(false);
    this.optionButtons.forEach(({ bg, text }) => {
      bg.destroy();
      text.destroy();
    });
    this.optionButtons = [];
  }
}
