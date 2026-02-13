/**
 * LIBRARYSCENE — Library Location
 *
 * NPCs: Alex (mentor)
 * Activities: Mentoring sessions, advice
 * Connections: Downtown (south), Tech Office (east)
 */

import { BaseWorldScene, LocationConfig } from './BaseWorldScene';

export class LibraryScene extends BaseWorldScene {
  constructor() {
    const locationConfig: LocationConfig = {
      sceneKey: 'LibraryScene',
      displayName: 'City Library - Study Area',
      backgroundColor: 0x3a3a5a,
      npcIds: ['alex_mentor'],
      exits: [
        {
          name: 'Go to Downtown',
          targetScene: 'DowntownScene',
          x: 974,
          y: 300,
          width: 50,
          height: 200,
        },
        {
          name: 'Go to Tech Office',
          targetScene: 'TechOfficeScene',
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
