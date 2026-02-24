/**
 * AssetLoader — Cached GLB/GLTF model loader for Babylon.js
 *
 * Loads 3D models from /public/models/ and caches them.
 * Subsequent calls for the same model clone from cache (instant).
 */

// Cache: path → root TransformNode (original, hidden)
const modelCache: Map<string, any> = new Map();

/**
 * Load a GLB model and return a positioned, scaled clone.
 * First call loads from network; subsequent calls clone from cache.
 */
export async function loadModel(
    path: string,
    scene: any,
    options?: {
        scale?: number;
        position?: { x: number; y: number; z: number };
        rotation?: { x: number; y: number; z: number };
        name?: string;
    }
): Promise<any> {
    const BABYLON = await import('@babylonjs/core');
    // Register GLTF loader plugin
    await import('@babylonjs/loaders');

    const scale = options?.scale ?? 1;
    const pos = options?.position ?? { x: 0, y: 0, z: 0 };
    const rot = options?.rotation ?? { x: 0, y: 0, z: 0 };
    const name = options?.name ?? path.split('/').pop()?.replace('.glb', '') ?? 'model';

    // Check cache
    if (!modelCache.has(path)) {
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                '',      // meshNames — empty loads all
                '',      // rootUrl — empty since path is full
                path,    // sceneFilename — full path like /models/furniture/desk.glb
                scene
            );

            // Create a root node to hold all meshes
            const root = new BABYLON.TransformNode(`__cache_${name}`, scene);
            for (const mesh of result.meshes) {
                if (!mesh.parent || mesh.parent === scene) {
                    mesh.parent = root;
                }
            }

            // Hide the cached original
            root.setEnabled(false);
            modelCache.set(path, root);
        } catch (err) {
            console.warn(`[AssetLoader] Failed to load ${path}:`, err);
            return null;
        }
    }

    // Clone from cache
    const cached = modelCache.get(path);
    if (!cached) return null;

    const clone = cached.clone(`${name}_${Date.now()}`, null);
    if (!clone) return null;

    clone.setEnabled(true);

    // Apply transforms
    clone.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
    clone.rotation = new BABYLON.Vector3(rot.x, rot.y, rot.z);
    clone.scaling = new BABYLON.Vector3(scale, scale, scale);

    // Enable all child meshes
    const meshes = clone.getChildMeshes(false);
    for (const mesh of meshes) {
        mesh.setEnabled(true);
        mesh.isPickable = true;
    }

    return clone;
}

/**
 * Preload multiple models in parallel (for faster room building).
 */
export async function preloadModels(
    paths: string[],
    scene: any
): Promise<void> {
    const BABYLON = await import('@babylonjs/core');
    await import('@babylonjs/loaders');

    const loadPromises = paths
        .filter(p => !modelCache.has(p))
        .map(async (path) => {
            try {
                const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', path, scene);
                const name = path.split('/').pop()?.replace('.glb', '') ?? 'model';
                const root = new BABYLON.TransformNode(`__cache_${name}`, scene);
                for (const mesh of result.meshes) {
                    if (!mesh.parent || mesh.parent === scene) {
                        mesh.parent = root;
                    }
                }
                root.setEnabled(false);
                modelCache.set(path, root);
            } catch (err) {
                console.warn(`[AssetLoader] Failed to preload ${path}:`, err);
            }
        });

    await Promise.all(loadPromises);
}

/**
 * Get all child meshes from a loaded model (for shadow casters, highlight, etc.)
 */
export function getModelMeshes(model: any): any[] {
    if (!model) return [];
    return model.getChildMeshes ? model.getChildMeshes(false) : [];
}

/**
 * Clear the model cache (call on scene dispose).
 */
export function clearModelCache(): void {
    for (const [, root] of modelCache) {
        if (root.dispose) root.dispose();
    }
    modelCache.clear();
}
