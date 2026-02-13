/**
 * PARKSCENE — City Park
 *
 * NPCs: Jordan (peer support)
 * Activities: Networking, relaxation
 * Connections: Downtown (west)
 */

import { BaseWorldScene, LocationConfig } from './BaseWorldScene';

export class ParkScene extends BaseWorldScene {
  constructor() {
    const locationConfig: LocationConfig = {
      sceneKey: 'ParkScene',
      displayName: 'City Park - Green Space',
      backgroundColor: 0x4a5a4a,
      npcIds: ['jordan_peer'],
      exits: [
        {
          name: 'Go to Downtown',
          targetScene: 'DowntownScene',
          x: 50,
          y: 300,
          width: 50,
          height: 200,
        },
      ],
    };

    super(locationConfig);
  }

  update(time: number, delta: number) {
    super.update(time, delta);
    this.checkLocationExits();
  }

  protected checkLocationExits() {
    for (const exit of this.locationConfig.exits) {
      const zone = new Phaser.Geom.Rectangle(exit.x, exit.y, exit.width, exit.height);
      if (Phaser.Geom.Rectangle.Contains(zone, this.player.x, this.player.y)) {
        console.log(`✨ Transitioning to ${exit.targetScene}`);
        this.scene.start(exit.targetScene);
        break;
      }
    }
  }
}
