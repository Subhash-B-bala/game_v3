/**
 * PlayerController — Third-person WASD movement with procedural animated character
 *
 * Uses a FreeCamera positioned manually behind the player every frame.
 * NO mouse controls — camera is completely fixed in third-person view.
 * Uses procedural CharacterBuilder (no GLB — instant, no loading, no glitches).
 */

import type { AnimatedCharacter } from './CharacterBuilder';
import { createAnimatedCharacter, CHARACTER_PRESETS } from './CharacterBuilder';

export interface PlayerControllerOptions {
  spawnX: number;
  spawnY: number;
  spawnZ: number;
  moveSpeed?: number;
  sprintSpeed?: number;
  worldBounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
  cameraRadius?: number;
  cameraBeta?: number;
  cameraRadiusLimits?: { lower: number; upper: number };
  terrain?: any;
}

export interface PlayerController {
  mesh: any;
  camera: any;
  character: AnimatedCharacter;
  getPosition: () => { x: number; y: number; z: number };
  setFrozen: (frozen: boolean) => void;
  dispose: () => void;
}

export async function createPlayerController(
  scene: any,
  canvas: HTMLCanvasElement,
  options: PlayerControllerOptions
): Promise<PlayerController> {
  const BABYLON = await import('@babylonjs/core');

  const moveSpeed = options.moveSpeed ?? 10;
  const sprintSpeed = options.sprintSpeed ?? 18;
  let frozen = false;

  // ---- Use procedural character (instant, no GLB loading, no glitches) ----
  const character = await createAnimatedCharacter(scene, {
    ...CHARACTER_PRESETS.player,
    scale: 1.0,
  });

  const playerRoot = character.root;
  playerRoot.position = new BABYLON.Vector3(options.spawnX, options.spawnY, options.spawnZ);

  // Invisible collision box
  const collider = BABYLON.MeshBuilder.CreateBox('player_collider', { width: 1, height: 2, depth: 0.6 }, scene);
  collider.position = new BABYLON.Vector3(0, 0.5, 0);
  collider.isVisible = false;
  collider.parent = playerRoot;
  collider.checkCollisions = true;
  collider.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.3);

  // ---- Camera: FreeCamera — NO mouse controls, fully manual positioning ----
  const camDistance = 8;
  const camHeight = 4;
  const camLookAtY = 1.5;

  const camera = new BABYLON.FreeCamera(
    'playerCamera',
    new BABYLON.Vector3(
      options.spawnX,
      options.spawnY + camHeight,
      options.spawnZ - camDistance
    ),
    scene
  );

  camera.setTarget(new BABYLON.Vector3(options.spawnX, options.spawnY + camLookAtY, options.spawnZ));

  // Remove ALL inputs — no mouse, no keyboard, no touch on camera
  camera.inputs.clear();
  camera.detachControl();

  // Fixed forward direction for movement (camera always looks in +Z direction)
  const FORWARD = new BABYLON.Vector3(0, 0, 1);
  const RIGHT = new BABYLON.Vector3(1, 0, 0);

  // ---- Input handling ----
  const keys: Record<string, boolean> = {};

  scene.onKeyboardObservable.add((kbInfo: any) => {
    const key = kbInfo.event.key.toLowerCase();
    if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
      keys[key] = true;
    } else if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
      keys[key] = false;
    }
  });

  // ---- Movement in render loop ----
  scene.onBeforeRenderObservable.add(() => {
    const px = playerRoot.position.x;
    const py = playerRoot.position.y;
    const pz = playerRoot.position.z;

    // Always position camera behind player
    camera.position.x = px;
    camera.position.y = py + camHeight;
    camera.position.z = pz - camDistance;
    camera.setTarget(new BABYLON.Vector3(px, py + camLookAtY, pz));

    if (frozen) {
      character.setAnimation('idle');
      character.update(scene.getEngine().getDeltaTime() / 1000);
      return;
    }

    const deltaTime = scene.getEngine().getDeltaTime() / 1000;
    const isSprinting = keys['shift'];
    const speed = (isSprinting ? sprintSpeed : moveSpeed) * deltaTime;

    // Movement — W=+Z, S=-Z, A=-X, D=+X
    let moveDir = BABYLON.Vector3.Zero();
    let isMoving = false;

    if (keys['w'] || keys['arrowup'])    { moveDir.addInPlace(FORWARD); isMoving = true; }
    if (keys['s'] || keys['arrowdown'])  { moveDir.subtractInPlace(FORWARD); isMoving = true; }
    if (keys['a'] || keys['arrowleft'])  { moveDir.subtractInPlace(RIGHT); isMoving = true; }
    if (keys['d'] || keys['arrowright']) { moveDir.addInPlace(RIGHT); isMoving = true; }

    if (isMoving) {
      moveDir.normalize();
      const movement = moveDir.scale(speed);

      // Move the player
      playerRoot.position.addInPlace(movement);

      // Rotate player to face movement direction (instant — feels snappy)
      const targetAngle = Math.atan2(-moveDir.x, -moveDir.z);
      playerRoot.rotation.y = targetAngle;

      // Set animation
      character.setAnimation(isSprinting ? 'run' : 'walk');
    } else {
      character.setAnimation('idle');
    }

    // Update character animation
    character.update(deltaTime);

    // Keep player on ground
    if (options.terrain && options.terrain.getHeightAtCoordinates) {
      const groundY = options.terrain.getHeightAtCoordinates(
        playerRoot.position.x, playerRoot.position.z
      );
      if (groundY !== undefined && groundY !== null) {
        playerRoot.position.y = groundY + 0.05;
      }
    } else if (playerRoot.position.y > options.spawnY) {
      playerRoot.position.y = Math.max(
        options.spawnY,
        playerRoot.position.y - 9.81 * deltaTime
      );
    } else {
      playerRoot.position.y = options.spawnY;
    }

    // Clamp to world bounds
    const bounds = options.worldBounds || { minX: 1, maxX: 198, minZ: 1, maxZ: 198 };
    playerRoot.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, playerRoot.position.x));
    playerRoot.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, playerRoot.position.z));

  });

  return {
    mesh: playerRoot,
    camera,
    character,
    getPosition: () => ({
      x: playerRoot.position.x,
      y: playerRoot.position.y,
      z: playerRoot.position.z,
    }),
    setFrozen: (f: boolean) => { frozen = f; },
    dispose: () => {
      character.dispose();
      collider.dispose();
      camera.dispose();
    },
  };
}
