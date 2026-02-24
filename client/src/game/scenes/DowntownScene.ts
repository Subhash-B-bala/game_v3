// @ts-nocheck
/**
 * DOWNTOWNSCENE — Downtown Location
 *
 * NPCs: Sarah (recruiter), Jordan (peer)
 * Activities: Coffee chat, informal networking
 * Connections: Library (north), Park (east)
 */

import { BaseWorldScene, LocationConfig } from './BaseWorldScene';

export class DowntownScene extends BaseWorldScene {
  constructor() {
    const locationConfig: LocationConfig = {
      sceneKey: 'DowntownScene',
      displayName: 'Downtown - Main Street',
      backgroundColor: 0x2a2a4e,
      npcIds: ['sarah_recruiter', 'jordan_peer'],
      exits: [
        {
          name: 'Go to Library',
          targetScene: 'LibraryScene',
          x: 50,
          y: 300,
          width: 50,
          height: 200,
        },
        {
          name: 'Go to Park',
          targetScene: 'ParkScene',
          x: 974,
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
