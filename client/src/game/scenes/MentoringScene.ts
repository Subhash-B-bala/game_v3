// @ts-nocheck
/**
 * MENTORINGSCENE — Mentoring Session Activity
 *
 * Player receives mentorship from Alex (or other mentors)
 * Mechanics:
 * - Receive advice
 * - Increase confidence and technical skills
 * - Strengthen mentor relationship
 */

import * as Phaser from 'phaser';
import { UI_LAYERS } from '@/game/GameConfig';

export class MentoringScene extends Phaser.Scene {
  private npcId: string = '';
  private returnScene: string = '';

  constructor() {
    super('MentoringScene');
  }

  init(data: any) {
    this.npcId = data.npcId;
    this.returnScene = data.returnScene || 'LibraryScene';
  }

  create() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: true });
    graphics.fillStyle(0x3a3a5a);
    graphics.fillRect(0, 0, 1024, 768);
    graphics.setDepth(UI_LAYERS.world);

    this.add
      .text(512, 150, '🎓 Mentoring Session', {
        fontSize: '32px',
        color: '#16c784',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);

    this.add
      .text(512, 250, 'Your mentor provides valuable guidance...', {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);

    this.add
      .text(512, 320, 'Confidence +10', {
        fontSize: '18px',
        color: '#16c784',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);

    this.add
      .text(512, 370, 'Technical Depth +8', {
        fontSize: '18px',
        color: '#16c784',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);

    this.add
      .text(512, 420, 'Stress -5', {
        fontSize: '18px',
        color: '#16c784',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);

    this.add
      .text(512, 650, 'Click to continue...', {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);

    // Return on any click
    this.input.on('pointerdown', () => {
      this.returnToLocation();
    });

    // Auto-return after 3 seconds
    this.time.delayedCall(3000, () => {
      this.returnToLocation();
    });
  }

  private returnToLocation() {
    console.log(`✨ Returning to ${this.returnScene}`);
    this.scene.stop('MentoringScene');
    this.scene.resume(this.returnScene);
  }
}
