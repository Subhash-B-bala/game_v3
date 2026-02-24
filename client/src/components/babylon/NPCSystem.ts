/**
 * NPCSystem — Manages animated GLB NPCs with patrol behavior and interaction
 *
 * NPCs now use real GLB animated models (via GLBCharacterLoader) instead of
 * procedural capsule characters. They patrol between waypoints near their
 * zone, creating a living world feel.
 */

import type { NPCSpawn } from './VoxelWorldGenerator';
import type { AnimatedCharacter } from './CharacterBuilder';
import { createAnimatedCharacter, CHARACTER_PRESETS } from './CharacterBuilder';

export interface NPCInstance {
  id: string;
  name: string;
  role: string;
  zone: string;
  mesh: any; // TransformNode (character root)
  character: AnimatedCharacter;
  billboard: any; // GUI control
  position: { x: number; y: number; z: number };
  // Patrol state
  patrol: PatrolState;
}

interface PatrolState {
  waypoints: { x: number; z: number }[];
  currentWaypointIdx: number;
  isWaiting: boolean;
  waitTimer: number;
  waitDuration: number;
  speed: number;
  isInteracting: boolean; // frozen when player is nearby
}

export interface NPCSystemHandle {
  getNearestNPC: () => NPCInstance | null;
  getNearestNPCDistance: () => number;
  getAllNPCs: () => NPCInstance[];
  dispose: () => void;
}

const INTERACTION_RADIUS = 5;
const PATROL_SPEED = 1.8;     // units per second (slow walk)
const PATROL_WAIT_MIN = 2;    // min pause at waypoint (seconds)
const PATROL_WAIT_MAX = 5;    // max pause at waypoint

// Map NPC IDs → GLB character roles
function getNPCGLBRole(spawn: NPCSpawn): string {
  if (spawn.id === 'tony') return 'tony';
  // Cycle through available models for variety
  const roles = ['npc_robot', 'npc_female', 'npc_robot', 'npc_female'];
  const hash = spawn.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return roles[hash % roles.length];
}

// Generate patrol waypoints around spawn point
function generatePatrolWaypoints(spawn: NPCSpawn): { x: number; z: number }[] {
  const radius = 4 + Math.random() * 4; // 4-8 unit patrol radius
  const count = 2 + Math.floor(Math.random() * 2); // 2-3 waypoints
  const waypoints: { x: number; z: number }[] = [];

  // Start at spawn position
  waypoints.push({ x: spawn.x, z: spawn.z });

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    waypoints.push({
      x: spawn.x + Math.cos(angle) * radius,
      z: spawn.z + Math.sin(angle) * radius,
    });
  }

  return waypoints;
}

export async function createNPCSystem(
  scene: any,
  npcSpawns: NPCSpawn[],
  getPlayerPosition: () => { x: number; y: number; z: number }
): Promise<NPCSystemHandle> {
  const BABYLON = await import('@babylonjs/core');
  const GUI = await import('@babylonjs/gui');

  const npcInstances: NPCInstance[] = [];
  let nearestNPC: NPCInstance | null = null;
  let nearestDistance = Infinity;

  // Create GUI layer for name billboards
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('npcUI', true, scene);

  // Create all NPCs in parallel using procedural characters (instant, no GLB loading)
  const npcPresets: Record<string, any> = {
    tony: CHARACTER_PRESETS.tony,
    npc_robot: CHARACTER_PRESETS.npcMale,
    npc_female: CHARACTER_PRESETS.npcFemale,
  };
  const npcPromises = npcSpawns.map(async (spawn) => {
    const glbRole = getNPCGLBRole(spawn);
    const preset = npcPresets[glbRole] || CHARACTER_PRESETS.npcMale;
    const character = await createAnimatedCharacter(scene, { ...preset, name: spawn.id, scale: 1.0 });

    character.root.position = new BABYLON.Vector3(spawn.x, spawn.y, spawn.z);
    character.setAnimation('idle');

    const billboard = createNameBillboard(GUI, advancedTexture, character.root, spawn);

    const patrol: PatrolState = {
      waypoints: generatePatrolWaypoints(spawn),
      currentWaypointIdx: 0,
      isWaiting: true,
      waitTimer: Math.random() * 3, // stagger initial starts
      waitDuration: PATROL_WAIT_MIN + Math.random() * (PATROL_WAIT_MAX - PATROL_WAIT_MIN),
      speed: PATROL_SPEED * (0.8 + Math.random() * 0.4), // slight speed variation
      isInteracting: false,
    };

    return {
      id: spawn.id,
      name: spawn.name,
      role: spawn.role,
      zone: spawn.zone,
      mesh: character.root,
      character,
      billboard,
      position: { x: spawn.x, y: spawn.y, z: spawn.z },
      patrol,
    } as NPCInstance;
  });

  const results = await Promise.all(npcPromises);
  npcInstances.push(...results);

  // ── Animation + patrol + proximity loop ──
  scene.onBeforeRenderObservable.add(() => {
    const deltaTime = scene.getEngine().getDeltaTime() / 1000;
    const playerPos = getPlayerPosition();
    nearestNPC = null;
    nearestDistance = Infinity;

    for (const npc of npcInstances) {
      // Update animation system
      npc.character.update(deltaTime);

      // Calculate distance to player
      const dx = playerPos.x - npc.mesh.position.x;
      const dz = playerPos.z - npc.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // ── Interaction proximity ──
      if (dist < INTERACTION_RADIUS * 1.5) {
        // Face player when nearby
        npc.character.lookAt(playerPos.x, playerPos.z);
        npc.patrol.isInteracting = true;

        // Stop walking, switch to idle when player is close
        if (dist < INTERACTION_RADIUS * 2) {
          npc.character.setAnimation('idle');
        }
      } else {
        npc.patrol.isInteracting = false;
      }

      // ── Patrol behavior (only when not interacting) ──
      if (!npc.patrol.isInteracting) {
        const p = npc.patrol;

        if (p.isWaiting) {
          // Waiting at waypoint
          p.waitTimer -= deltaTime;
          npc.character.setAnimation('idle');

          if (p.waitTimer <= 0) {
            // Move to next waypoint
            p.currentWaypointIdx = (p.currentWaypointIdx + 1) % p.waypoints.length;
            p.isWaiting = false;
          }
        } else {
          // Walking toward current waypoint
          const target = p.waypoints[p.currentWaypointIdx];
          const tdx = target.x - npc.mesh.position.x;
          const tdz = target.z - npc.mesh.position.z;
          const tDist = Math.sqrt(tdx * tdx + tdz * tdz);

          if (tDist < 0.5) {
            // Reached waypoint, start waiting
            p.isWaiting = true;
            p.waitTimer = p.waitDuration;
            p.waitDuration = PATROL_WAIT_MIN + Math.random() * (PATROL_WAIT_MAX - PATROL_WAIT_MIN);
            npc.character.setAnimation('idle');
          } else {
            // Move toward waypoint
            const moveX = (tdx / tDist) * p.speed * deltaTime;
            const moveZ = (tdz / tDist) * p.speed * deltaTime;
            npc.mesh.position.x += moveX;
            npc.mesh.position.z += moveZ;

            // Update tracked position
            npc.position.x = npc.mesh.position.x;
            npc.position.z = npc.mesh.position.z;

            // Face movement direction
            npc.character.lookAt(target.x, target.z);
            npc.character.setAnimation('walk');
          }
        }
      }

      // Track nearest NPC for interaction
      if (dist < INTERACTION_RADIUS && dist < nearestDistance) {
        nearestNPC = npc;
        nearestDistance = dist;
      }
    }
  });

  return {
    getNearestNPC: () => nearestNPC,
    getNearestNPCDistance: () => nearestDistance,
    getAllNPCs: () => npcInstances,
    dispose: () => {
      for (const npc of npcInstances) {
        npc.character.dispose();
      }
      advancedTexture.dispose();
    },
  };
}

function createNameBillboard(GUI: any, advancedTexture: any, mesh: any, spawn: NPCSpawn) {
  const rect = new GUI.Rectangle(`npc_label_bg_${spawn.id}`);
  rect.width = '160px';
  rect.height = '44px';
  rect.cornerRadius = 10;
  rect.color = 'transparent';
  rect.thickness = 0;
  rect.background = 'rgba(0, 0, 0, 0.7)';
  advancedTexture.addControl(rect);
  rect.linkWithMesh(mesh);
  rect.linkOffsetY = -100;

  const nameText = new GUI.TextBlock(`npc_name_${spawn.id}`);
  nameText.text = spawn.name;
  nameText.color = '#ffffff';
  nameText.fontSize = 14;
  nameText.fontWeight = 'bold';
  nameText.fontFamily = '"Saira Condensed", sans-serif';
  nameText.top = '-6px';
  rect.addControl(nameText);

  const roleText = new GUI.TextBlock(`npc_role_${spawn.id}`);
  roleText.text = spawn.role;
  roleText.color = '#3B82F6';
  roleText.fontSize = 10;
  roleText.fontFamily = '"Kanit", sans-serif';
  roleText.top = '10px';
  rect.addControl(roleText);

  return rect;
}
