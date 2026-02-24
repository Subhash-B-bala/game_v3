/**
 * InteractableObjectSystem — Manages glowing interactable objects in rooms
 *
 * Supports both GLB models (via modelPath) and fallback box meshes.
 * Uses HighlightLayer for beautiful outline glow on active objects.
 *
 * Features:
 * - Proximity detection (3 unit radius)
 * - HighlightLayer outline glow on active objects
 * - Activation/deactivation toggle
 * - Floating label billboards
 */

import { loadModel, getModelMeshes } from './AssetLoader';

export interface InteractableObjectDef {
    id: string;
    name: string;
    promptText: string;           // e.g., "[E] Check Phone"
    position: { x: number; y: number; z: number };
    size: { w: number; h: number; d: number };  // Fallback box size
    color: string;                // Hex color (for fallback box)
    emissiveColor?: string;       // Glow color when active
    scenarioTag?: string;         // Filter tag for scenario selection
    modelPath?: string;           // GLB model path, e.g., "/models/furniture/laptop.glb"
    modelScale?: number;          // Scale factor for the model
    modelRotation?: { x: number; y: number; z: number }; // Rotation in radians
}

export interface InteractableObjectInstance {
    id: string;
    name: string;
    promptText: string;
    position: { x: number; y: number; z: number };
    mesh: any;          // TransformNode or Mesh (root of the object)
    meshes: any[];      // All child meshes (for highlight layer)
    isActive: boolean;
    scenarioTag?: string;
}

export interface InteractableObjectSystemHandle {
    getNearestObject: () => InteractableObjectInstance | null;
    getNearestActiveObject: () => InteractableObjectInstance | null;
    setObjectActive: (id: string, active: boolean) => void;
    activateAll: () => void;
    deactivateAll: () => void;
    getActiveObjects: () => InteractableObjectInstance[];
    getAllObjects: () => InteractableObjectInstance[];
    dispose: () => void;
}

const INTERACTION_RADIUS = 5;

export async function createInteractableObjectSystem(
    scene: any,
    objectDefs: InteractableObjectDef[],
    getPlayerPosition: () => { x: number; y: number; z: number }
): Promise<InteractableObjectSystemHandle> {
    const BABYLON = await import('@babylonjs/core');
    const GUI = await import('@babylonjs/gui');

    const objects: InteractableObjectInstance[] = [];
    let nearestObject: InteractableObjectInstance | null = null;
    let nearestActiveObject: InteractableObjectInstance | null = null;
    let nearestDistance = Infinity;

    // Create GUI layer for object labels
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('objectUI', true, scene);

    // Create HighlightLayer for active object glow outlines
    const highlightLayer = new BABYLON.HighlightLayer('objectHighlight', scene, {
        blurHorizontalSize: 0.5,
        blurVerticalSize: 0.5,
    });

    for (const def of objectDefs) {
        let rootMesh: any;
        let childMeshes: any[] = [];

        // Try loading GLB model first
        if (def.modelPath) {
            const model = await loadModel(def.modelPath, scene, {
                scale: def.modelScale ?? 1,
                position: def.position,
                rotation: def.modelRotation ?? { x: 0, y: 0, z: 0 },
                name: `obj_${def.id}`,
            });

            if (model) {
                rootMesh = model;
                childMeshes = getModelMeshes(model);
            }
        }

        // Fallback to colored box if model didn't load
        if (!rootMesh) {
            const mesh = BABYLON.MeshBuilder.CreateBox(`obj_${def.id}`, {
                width: def.size.w,
                height: def.size.h,
                depth: def.size.d,
            }, scene);
            mesh.position = new BABYLON.Vector3(def.position.x, def.position.y, def.position.z);

            const mat = new BABYLON.StandardMaterial(`obj_mat_${def.id}`, scene);
            mat.diffuseColor = BABYLON.Color3.FromHexString(def.color);
            mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            mesh.material = mat;

            rootMesh = mesh;
            childMeshes = [mesh];
        }

        // Floating label billboard
        const rect = new GUI.Rectangle(`obj_label_${def.id}`);
        rect.width = '120px';
        rect.height = '28px';
        rect.cornerRadius = 6;
        rect.color = 'transparent';
        rect.thickness = 0;
        rect.background = 'rgba(59, 130, 246, 0.7)';
        advancedTexture.addControl(rect);
        rect.linkWithMesh(rootMesh);
        rect.linkOffsetY = -60;

        const labelText = new GUI.TextBlock(`obj_label_text_${def.id}`);
        labelText.text = def.name;
        labelText.color = 'white';
        labelText.fontSize = 11;
        labelText.fontWeight = 'bold';
        rect.addControl(labelText);

        const instance: InteractableObjectInstance = {
            id: def.id,
            name: def.name,
            promptText: def.promptText,
            position: { ...def.position },
            mesh: rootMesh,
            meshes: childMeshes,
            isActive: true,
            scenarioTag: def.scenarioTag,
        };

        objects.push(instance);

        // Add highlight glow to all meshes of active objects
        const glowColor = BABYLON.Color3.FromHexString(def.emissiveColor || '#3B82F6');
        for (const m of childMeshes) {
            highlightLayer.addMesh(m, glowColor);
        }
    }

    // Helper to update highlight visibility
    const updateHighlight = (obj: InteractableObjectInstance, active: boolean) => {
        for (const m of obj.meshes) {
            if (active) {
                highlightLayer.addMesh(m, BABYLON.Color3.FromHexString(
                    objectDefs.find(d => d.id === obj.id)?.emissiveColor || '#3B82F6'
                ));
            } else {
                highlightLayer.removeMesh(m);
            }
        }
    };

    // Per-frame: proximity detection + subtle bobbing for active objects
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
        const deltaTime = scene.getEngine().getDeltaTime() / 1000;
        time += deltaTime;

        const playerPos = getPlayerPosition();
        nearestObject = null;
        nearestActiveObject = null;
        nearestDistance = Infinity;

        for (const obj of objects) {
            const dx = playerPos.x - obj.position.x;
            const dz = playerPos.z - obj.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            // Track nearest overall
            if (dist < INTERACTION_RADIUS && dist < nearestDistance) {
                nearestObject = obj;
                nearestDistance = dist;
                if (obj.isActive) {
                    nearestActiveObject = obj;
                }
            }

            // Subtle bobbing for active objects
            if (obj.isActive && obj.mesh) {
                const bob = Math.sin(time * 2 + objects.indexOf(obj) * 1.5) * 0.03;
                obj.mesh.position.y = obj.position.y + bob;
            }
        }
    });

    return {
        getNearestObject: () => nearestObject,
        getNearestActiveObject: () => nearestActiveObject,

        setObjectActive: (id: string, active: boolean) => {
            const obj = objects.find(o => o.id === id);
            if (!obj) return;
            obj.isActive = active;
            updateHighlight(obj, active);
        },

        activateAll: () => {
            for (const obj of objects) {
                obj.isActive = true;
                updateHighlight(obj, true);
            }
        },

        deactivateAll: () => {
            for (const obj of objects) {
                obj.isActive = false;
                updateHighlight(obj, false);
            }
        },

        getActiveObjects: () => objects.filter(o => o.isActive),
        getAllObjects: () => [...objects],

        dispose: () => {
            for (const obj of objects) {
                if (obj.mesh?.dispose) obj.mesh.dispose();
            }
            highlightLayer.dispose();
            advancedTexture.dispose();
        },
    };
}
