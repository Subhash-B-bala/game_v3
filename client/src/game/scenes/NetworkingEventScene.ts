// @ts-nocheck
/**
 * NETWORKINGEVENTSCENE — Networking Event Activity
 *
 * Player attends a networking event to build connections
 * Mechanics:
 * - Meet new contacts
 * - Increase network stat
 * - Potential job referrals
 */

import * as Phaser from 'phaser';
import { UI_LAYERS } from '@/game/GameConfig';

export class NetworkingEventScene extends Phaser.Scene {
  private returnScene: string = '';

  constructor() {
    super('NetworkingEventScene');
  }

  init(data: any) {
    this.returnScene = data.returnScene || 'DowntownScene';
  }

  create() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: true });
    graphics.fillStyle(0x5a6a7a);
    graphics.fillRect(0, 0, 1024, 768);
    graphics.setDepth(UI_LAYERS.world);

    this.add
      .text(512, 150, '🎉 Networking Event', {
        fontSize: '32px',
        color: '#16c784',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);

    this.add
      .text(512, 250, 'You meet several professionals...', {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);

    this.add
      .text(512, 350, 'Network +15', {
        fontSize: '18px',
        color: '#16c784',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);

    this.add
      .text(512, 400, 'Confidence +5', {
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
    this.scene.stop('NetworkingEventScene');
    this.scene.resume(this.returnScene);
  }
}
