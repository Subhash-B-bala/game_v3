/**
 * CharacterBuilder — Creates animated humanoid characters using Babylon.js
 *
 * Builds smooth, properly proportioned 3D characters with:
 * - Rounded body parts (capsules, spheres, rounded cylinders)
 * - Skeletal animation system (idle, walk, run)
 * - Character customization (colors, proportions)
 * - Smooth animation blending between states
 *
 * Much better than the old voxel cube-stack characters.
 */

export type CharacterAnimation = 'idle' | 'walk' | 'run';

export interface CharacterOptions {
  name: string;
  // Colors
  skinColor?: string;     // hex e.g. '#FFCD94'
  shirtColor?: string;    // hex
  pantsColor?: string;    // hex
  shoeColor?: string;     // hex
  hairColor?: string;     // hex
  // Scale
  scale?: number;         // overall scale, default 1
  // Features
  hasHair?: boolean;      // default true
  hairStyle?: 'short' | 'medium' | 'long';
}

export interface AnimatedCharacter {
  root: any;              // TransformNode — move this to position the character
  setAnimation: (anim: CharacterAnimation) => void;
  getAnimation: () => CharacterAnimation;
  update: (deltaTime: number) => void;   // call every frame
  lookAt: (x: number, z: number) => void;
  dispose: () => void;
}

// Default character presets
export const CHARACTER_PRESETS = {
  player: {
    name: 'player',
    skinColor: '#FFCD94',
    shirtColor: '#2563EB',   // Blue professional shirt
    pantsColor: '#1E293B',   // Dark slacks
    shoeColor: '#292524',    // Dark shoes
    hairColor: '#1C1917',    // Dark hair
    hasHair: true,
    hairStyle: 'short' as const,
  },
  tony: {
    name: 'tony',
    skinColor: '#D4A574',    // South Asian skin tone
    shirtColor: '#3B82F6',   // Blue (matches his theme)
    pantsColor: '#374151',   // Charcoal pants
    shoeColor: '#1C1917',
    hairColor: '#0F172A',    // Very dark hair
    hasHair: true,
    hairStyle: 'short' as const,
  },
  npcFemale: {
    name: 'npc_female',
    skinColor: '#FFCD94',
    shirtColor: '#EC4899',
    pantsColor: '#1E293B',
    shoeColor: '#292524',
    hairColor: '#78350F',    // Brown hair
    hasHair: true,
    hairStyle: 'medium' as const,
  },
  npcMale: {
    name: 'npc_male',
    skinColor: '#8D5524',
    shirtColor: '#059669',
    pantsColor: '#1E293B',
    shoeColor: '#292524',
    hairColor: '#0F172A',
    hasHair: true,
    hairStyle: 'short' as const,
  },
};

export async function createAnimatedCharacter(
  scene: any,
  options: CharacterOptions
): Promise<AnimatedCharacter> {
  const BABYLON = await import('@babylonjs/core');

  const scale = options.scale ?? 1;
  const skinHex = options.skinColor ?? '#FFCD94';
  const shirtHex = options.shirtColor ?? '#2563EB';
  const pantsHex = options.pantsColor ?? '#1E293B';
  const shoeHex = options.shoeColor ?? '#292524';
  const hairHex = options.hairColor ?? '#1C1917';
  const hasHair = options.hasHair ?? true;
  const hairStyle = options.hairStyle ?? 'short';

  // Helper: hex to Color3
  const hexToColor = (hex: string) => BABYLON.Color3.FromHexString(hex);

  // Materials (shared where possible)
  const skinMat = new BABYLON.StandardMaterial(`${options.name}_skin`, scene);
  skinMat.diffuseColor = hexToColor(skinHex);
  skinMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const shirtMat = new BABYLON.StandardMaterial(`${options.name}_shirt`, scene);
  shirtMat.diffuseColor = hexToColor(shirtHex);
  shirtMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

  const pantsMat = new BABYLON.StandardMaterial(`${options.name}_pants`, scene);
  pantsMat.diffuseColor = hexToColor(pantsHex);
  pantsMat.specularColor = new BABYLON.Color3(0.02, 0.02, 0.02);

  const shoeMat = new BABYLON.StandardMaterial(`${options.name}_shoes`, scene);
  shoeMat.diffuseColor = hexToColor(shoeHex);
  shoeMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const hairMat = new BABYLON.StandardMaterial(`${options.name}_hair`, scene);
  hairMat.diffuseColor = hexToColor(hairHex);
  hairMat.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);

  // ── Root node ──
  const root = new BABYLON.TransformNode(`${options.name}_root`, scene);
  root.scaling = new BABYLON.Vector3(scale, scale, scale);

  // ── Body hierarchy ──
  // Spine pivot (center of body, everything attaches here or to sub-pivots)
  const spine = new BABYLON.TransformNode(`${options.name}_spine`, scene);
  spine.parent = root;
  spine.position.y = 0.95;

  // ── Torso (rounded box / capsule-like) ──
  const torso = BABYLON.MeshBuilder.CreateCapsule(`${options.name}_torso`, {
    height: 0.9,
    radius: 0.28,
    tessellation: 12,
    subdivisions: 1,
  }, scene);
  torso.material = shirtMat;
  torso.parent = spine;
  torso.position.y = 0;
  torso.scaling = new BABYLON.Vector3(1, 1, 0.75);

  // ── Neck + Head ──
  const neckPivot = new BABYLON.TransformNode(`${options.name}_neck`, scene);
  neckPivot.parent = spine;
  neckPivot.position.y = 0.5;

  const head = BABYLON.MeshBuilder.CreateSphere(`${options.name}_head`, {
    diameter: 0.48,
    segments: 12,
  }, scene);
  head.material = skinMat;
  head.parent = neckPivot;
  head.position.y = 0.28;

  // Eyes (small dark spheres)
  const eyeMat = new BABYLON.StandardMaterial(`${options.name}_eye`, scene);
  eyeMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  eyeMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);

  const leftEye = BABYLON.MeshBuilder.CreateSphere(`${options.name}_leye`, { diameter: 0.06, segments: 6 }, scene);
  leftEye.material = eyeMat;
  leftEye.parent = head;
  leftEye.position = new BABYLON.Vector3(-0.1, 0.06, 0.2);

  const rightEye = BABYLON.MeshBuilder.CreateSphere(`${options.name}_reye`, { diameter: 0.06, segments: 6 }, scene);
  rightEye.material = eyeMat;
  rightEye.parent = head;
  rightEye.position = new BABYLON.Vector3(0.1, 0.06, 0.2);

  // Hair
  if (hasHair) {
    let hairMesh: any;
    if (hairStyle === 'short') {
      hairMesh = BABYLON.MeshBuilder.CreateSphere(`${options.name}_hair`, {
        diameter: 0.52,
        segments: 10,
        slice: 0.6,
      }, scene);
      hairMesh.position.y = 0.06;
    } else if (hairStyle === 'medium') {
      hairMesh = BABYLON.MeshBuilder.CreateSphere(`${options.name}_hair`, {
        diameter: 0.55,
        segments: 10,
        slice: 0.65,
      }, scene);
      hairMesh.position.y = 0.04;
      hairMesh.scaling.z = 1.1;
    } else {
      // long hair
      hairMesh = BABYLON.MeshBuilder.CreateCapsule(`${options.name}_hair`, {
        height: 0.7,
        radius: 0.25,
        tessellation: 10,
      }, scene);
      hairMesh.position.y = -0.05;
      hairMesh.position.z = -0.05;
    }
    hairMesh.material = hairMat;
    hairMesh.parent = head;
  }

  // ── Shoulders / Arms ──
  const leftShoulderPivot = new BABYLON.TransformNode(`${options.name}_lshoulder`, scene);
  leftShoulderPivot.parent = spine;
  leftShoulderPivot.position = new BABYLON.Vector3(-0.35, 0.3, 0);

  const leftUpperArm = BABYLON.MeshBuilder.CreateCapsule(`${options.name}_luarm`, {
    height: 0.45,
    radius: 0.08,
    tessellation: 8,
  }, scene);
  leftUpperArm.material = shirtMat;
  leftUpperArm.parent = leftShoulderPivot;
  leftUpperArm.position.y = -0.22;

  const leftElbowPivot = new BABYLON.TransformNode(`${options.name}_lelbow`, scene);
  leftElbowPivot.parent = leftShoulderPivot;
  leftElbowPivot.position.y = -0.45;

  const leftForearm = BABYLON.MeshBuilder.CreateCapsule(`${options.name}_lfarm`, {
    height: 0.4,
    radius: 0.065,
    tessellation: 8,
  }, scene);
  leftForearm.material = skinMat;
  leftForearm.parent = leftElbowPivot;
  leftForearm.position.y = -0.18;

  // Hand
  const leftHand = BABYLON.MeshBuilder.CreateSphere(`${options.name}_lhand`, {
    diameter: 0.12,
    segments: 6,
  }, scene);
  leftHand.material = skinMat;
  leftHand.parent = leftElbowPivot;
  leftHand.position.y = -0.4;

  // Right arm (mirror)
  const rightShoulderPivot = new BABYLON.TransformNode(`${options.name}_rshoulder`, scene);
  rightShoulderPivot.parent = spine;
  rightShoulderPivot.position = new BABYLON.Vector3(0.35, 0.3, 0);

  const rightUpperArm = BABYLON.MeshBuilder.CreateCapsule(`${options.name}_ruarm`, {
    height: 0.45,
    radius: 0.08,
    tessellation: 8,
  }, scene);
  rightUpperArm.material = shirtMat;
  rightUpperArm.parent = rightShoulderPivot;
  rightUpperArm.position.y = -0.22;

  const rightElbowPivot = new BABYLON.TransformNode(`${options.name}_relbow`, scene);
  rightElbowPivot.parent = rightShoulderPivot;
  rightElbowPivot.position.y = -0.45;

  const rightForearm = BABYLON.MeshBuilder.CreateCapsule(`${options.name}_rfarm`, {
    height: 0.4,
    radius: 0.065,
    tessellation: 8,
  }, scene);
  rightForearm.material = skinMat;
  rightForearm.parent = rightElbowPivot;
  rightForearm.position.y = -0.18;

  const rightHand = BABYLON.MeshBuilder.CreateSphere(`${options.name}_rhand`, {
    diameter: 0.12,
    segments: 6,
  }, scene);
  rightHand.material = skinMat;
  rightHand.parent = rightElbowPivot;
  rightHand.position.y = -0.4;

  // ── Hips / Legs ──
  const hipsPivot = new BABYLON.TransformNode(`${options.name}_hips`, scene);
  hipsPivot.parent = root;
  hipsPivot.position.y = 0.52;

  // Hip mesh (small connector)
  const hips = BABYLON.MeshBuilder.CreateCapsule(`${options.name}_hipsmesh`, {
    height: 0.25,
    radius: 0.22,
    tessellation: 8,
  }, scene);
  hips.material = pantsMat;
  hips.parent = hipsPivot;
  hips.scaling = new BABYLON.Vector3(1.2, 1, 0.8);

  // Left leg
  const leftHipPivot = new BABYLON.TransformNode(`${options.name}_lhip`, scene);
  leftHipPivot.parent = hipsPivot;
  leftHipPivot.position = new BABYLON.Vector3(-0.12, -0.1, 0);

  const leftUpperLeg = BABYLON.MeshBuilder.CreateCapsule(`${options.name}_luleg`, {
    height: 0.5,
    radius: 0.1,
    tessellation: 8,
  }, scene);
  leftUpperLeg.material = pantsMat;
  leftUpperLeg.parent = leftHipPivot;
  leftUpperLeg.position.y = -0.25;

  const leftKneePivot = new BABYLON.TransformNode(`${options.name}_lknee`, scene);
  leftKneePivot.parent = leftHipPivot;
  leftKneePivot.position.y = -0.5;

  const leftLowerLeg = BABYLON.MeshBuilder.CreateCapsule(`${options.name}_llleg`, {
    height: 0.5,
    radius: 0.08,
    tessellation: 8,
  }, scene);
  leftLowerLeg.material = pantsMat;
  leftLowerLeg.parent = leftKneePivot;
  leftLowerLeg.position.y = -0.25;

  // Left foot
  const leftFoot = BABYLON.MeshBuilder.CreateBox(`${options.name}_lfoot`, {
    width: 0.14,
    height: 0.08,
    depth: 0.24,
  }, scene);
  leftFoot.material = shoeMat;
  leftFoot.parent = leftKneePivot;
  leftFoot.position = new BABYLON.Vector3(0, -0.52, 0.04);

  // Right leg (mirror)
  const rightHipPivot = new BABYLON.TransformNode(`${options.name}_rhip`, scene);
  rightHipPivot.parent = hipsPivot;
  rightHipPivot.position = new BABYLON.Vector3(0.12, -0.1, 0);

  const rightUpperLeg = BABYLON.MeshBuilder.CreateCapsule(`${options.name}_ruleg`, {
    height: 0.5,
    radius: 0.1,
    tessellation: 8,
  }, scene);
  rightUpperLeg.material = pantsMat;
  rightUpperLeg.parent = rightHipPivot;
  rightUpperLeg.position.y = -0.25;

  const rightKneePivot = new BABYLON.TransformNode(`${options.name}_rknee`, scene);
  rightKneePivot.parent = rightHipPivot;
  rightKneePivot.position.y = -0.5;

  const rightLowerLeg = BABYLON.MeshBuilder.CreateCapsule(`${options.name}_rlleg`, {
    height: 0.5,
    radius: 0.08,
    tessellation: 8,
  }, scene);
  rightLowerLeg.material = pantsMat;
  rightLowerLeg.parent = rightKneePivot;
  rightLowerLeg.position.y = -0.25;

  const rightFoot = BABYLON.MeshBuilder.CreateBox(`${options.name}_rfoot`, {
    width: 0.14,
    height: 0.08,
    depth: 0.24,
  }, scene);
  rightFoot.material = shoeMat;
  rightFoot.parent = rightKneePivot;
  rightFoot.position = new BABYLON.Vector3(0, -0.52, 0.04);

  // ── Animation state ──
  let currentAnim: CharacterAnimation = 'idle';
  let animTime = 0;
  let blendFactor = 0;    // 0 = idle, 1 = walk/run
  let targetBlend = 0;

  // Animation parameters
  const IDLE_BOB_SPEED = 2;
  const IDLE_BOB_AMOUNT = 0.02;
  const IDLE_BREATHE_SPEED = 1.5;

  const WALK_SPEED = 5;
  const WALK_STRIDE = 0.35;
  const WALK_ARM_SWING = 0.5;
  const WALK_BODY_SWAY = 0.03;

  const RUN_SPEED = 9;
  const RUN_STRIDE = 0.55;
  const RUN_ARM_SWING = 0.75;
  const RUN_LEAN = 0.12;

  function setAnimation(anim: CharacterAnimation) {
    if (anim === currentAnim) return;
    currentAnim = anim;
    targetBlend = anim === 'idle' ? 0 : 1;
  }

  function getAnimation() {
    return currentAnim;
  }

  function update(deltaTime: number) {
    animTime += deltaTime;

    // Smooth blend
    const blendSpeed = 5 * deltaTime;
    if (blendFactor < targetBlend) {
      blendFactor = Math.min(targetBlend, blendFactor + blendSpeed);
    } else if (blendFactor > targetBlend) {
      blendFactor = Math.max(targetBlend, blendFactor - blendSpeed);
    }

    // ── IDLE animation ──
    const idleWeight = 1 - blendFactor;

    // Idle: gentle breathing / bobbing
    const idleBob = Math.sin(animTime * IDLE_BOB_SPEED) * IDLE_BOB_AMOUNT;
    const idleBreathe = Math.sin(animTime * IDLE_BREATHE_SPEED) * 0.01;

    // ── WALK / RUN animation ──
    const moveWeight = blendFactor;
    const isRunning = currentAnim === 'run';
    const moveSpeed = isRunning ? RUN_SPEED : WALK_SPEED;
    const stride = isRunning ? RUN_STRIDE : WALK_STRIDE;
    const armSwing = isRunning ? RUN_ARM_SWING : WALK_ARM_SWING;

    const cycle = animTime * moveSpeed;
    const legSwing = Math.sin(cycle) * stride;
    const armSwingVal = Math.sin(cycle) * armSwing;
    const bodyBounce = Math.abs(Math.sin(cycle * 2)) * 0.03;
    const bodySway = Math.sin(cycle) * WALK_BODY_SWAY;

    // ── Apply to skeleton ──

    // Spine (body bob + lean)
    spine.position.y = 0.95 + idleBob * idleWeight + bodyBounce * moveWeight;
    spine.rotation.x = (isRunning ? RUN_LEAN : 0) * moveWeight;
    spine.scaling.x = 1 + idleBreathe * idleWeight;
    spine.scaling.z = 1 + idleBreathe * idleWeight;

    // Head slight counter-movement
    neckPivot.rotation.x = -spine.rotation.x * 0.5;
    neckPivot.rotation.z = -bodySway * moveWeight * 2;

    // Left arm
    leftShoulderPivot.rotation.x = armSwingVal * moveWeight;
    leftElbowPivot.rotation.x = isRunning
      ? Math.max(0, -armSwingVal * 0.6) * moveWeight
      : -0.1 * moveWeight;

    // Right arm (opposite phase)
    rightShoulderPivot.rotation.x = -armSwingVal * moveWeight;
    rightElbowPivot.rotation.x = isRunning
      ? Math.max(0, armSwingVal * 0.6) * moveWeight
      : -0.1 * moveWeight;

    // Idle arm slight sway
    leftShoulderPivot.rotation.z = (0.05 + Math.sin(animTime * 0.8) * 0.02) * idleWeight;
    rightShoulderPivot.rotation.z = (-0.05 - Math.sin(animTime * 0.8) * 0.02) * idleWeight;

    // Left leg
    leftHipPivot.rotation.x = -legSwing * moveWeight;
    leftKneePivot.rotation.x = Math.max(0, legSwing * 0.7) * moveWeight;

    // Right leg (opposite phase)
    rightHipPivot.rotation.x = legSwing * moveWeight;
    rightKneePivot.rotation.x = Math.max(0, -legSwing * 0.7) * moveWeight;

    // Hips slight twist
    hipsPivot.rotation.y = bodySway * moveWeight * 0.5;
    hipsPivot.position.y = 0.52 + bodyBounce * moveWeight * 0.5;
  }

  function lookAt(x: number, z: number) {
    const dx = x - root.position.x;
    const dz = z - root.position.z;
    const targetAngle = Math.atan2(dx, dz);
    // Smooth rotation
    let diff = targetAngle - root.rotation.y;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    root.rotation.y += diff * 0.1;
  }

  function dispose() {
    root.dispose();
    skinMat.dispose();
    shirtMat.dispose();
    pantsMat.dispose();
    shoeMat.dispose();
    hairMat.dispose();
    eyeMat.dispose();
  }

  return {
    root,
    setAnimation,
    getAnimation,
    update,
    lookAt,
    dispose,
  };
}
