// @ts-nocheck
/**
 * HOMESCENE — Player's Home
 *
 * NPCs: Family (emotional support/pressure)
 * Activities: Rest, stress relief
 * Connections: Tech Office (north)
 */

import { BaseWorldScene, LocationConfig } from './BaseWorldScene';

export class HomeScene extends BaseWorldScene {
  constructor() {
    const locationConfig: LocationConfig = {
      sceneKey: 'HomeScene',
      displayName: 'Home - Apartment',
      backgroundColor: 0x2a2a3a,
      npcIds: ['family_support'],
      exits: [
        {
          name: 'Go to Tech Office',
          targetScene: 'TechOfficeScene',
          x: 512,
          y: 50,
          width: 100,
          height: 50,
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
