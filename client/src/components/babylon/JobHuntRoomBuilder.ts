/**
 * JobHuntRoomBuilder — Generates 3D room geometry for each floor of "The Climb"
 *
 * Uses real 3D GLB models from Kenney.nl Furniture Kit (CC0 license).
 * Walls/floor/lighting are procedural; furniture is loaded from /models/furniture/*.glb
 *
 * Floor 0: THE GRIND — Studio apartment (cramped, single bulb, folding table)
 * Floor 1: THE WORKBENCH — Home office (proper desk, dual monitors, bookshelf)
 * Floor 2: THE COWORK — Coworking space (standing desk, conference table, whiteboard)
 * Floor 3: THE NEGOTIATION SUITE — Executive office (mahogany desk, leather chair)
 * Floor 4: THE SUMMIT — Boardroom (oval table, panoramic windows, contract)
 */

import type { InteractableObjectDef } from './InteractableObjectSystem';
import { loadModel, preloadModels, getModelMeshes } from './AssetLoader';

export interface RoomLayout {
    width: number;
    depth: number;
    height: number;
    spawnPoint: { x: number; y: number; z: number };
    tonyPosition: { x: number; y: number; z: number };
    tonyIsPhysical: boolean;
    objects: InteractableObjectDef[];
    worldBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
    cameraRadius: number;
    cameraBeta: number;
    cameraRadiusLimits: { lower: number; upper: number };
    shadowCasters?: any[];  // Meshes to cast shadows
}

const BRAND = {
    blue: '#3B82F6',
    purple: '#6F53C1',
    lime: '#D7EF3F',
    navy: '#181830',
    teal: '#20C997',
    slate: '#3F4C78',
};

// Model path helper
const M = (name: string) => `/models/furniture/${name}.glb`;

/**
 * Build room geometry. Returns layout metadata.
 */
export async function buildFloorRoom(
    stage: number,
    progress: number,
    scene: any
): Promise<RoomLayout> {
    const BABYLON = await import('@babylonjs/core');

    // Helper: colored box (for walls, structural elements, small props)
    const box = (
        name: string,
        w: number, h: number, d: number,
        color: string,
        px: number, py: number, pz: number,
        emissive?: string
    ) => {
        const mesh = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
        const mat = new BABYLON.StandardMaterial(name + '_mat', scene);
        mat.diffuseColor = BABYLON.Color3.FromHexString(color);
        if (emissive) mat.emissiveColor = BABYLON.Color3.FromHexString(emissive).scale(0.25);
        mat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        mesh.material = mat;
        mesh.position = new BABYLON.Vector3(px, py, pz);
        mesh.checkCollisions = false;
        return mesh;
    };

    // Helper: wall with collision
    const wall = (
        name: string,
        w: number, h: number, d: number,
        color: string,
        px: number, py: number, pz: number
    ) => {
        const mesh = box(name, w, h, d, color, px, py, pz);
        mesh.checkCollisions = true;
        return mesh;
    };

    switch (stage) {
        case 0: return buildFloor0(scene, BABYLON, box, wall, progress);
        case 1: return buildFloor1(scene, BABYLON, box, wall, progress);
        case 2: return buildFloor2(scene, BABYLON, box, wall, progress);
        case 3: return buildFloor3(scene, BABYLON, box, wall, progress);
        case 4: return buildFloor4(scene, BABYLON, box, wall, progress);
        default: return buildFloor0(scene, BABYLON, box, wall, progress);
    }
}

// ═══════════════════════════════════════════════════════════════
// SHADOW HELPER — creates ShadowGenerator for a PointLight
// ═══════════════════════════════════════════════════════════════
async function setupShadows(scene: any, light: any, floor: any): Promise<any> {
    const BABYLON = await import('@babylonjs/core');
    // ShadowGenerator needs a DirectionalLight or SpotLight, not PointLight
    // For PointLight, we use ShadowGenerator with special setup
    // Actually, let's create a DirectionalLight specifically for shadows
    const shadowLight = new BABYLON.DirectionalLight(
        'shadowLight',
        new BABYLON.Vector3(-0.5, -1, 0.3),
        scene
    );
    shadowLight.intensity = 0.3;
    shadowLight.diffuse = new BABYLON.Color3(1, 0.95, 0.9);

    const shadowGen = new BABYLON.ShadowGenerator(1024, shadowLight);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 32;
    shadowGen.darkness = 0.4;

    floor.receiveShadows = true;

    return shadowGen;
}

// Helper: add all meshes from a loaded model to shadow caster list
function addToShadows(shadowGen: any, model: any) {
    if (!shadowGen || !model) return;
    const meshes = getModelMeshes(model);
    for (const m of meshes) {
        shadowGen.addShadowCaster(m);
    }
}

// ═══════════════════════════════════════════════════════════════
// FLOOR 0 — THE GRIND (Studio Apartment, 15×10)
// ═══════════════════════════════════════════════════════════════

async function buildFloor0(
    scene: any, BABYLON: any,
    box: Function, wall: Function,
    progress: number
): Promise<RoomLayout> {
    const W = 15, D = 10, H = 4;

    // Preload models we'll need
    await preloadModels([
        M('desk'), M('chair'), M('laptop'), M('bedSingle'), M('pillow'),
        M('cardboardBoxClosed'), M('cardboardBoxOpen'), M('kitchenFridgeSmall'),
        M('lampRoundTable'), M('plantSmall1'), M('sideTable'), M('books'),
        M('rugRectangle'), M('trashcan'),
    ], scene);

    scene.clearColor = new BABYLON.Color4(0.08, 0.06, 0.05, 1);

    // ── Lighting ──
    const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
    ambient.intensity = 0.85;
    ambient.diffuse = new BABYLON.Color3(1, 0.95, 0.88);
    ambient.groundColor = new BABYLON.Color3(0.35, 0.3, 0.25);

    const bulb = new BABYLON.PointLight('bulb', new BABYLON.Vector3(W / 2, 3.5, D / 2), scene);
    bulb.intensity = 1.5;
    bulb.diffuse = new BABYLON.Color3(1, 0.9, 0.75);
    bulb.range = 25;

    const fillLight = new BABYLON.PointLight('fillLight', new BABYLON.Vector3(3, 2.5, 7), scene);
    fillLight.intensity = 0.7;
    fillLight.diffuse = new BABYLON.Color3(1, 0.92, 0.82);
    fillLight.range = 15;

    // ── Floor ──
    const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: W, height: D }, scene);
    const floorMat = new BABYLON.PBRMaterial('floor_mat', scene);
    floorMat.albedoColor = BABYLON.Color3.FromHexString('#5D4037');
    floorMat.roughness = 0.85;
    floorMat.metallic = 0.0;
    floor.material = floorMat;
    floor.position = new BABYLON.Vector3(W / 2, 0, D / 2);

    // ── Shadows ──
    const shadowGen = await setupShadows(scene, bulb, floor);

    // ── Walls ──
    wall('wall_back', W, H, 0.3, '#C8B8A0', W / 2, H / 2, 0);
    wall('wall_front', W, H, 0.3, '#BBA88F', W / 2, H / 2, D);
    wall('wall_left', 0.3, H, D, '#BBA88F', 0, H / 2, D / 2);
    wall('wall_right', 0.3, H, D, '#C8B8A0', W, H / 2, D / 2);

    // ── Window ──
    box('window_glass', 2.2, 1.5, 0.08, '#5A6A7A', 11, 2.8, 0.2, '#334455');
    box('wf_t', 2.4, 0.08, 0.12, '#8B7355', 11, 3.58, 0.2);
    box('wf_b', 2.4, 0.08, 0.12, '#8B7355', 11, 2.02, 0.2);
    box('wf_l', 0.08, 1.5, 0.12, '#8B7355', 9.85, 2.8, 0.2);
    box('wf_r', 0.08, 1.5, 0.12, '#8B7355', 12.15, 2.8, 0.2);

    // ══ FURNITURE (Real 3D Models) ══

    // Desk — right side of room
    const desk = await loadModel(M('desk'), scene, {
        scale: 2.0, position: { x: 10.5, y: 0, z: 3 }, name: 'desk'
    });
    addToShadows(shadowGen, desk);

    // Chair — facing desk
    const chair = await loadModel(M('chair'), scene, {
        scale: 2.0, position: { x: 10.5, y: 0, z: 5.5 },
        rotation: { x: 0, y: Math.PI, z: 0 }, name: 'chair'
    });
    addToShadows(shadowGen, chair);

    // Laptop on desk (decorative — interactable version is separate)
    const laptopDeco = await loadModel(M('laptop'), scene, {
        scale: 2.0, position: { x: 10, y: 1.0, z: 2.8 }, name: 'laptop_deco'
    });
    addToShadows(shadowGen, laptopDeco);

    // Bed — left back corner
    const bed = await loadModel(M('bedSingle'), scene, {
        scale: 2.0, position: { x: 3, y: 0, z: 8 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 }, name: 'bed'
    });
    addToShadows(shadowGen, bed);

    // Pillow on bed
    await loadModel(M('pillow'), scene, {
        scale: 2.0, position: { x: 2, y: 0.6, z: 8 }, name: 'pillow'
    });

    // Cardboard boxes — left side (moving in)
    const box1 = await loadModel(M('cardboardBoxClosed'), scene, {
        scale: 1.8, position: { x: 1.5, y: 0, z: 1.5 }, name: 'cbox1'
    });
    addToShadows(shadowGen, box1);
    const box2 = await loadModel(M('cardboardBoxOpen'), scene, {
        scale: 1.8, position: { x: 2.5, y: 0, z: 2.5 }, name: 'cbox2'
    });
    addToShadows(shadowGen, box2);
    await loadModel(M('cardboardBoxClosed'), scene, {
        scale: 1.5, position: { x: 1.2, y: 0, z: 4.5 }, name: 'cbox3'
    });

    // Mini fridge — right wall
    const fridge = await loadModel(M('kitchenFridgeSmall'), scene, {
        scale: 2.0, position: { x: 14, y: 0, z: 6 }, name: 'fridge'
    });
    addToShadows(shadowGen, fridge);

    // Side table with lamp — near bed
    await loadModel(M('sideTable'), scene, {
        scale: 2.0, position: { x: 5, y: 0, z: 8 }, name: 'sidetable'
    });
    await loadModel(M('lampRoundTable'), scene, {
        scale: 2.0, position: { x: 5, y: 0.8, z: 8 }, name: 'lamp'
    });

    // Books on desk
    await loadModel(M('books'), scene, {
        scale: 2.0, position: { x: 12, y: 1.0, z: 3 }, name: 'books'
    });

    // Rug near desk
    await loadModel(M('rugRectangle'), scene, {
        scale: 2.5, position: { x: 10, y: 0.01, z: 4.5 }, name: 'rug'
    });

    // Trash can
    await loadModel(M('trashcan'), scene, {
        scale: 2.0, position: { x: 13.5, y: 0, z: 4 }, name: 'trash'
    });

    // Wall decorations (keep as boxes — flat on wall)
    box('sticky1', 0.25, 0.25, 0.02, BRAND.lime, 4, 2.2, 0.2);
    box('sticky4', 0.25, 0.25, 0.02, '#FF9800', 4.4, 2.0, 0.2);
    box('calendar', 0.5, 0.6, 0.02, '#FFF8E1', 3, 2.8, 0.2);
    box('calendar_top', 0.5, 0.08, 0.03, '#D63384', 3, 3.12, 0.2);
    box('tony_photo_frame', 0.7, 0.8, 0.03, '#5D4037', 6, 2.6, 0.2);
    box('tony_photo', 0.55, 0.65, 0.02, '#5588BB', 6, 2.6, 0.22, BRAND.blue);

    // Hanging bulb
    box('bulb_wire', 0.02, 0.8, 0.02, '#555', W / 2, 3.6, D / 2);
    box('bulb_body', 0.15, 0.18, 0.15, '#FFFDE7', W / 2, 3.15, D / 2, '#FFE082');

    // Progress-based additions
    if (progress >= 25) {
        await loadModel(M('plantSmall1'), scene, {
            scale: 2.0, position: { x: 14, y: 0, z: 2 }, name: 'plant'
        });
    }
    if (progress >= 50) {
        box('sticky2', 0.25, 0.25, 0.02, '#20C997', 4.8, 2.5, 0.2);
        box('sticky3', 0.25, 0.25, 0.02, '#FD7E14', 5.2, 1.9, 0.2);
    }
    if (progress >= 75) {
        await loadModel(M('lampRoundFloor'), scene, {
            scale: 2.0, position: { x: 8, y: 0, z: 4 }, name: 'floorLamp'
        });
    }

    // Bulb flicker animation
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
        time += 0.015;
        bulb.intensity = 1.5 + Math.sin(time * 8) * 0.04;
    });

    return {
        width: W, depth: D, height: H,
        spawnPoint: { x: 7.5, y: 1.5, z: 6 },
        tonyPosition: { x: 6, y: 2.6, z: 0.3 },
        tonyIsPhysical: false,
        objects: [
            {
                id: 'laptop',
                name: 'Laptop',
                promptText: '[E] Open Laptop',
                position: { x: 10, y: 1.2, z: 2.8 },
                size: { w: 0.9, h: 0.4, d: 0.6 },
                color: '#333333',
                emissiveColor: BRAND.blue,
                scenarioTag: 'ATS',
                modelPath: M('laptop'),
                modelScale: 2.0,
            },
            {
                id: 'phone',
                name: 'Phone',
                promptText: '[E] Check Phone',
                position: { x: 12, y: 1.1, z: 3.2 },
                size: { w: 0.4, h: 0.3, d: 0.5 },
                color: '#1A1A2E',
                emissiveColor: BRAND.blue,
                scenarioTag: 'networking',
                modelPath: M('radio'),  // radio as phone substitute
                modelScale: 1.5,
            },
            {
                id: 'resume_box',
                name: 'Resume',
                promptText: '[E] Check Resume',
                position: { x: 2.5, y: 0.3, z: 2.5 },
                size: { w: 0.6, h: 0.5, d: 0.5 },
                color: '#A0855B',
                emissiveColor: BRAND.lime,
                scenarioTag: 'resume',
                modelPath: M('cardboardBoxOpen'),
                modelScale: 1.8,
            },
        ],
        worldBounds: { minX: 0.8, maxX: W - 0.8, minZ: 0.8, maxZ: D - 0.8 },
        cameraRadius: 7,
        cameraBeta: Math.PI / 3,
        cameraRadiusLimits: { lower: 4, upper: 12 },
    };
}

// ═══════════════════════════════════════════════════════════════
// FLOOR 1 — THE WORKBENCH (Home Office, 20×15)
// ═══════════════════════════════════════════════════════════════

async function buildFloor1(
    scene: any, BABYLON: any,
    box: Function, wall: Function,
    progress: number
): Promise<RoomLayout> {
    const W = 20, D = 15, H = 4;

    await preloadModels([
        M('deskCorner'), M('chairDesk'), M('computerScreen'), M('computerKeyboard'),
        M('computerMouse'), M('laptop'), M('bookcaseClosedWide'), M('books'),
        M('plantSmall2'), M('lampSquareFloor'), M('rugRound'), M('pottedPlant'),
        M('sideTableDrawers'), M('loungeSofa'),
    ], scene);

    scene.clearColor = new BABYLON.Color4(0.06, 0.06, 0.08, 1);

    const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
    ambient.intensity = 0.9;
    ambient.diffuse = new BABYLON.Color3(1, 0.95, 0.88);
    ambient.groundColor = new BABYLON.Color3(0.35, 0.3, 0.25);

    const ceilingLight = new BABYLON.PointLight('ceilingLight', new BABYLON.Vector3(10, 3.8, 7.5), scene);
    ceilingLight.intensity = 1.5;
    ceilingLight.diffuse = new BABYLON.Color3(1, 0.95, 0.9);
    ceilingLight.range = 30;

    const fillLight = new BABYLON.PointLight('fillLight', new BABYLON.Vector3(3, 2.5, 12), scene);
    fillLight.intensity = 0.6;
    fillLight.diffuse = new BABYLON.Color3(1, 0.93, 0.85);
    fillLight.range = 18;

    const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: W, height: D }, scene);
    const floorMat = new BABYLON.PBRMaterial('floor_mat', scene);
    floorMat.albedoColor = BABYLON.Color3.FromHexString('#5C4033');
    floorMat.roughness = 0.8;
    floorMat.metallic = 0.0;
    floor.material = floorMat;
    floor.position = new BABYLON.Vector3(W / 2, 0, D / 2);

    const shadowGen = await setupShadows(scene, ceilingLight, floor);

    wall('wall_back', W, H, 0.3, '#C4BFAE', W / 2, H / 2, 0);
    wall('wall_front', W, H, 0.3, '#C4BFAE', W / 2, H / 2, D);
    wall('wall_left', 0.3, H, D, '#B8B0A0', 0, H / 2, D / 2);
    wall('wall_right', 0.3, H, D, '#B8B0A0', W, H / 2, D / 2);

    // Window
    box('window_glass', 4, 2, 0.08, '#87CEEB', 10, 2.5, 0.2, '#87CEEB');
    box('wf_t', 4.2, 0.1, 0.12, '#DABB8A', 10, 3.55, 0.2);
    box('wf_b', 4.2, 0.1, 0.12, '#DABB8A', 10, 1.45, 0.2);

    // ══ FURNITURE ══

    // L-Shaped desk
    const deskCorner = await loadModel(M('deskCorner'), scene, {
        scale: 2.2, position: { x: 10, y: 0, z: 2.5 }, name: 'desk'
    });
    addToShadows(shadowGen, deskCorner);

    // Desk chair
    const deskChair = await loadModel(M('chairDesk'), scene, {
        scale: 2.0, position: { x: 10, y: 0, z: 5 },
        rotation: { x: 0, y: Math.PI, z: 0 }, name: 'deskChair'
    });
    addToShadows(shadowGen, deskChair);

    // Dual monitors
    await loadModel(M('computerScreen'), scene, {
        scale: 2.0, position: { x: 9, y: 1.0, z: 2 }, name: 'monitor1'
    });
    await loadModel(M('computerScreen'), scene, {
        scale: 2.0, position: { x: 11, y: 1.0, z: 2 }, name: 'monitor2'
    });
    await loadModel(M('computerKeyboard'), scene, {
        scale: 2.0, position: { x: 10, y: 1.0, z: 3 }, name: 'keyboard'
    });
    await loadModel(M('computerMouse'), scene, {
        scale: 2.0, position: { x: 11.5, y: 1.0, z: 3 }, name: 'mouse'
    });

    // Bookcase — left wall
    const bookcase = await loadModel(M('bookcaseClosedWide'), scene, {
        scale: 2.2, position: { x: 1.5, y: 0, z: 5 }, name: 'bookcase'
    });
    addToShadows(shadowGen, bookcase);

    await loadModel(M('books'), scene, {
        scale: 2.0, position: { x: 1.5, y: 1.2, z: 5 }, name: 'books'
    });

    // Floor lamp — corner
    const floorLamp = await loadModel(M('lampSquareFloor'), scene, {
        scale: 2.0, position: { x: 2, y: 0, z: 1 }, name: 'floorLamp'
    });
    addToShadows(shadowGen, floorLamp);

    // Plants
    await loadModel(M('plantSmall2'), scene, {
        scale: 2.0, position: { x: 13, y: 1.0, z: 2 }, name: 'deskPlant'
    });
    await loadModel(M('pottedPlant'), scene, {
        scale: 2.5, position: { x: 18, y: 0, z: 13 }, name: 'floorPlant'
    });

    // Round rug
    await loadModel(M('rugRound'), scene, {
        scale: 3.0, position: { x: 10, y: 0.01, z: 7 }, name: 'rug'
    });

    // Side table with items
    await loadModel(M('sideTableDrawers'), scene, {
        scale: 2.0, position: { x: 18, y: 0, z: 3 }, name: 'sideTable'
    });

    // Whiteboard on right wall (keep as box — flat surface)
    box('whiteboard_frame', 0.08, 2, 3, '#DABB8A', W - 0.2, 2.5, 7.5);
    box('whiteboard_surface', 0.05, 1.8, 2.8, '#FFFFFF', W - 0.18, 2.5, 7.5, '#FFFFFF');

    // Tony video frame on monitor
    box('tony_video_frame', 0.8, 0.55, 0.02, BRAND.blue, 11, 1.65, 1.8, BRAND.blue);

    if (progress >= 50) {
        await loadModel(M('loungeSofa'), scene, {
            scale: 2.0, position: { x: 5, y: 0, z: 12 },
            rotation: { x: 0, y: -Math.PI / 2, z: 0 }, name: 'sofa'
        });
    }

    return {
        width: W, depth: D, height: H,
        spawnPoint: { x: 10, y: 1.5, z: 12 },
        tonyPosition: { x: 11, y: 1.65, z: 1.77 },
        tonyIsPhysical: false,
        objects: [
            {
                id: 'monitor',
                name: 'Email',
                promptText: '[E] Check Email',
                position: { x: 9, y: 1.5, z: 2.0 },
                size: { w: 1.0, h: 0.6, d: 0.3 },
                color: '#111111',
                emissiveColor: BRAND.blue,
                scenarioTag: 'ATS',
                modelPath: M('computerScreen'),
                modelScale: 2.0,
            },
            {
                id: 'bookshelf',
                name: 'Study',
                promptText: '[E] Study Materials',
                position: { x: 1.5, y: 0.5, z: 5 },
                size: { w: 1.5, h: 1.0, d: 0.6 },
                color: '#5D4037',
                emissiveColor: BRAND.teal,
                scenarioTag: 'technical',
                modelPath: M('books'),
                modelScale: 2.5,
            },
            {
                id: 'whiteboard',
                name: 'Plan',
                promptText: '[E] Review Plan',
                position: { x: W - 1, y: 2.5, z: 7.5 },
                size: { w: 0.5, h: 1.5, d: 2.5 },
                color: '#FFFFFF',
                emissiveColor: BRAND.purple,
                scenarioTag: 'strategy',
            },
        ],
        worldBounds: { minX: 0.8, maxX: W - 0.8, minZ: 0.8, maxZ: D - 0.8 },
        cameraRadius: 9,
        cameraBeta: Math.PI / 3,
        cameraRadiusLimits: { lower: 5, upper: 15 },
    };
}

// ═══════════════════════════════════════════════════════════════
// FLOOR 2 — THE COWORK (Coworking Space, 28×18)
// ═══════════════════════════════════════════════════════════════

async function buildFloor2(
    scene: any, BABYLON: any,
    box: Function, wall: Function,
    progress: number
): Promise<RoomLayout> {
    const W = 28, D = 18, H = 5;

    await preloadModels([
        M('desk'), M('chairDesk'), M('computerScreen'), M('table'),
        M('chairModernCushion'), M('kitchenCoffeeMachine'), M('pottedPlant'),
        M('lampSquareCeiling'), M('loungeChair'), M('tableCoffeeGlass'),
        M('stoolBar'), M('bookcaseOpen'),
    ], scene);

    scene.clearColor = new BABYLON.Color4(0.05, 0.06, 0.1, 1);

    const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
    ambient.intensity = 0.9;
    ambient.diffuse = new BABYLON.Color3(1, 0.98, 0.95);
    ambient.groundColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    const mainLight = new BABYLON.PointLight('mainLight', new BABYLON.Vector3(14, 4.5, 9), scene);
    mainLight.intensity = 1.5;
    mainLight.diffuse = new BABYLON.Color3(1, 0.98, 0.95);
    mainLight.range = 40;

    const fillLight = new BABYLON.PointLight('fillLight', new BABYLON.Vector3(5, 3, 14), scene);
    fillLight.intensity = 0.7;
    fillLight.diffuse = new BABYLON.Color3(1, 0.95, 0.9);
    fillLight.range = 20;

    const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: W, height: D }, scene);
    const floorMat = new BABYLON.PBRMaterial('floor_mat', scene);
    floorMat.albedoColor = BABYLON.Color3.FromHexString('#E0E0E0');
    floorMat.roughness = 0.5;
    floorMat.metallic = 0.05;
    floor.material = floorMat;
    floor.position = new BABYLON.Vector3(W / 2, 0, D / 2);

    const shadowGen = await setupShadows(scene, mainLight, floor);

    wall('wall_back', W, H, 0.3, '#AAB0BB', W / 2, H / 2, 0);
    wall('wall_front', W, H, 0.3, '#AAB0BB', W / 2, H / 2, D);
    wall('wall_left', 0.3, H, D, '#A0A8B5', 0, H / 2, D / 2);
    wall('wall_right', 0.3, H, D, '#A0A8B5', W, H / 2, D / 2);

    // Large windows
    box('window1', 8, 3, 0.08, '#87CEEB', 8, 2.8, 0.2, '#87CEEB');
    box('window2', 8, 3, 0.08, '#87CEEB', 20, 2.8, 0.2, '#87CEEB');

    // Glass partition
    box('glass_partition', 0.1, 3.5, 8, '#88CCEE', 18, 1.75, 9);
    const glassMesh = scene.getMeshByName('glass_partition');
    if (glassMesh?.material) glassMesh.material.alpha = 0.3;

    // ══ FURNITURE ══

    // Standing desk area
    const standingDesk = await loadModel(M('desk'), scene, {
        scale: 2.5, position: { x: 5, y: 0, z: 3 }, name: 'standingDesk'
    });
    addToShadows(shadowGen, standingDesk);
    await loadModel(M('computerScreen'), scene, {
        scale: 2.5, position: { x: 5, y: 1.2, z: 2.5 }, name: 'standingMonitor'
    });
    await loadModel(M('chairDesk'), scene, {
        scale: 2.0, position: { x: 5, y: 0, z: 5 },
        rotation: { x: 0, y: Math.PI, z: 0 }, name: 'standingChair'
    });

    // Conference table
    const confTable = await loadModel(M('table'), scene, {
        scale: 3.0, position: { x: 22, y: 0, z: 9 }, name: 'confTable'
    });
    addToShadows(shadowGen, confTable);

    // Conference chairs
    for (let i = 0; i < 4; i++) {
        await loadModel(M('chairModernCushion'), scene, {
            scale: 2.0, position: { x: 20 + i * 1.5, y: 0, z: 7 }, name: `confChair${i}`
        });
        await loadModel(M('chairModernCushion'), scene, {
            scale: 2.0, position: { x: 20 + i * 1.5, y: 0, z: 11 },
            rotation: { x: 0, y: Math.PI, z: 0 }, name: `confChairB${i}`
        });
    }

    // Conference screen
    box('conf_screen_stand', 0.15, 1.5, 0.15, '#333', 22, 1.8, 7.2);
    box('conf_screen', 2.5, 1.5, 0.08, '#111', 22, 2.8, 7.1, BRAND.purple);

    // Whiteboard on left wall
    box('wb_frame', 0.08, 2.5, 4, '#DABB8A', 0.2, 2.5, 9);
    box('wb_surface', 0.05, 2.3, 3.8, '#FFFFFF', 0.23, 2.5, 9, '#FFFFFF');

    // Coffee machine
    const coffeeMachine = await loadModel(M('kitchenCoffeeMachine'), scene, {
        scale: 2.0, position: { x: 25, y: 1.0, z: 1 }, name: 'coffee'
    });
    addToShadows(shadowGen, coffeeMachine);
    // Coffee counter
    await loadModel(M('kitchenCoffeeMachine'), scene, {
        scale: 1.5, position: { x: 26.5, y: 1.0, z: 1 }, name: 'coffee2'
    });

    // Plants
    await loadModel(M('pottedPlant'), scene, {
        scale: 2.5, position: { x: 14, y: 0, z: 1 }, name: 'plant1'
    });
    await loadModel(M('pottedPlant'), scene, {
        scale: 2.5, position: { x: 3, y: 0, z: 16 }, name: 'plant2'
    });

    // Lounge area
    await loadModel(M('loungeChair'), scene, {
        scale: 2.5, position: { x: 4, y: 0, z: 14 },
        rotation: { x: 0, y: Math.PI / 4, z: 0 }, name: 'lounge1'
    });
    await loadModel(M('tableCoffeeGlass'), scene, {
        scale: 2.5, position: { x: 6, y: 0, z: 15 }, name: 'coffeeTable'
    });

    // Open bookcase
    await loadModel(M('bookcaseOpen'), scene, {
        scale: 2.5, position: { x: 1, y: 0, z: 2 }, name: 'bookcase'
    });

    return {
        width: W, depth: D, height: H,
        spawnPoint: { x: 14, y: 1.5, z: 15 },
        tonyPosition: { x: 2, y: 1.5, z: 9 },
        tonyIsPhysical: true,
        objects: [
            {
                id: 'whiteboard',
                name: 'Whiteboard',
                promptText: '[E] System Design',
                position: { x: 1, y: 2.5, z: 9 },
                size: { w: 0.5, h: 1.5, d: 3 },
                color: '#FFFFFF',
                emissiveColor: BRAND.blue,
                scenarioTag: 'technical',
            },
            {
                id: 'conference_screen',
                name: 'Interview',
                promptText: '[E] Video Interview',
                position: { x: 22, y: 2.8, z: 7.5 },
                size: { w: 2, h: 1.2, d: 0.5 },
                color: '#111111',
                emissiveColor: BRAND.purple,
                scenarioTag: 'interview',
            },
            {
                id: 'coffee_machine',
                name: 'Coffee',
                promptText: '[E] Get Coffee',
                position: { x: 25, y: 1.0, z: 1 },
                size: { w: 0.5, h: 0.6, d: 0.4 },
                color: '#333333',
                emissiveColor: BRAND.teal,
                scenarioTag: 'networking',
                modelPath: M('kitchenCoffeeMachine'),
                modelScale: 2.0,
            },
        ],
        worldBounds: { minX: 0.8, maxX: W - 0.8, minZ: 0.8, maxZ: D - 0.8 },
        cameraRadius: 12,
        cameraBeta: Math.PI / 3,
        cameraRadiusLimits: { lower: 6, upper: 20 },
    };
}

// ═══════════════════════════════════════════════════════════════
// FLOOR 3 — THE NEGOTIATION SUITE (Executive Office, 22×16)
// ═══════════════════════════════════════════════════════════════

async function buildFloor3(
    scene: any, BABYLON: any,
    box: Function, wall: Function,
    progress: number
): Promise<RoomLayout> {
    const W = 22, D = 16, H = 4.5;

    await preloadModels([
        M('desk'), M('chairRounded'), M('loungeChairRelax'),
        M('bookcaseClosedDoors'), M('lampRoundFloor'), M('rugRounded'),
        M('pottedPlant'), M('books'), M('televisionModern'),
    ], scene);

    scene.clearColor = new BABYLON.Color4(0.04, 0.03, 0.06, 1);

    const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
    ambient.intensity = 0.85;
    ambient.diffuse = new BABYLON.Color3(1, 0.92, 0.82);
    ambient.groundColor = new BABYLON.Color3(0.3, 0.25, 0.2);

    const chandelier = new BABYLON.PointLight('chandelier', new BABYLON.Vector3(11, 4, 8), scene);
    chandelier.intensity = 1.5;
    chandelier.diffuse = new BABYLON.Color3(1, 0.9, 0.75);
    chandelier.range = 30;

    const fillLight = new BABYLON.PointLight('fillLight', new BABYLON.Vector3(4, 2.5, 12), scene);
    fillLight.intensity = 0.6;
    fillLight.diffuse = new BABYLON.Color3(1, 0.9, 0.78);
    fillLight.range = 16;

    const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: W, height: D }, scene);
    const floorMat = new BABYLON.PBRMaterial('floor_mat', scene);
    floorMat.albedoColor = BABYLON.Color3.FromHexString('#4E3425');
    floorMat.roughness = 0.6;
    floorMat.metallic = 0.05;
    floor.material = floorMat;
    floor.position = new BABYLON.Vector3(W / 2, 0, D / 2);

    const shadowGen = await setupShadows(scene, chandelier, floor);

    wall('wall_back', W, H, 0.3, '#2A3A6E', W / 2, H / 2, 0);
    wall('wall_front', W, H, 0.3, '#546070', W / 2, H / 2, D);
    wall('wall_left', 0.3, H, D, '#546070', 0, H / 2, D / 2);
    wall('wall_right', 0.3, H, D, '#546070', W, H / 2, D / 2);

    // Golden window
    box('window_glass', 6, 3, 0.08, '#FFB74D', 11, 2.5, 0.2, '#FF8F00');
    box('curtain_l', 0.8, 3.5, 0.05, '#1A237E', 7.5, 2.5, 0.25);
    box('curtain_r', 0.8, 3.5, 0.05, '#1A237E', 14.5, 2.5, 0.25);

    // ══ FURNITURE ══

    // Executive desk
    const execDesk = await loadModel(M('desk'), scene, {
        scale: 3.0, position: { x: 11, y: 0, z: 5 }, name: 'execDesk'
    });
    addToShadows(shadowGen, execDesk);

    // Executive chair (Tony's side)
    await loadModel(M('chairRounded'), scene, {
        scale: 2.5, position: { x: 11, y: 0, z: 3 }, name: 'tonyChair'
    });

    // Guest chair (player's side)
    await loadModel(M('loungeChairRelax'), scene, {
        scale: 2.5, position: { x: 11, y: 0, z: 8 },
        rotation: { x: 0, y: Math.PI, z: 0 }, name: 'guestChair'
    });

    // Bookcase with trophies
    const bookcase = await loadModel(M('bookcaseClosedDoors'), scene, {
        scale: 2.5, position: { x: 1.5, y: 0, z: D / 2 }, name: 'trophyShelf'
    });
    addToShadows(shadowGen, bookcase);

    // Floor lamp
    await loadModel(M('lampRoundFloor'), scene, {
        scale: 2.5, position: { x: 2, y: 0, z: 2 }, name: 'floorLamp'
    });

    // Large rug
    await loadModel(M('rugRounded'), scene, {
        scale: 4.0, position: { x: 11, y: 0.01, z: 6 }, name: 'rug'
    });

    // Plants
    await loadModel(M('pottedPlant'), scene, {
        scale: 3.0, position: { x: 20, y: 0, z: 2 }, name: 'plant1'
    });
    await loadModel(M('pottedPlant'), scene, {
        scale: 3.0, position: { x: 20, y: 0, z: 14 }, name: 'plant2'
    });

    // Books and offer letters on desk
    await loadModel(M('books'), scene, {
        scale: 2.0, position: { x: 13, y: 1.0, z: 5 }, name: 'deskBooks'
    });
    box('offer1', 0.5, 0.01, 0.7, '#FFF8E1', 10, 1.12, 5);
    box('offer2', 0.5, 0.01, 0.7, '#FFF8E1', 11.5, 1.12, 5.3);

    // TV/Monitor on wall
    await loadModel(M('televisionModern'), scene, {
        scale: 3.0, position: { x: W - 0.5, y: 2.0, z: 8 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 }, name: 'wallTV'
    });

    return {
        width: W, depth: D, height: H,
        spawnPoint: { x: 11, y: 1.5, z: 13 },
        tonyPosition: { x: 11, y: 1.5, z: 3 },
        tonyIsPhysical: true,
        objects: [
            {
                id: 'offer_letters',
                name: 'Offers',
                promptText: '[E] Review Offers',
                position: { x: 10.5, y: 1.3, z: 5 },
                size: { w: 2.5, h: 0.3, d: 1.5 },
                color: '#FFF8E1',
                emissiveColor: BRAND.lime,
                scenarioTag: 'negotiation',
                modelPath: M('books'),
                modelScale: 2.0,
            },
            {
                id: 'phone',
                name: 'Phone',
                promptText: '[E] Take Call',
                position: { x: 13, y: 1.3, z: 4.5 },
                size: { w: 0.4, h: 0.3, d: 0.4 },
                color: '#333333',
                emissiveColor: BRAND.blue,
                scenarioTag: 'networking',
                modelPath: M('radio'),
                modelScale: 1.5,
            },
            {
                id: 'trophy_shelf',
                name: 'Trophies',
                promptText: '[E] View Achievements',
                position: { x: 1.5, y: 1.0, z: D / 2 },
                size: { w: 2, h: 0.5, d: 0.5 },
                color: '#FFD600',
                emissiveColor: '#FFD600',
                scenarioTag: 'career',
            },
        ],
        worldBounds: { minX: 0.8, maxX: W - 0.8, minZ: 0.8, maxZ: D - 0.8 },
        cameraRadius: 10,
        cameraBeta: Math.PI / 3,
        cameraRadiusLimits: { lower: 5, upper: 16 },
    };
}

// ═══════════════════════════════════════════════════════════════
// FLOOR 4 — THE SUMMIT (Boardroom, 30×20)
// ═══════════════════════════════════════════════════════════════

async function buildFloor4(
    scene: any, BABYLON: any,
    box: Function, wall: Function,
    progress: number
): Promise<RoomLayout> {
    const W = 30, D = 20, H = 5;

    await preloadModels([
        M('tableCross'), M('chairModernFrameCushion'), M('pottedPlant'),
        M('lampSquareCeiling'), M('rugRounded'), M('books'),
        M('loungeDesignSofa'), M('tableCoffeeGlassSquare'),
    ], scene);

    scene.clearColor = new BABYLON.Color4(0.03, 0.03, 0.06, 1);

    const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
    ambient.intensity = 0.9;
    ambient.diffuse = new BABYLON.Color3(1, 0.95, 0.88);
    ambient.groundColor = new BABYLON.Color3(0.3, 0.28, 0.25);

    const sunLight = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.5, -1, 0.5), scene);
    sunLight.intensity = 1.0;
    sunLight.diffuse = new BABYLON.Color3(1, 0.9, 0.7);

    const chandelier = new BABYLON.PointLight('chandelier', new BABYLON.Vector3(15, 4.5, 10), scene);
    chandelier.intensity = 1.2;
    chandelier.diffuse = new BABYLON.Color3(1, 0.95, 0.9);
    chandelier.range = 40;

    const fillLight = new BABYLON.PointLight('fillLight', new BABYLON.Vector3(5, 3, 15), scene);
    fillLight.intensity = 0.6;
    fillLight.diffuse = new BABYLON.Color3(1, 0.95, 0.9);
    fillLight.range = 20;

    const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: W, height: D }, scene);
    const floorMat = new BABYLON.PBRMaterial('floor_mat', scene);
    floorMat.albedoColor = BABYLON.Color3.FromHexString('#E8E8E8');
    floorMat.roughness = 0.3;
    floorMat.metallic = 0.1;
    floor.material = floorMat;
    floor.position = new BABYLON.Vector3(W / 2, 0, D / 2);

    const shadowGen = await setupShadows(scene, chandelier, floor);

    wall('wall_back', W, H, 0.3, '#607080', W / 2, H / 2, 0);
    wall('wall_front', W, H, 0.3, '#607080', W / 2, H / 2, D);
    wall('wall_left', 0.3, H, D, '#6B7888', 0, H / 2, D / 2);
    wall('wall_right', 0.3, H, D, '#6B7888', W, H / 2, D / 2);

    // Panoramic windows
    box('window_back', 20, 3.5, 0.08, '#FFCC80', 15, 2.7, 0.2, '#FF8F00');
    box('window_right', 0.08, 3.5, 14, '#FFCC80', W - 0.2, 2.7, 10, '#FF8F00');

    // ══ FURNITURE ══

    // Grand conference table
    const confTable = await loadModel(M('tableCross'), scene, {
        scale: 4.0, position: { x: 15, y: 0, z: 10 }, name: 'boardTable'
    });
    addToShadows(shadowGen, confTable);

    // Chairs around table
    for (let i = 0; i < 5; i++) {
        await loadModel(M('chairModernFrameCushion'), scene, {
            scale: 2.0, position: { x: 10 + i * 2.5, y: 0, z: 7 }, name: `chairBack${i}`
        });
        await loadModel(M('chairModernFrameCushion'), scene, {
            scale: 2.0, position: { x: 10 + i * 2.5, y: 0, z: 13 },
            rotation: { x: 0, y: Math.PI, z: 0 }, name: `chairFront${i}`
        });
    }

    // Contract at player's seat
    box('contract_paper', 0.6, 0.01, 0.8, '#FFFFF0', 15, 1.14, 10);
    box('contract_pen', 0.04, 0.04, 0.25, '#1A237E', 15.5, 1.16, 10, BRAND.blue);

    // Player nameplate
    box('nameplate_base', 0.8, 0.2, 0.25, '#5D4037', 15, 1.2, 12.5);
    box('nameplate_text', 0.7, 0.15, 0.02, '#FFD600', 15, 1.25, 12.38, '#FFD600');

    // Large rug under table
    await loadModel(M('rugRounded'), scene, {
        scale: 6.0, position: { x: 15, y: 0.01, z: 10 }, name: 'boardRug'
    });

    // Plants in corners
    await loadModel(M('pottedPlant'), scene, {
        scale: 3.5, position: { x: 2, y: 0, z: 2 }, name: 'plant1'
    });
    await loadModel(M('pottedPlant'), scene, {
        scale: 3.5, position: { x: 2, y: 0, z: 18 }, name: 'plant2'
    });
    await loadModel(M('pottedPlant'), scene, {
        scale: 3.5, position: { x: 27, y: 0, z: 18 }, name: 'plant3'
    });

    // Lounge area near entrance
    await loadModel(M('loungeDesignSofa'), scene, {
        scale: 2.5, position: { x: 5, y: 0, z: 17 },
        rotation: { x: 0, y: 0, z: 0 }, name: 'entranceSofa'
    });
    await loadModel(M('tableCoffeeGlassSquare'), scene, {
        scale: 2.5, position: { x: 5, y: 0, z: 15 }, name: 'entranceTable'
    });

    return {
        width: W, depth: D, height: H,
        spawnPoint: { x: 15, y: 1.5, z: 17 },
        tonyPosition: { x: 5, y: 1.5, z: D - 2 },
        tonyIsPhysical: true,
        objects: [
            {
                id: 'contract',
                name: 'Contract',
                promptText: '[E] Read Contract',
                position: { x: 15, y: 1.3, z: 10 },
                size: { w: 1.2, h: 0.3, d: 1 },
                color: '#FFFFF0',
                emissiveColor: BRAND.lime,
                scenarioTag: 'final',
                modelPath: M('books'),
                modelScale: 2.0,
            },
            {
                id: 'pen',
                name: 'Sign',
                promptText: '[E] Sign Contract',
                position: { x: 15.5, y: 1.3, z: 10 },
                size: { w: 0.3, h: 0.3, d: 0.3 },
                color: '#1A237E',
                emissiveColor: BRAND.blue,
                scenarioTag: 'final',
            },
        ],
        worldBounds: { minX: 0.8, maxX: W - 0.8, minZ: 0.8, maxZ: D - 0.8 },
        cameraRadius: 13,
        cameraBeta: Math.PI / 3,
        cameraRadiusLimits: { lower: 7, upper: 22 },
    };
}
