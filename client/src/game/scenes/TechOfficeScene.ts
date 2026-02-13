/**
 * TECHOFFICE SCENE — Tech Company Office
 *
 * NPCs: Casey (HR Manager)
 * Activities: Interviews, technical assessments
 * Connections: Library (west), Home (south)
 */

import { BaseWorldScene, LocationConfig } from './BaseWorldScene';

export class TechOfficeScene extends BaseWorldScene {
  constructor() {
    const locationConfig: LocationConfig = {
      sceneKey: 'TechOfficeScene',
      displayName: 'Tech Company - Office Building',
      backgroundColor: 0x42425a,
      npcIds: ['casey_hr'],
      exits: [
        {
          name: 'Go to Library',
          targetScene: 'LibraryScene',
          x: 974,
          y: 300,
          width: 50,
          height: 200,
        },
        {
          name: 'Go to Home',
          targetScene: 'HomeScene',
          x: 512,
          y: 730,
          width: 100,
          height: 38,
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
