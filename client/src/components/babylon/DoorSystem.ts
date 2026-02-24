/**
 * DoorSystem — Handles building entrance/exit transitions
 *
 * Detects when the player is near a door block and allows entry via E key.
 * Manages indoor scene generation and exit back to the outdoor world.
 */

import type { DoorData } from './VoxelWorldGenerator';

export interface DoorSystemHandle {
  getNearestDoor: () => DoorData | null;
  getNearestDoorDistance: () => number;
  dispose: () => void;
}

const DOOR_INTERACTION_RADIUS = 3;

export async function createDoorSystem(
  scene: any,
  doors: DoorData[],
  getPlayerPosition: () => { x: number; y: number; z: number }
): Promise<DoorSystemHandle> {
  let nearestDoor: DoorData | null = null;
  let nearestDistance = Infinity;

  scene.onBeforeRenderObservable.add(() => {
    const playerPos = getPlayerPosition();
    nearestDoor = null;
    nearestDistance = Infinity;

    for (const door of doors) {
      const dx = playerPos.x - door.x;
      const dz = playerPos.z - door.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < DOOR_INTERACTION_RADIUS && dist < nearestDistance) {
        nearestDoor = door;
        nearestDistance = dist;
      }
    }
  });

  return {
    getNearestDoor: () => nearestDoor,
    getNearestDoorDistance: () => nearestDistance,
    dispose: () => {},
  };
}

/**
 * Generate a simple indoor room for a building
 */
export interface IndoorRoomData {
  buildingName: string;
  width: number;
  depth: number;
  height: number;
  blocks: Array<{ x: number; y: number; z: number; type: string; color: string }>;
  exitDoor: { x: number; y: number; z: number };
  npcSpawn: { x: number; y: number; z: number } | null;
}

export function generateIndoorRoom(buildingName: string): IndoorRoomData {
  const rooms: Record<string, { width: number; depth: number; height: number; floorColor: string; wallColor: string }> = {
    library: { width: 28, depth: 18, height: 4, floorColor: '#8D6E63', wallColor: '#455A64' },
    tech_office: { width: 23, depth: 18, height: 4, floorColor: '#ECEFF1', wallColor: '#37474F' },
    coffee_shop: { width: 13, depth: 10, height: 3, floorColor: '#D7CCC8', wallColor: '#795548' },
    home: { width: 16, depth: 12, height: 3, floorColor: '#EFEBE9', wallColor: '#795548' },
  };

  const config = rooms[buildingName] || { width: 15, depth: 12, height: 3, floorColor: '#BDBDBD', wallColor: '#607D8B' };
  const blocks: IndoorRoomData['blocks'] = [];

  // Floor
  for (let x = 0; x < config.width; x++) {
    for (let z = 0; z < config.depth; z++) {
      blocks.push({ x, y: 0, z, type: 'floor', color: config.floorColor });
    }
  }

  // Walls
  for (let y = 1; y <= config.height; y++) {
    for (let x = 0; x < config.width; x++) {
      // North wall
      const isWindowN = y >= 2 && x % 4 === 2;
      blocks.push({ x, y, z: 0, type: isWindowN ? 'window' : 'wall', color: isWindowN ? '#81D4FA' : config.wallColor });
      // South wall
      const isWindowS = y >= 2 && x % 4 === 2;
      blocks.push({ x, y, z: config.depth - 1, type: isWindowS ? 'window' : 'wall', color: isWindowS ? '#81D4FA' : config.wallColor });
    }
    for (let z = 1; z < config.depth - 1; z++) {
      // West wall
      blocks.push({ x: 0, y, z, type: 'wall', color: config.wallColor });
      // East wall
      blocks.push({ x: config.width - 1, y, z, type: 'wall', color: config.wallColor });
    }
  }

  // Ceiling
  for (let x = 0; x < config.width; x++) {
    for (let z = 0; z < config.depth; z++) {
      blocks.push({ x, y: config.height + 1, z, type: 'ceiling', color: '#EEEEEE' });
    }
  }

  // Furniture based on building type
  addFurniture(blocks, buildingName, config.width, config.depth);

  // Exit door (south wall, center)
  const exitX = Math.floor(config.width / 2);
  const exitZ = config.depth - 1;
  // Remove wall blocks at exit door position
  const doorBlockIndices: number[] = [];
  blocks.forEach((b, i) => {
    if (b.x === exitX && b.z === exitZ && b.y >= 1 && b.y <= 2) {
      doorBlockIndices.push(i);
    }
  });
  // Replace with door color
  for (const idx of doorBlockIndices) {
    blocks[idx] = { ...blocks[idx], type: 'door', color: '#A1887F' };
  }

  return {
    buildingName,
    width: config.width,
    depth: config.depth,
    height: config.height,
    blocks,
    exitDoor: { x: exitX, y: 1, z: exitZ },
    npcSpawn: { x: Math.floor(config.width / 2) - 2, y: 1.5, z: Math.floor(config.depth / 2) },
  };
}

function addFurniture(
  blocks: IndoorRoomData['blocks'],
  buildingName: string,
  width: number,
  depth: number
) {
  switch (buildingName) {
    case 'library':
      // Bookshelves along walls
      for (let x = 2; x < width - 2; x += 3) {
        for (let y = 1; y <= 3; y++) {
          blocks.push({ x, y, z: 1, type: 'bookshelf', color: '#5D4037' });
        }
      }
      // Reading tables
      for (let x = 5; x < width - 5; x += 6) {
        blocks.push({ x, y: 1, z: Math.floor(depth / 2), type: 'table', color: '#8D6E63' });
        blocks.push({ x: x + 1, y: 1, z: Math.floor(depth / 2), type: 'table', color: '#8D6E63' });
      }
      break;

    case 'tech_office':
      // Desk rows
      for (let x = 3; x < width - 3; x += 4) {
        blocks.push({ x, y: 1, z: 4, type: 'desk', color: '#BDBDBD' });
        blocks.push({ x, y: 1.5, z: 4, type: 'monitor', color: '#1A237E' }); // computer
        blocks.push({ x, y: 1, z: 8, type: 'desk', color: '#BDBDBD' });
        blocks.push({ x, y: 1.5, z: 8, type: 'monitor', color: '#1A237E' });
      }
      // Whiteboard
      blocks.push({ x: 1, y: 2, z: Math.floor(depth / 2), type: 'whiteboard', color: '#FFFFFF' });
      blocks.push({ x: 1, y: 3, z: Math.floor(depth / 2), type: 'whiteboard', color: '#FFFFFF' });
      break;

    case 'coffee_shop':
      // Counter
      for (let x = 2; x < 6; x++) {
        blocks.push({ x, y: 1, z: 2, type: 'counter', color: '#5D4037' });
      }
      // Tables
      blocks.push({ x: 3, y: 1, z: 6, type: 'table', color: '#8D6E63' });
      blocks.push({ x: 8, y: 1, z: 5, type: 'table', color: '#8D6E63' });
      blocks.push({ x: 8, y: 1, z: 8, type: 'table', color: '#8D6E63' });
      break;

    case 'home':
      // Bed
      blocks.push({ x: 2, y: 1, z: 2, type: 'bed', color: '#1565C0' });
      blocks.push({ x: 3, y: 1, z: 2, type: 'bed', color: '#1565C0' });
      // Desk
      blocks.push({ x: 8, y: 1, z: 2, type: 'desk', color: '#8D6E63' });
      blocks.push({ x: 8, y: 1.5, z: 2, type: 'monitor', color: '#1A237E' });
      // Couch
      blocks.push({ x: 4, y: 1, z: 7, type: 'couch', color: '#4E342E' });
      blocks.push({ x: 5, y: 1, z: 7, type: 'couch', color: '#4E342E' });
      blocks.push({ x: 6, y: 1, z: 7, type: 'couch', color: '#4E342E' });
      // Kitchen counter
      blocks.push({ x: 10, y: 1, z: 2, type: 'counter', color: '#BDBDBD' });
      blocks.push({ x: 11, y: 1, z: 2, type: 'counter', color: '#BDBDBD' });
      break;
  }
}

/**
 * Render an indoor room in the Babylon.js scene
 */
export async function renderIndoorRoom(
  roomData: IndoorRoomData,
  scene: any
): Promise<{ collisionMeshes: any[] }> {
  const BABYLON = await import('@babylonjs/core');

  const collisionMeshes: any[] = [];

  // Group blocks by color for instanced rendering
  const blocksByColor = new Map<string, Array<{ x: number; y: number; z: number }>>();
  for (const block of roomData.blocks) {
    if (!blocksByColor.has(block.color)) {
      blocksByColor.set(block.color, []);
    }
    blocksByColor.get(block.color)!.push({ x: block.x, y: block.y, z: block.z });
  }

  let meshIdx = 0;
  for (const [colorHex, positions] of blocksByColor) {
    const baseMesh = BABYLON.MeshBuilder.CreateBox(`indoor_block_${meshIdx}`, { size: 1 }, scene);
    const mat = new BABYLON.StandardMaterial(`indoor_mat_${meshIdx}`, scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString(colorHex);

    if (colorHex === '#81D4FA') {
      mat.emissiveColor = BABYLON.Color3.FromHexString(colorHex).scale(0.3);
      mat.alpha = 0.8;
    }
    if (colorHex === '#1A237E') {
      mat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.5);
    }
    if (colorHex === '#FFFFFF') {
      mat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    }

    baseMesh.material = mat;
    baseMesh.isVisible = false;

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const instance = baseMesh.createInstance(`indoor_${meshIdx}_${i}`);
      instance.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);

      // Wall blocks have collision
      if (pos.y >= 1 && pos.y <= roomData.height) {
        const block = roomData.blocks.find(b => b.x === pos.x && b.y === pos.y && b.z === pos.z);
        if (block && (block.type === 'wall' || block.type === 'bookshelf' || block.type === 'counter')) {
          instance.checkCollisions = true;
          collisionMeshes.push(instance);
        }
      }
    }

    meshIdx++;
  }

  // Indoor lighting
  const ambientLight = new BABYLON.HemisphericLight('indoor_ambient', new BABYLON.Vector3(0, 1, 0), scene);
  ambientLight.intensity = 0.5;
  ambientLight.diffuse = new BABYLON.Color3(1, 0.95, 0.85);

  const pointLight = new BABYLON.PointLight(
    'indoor_light',
    new BABYLON.Vector3(roomData.width / 2, roomData.height, roomData.depth / 2),
    scene
  );
  pointLight.intensity = 0.8;
  pointLight.diffuse = new BABYLON.Color3(1, 0.95, 0.85);

  // Ground collision
  const ground = BABYLON.MeshBuilder.CreateGround(
    'indoor_ground_collision',
    { width: roomData.width, height: roomData.depth },
    scene
  );
  ground.position = new BABYLON.Vector3(roomData.width / 2, 0.5, roomData.depth / 2);
  ground.isVisible = false;
  ground.checkCollisions = true;
  collisionMeshes.push(ground);

  return { collisionMeshes };
}
