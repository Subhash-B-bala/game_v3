/**
 * VoxelWorldGenerator — Procedurally generates a 200x200 voxel city block
 *
 * Uses Babylon.js InstancedMesh for performance (one draw call per block type).
 * The city has roads, buildings, a park, water, trees, NPCs, and doors.
 */

// Block type definitions
export enum BlockType {
  Grass = 'grass',
  Road = 'road',
  RoadLine = 'road_line',
  Sidewalk = 'sidewalk',
  BuildingWall = 'building_wall',
  BuildingWallAlt = 'building_wall_alt',
  BuildingWallDark = 'building_wall_dark',
  BuildingWindow = 'building_window',
  BuildingDoor = 'building_door',
  Water = 'water',
  TreeTrunk = 'tree_trunk',
  TreeLeaves = 'tree_leaves',
  Bench = 'bench',
  Lamppost = 'lamppost',
  Roof = 'roof',
  Fountain = 'fountain',
  MarketStall = 'market_stall',
  Flower = 'flower',
  Sand = 'sand',
  PathStone = 'path_stone',
}

// Color mapping for each block type
export const BLOCK_COLORS: Record<BlockType, string> = {
  [BlockType.Grass]: '#4CAF50',
  [BlockType.Road]: '#546E7A',
  [BlockType.RoadLine]: '#FFD600',
  [BlockType.Sidewalk]: '#BDBDBD',
  [BlockType.BuildingWall]: '#795548',
  [BlockType.BuildingWallAlt]: '#455A64',
  [BlockType.BuildingWallDark]: '#37474F',
  [BlockType.Water]: '#29B6F6',
  [BlockType.TreeTrunk]: '#5D4037',
  [BlockType.TreeLeaves]: '#2E7D32',
  [BlockType.Bench]: '#8D6E63',
  [BlockType.Lamppost]: '#424242',
  [BlockType.Roof]: '#D84315',
  [BlockType.BuildingWindow]: '#81D4FA',
  [BlockType.BuildingDoor]: '#A1887F',
  [BlockType.Fountain]: '#4FC3F7',
  [BlockType.MarketStall]: '#FF8A65',
  [BlockType.Flower]: '#E91E63',
  [BlockType.Sand]: '#D7CCC8',
  [BlockType.PathStone]: '#9E9E9E',
};

// Block placement data
interface BlockInstance {
  x: number;
  y: number;
  z: number;
  type: BlockType;
}

// NPC spawn data
export interface NPCSpawn {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  color: string;
  role: string;
  zone: string;
}

// Door data
export interface DoorData {
  id: string;
  x: number;
  y: number;
  z: number;
  targetBuilding: string;
  label: string;
}

// Zone data for area name display
export interface ZoneArea {
  name: string;
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
}

// Building definition
interface BuildingDef {
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number; // in blocks above ground
  wallType: BlockType;
  doorSide: 'north' | 'south' | 'east' | 'west';
  doorOffset: number; // offset along the door side
}

export interface WorldData {
  blocks: BlockInstance[];
  npcs: NPCSpawn[];
  doors: DoorData[];
  zones: ZoneArea[];
  playerSpawn: { x: number; y: number; z: number };
}

const WORLD_SIZE = 200;
const ROAD_WIDTH = 6;
const SIDEWALK_WIDTH = 2;
const MAIN_ROAD_Z = 95; // Horizontal main road
const SIDE_ROAD_X = 95; // Vertical side road

export function generateWorld(): WorldData {
  const blocks: BlockInstance[] = [];
  const npcs: NPCSpawn[] = [];
  const doors: DoorData[] = [];

  // ---- STEP 1: Ground layer ----
  for (let x = 0; x < WORLD_SIZE; x++) {
    for (let z = 0; z < WORLD_SIZE; z++) {
      blocks.push({ x, y: 0, z, type: BlockType.Grass });
    }
  }

  // ---- STEP 2: Roads ----
  // Main horizontal road (east-west)
  for (let x = 0; x < WORLD_SIZE; x++) {
    for (let dz = 0; dz < ROAD_WIDTH; dz++) {
      const z = MAIN_ROAD_Z + dz;
      if (z < WORLD_SIZE) {
        setGround(blocks, x, z, BlockType.Road);
        // Center line
        if (dz === 2 || dz === 3) {
          if (x % 4 < 2) {
            blocks.push({ x, y: 0.01, z, type: BlockType.RoadLine });
          }
        }
      }
    }
    // Sidewalks along main road
    for (let dz = 0; dz < SIDEWALK_WIDTH; dz++) {
      const zNorth = MAIN_ROAD_Z - 1 - dz;
      const zSouth = MAIN_ROAD_Z + ROAD_WIDTH + dz;
      if (zNorth >= 0) setGround(blocks, x, zNorth, BlockType.Sidewalk);
      if (zSouth < WORLD_SIZE) setGround(blocks, x, zSouth, BlockType.Sidewalk);
    }
  }

  // Side vertical road (north-south)
  for (let z = 0; z < WORLD_SIZE; z++) {
    for (let dx = 0; dx < ROAD_WIDTH; dx++) {
      const x = SIDE_ROAD_X + dx;
      if (x < WORLD_SIZE) {
        setGround(blocks, x, z, BlockType.Road);
        if (dx === 2 || dx === 3) {
          if (z % 4 < 2) {
            blocks.push({ x, y: 0.01, z, type: BlockType.RoadLine });
          }
        }
      }
    }
    // Sidewalks along side road
    for (let dx = 0; dx < SIDEWALK_WIDTH; dx++) {
      const xWest = SIDE_ROAD_X - 1 - dx;
      const xEast = SIDE_ROAD_X + ROAD_WIDTH + dx;
      if (xWest >= 0) setGround(blocks, xWest, z, BlockType.Sidewalk);
      if (xEast < WORLD_SIZE) setGround(blocks, xEast, z, BlockType.Sidewalk);
    }
  }

  // ---- STEP 3: Buildings ----
  const buildings: BuildingDef[] = [
    // Library (upper-right quadrant)
    {
      name: 'library',
      x: 120, z: 30,
      width: 30, depth: 20, height: 6,
      wallType: BlockType.BuildingWallAlt,
      doorSide: 'south', doorOffset: 15,
    },
    // Tech Office (lower-left quadrant)
    {
      name: 'tech_office',
      x: 20, z: 120,
      width: 25, depth: 20, height: 8,
      wallType: BlockType.BuildingWallDark,
      doorSide: 'north', doorOffset: 12,
    },
    // Coffee Shop (middle-right)
    {
      name: 'coffee_shop',
      x: 130, z: 108,
      width: 15, depth: 12, height: 4,
      wallType: BlockType.BuildingWall,
      doorSide: 'west', doorOffset: 6,
    },
    // Home / Apartment (lower-right)
    {
      name: 'home',
      x: 140, z: 150,
      width: 18, depth: 14, height: 6,
      wallType: BlockType.BuildingWall,
      doorSide: 'west', doorOffset: 7,
    },
    // Small shops along main road
    {
      name: 'shop1',
      x: 30, z: 75,
      width: 12, depth: 10, height: 4,
      wallType: BlockType.BuildingWall,
      doorSide: 'south', doorOffset: 6,
    },
    {
      name: 'shop2',
      x: 55, z: 75,
      width: 10, depth: 10, height: 4,
      wallType: BlockType.BuildingWallAlt,
      doorSide: 'south', doorOffset: 5,
    },
    // Apartments in residential area
    {
      name: 'apartment1',
      x: 130, z: 175,
      width: 14, depth: 10, height: 6,
      wallType: BlockType.BuildingWallAlt,
      doorSide: 'west', doorOffset: 5,
    },
    {
      name: 'apartment2',
      x: 160, z: 140,
      width: 12, depth: 12, height: 8,
      wallType: BlockType.BuildingWallDark,
      doorSide: 'west', doorOffset: 6,
    },
  ];

  for (const bld of buildings) {
    generateBuilding(blocks, doors, bld);
  }

  // ---- STEP 4: Park area (upper-left quadrant, roughly 0-90 x 0-90) ----
  // Park paths
  for (let x = 10; x < 80; x++) {
    setGround(blocks, x, 45, BlockType.PathStone);
    setGround(blocks, x, 46, BlockType.PathStone);
  }
  for (let z = 10; z < 80; z++) {
    setGround(blocks, 45, z, BlockType.PathStone);
    setGround(blocks, 46, z, BlockType.PathStone);
  }

  // Trees in the park
  const treePositions = [
    [15, 15], [25, 20], [35, 10], [55, 15], [70, 20],
    [15, 35], [30, 30], [60, 30], [75, 40],
    [20, 55], [35, 60], [50, 55], [65, 65], [80, 55],
    [10, 70], [25, 75], [40, 80], [55, 78], [70, 72],
    [18, 48], [62, 42], [78, 25], [42, 18], [8, 60],
  ];
  for (const [tx, tz] of treePositions) {
    generateTree(blocks, tx, tz);
  }

  // Pond / Lake in the park
  for (let x = 55; x < 75; x++) {
    for (let z = 45; z < 60; z++) {
      const dx = x - 65;
      const dz = z - 52.5;
      if (dx * dx / 100 + dz * dz / 56 < 1) {
        // Sand border
        setGround(blocks, x, z, BlockType.Sand);
        if (dx * dx / 80 + dz * dz / 42 < 1) {
          setGround(blocks, x, z, BlockType.Water);
        }
      }
    }
  }

  // Park benches
  const benchPositions = [
    [20, 44], [35, 44], [50, 44], [44, 25], [44, 55],
    [15, 65], [30, 70],
  ];
  for (const [bx, bz] of benchPositions) {
    blocks.push({ x: bx, y: 1, z: bz, type: BlockType.Bench });
  }

  // Flowers scattered in park
  for (let i = 0; i < 30; i++) {
    const fx = 5 + Math.floor(seededRandom(i * 7 + 1) * 80);
    const fz = 5 + Math.floor(seededRandom(i * 13 + 3) * 80);
    if (fx < 90 && fz < 90) {
      blocks.push({ x: fx, y: 0.5, z: fz, type: BlockType.Flower });
    }
  }

  // ---- STEP 5: Downtown Plaza (lower-left of center) ----
  // Plaza area: roughly x=20-85, z=103-140
  for (let x = 25; x < 85; x++) {
    for (let z = 103; z < 115; z++) {
      setGround(blocks, x, z, BlockType.PathStone);
    }
  }

  // Fountain in the plaza center
  const fountainCenter = { x: 55, z: 109 };
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (Math.abs(dx) + Math.abs(dz) <= 3) {
        blocks.push({
          x: fountainCenter.x + dx,
          y: 1,
          z: fountainCenter.z + dz,
          type: BlockType.Fountain,
        });
      }
    }
  }
  // Fountain pillar
  blocks.push({ x: fountainCenter.x, y: 2, z: fountainCenter.z, type: BlockType.Fountain });
  blocks.push({ x: fountainCenter.x, y: 3, z: fountainCenter.z, type: BlockType.Water });

  // Market stalls
  const stallPositions = [[30, 106], [40, 106], [70, 106], [80, 106]];
  for (const [sx, sz] of stallPositions) {
    blocks.push({ x: sx, y: 1, z: sz, type: BlockType.MarketStall });
    blocks.push({ x: sx, y: 2, z: sz, type: BlockType.Roof });
  }

  // ---- STEP 6: Lampposts along roads ----
  for (let x = 10; x < WORLD_SIZE; x += 15) {
    // Along north side of main road
    generateLamppost(blocks, x, MAIN_ROAD_Z - 3);
    // Along south side
    generateLamppost(blocks, x, MAIN_ROAD_Z + ROAD_WIDTH + 3);
  }
  for (let z = 10; z < WORLD_SIZE; z += 15) {
    // Along west side of side road
    generateLamppost(blocks, SIDE_ROAD_X - 3, z);
    // Along east side
    generateLamppost(blocks, SIDE_ROAD_X + ROAD_WIDTH + 3, z);
  }

  // ---- STEP 7: Trees along streets (not in building areas) ----
  for (let x = 10; x < WORLD_SIZE; x += 12) {
    if (!isNearBuilding(x, MAIN_ROAD_Z - 5, buildings) && x < 90) {
      generateTree(blocks, x, MAIN_ROAD_Z - 5);
    }
    if (!isNearBuilding(x, MAIN_ROAD_Z + ROAD_WIDTH + 5, buildings)) {
      generateTree(blocks, x, MAIN_ROAD_Z + ROAD_WIDTH + 5);
    }
  }

  // ---- STEP 8: NPCs ----
  npcs.push(
    {
      id: 'sarah', name: 'Sarah', x: 50, y: 1.5, z: 110,
      color: '#E91E63', role: 'Recruiter', zone: 'Downtown Plaza',
    },
    {
      id: 'alex', name: 'Alex', x: 135, y: 1.5, z: 55,
      color: '#2196F3', role: 'Mentor', zone: 'Library',
    },
    {
      id: 'casey', name: 'Casey', x: 32, y: 1.5, z: 118,
      color: '#FF9800', role: 'HR Manager', zone: 'Tech Office',
    },
    {
      id: 'jordan', name: 'Jordan', x: 40, y: 1.5, z: 40,
      color: '#4CAF50', role: 'Peer', zone: 'Park',
    },
    {
      id: 'family', name: 'Family', x: 138, y: 1.5, z: 158,
      color: '#9C27B0', role: 'Support', zone: 'Home',
    },
  );

  // ---- STEP 9: Zone definitions ----
  const zones: ZoneArea[] = [
    { name: 'City Park', xMin: 0, xMax: 90, zMin: 0, zMax: MAIN_ROAD_Z - 3 },
    { name: 'Library District', xMin: 105, xMax: 200, zMin: 0, zMax: MAIN_ROAD_Z - 3 },
    { name: 'Downtown Plaza', xMin: 0, xMax: SIDE_ROAD_X - 3, zMin: MAIN_ROAD_Z + ROAD_WIDTH + 3, zMax: 140 },
    { name: 'Coffee Quarter', xMin: SIDE_ROAD_X + ROAD_WIDTH + 3, xMax: 200, zMin: MAIN_ROAD_Z + ROAD_WIDTH + 3, zMax: 140 },
    { name: 'Tech District', xMin: 0, xMax: SIDE_ROAD_X - 3, zMin: 140, zMax: 200 },
    { name: 'Residential Area', xMin: SIDE_ROAD_X + ROAD_WIDTH + 3, xMax: 200, zMin: 140, zMax: 200 },
  ];

  // Player spawns at downtown plaza
  const playerSpawn = { x: 60, y: 1.5, z: 112 };

  return { blocks, npcs, doors, zones, playerSpawn };
}

// ---- Helper functions ----

function setGround(blocks: BlockInstance[], x: number, z: number, type: BlockType) {
  // Replace the ground block at this position
  // Find and update or just overwrite (ground is at y=0)
  const idx = blocks.findIndex(b => b.x === x && b.z === z && b.y === 0);
  if (idx >= 0) {
    blocks[idx].type = type;
  } else {
    blocks.push({ x, y: 0, z, type });
  }
}

function generateBuilding(blocks: BlockInstance[], doors: DoorData[], bld: BuildingDef) {
  // Floor inside building
  for (let x = bld.x; x < bld.x + bld.width; x++) {
    for (let z = bld.z; z < bld.z + bld.depth; z++) {
      setGround(blocks, x, z, BlockType.Sidewalk);
    }
  }

  // Walls
  for (let y = 1; y <= bld.height; y++) {
    // North wall
    for (let x = bld.x; x < bld.x + bld.width; x++) {
      const isWindow = y > 1 && y % 2 === 0 && x % 3 === 1;
      blocks.push({
        x, y, z: bld.z,
        type: isWindow ? BlockType.BuildingWindow : bld.wallType,
      });
    }
    // South wall
    for (let x = bld.x; x < bld.x + bld.width; x++) {
      const isWindow = y > 1 && y % 2 === 0 && x % 3 === 1;
      blocks.push({
        x, y, z: bld.z + bld.depth - 1,
        type: isWindow ? BlockType.BuildingWindow : bld.wallType,
      });
    }
    // West wall
    for (let z = bld.z + 1; z < bld.z + bld.depth - 1; z++) {
      const isWindow = y > 1 && y % 2 === 0 && z % 3 === 1;
      blocks.push({
        x: bld.x, y, z,
        type: isWindow ? BlockType.BuildingWindow : bld.wallType,
      });
    }
    // East wall
    for (let z = bld.z + 1; z < bld.z + bld.depth - 1; z++) {
      const isWindow = y > 1 && y % 2 === 0 && z % 3 === 1;
      blocks.push({
        x: bld.x + bld.width - 1, y, z,
        type: isWindow ? BlockType.BuildingWindow : bld.wallType,
      });
    }
  }

  // Roof
  for (let x = bld.x; x < bld.x + bld.width; x++) {
    for (let z = bld.z; z < bld.z + bld.depth; z++) {
      blocks.push({ x, y: bld.height + 1, z, type: BlockType.Roof });
    }
  }

  // Door
  let doorX = bld.x;
  let doorZ = bld.z;
  switch (bld.doorSide) {
    case 'north':
      doorX = bld.x + bld.doorOffset;
      doorZ = bld.z;
      break;
    case 'south':
      doorX = bld.x + bld.doorOffset;
      doorZ = bld.z + bld.depth - 1;
      break;
    case 'west':
      doorX = bld.x;
      doorZ = bld.z + bld.doorOffset;
      break;
    case 'east':
      doorX = bld.x + bld.width - 1;
      doorZ = bld.z + bld.doorOffset;
      break;
  }

  // Replace wall blocks at door position with door blocks
  const doorBlocks = blocks.filter(b => b.x === doorX && b.z === doorZ && b.y >= 1 && b.y <= 2);
  for (const db of doorBlocks) {
    db.type = BlockType.BuildingDoor;
  }

  doors.push({
    id: `door_${bld.name}`,
    x: doorX,
    y: 1,
    z: doorZ,
    targetBuilding: bld.name,
    label: bld.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  });
}

function generateTree(blocks: BlockInstance[], x: number, z: number) {
  // Trunk
  blocks.push({ x, y: 1, z, type: BlockType.TreeTrunk });
  blocks.push({ x, y: 2, z, type: BlockType.TreeTrunk });
  // Leaves (cross pattern)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      blocks.push({ x: x + dx, y: 3, z: z + dz, type: BlockType.TreeLeaves });
    }
  }
  blocks.push({ x, y: 4, z, type: BlockType.TreeLeaves });
  blocks.push({ x: x + 1, y: 4, z, type: BlockType.TreeLeaves });
  blocks.push({ x: x - 1, y: 4, z, type: BlockType.TreeLeaves });
  blocks.push({ x, y: 4, z: z + 1, type: BlockType.TreeLeaves });
  blocks.push({ x, y: 4, z: z - 1, type: BlockType.TreeLeaves });
}

function generateLamppost(blocks: BlockInstance[], x: number, z: number) {
  blocks.push({ x, y: 1, z, type: BlockType.Lamppost });
  blocks.push({ x, y: 2, z, type: BlockType.Lamppost });
  blocks.push({ x, y: 3, z, type: BlockType.Lamppost });
}

function isNearBuilding(x: number, z: number, buildings: BuildingDef[]): boolean {
  for (const bld of buildings) {
    if (
      x >= bld.x - 3 && x <= bld.x + bld.width + 3 &&
      z >= bld.z - 3 && z <= bld.z + bld.depth + 3
    ) {
      return true;
    }
  }
  return false;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Renders the generated world data into Babylon.js scene using InstancedMesh
 */
export async function renderWorld(
  worldData: WorldData,
  scene: any
): Promise<{
  collisionMeshes: any[];
  doorMeshes: Map<string, any>;
}> {
  const BABYLON = await import('@babylonjs/core');

  // Group blocks by type for instanced rendering
  const blocksByType = new Map<BlockType, BlockInstance[]>();
  for (const block of worldData.blocks) {
    if (!blocksByType.has(block.type)) {
      blocksByType.set(block.type, []);
    }
    blocksByType.get(block.type)!.push(block);
  }

  const collisionMeshes: any[] = [];
  const doorMeshes = new Map<string, any>();

  // Create one InstancedMesh per block type
  for (const [type, instances] of blocksByType) {
    const colorHex = BLOCK_COLORS[type];
    const color = BABYLON.Color3.FromHexString(colorHex);

    // Create base mesh (unit cube)
    const baseMesh = BABYLON.MeshBuilder.CreateBox(
      `block_${type}`,
      { size: 1 },
      scene
    );

    // Material
    const material = new BABYLON.StandardMaterial(`mat_${type}`, scene);
    material.diffuseColor = color;

    // Special material properties
    if (type === BlockType.Water) {
      material.alpha = 0.7;
      material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    } else if (type === BlockType.BuildingWindow) {
      material.emissiveColor = color.scale(0.3);
      material.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    } else if (type === BlockType.Fountain) {
      material.alpha = 0.8;
      material.emissiveColor = color.scale(0.2);
    } else if (type === BlockType.Flower) {
      material.emissiveColor = color.scale(0.2);
    } else {
      material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    }

    baseMesh.material = material;
    baseMesh.isVisible = false; // base mesh hidden, only instances shown

    // Create instances
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      const instance = baseMesh.createInstance(`${type}_${i}`);
      instance.position = new BABYLON.Vector3(inst.x, inst.y, inst.z);

      // Scale for special blocks
      if (type === BlockType.Flower) {
        instance.scaling = new BABYLON.Vector3(0.3, 0.5, 0.3);
      } else if (type === BlockType.Bench) {
        instance.scaling = new BABYLON.Vector3(2, 0.5, 0.8);
      } else if (type === BlockType.Lamppost) {
        instance.scaling = new BABYLON.Vector3(0.3, 1, 0.3);
      } else if (type === BlockType.RoadLine) {
        instance.scaling = new BABYLON.Vector3(1, 0.05, 0.3);
      }

      // Collision for solid blocks
      if (
        type === BlockType.BuildingWall ||
        type === BlockType.BuildingWallAlt ||
        type === BlockType.BuildingWallDark ||
        type === BlockType.TreeTrunk ||
        type === BlockType.Fountain
      ) {
        instance.checkCollisions = true;
        collisionMeshes.push(instance);
      }

      // Track door meshes
      if (type === BlockType.BuildingDoor) {
        const door = worldData.doors.find(
          d => d.x === inst.x && d.z === inst.z && d.y === inst.y
        );
        if (door) {
          doorMeshes.set(door.id, instance);
        }
      }
    }

    // Freeze static meshes for performance
    baseMesh.freezeWorldMatrix();
  }

  // Create invisible ground collision plane
  const ground = BABYLON.MeshBuilder.CreateGround(
    'ground_collision',
    { width: WORLD_SIZE, height: WORLD_SIZE },
    scene
  );
  ground.position = new BABYLON.Vector3(WORLD_SIZE / 2, 0.5, WORLD_SIZE / 2);
  ground.isVisible = false;
  ground.checkCollisions = true;
  collisionMeshes.push(ground);

  // Lighting
  const hemisphericLight = new BABYLON.HemisphericLight(
    'skyLight',
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  hemisphericLight.intensity = 0.6;
  hemisphericLight.diffuse = new BABYLON.Color3(1, 0.95, 0.9);
  hemisphericLight.groundColor = new BABYLON.Color3(0.2, 0.2, 0.3);

  const sunLight = new BABYLON.DirectionalLight(
    'sunLight',
    new BABYLON.Vector3(-0.5, -1, 0.5),
    scene
  );
  sunLight.intensity = 0.8;
  sunLight.diffuse = new BABYLON.Color3(1, 0.98, 0.9);

  // Enable shadows from sun
  const shadowGenerator = new BABYLON.ShadowGenerator(2048, sunLight);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 16;

  // Freeze active meshes for performance after all meshes are created
  scene.freezeActiveMeshes();

  return { collisionMeshes, doorMeshes };
}
