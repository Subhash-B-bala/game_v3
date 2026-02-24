/**
 * GLBCharacterLoader — Loads real animated 3D characters from GLB files
 *
 * Replaces the procedural CharacterBuilder with actual rigged, animated
 * GLB models (Soldier, Robot, Michelle, Xbot, etc.) downloaded from
 * the Three.js examples repository.
 *
 * Implements the same AnimatedCharacter interface so PlayerController
 * and NPCSystem work without changes.
 *
 * Key Babylon.js concepts used:
 *  - SceneLoader.ImportMeshAsync — loads GLB with meshes + skeleton + animations
 *  - AnimationGroup — Babylon auto-parses GLB animations into these
 *  - AnimationGroup blending — crossfade between idle/walk/run
 */

import type { AnimatedCharacter, CharacterAnimation } from './CharacterBuilder';

// ═══════════════════════════════════════════════════════════════
// Character Model Registry
// ═══════════════════════════════════════════════════════════════

export interface GLBCharacterConfig {
    path: string;
    scale: number;
    yOffset: number; // vertical offset to place feet on ground
    animationMap: Record<CharacterAnimation, string[]>; // anim name → possible GLB animation names
}

// Map of role → GLB configuration
// Animation names vary per model, so we list alternatives
const CHARACTER_CONFIGS: Record<string, GLBCharacterConfig> = {
    player: {
        path: '/models/characters/Soldier.glb',
        scale: 0.55,
        yOffset: 0,
        animationMap: {
            idle: ['Idle', 'idle', 'TPose', 'Survey'],
            walk: ['Walk', 'walk', 'Walking', 'Run'],
            run: ['Run', 'run', 'Running', 'Walk'],
        },
    },
    tony: {
        path: '/models/characters/Xbot.glb',
        scale: 0.012,
        yOffset: 0,
        animationMap: {
            idle: ['idle', 'Idle', 'mixamo.com', 'TPose'],
            walk: ['walk', 'Walk', 'Walking', 'run'],
            run: ['run', 'Run', 'Running', 'walk'],
        },
    },
    npc_robot: {
        path: '/models/characters/RobotExpressive.glb',
        scale: 0.45,
        yOffset: 0,
        animationMap: {
            idle: ['Idle', 'idle', 'Standing'],
            walk: ['Walking', 'Walk', 'walk', 'Running'],
            run: ['Running', 'Run', 'run', 'Walking'],
        },
    },
    npc_female: {
        path: '/models/characters/Michelle.glb',
        scale: 0.012,
        yOffset: 0,
        animationMap: {
            idle: ['idle', 'Idle', 'mixamo.com', 'TPose'],
            walk: ['walk', 'Walk', 'Walking'],
            run: ['run', 'Run', 'Running'],
        },
    },
    npc_cesium: {
        path: '/models/characters/CesiumMan.glb',
        scale: 1.0,
        yOffset: 0,
        animationMap: {
            idle: ['0', 'Idle', 'idle'],
            walk: ['0', 'Walk', 'walk'],
            run: ['0', 'Run', 'run'],
        },
    },
};

// ═══════════════════════════════════════════════════════════════
// Main Loader
// ═══════════════════════════════════════════════════════════════

export async function loadGLBCharacter(
    scene: any,
    role: string,
    overrideScale?: number
): Promise<AnimatedCharacter> {
    const BABYLON = await import('@babylonjs/core');
    await import('@babylonjs/loaders');

    const config = CHARACTER_CONFIGS[role] || CHARACTER_CONFIGS.player;
    const scale = overrideScale ?? config.scale;

    // Load the GLB file with all meshes and animations
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
        '', '', config.path, scene
    );

    // ── Setup root transform node ──
    const root = new BABYLON.TransformNode(`${role}_root`, scene);
    root.scaling = new BABYLON.Vector3(scale, scale, scale);

    // Parent all loaded meshes under root
    for (const mesh of result.meshes) {
        if (!mesh.parent || mesh.parent === scene) {
            mesh.parent = root;
        }
        // Enable shadows
        mesh.receiveShadows = true;
    }

    // Apply vertical offset
    if (config.yOffset !== 0) {
        root.position.y = config.yOffset;
    }

    // ── Clear rotationQuaternion ONLY on the external root (our TransformNode) ──
    // Do NOT clear on loaded meshes — skinned meshes and bone-driven nodes need rotationQuaternion!
    if ((root as any).rotationQuaternion) {
        (root as any).rotationQuaternion = null;
    }

    // Find the GLB's internal __root__ node (the top-level container inside the GLB)
    const glbInternalRoot = result.meshes.find((m: any) =>
        m.name === '__root__' || m.name === 'RootNode' || m.name === 'Armature'
    );
    // Also clear rotationQuaternion on just the GLB internal root so we can lock it
    if (glbInternalRoot && glbInternalRoot.rotationQuaternion) {
        glbInternalRoot.rotationQuaternion = null;
    }

    // ── Extract animation groups ──
    const animationGroups = result.animationGroups || [];

    // Targeted root motion stripping: ONLY remove position/rotation tracks
    // that target the GLB's top-level __root__ node. Leave ALL other tracks alone
    // (bones, skeleton nodes, skinned mesh transforms all need their animations).
    const rootNodeNames = new Set(['__root__', 'rootnode', 'root', 'armature', 'soldier']);
    for (const group of animationGroups) {
        const toRemove: any[] = [];
        for (const ta of (group.targetedAnimations || [])) {
            const target = ta.target;
            const prop = ta.animation?.targetProperty || '';
            if (!target) continue;
            const targetName = (target.name || '').toLowerCase();

            // Only strip tracks on the actual root container node
            if (rootNodeNames.has(targetName) &&
                (prop === 'position' || prop === 'position.x' || prop === 'position.y' || prop === 'position.z' ||
                 prop === 'rotation' || prop === 'rotation.x' || prop === 'rotation.y' || prop === 'rotation.z' ||
                 prop === 'rotationQuaternion' || prop === 'rotationQuaternion.x' || prop === 'rotationQuaternion.y' ||
                 prop === 'rotationQuaternion.z' || prop === 'rotationQuaternion.w')) {
                toRemove.push(ta.animation);
            }
        }
        for (const anim of toRemove) {
            group.removeTargetedAnimation(anim);
        }
    }

    // Map our standard animation names to the actual AnimationGroups
    const animMap: Record<CharacterAnimation, any> = {
        idle: null,
        walk: null,
        run: null,
    };

    for (const animName of ['idle', 'walk', 'run'] as CharacterAnimation[]) {
        const candidates = config.animationMap[animName];
        for (const candidate of candidates) {
            const found = animationGroups.find((g: any) =>
                g.name.toLowerCase().includes(candidate.toLowerCase())
            );
            if (found) {
                animMap[animName] = found;
                break;
            }
        }
    }

    // Fallbacks
    if (!animMap.idle && animationGroups.length > 0) animMap.idle = animationGroups[0];
    if (!animMap.walk) animMap.walk = animMap.idle;
    if (!animMap.run) animMap.run = animMap.walk;

    // ── Stop all animations initially, then play idle ──
    for (const group of animationGroups) {
        group.stop();
    }

    let currentAnim: CharacterAnimation = 'idle';
    let activeGroup: any = null;

    function playAnimGroup(anim: CharacterAnimation) {
        const targetGroup = animMap[anim];
        if (!targetGroup) return;
        if (activeGroup === targetGroup) return;

        // Crossfade: don't hard-stop, use weight blending
        if (activeGroup) {
            // Fade out old animation
            const oldGroup = activeGroup;
            oldGroup.setWeightForAllAnimatables(0);
            oldGroup.stop();
        }

        // Play new animation (looped) with full weight
        targetGroup.start(true, anim === 'run' ? 1.3 : 1.0);
        targetGroup.setWeightForAllAnimatables(1.0);
        activeGroup = targetGroup;
    }

    // Start with idle
    playAnimGroup('idle');

    // ── AnimatedCharacter interface implementation ──

    function setAnimation(anim: CharacterAnimation) {
        if (anim === currentAnim) return;
        currentAnim = anim;
        playAnimGroup(anim);
    }

    function getAnimation(): CharacterAnimation {
        return currentAnim;
    }

    function update(_deltaTime: number) {
        // Lock the GLB's internal root node position every frame
        // to prevent any remaining root motion from shifting the model.
        // Only lock position — rotation on this node should stay at 0 (set once above).
        if (glbInternalRoot) {
            glbInternalRoot.position.x = 0;
            glbInternalRoot.position.y = 0;
            glbInternalRoot.position.z = 0;
        }
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
        // Stop all animations
        for (const group of animationGroups) {
            group.stop();
            group.dispose();
        }
        // Dispose meshes
        for (const mesh of result.meshes) {
            if (mesh.dispose) mesh.dispose();
        }
        // Dispose skeletons
        for (const skeleton of (result.skeletons || [])) {
            if (skeleton.dispose) skeleton.dispose();
        }
        root.dispose();
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

// ═══════════════════════════════════════════════════════════════
// Safe loader with fallback to procedural characters
// ═══════════════════════════════════════════════════════════════

export async function loadCharacterWithFallback(
    scene: any,
    role: string,
    overrideScale?: number
): Promise<AnimatedCharacter> {
    try {
        return await loadGLBCharacter(scene, role, overrideScale);
    } catch (err) {
        console.warn(`[GLBCharacter] Failed to load GLB for ${role}, falling back to procedural:`, err);
        // Fallback to procedural character
        const { createAnimatedCharacter, CHARACTER_PRESETS } = await import('./CharacterBuilder');
        const preset = (CHARACTER_PRESETS as any)[role] || CHARACTER_PRESETS.player;
        return createAnimatedCharacter(scene, { ...preset, scale: overrideScale ?? preset.scale ?? 1.0 });
    }
}

// Export config for external use
export { CHARACTER_CONFIGS };
