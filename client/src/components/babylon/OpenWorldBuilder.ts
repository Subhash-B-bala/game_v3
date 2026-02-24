/**
 * OpenWorldBuilder — Creates an outdoor CITY BLOCK world for Career Quest
 *
 * Uses Kenney City Kit GLB models for buildings, furniture GLBs for stations.
 * Procedural fallbacks if any model fails to load.
 *
 * District Layout (200x200 map):
 *   District 0: DOWNTOWN       — Center (0, 0)     — Apartment, coffee shop
 *   District 1: TECH PARK      — NW (-55, -50)     — Tech HQ, coding lab
 *   District 2: BUSINESS DIST  — NE (55, -50)      — Corporate tower, cafe
 *   District 3: GOV QUARTER    — SW (-55, 55)      — Police station, bank
 *   District 4: EXEC HEIGHTS   — SE (55, 55)       — Boardroom, penthouse
 */

import type { InteractableObjectDef } from './InteractableObjectSystem';
import { loadModel, preloadModels, getModelMeshes } from './AssetLoader';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface OpenWorldLayout {
    width: number;
    depth: number;
    spawnPoint: { x: number; y: number; z: number };
    tonyPosition: { x: number; y: number; z: number };
    tonyIsPhysical: boolean;
    objects: InteractableObjectDef[];
    worldBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
    cameraRadius: number;
    cameraBeta: number;
    cameraRadiusLimits: { lower: number; upper: number };
    zones: WorldZone[];
    terrain: any;
}

export interface WorldZone {
    id: string;
    name: string;
    subtitle: string;
    stage: number;
    centerX: number;
    centerZ: number;
    radius: number;
    buildingModel?: string;
    buildingScale?: number;
    buildingRotY?: number;
}

// ═══════════════════════════════════════════════════════════════
// District Definitions
// ═══════════════════════════════════════════════════════════════

export const WORLD_ZONES: WorldZone[] = [
    {
        id: 'downtown',
        name: 'DOWNTOWN',
        subtitle: 'Your Apartment & Coffee Shop',
        stage: 0,
        centerX: 0,
        centerZ: 0,
        radius: 30,
        buildingModel: '/models/city/building-a.glb',
        buildingScale: 3.5,
    },
    {
        id: 'tech_park',
        name: 'TECH PARK',
        subtitle: 'Tech Company HQ & Coding Lab',
        stage: 1,
        centerX: -55,
        centerZ: -50,
        radius: 28,
        buildingModel: '/models/city/building-skyscraper-a.glb',
        buildingScale: 3.0,
    },
    {
        id: 'business_district',
        name: 'BUSINESS DISTRICT',
        subtitle: 'Corporate Tower & Networking Cafe',
        stage: 2,
        centerX: 55,
        centerZ: -50,
        radius: 28,
        buildingModel: '/models/city/building-skyscraper-c.glb',
        buildingScale: 3.5,
    },
    {
        id: 'gov_quarter',
        name: 'GOVERNMENT QUARTER',
        subtitle: 'Scam Awareness Center & Consumer Court',
        stage: 3,
        centerX: -55,
        centerZ: 55,
        radius: 28,
        buildingModel: '/models/city/building-h.glb',
        buildingScale: 3.5,
    },
    {
        id: 'exec_heights',
        name: 'EXECUTIVE HEIGHTS',
        subtitle: 'Boardroom & Signing Office',
        stage: 4,
        centerX: 55,
        centerZ: 55,
        radius: 30,
        buildingModel: '/models/city/building-skyscraper-d.glb',
        buildingScale: 3.5,
    },
];

// City building paths for variety
const C = (name: string) => `/models/city/${name}.glb`;
const F = (name: string) => `/models/furniture/${name}.glb`;

// Extra buildings per district (for visual variety)
const DISTRICT_EXTRA_BUILDINGS: Record<string, string[]> = {
    downtown: ['building-b', 'building-c', 'building-d', 'building-e'],
    tech_park: ['building-f', 'building-g', 'building-skyscraper-b'],
    business_district: ['building-i', 'building-j', 'building-skyscraper-e'],
    gov_quarter: ['building-k', 'building-l', 'building-m'],
    exec_heights: ['building-n', 'building-skyscraper-b', 'building-skyscraper-e'],
};

// Low-detail buildings for skyline
const SKYLINE_MODELS = [
    'low-detail-building-a', 'low-detail-building-b', 'low-detail-building-c',
    'low-detail-building-d', 'low-detail-building-e', 'low-detail-building-f',
    'low-detail-building-g', 'low-detail-building-h', 'low-detail-building-i',
    'low-detail-building-j', 'low-detail-building-wide-a', 'low-detail-building-wide-b',
];

function seededRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
}

// ═══════════════════════════════════════════════════════════════
// Main Builder
// ═══════════════════════════════════════════════════════════════

export async function buildOpenWorld(
    currentStage: number,
    scene: any
): Promise<OpenWorldLayout> {
    const BABYLON = await import('@babylonjs/core');
    await import('@babylonjs/loaders');

    const WORLD_SIZE = 200;
    const HALF = WORLD_SIZE / 2;

    scene.clearColor = new BABYLON.Color4(0.55, 0.68, 0.85, 1.0);

    // ══════════════════════════════════════════════════════════
    // LIGHTING — Urban outdoor
    // ══════════════════════════════════════════════════════════

    const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
    ambient.intensity = 0.7;
    ambient.diffuse = new BABYLON.Color3(0.95, 0.95, 1.0);
    ambient.groundColor = new BABYLON.Color3(0.35, 0.35, 0.4);
    ambient.specular = new BABYLON.Color3(0.15, 0.15, 0.15);

    const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.4, -0.8, 0.3).normalize(), scene);
    sun.intensity = 1.1;
    sun.diffuse = new BABYLON.Color3(1.0, 0.95, 0.85);
    sun.specular = new BABYLON.Color3(0.7, 0.65, 0.5);
    sun.position = new BABYLON.Vector3(60, 100, -40);

    const fillLight = new BABYLON.DirectionalLight('fill', new BABYLON.Vector3(0.3, -0.5, -0.4).normalize(), scene);
    fillLight.intensity = 0.25;
    fillLight.diffuse = new BABYLON.Color3(0.7, 0.8, 1.0);
    fillLight.specular = BABYLON.Color3.Black();

    const shadowGen = new BABYLON.ShadowGenerator(1024, sun);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 16;
    shadowGen.darkness = 0.35;
    shadowGen.bias = 0.001;

    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogColor = new BABYLON.Color3(0.6, 0.65, 0.75);
    scene.fogDensity = 0.005;

    // ══════════════════════════════════════════════════════════
    // GROUND — Flat asphalt/concrete
    // ══════════════════════════════════════════════════════════

    const ground = BABYLON.MeshBuilder.CreateGround('ground', {
        width: WORLD_SIZE, height: WORLD_SIZE, subdivisions: 4,
    }, scene);
    ground.receiveShadows = true;
    ground.checkCollisions = true;

    const groundMat = new BABYLON.PBRMaterial('groundMat', scene);
    groundMat.albedoColor = new BABYLON.Color3(0.18, 0.18, 0.2);
    groundMat.roughness = 0.95;
    groundMat.metallic = 0.0;
    groundMat.environmentIntensity = 0.15;

    // Procedural concrete texture
    const concreteSize = 128;
    const concreteTex = new BABYLON.DynamicTexture('concreteTex', { width: concreteSize, height: concreteSize }, scene, true);
    const ctx = concreteTex.getContext();
    const blockSize = 4;
    for (let px = 0; px < concreteSize; px += blockSize) {
        for (let py = 0; py < concreteSize; py += blockSize) {
            const n = seededRandom(px * concreteSize + py);
            const v = (40 + n * 25) | 0;
            (ctx as any).fillStyle = `rgb(${v},${v},${v + 3})`;
            (ctx as any).fillRect(px, py, blockSize, blockSize);
        }
    }
    concreteTex.update();
    groundMat.albedoTexture = concreteTex;
    (groundMat.albedoTexture as any).uScale = 40;
    (groundMat.albedoTexture as any).vScale = 40;
    ground.material = groundMat;

    // ══════════════════════════════════════════════════════════
    // SKYBOX — Urban gradient
    // ══════════════════════════════════════════════════════════
    const skybox = BABYLON.MeshBuilder.CreateSphere('sky', {
        diameter: 2000, segments: 20, sideOrientation: BABYLON.Mesh.BACKSIDE,
    }, scene);

    BABYLON.Effect.ShadersStore['citySkyVertexShader'] = `
        precision highp float;
        attribute vec3 position;
        uniform mat4 worldViewProjection;
        varying vec3 vPosition;
        void main() {
            gl_Position = worldViewProjection * vec4(position, 1.0);
            vPosition = position;
        }
    `;
    BABYLON.Effect.ShadersStore['citySkyFragmentShader'] = `
        precision highp float;
        varying vec3 vPosition;
        void main() {
            vec3 dir = normalize(vPosition);
            float h = dir.y;
            vec3 zenith = vec3(0.2, 0.4, 0.75);
            vec3 horizon = vec3(0.6, 0.7, 0.85);
            vec3 gnd = vec3(0.45, 0.45, 0.5);
            vec3 color = h > 0.0 ? mix(horizon, zenith, pow(h, 0.5)) : mix(horizon, gnd, pow(-h, 0.4));
            float sunAngle = dot(dir, normalize(vec3(-0.4, 0.2, 0.3)));
            if (sunAngle > 0.9) {
                color += vec3(0.3, 0.25, 0.1) * pow((sunAngle - 0.9) * 10.0, 2.0) * 0.5;
            }
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    const skyMat = new BABYLON.ShaderMaterial('skyMat', scene, {
        vertex: 'citySky', fragment: 'citySky',
    }, { attributes: ['position'], uniforms: ['worldViewProjection'] });
    skyMat.backFaceCulling = false;
    skybox.material = skyMat;
    skybox.infiniteDistance = true;
    skybox.isPickable = false;

    // ══════════════════════════════════════════════════════════
    // POST-PROCESSING
    // ══════════════════════════════════════════════════════════
    try {
        const pipeline = new BABYLON.DefaultRenderingPipeline('defaultPipeline', true, scene, [scene.activeCamera]);
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.75;
        pipeline.bloomWeight = 0.25;
        pipeline.bloomKernel = 64;
        pipeline.bloomScale = 0.5;
        pipeline.imageProcessingEnabled = true;
        pipeline.imageProcessing.toneMappingEnabled = true;
        pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
        pipeline.imageProcessing.contrast = 1.1;
        pipeline.imageProcessing.exposure = 1.0;
        pipeline.imageProcessing.vignetteEnabled = true;
        pipeline.imageProcessing.vignetteWeight = 1.5;
        pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(0.1, 0.1, 0.15, 0);
        pipeline.fxaaEnabled = true;
    } catch (e) {
        console.warn('Post-processing setup failed:', e);
    }

    // ══════════════════════════════════════════════════════════
    // ROADS between districts
    // ══════════════════════════════════════════════════════════
    const roadMat = new BABYLON.PBRMaterial('roadMat', scene);
    roadMat.albedoColor = new BABYLON.Color3(0.12, 0.12, 0.14);
    roadMat.roughness = 0.92;
    roadMat.metallic = 0.0;
    roadMat.environmentIntensity = 0.1;

    const sidewalkMat = new BABYLON.PBRMaterial('sidewalkMat', scene);
    sidewalkMat.albedoColor = new BABYLON.Color3(0.55, 0.53, 0.5);
    sidewalkMat.roughness = 0.88;
    sidewalkMat.metallic = 0.0;

    for (const zone of WORLD_ZONES) {
        if (zone.stage === 0) continue;
        createRoad(scene, BABYLON, roadMat, sidewalkMat, 0, 0, zone.centerX, zone.centerZ, 8);
    }
    createRoad(scene, BABYLON, roadMat, sidewalkMat, -55, -50, 55, -50, 8);
    createRoad(scene, BABYLON, roadMat, sidewalkMat, -55, 55, 55, 55, 8);

    // ══════════════════════════════════════════════════════════
    // PRELOAD ALL CITY MODELS (parallel for speed)
    // ══════════════════════════════════════════════════════════
    const allModelPaths: string[] = [];

    // Main zone buildings
    for (const zone of WORLD_ZONES) {
        if (zone.buildingModel) allModelPaths.push(zone.buildingModel);
    }
    // Extra buildings per district
    for (const extras of Object.values(DISTRICT_EXTRA_BUILDINGS)) {
        for (const name of extras) allModelPaths.push(C(name));
    }
    // Skyline models (just a few unique ones, will clone)
    for (const name of SKYLINE_MODELS.slice(0, 6)) {
        allModelPaths.push(C(name));
    }
    // City detail models
    allModelPaths.push(C('detail-awning'), C('detail-parasol-a'), C('detail-parasol-b'));

    // Preload all unique models in parallel
    const uniquePaths = [...new Set(allModelPaths)];
    await preloadModels(uniquePaths, scene);

    // ══════════════════════════════════════════════════════════
    // DISTRICT BUILDINGS — Real Kenney GLB models
    // ══════════════════════════════════════════════════════════

    // Fallback building materials (if GLB fails)
    const buildingColors = ['#4A5568', '#2D3748', '#1A202C', '#2C5282', '#1A365D', '#3C366B', '#234E52', '#553C9A'];

    for (const zone of WORLD_ZONES) {
        const zoneScale = zone.buildingScale ?? 3.0;

        // Main building — try GLB first, fallback to procedural box
        if (zone.buildingModel) {
            const mainModel = await loadModel(zone.buildingModel, scene, {
                scale: zoneScale,
                position: { x: zone.centerX, y: 0, z: zone.centerZ },
                rotation: { x: 0, y: zone.buildingRotY ?? 0, z: 0 },
                name: `main_${zone.id}`,
            });
            if (mainModel) {
                const meshes = getModelMeshes(mainModel);
                for (const m of meshes) {
                    m.receiveShadows = true;
                    m.checkCollisions = true;
                    shadowGen.addShadowCaster(m);
                }
                mainModel.freezeWorldMatrix();
            } else {
                // Fallback: procedural box
                createFallbackBuilding(BABYLON, scene, zone, shadowGen, buildingColors);
            }
        } else {
            createFallbackBuilding(BABYLON, scene, zone, shadowGen, buildingColors);
        }

        // Extra buildings around the district
        const extras = DISTRICT_EXTRA_BUILDINGS[zone.id] || [];
        for (let b = 0; b < extras.length; b++) {
            const angle = (b / extras.length) * Math.PI * 2 + 0.8;
            const dist = zone.radius * 0.55 + seededRandom(b * 251 + zone.stage * 100) * 8;
            const bx = zone.centerX + Math.cos(angle) * dist;
            const bz = zone.centerZ + Math.sin(angle) * dist;
            if (Math.abs(bx) > HALF * 0.9 || Math.abs(bz) > HALF * 0.9) continue;

            const extraScale = 2.0 + seededRandom(b * 257 + zone.stage * 200) * 2.0;
            const extraRotY = seededRandom(b * 263 + zone.stage * 300) * Math.PI * 2;
            const extraModel = await loadModel(C(extras[b]), scene, {
                scale: extraScale,
                position: { x: bx, y: 0, z: bz },
                rotation: { x: 0, y: extraRotY, z: 0 },
                name: `extra_${zone.id}_${b}`,
            });
            if (extraModel) {
                const meshes = getModelMeshes(extraModel);
                for (const m of meshes) {
                    m.receiveShadows = true;
                    m.checkCollisions = true;
                }
                extraModel.freezeWorldMatrix();
            }
        }

        // Detail: awnings and parasols at zone entrances
        const detailModels = ['detail-awning', 'detail-parasol-a', 'detail-parasol-b'];
        for (let d = 0; d < 2; d++) {
            const dAngle = (d / 2) * Math.PI + 0.3;
            const dDist = zone.radius * 0.35;
            const dx = zone.centerX + Math.cos(dAngle) * dDist;
            const dz = zone.centerZ + Math.sin(dAngle) * dDist;
            const detailName = detailModels[d % detailModels.length];
            await loadModel(C(detailName), scene, {
                scale: 2.5,
                position: { x: dx, y: 0, z: dz },
                rotation: { x: 0, y: dAngle, z: 0 },
                name: `detail_${zone.id}_${d}`,
            });
        }
    }

    // ══════════════════════════════════════════════════════════
    // SKYLINE — Low-detail buildings around map edge
    // ══════════════════════════════════════════════════════════

    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const dist = 82 + seededRandom(i * 277 + 900) * 14;
        const skyModelName = SKYLINE_MODELS[i % SKYLINE_MODELS.length];
        const skyScale = 3.0 + seededRandom(i * 283 + 920) * 4.0;

        const skyModel = await loadModel(C(skyModelName), scene, {
            scale: skyScale,
            position: { x: Math.cos(angle) * dist, y: 0, z: Math.sin(angle) * dist },
            rotation: { x: 0, y: seededRandom(i * 289 + 930) * Math.PI * 2, z: 0 },
            name: `skyline_${i}`,
        });
        if (skyModel) {
            skyModel.freezeWorldMatrix();
            const meshes = getModelMeshes(skyModel);
            for (const m of meshes) { m.isPickable = false; }
        } else {
            // Fallback: procedural box
            const bh = 15 + seededRandom(i * 283 + 920) * 30;
            const bw = 5 + seededRandom(i * 289 + 930) * 8;
            const sky = BABYLON.MeshBuilder.CreateBox(`skyline_fb_${i}`, { width: bw, height: bh, depth: bw }, scene);
            sky.position = new BABYLON.Vector3(Math.cos(angle) * dist, bh / 2, Math.sin(angle) * dist);
            const skyBldgMat = new BABYLON.PBRMaterial(`skyBldgMat_${i}`, scene);
            skyBldgMat.albedoColor = new BABYLON.Color3(0.2, 0.2, 0.25);
            skyBldgMat.roughness = 0.9; skyBldgMat.metallic = 0.05;
            sky.material = skyBldgMat; sky.isPickable = false;
            sky.freezeWorldMatrix();
        }
    }

    // ══════════════════════════════════════════════════════════
    // STREET FURNITURE — Benches + Street Lamps with lights
    // ══════════════════════════════════════════════════════════

    for (const zone of WORLD_ZONES) {
        // 2 benches per zone (try GLB, fallback procedural)
        for (let i = 0; i < 2; i++) {
            const angle = (i / 2) * Math.PI * 2 + 0.3;
            const dist = zone.radius * 0.55;
            const bx = zone.centerX + Math.cos(angle) * dist;
            const bz = zone.centerZ + Math.sin(angle) * dist;

            const benchModel = await loadModel(F('bench'), scene, {
                scale: 2.0,
                position: { x: bx, y: 0, z: bz },
                rotation: { x: 0, y: angle, z: 0 },
                name: `bench_${zone.id}_${i}`,
            });
            if (benchModel) {
                benchModel.freezeWorldMatrix();
            } else {
                // Fallback procedural bench
                const benchMat = new BABYLON.StandardMaterial(`benchMat_${zone.id}_${i}`, scene);
                benchMat.diffuseColor = new BABYLON.Color3(0.45, 0.3, 0.15);
                const seat = BABYLON.MeshBuilder.CreateBox(`bench_fb_${zone.id}_${i}`, { width: 2, height: 0.15, depth: 0.6 }, scene);
                seat.position = new BABYLON.Vector3(bx, 0.5, bz);
                seat.rotation.y = angle; seat.material = benchMat;
            }
        }

        // 2 street lamps with point lights per zone
        for (let i = 0; i < 2; i++) {
            const a = (i / 2) * Math.PI * 2 + 1.2;
            const d = zone.radius * 0.7;
            const lx = zone.centerX + Math.cos(a) * d;
            const lz = zone.centerZ + Math.sin(a) * d;

            // Procedural lamp post (simple and reliable)
            const lampPoleMat = new BABYLON.StandardMaterial(`lampPoleMat_${zone.id}_${i}`, scene);
            lampPoleMat.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.28);
            const pole = BABYLON.MeshBuilder.CreateCylinder(`lp_${zone.id}_${i}`, { diameter: 0.12, height: 5, tessellation: 6 }, scene);
            pole.position = new BABYLON.Vector3(lx, 2.5, lz);
            pole.material = lampPoleMat;

            const lampGlobeMat = new BABYLON.StandardMaterial(`lampGlobeMat_${zone.id}_${i}`, scene);
            lampGlobeMat.diffuseColor = new BABYLON.Color3(1, 0.95, 0.8);
            lampGlobeMat.emissiveColor = new BABYLON.Color3(0.5, 0.45, 0.25);
            lampGlobeMat.alpha = 0.9;
            const globe = BABYLON.MeshBuilder.CreateSphere(`lg_${zone.id}_${i}`, { diameter: 0.4, segments: 6 }, scene);
            globe.position = new BABYLON.Vector3(lx, 5.1, lz);
            globe.material = lampGlobeMat;

            // Warm point light at each street lamp
            const lampLight = new BABYLON.PointLight(`ll_${zone.id}_${i}`, new BABYLON.Vector3(lx, 5, lz), scene);
            lampLight.diffuse = new BABYLON.Color3(1.0, 0.9, 0.7);
            lampLight.intensity = 0.5;
            lampLight.range = 12;
        }
    }

    // ══════════════════════════════════════════════════════════
    // ZONE SIGNS & BARRIERS
    // ══════════════════════════════════════════════════════════
    const GUI = await import('@babylonjs/gui');

    for (const zone of WORLD_ZONES) {
        const isUnlocked = zone.stage <= currentStage;

        const signPost = BABYLON.MeshBuilder.CreateCylinder(`sp_${zone.id}`, { diameter: 0.12, height: 3.5, tessellation: 6 }, scene);
        signPost.position = new BABYLON.Vector3(zone.centerX + zone.radius * 0.5, 1.75, zone.centerZ - zone.radius * 0.3);
        const postMat = new BABYLON.StandardMaterial(`pm_${zone.id}`, scene);
        postMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.32);
        signPost.material = postMat;

        const signBoard = BABYLON.MeshBuilder.CreatePlane(`sb_${zone.id}`, { width: 4, height: 1.5 }, scene);
        signBoard.position = new BABYLON.Vector3(zone.centerX + zone.radius * 0.5, 4, zone.centerZ - zone.radius * 0.3);
        signBoard.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

        const signTex = GUI.AdvancedDynamicTexture.CreateForMesh(signBoard, 400, 150);
        const signBg = new GUI.Rectangle('signBg');
        signBg.width = '390px'; signBg.height = '140px'; signBg.cornerRadius = 8;
        signBg.background = isUnlocked ? 'rgba(10,15,30,0.92)' : 'rgba(40,40,50,0.8)';
        signBg.color = isUnlocked ? '#3B82F6' : '#555'; signBg.thickness = 2;
        signTex.addControl(signBg);

        const nameText = new GUI.TextBlock('zn');
        nameText.text = isUnlocked ? zone.name : `DISTRICT ${zone.stage}`;
        nameText.color = isUnlocked ? '#E1E3FA' : '#777';
        nameText.fontSize = 26; nameText.fontWeight = 'bold';
        nameText.fontFamily = '"Saira Condensed", sans-serif';
        nameText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        nameText.top = '15px';
        signBg.addControl(nameText);

        const subText = new GUI.TextBlock('zs');
        subText.text = isUnlocked ? zone.subtitle : 'LOCKED';
        subText.color = isUnlocked ? '#9CA3AF' : '#555';
        subText.fontSize = 16; subText.fontFamily = '"Kanit", sans-serif';
        subText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        subText.top = '15px';
        signBg.addControl(subText);

        if (isUnlocked) {
            const zc = BABYLON.MeshBuilder.CreateDisc(`zc_${zone.id}`, { radius: zone.radius * 0.25, tessellation: 32 }, scene);
            zc.rotation.x = Math.PI / 2;
            zc.position = new BABYLON.Vector3(zone.centerX, 0.02, zone.centerZ);
            const cm = new BABYLON.StandardMaterial(`cm_${zone.id}`, scene);
            cm.diffuseColor = BABYLON.Color3.FromHexString('#3B82F6');
            cm.alpha = 0.06; cm.emissiveColor = BABYLON.Color3.FromHexString('#3B82F6');
            cm.disableLighting = true; zc.material = cm;
        }
    }

    // Locked district barriers
    for (const zone of WORLD_ZONES) {
        if (zone.stage === 0 || zone.stage <= currentStage) continue;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const barrier = BABYLON.MeshBuilder.CreateBox(`bar_${zone.id}_${i}`, { width: 8, height: 6, depth: 1 }, scene);
            barrier.position = new BABYLON.Vector3(
                zone.centerX + Math.cos(angle) * (zone.radius + 2), 3,
                zone.centerZ + Math.sin(angle) * (zone.radius + 2)
            );
            barrier.rotation.y = angle + Math.PI / 2;
            barrier.isVisible = false; barrier.checkCollisions = true;
            barrier.metadata = { isBarrier: true, zoneId: zone.id, stage: zone.stage };
        }
        const fw = BABYLON.MeshBuilder.CreateCylinder(`fw_${zone.id}`, {
            diameter: (zone.radius + 2) * 2, height: 6, tessellation: 20,
        }, scene);
        fw.position = new BABYLON.Vector3(zone.centerX, 3, zone.centerZ);
        const fwm = new BABYLON.StandardMaterial(`fwm_${zone.id}`, scene);
        fwm.diffuseColor = new BABYLON.Color3(0.4, 0.35, 0.3);
        fwm.alpha = 0.2; fwm.backFaceCulling = false;
        fwm.emissiveColor = new BABYLON.Color3(0.15, 0.1, 0.05);
        fw.material = fwm; fw.isPickable = false;
        fw.metadata = { isFogWall: true, zoneId: zone.id, stage: zone.stage };
    }

    // ══════════════════════════════════════════════════════════
    // DAY/NIGHT CYCLE
    // ══════════════════════════════════════════════════════════
    let dayTime = 0.3;
    scene.onBeforeRenderObservable.add(() => {
        const dt = scene.getEngine().getDeltaTime() / 1000;
        dayTime = (dayTime + dt / 300) % 1.0;
        const sa = dayTime * Math.PI * 2 - Math.PI / 2;
        const sh = Math.sin(sa);
        const sf = Math.cos(sa);
        sun.direction = new BABYLON.Vector3(-0.4 * sf, -Math.max(0.15, Math.abs(sh)), 0.3 * sf).normalize();
        const df = Math.max(0, sh);
        sun.intensity = 0.2 + df * 0.9;
        ambient.intensity = 0.3 + df * 0.4;
        scene.fogColor = new BABYLON.Color3(0.45 + df * 0.15, 0.5 + df * 0.15, 0.6 + df * 0.15);
    });

    // ══════════════════════════════════════════════════════════
    // PARTICLES — Urban dust
    // ══════════════════════════════════════════════════════════
    try {
        const dustTex = new BABYLON.DynamicTexture('dustTex', { width: 16, height: 16 }, scene, true);
        const dc = dustTex.getContext();
        (dc as any).fillStyle = 'rgba(200,200,210,0.6)';
        (dc as any).beginPath();
        (dc as any).arc(8, 8, 6, 0, Math.PI * 2);
        (dc as any).fill();
        dustTex.update();
        const ps = new BABYLON.ParticleSystem('dust', 80, scene);
        ps.particleTexture = dustTex;
        ps.emitter = new BABYLON.Vector3(0, 3, 0);
        ps.createBoxEmitter(new BABYLON.Vector3(-0.1, 0.2, -0.1), new BABYLON.Vector3(0.1, 0.4, 0.1),
            new BABYLON.Vector3(-50, 1, -50), new BABYLON.Vector3(50, 6, 50));
        ps.minSize = 0.04; ps.maxSize = 0.1;
        ps.minLifeTime = 5; ps.maxLifeTime = 10;
        ps.emitRate = 12;
        ps.color1 = new BABYLON.Color4(0.8, 0.8, 0.85, 0.2);
        ps.color2 = new BABYLON.Color4(0.7, 0.7, 0.75, 0.1);
        ps.colorDead = new BABYLON.Color4(0.8, 0.8, 0.8, 0);
        ps.gravity = new BABYLON.Vector3(0.05, -0.1, 0.02);
        ps.start();
    } catch (e) { console.warn('Particle setup failed:', e); }

    // ══════════════════════════════════════════════════════════
    // INTERACTABLE OBJECTS
    // ══════════════════════════════════════════════════════════
    const objects: InteractableObjectDef[] = getDistrictInteractables(currentStage);

    scene.autoClearDepthAndStencil = true;
    scene.skipFrustumClipping = false;

    return {
        width: WORLD_SIZE, depth: WORLD_SIZE,
        spawnPoint: { x: 0, y: 0, z: 8 },
        tonyPosition: { x: 5, y: 0, z: -3 },
        tonyIsPhysical: true,
        objects,
        worldBounds: { minX: -HALF + 3, maxX: HALF - 3, minZ: -HALF + 3, maxZ: HALF - 3 },
        cameraRadius: 14, cameraBeta: Math.PI / 3.2,
        cameraRadiusLimits: { lower: 5, upper: 30 },
        zones: WORLD_ZONES,
        terrain: ground,
    };
}

// ═══════════════════════════════════════════════════════════════
// Fallback procedural building (if GLB fails to load)
// ═══════════════════════════════════════════════════════════════

function createFallbackBuilding(
    BABYLON: any, scene: any, zone: WorldZone,
    shadowGen: any, colors: string[]
) {
    const h = 12 + zone.stage * 6;
    const w = 8 + zone.stage * 2;
    const mainB = BABYLON.MeshBuilder.CreateBox(`main_fb_${zone.id}`, { width: w, height: h, depth: w }, scene);
    mainB.position = new BABYLON.Vector3(zone.centerX, h / 2, zone.centerZ);
    mainB.checkCollisions = true;
    const mainMat = new BABYLON.PBRMaterial(`mm_fb_${zone.id}`, scene);
    mainMat.albedoColor = BABYLON.Color3.FromHexString(colors[zone.stage]);
    mainMat.roughness = 0.7; mainMat.metallic = 0.15; mainB.material = mainMat;
    shadowGen.addShadowCaster(mainB);
    mainB.receiveShadows = true;

    // Windows
    const windowMat = new BABYLON.StandardMaterial(`winMat_fb_${zone.id}`, scene);
    windowMat.diffuseColor = new BABYLON.Color3(0.7, 0.85, 1.0);
    windowMat.emissiveColor = new BABYLON.Color3(0.15, 0.2, 0.3);
    windowMat.alpha = 0.75;
    for (let r = 0; r < Math.min(5, 3 + zone.stage); r++) {
        for (let c = 0; c < 3; c++) {
            const win = BABYLON.MeshBuilder.CreatePlane(`w_fb_${zone.id}_${r}_${c}`, { width: 1.2, height: 1.0 }, scene);
            win.position = new BABYLON.Vector3(zone.centerX + (c - 1) * 2.5, 2.5 + r * 2.5, zone.centerZ + w / 2 + 0.05);
            win.material = windowMat;
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Road helper
// ═══════════════════════════════════════════════════════════════

function createRoad(
    scene: any, BABYLON: any, roadMat: any, sidewalkMat: any,
    x1: number, z1: number, x2: number, z2: number, roadWidth: number
) {
    const dx = x2 - x1; const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);
    const road = BABYLON.MeshBuilder.CreateGround(`road_${x1}_${z1}_${x2}_${z2}`, { width: roadWidth, height: length }, scene);
    road.position = new BABYLON.Vector3((x1 + x2) / 2, 0.01, (z1 + z2) / 2);
    road.rotation.y = angle; road.material = roadMat; road.receiveShadows = true;
    for (const side of [-1, 1]) {
        const sw = BABYLON.MeshBuilder.CreateGround(`sw_${x1}_${z1}_${side}`, { width: 2.5, height: length }, scene);
        sw.position = new BABYLON.Vector3(
            (x1 + x2) / 2 - Math.sin(angle) * (roadWidth / 2 + 1.5) * side,
            0.02,
            (z1 + z2) / 2 + Math.cos(angle) * (roadWidth / 2 + 1.5) * side
        );
        sw.rotation.y = angle; sw.material = sidewalkMat; sw.receiveShadows = true;
    }
}

// ═══════════════════════════════════════════════════════════════
// District Interactable Objects
// ═══════════════════════════════════════════════════════════════

function getDistrictInteractables(currentStage: number): InteractableObjectDef[] {
    const all: InteractableObjectDef[] = [];

    // District 0 — DOWNTOWN
    all.push(
        { id: 'laptop_downtown', name: 'Laptop', promptText: '[E] Check ATS Resume',
            position: { x: -5, y: 0.8, z: 3 },
            size: { w: 0.9, h: 0.4, d: 0.6 }, color: '#333333', emissiveColor: '#3B82F6',
            scenarioTag: 'ATS', modelPath: F('laptop'), modelScale: 2.0 },
        { id: 'jobboard_downtown', name: 'Job Board', promptText: '[E] Browse Jobs',
            position: { x: 6, y: 0.8, z: -3 },
            size: { w: 0.4, h: 0.3, d: 0.5 }, color: '#1A1A2E', emissiveColor: '#20C997',
            scenarioTag: 'networking', modelPath: F('radio'), modelScale: 1.5 },
        { id: 'resume_downtown', name: 'Resume Printer', promptText: '[E] Fix Resume',
            position: { x: -8, y: 0.3, z: -6 },
            size: { w: 0.6, h: 0.5, d: 0.5 }, color: '#A0855B', emissiveColor: '#D7EF3F',
            scenarioTag: 'resume', modelPath: F('cardboardBoxOpen'), modelScale: 1.8 },
        { id: 'boss_downtown', name: 'HR Office', promptText: '[E] Interview: The HR Screener',
            position: { x: 3, y: 0.8, z: -10 },
            size: { w: 1.2, h: 1.0, d: 0.6 }, color: '#1A1A2E', emissiveColor: '#EF4444',
            scenarioTag: 'boss', modelPath: F('deskCorner'), modelScale: 2.5 },
    );

    if (currentStage >= 1) {
        all.push(
            { id: 'terminal_techpark', name: 'Coding Terminal', promptText: '[E] Code Challenge',
                position: { x: -55, y: 0.8, z: -45 },
                size: { w: 1.0, h: 0.6, d: 0.3 }, color: '#111111', emissiveColor: '#3B82F6',
                scenarioTag: 'technical', modelPath: F('computerScreen'), modelScale: 2.0 },
            { id: 'whiteboard_techpark', name: 'Design Board', promptText: '[E] System Design',
                position: { x: -50, y: 1.5, z: -55 },
                size: { w: 0.5, h: 1.5, d: 2.5 }, color: '#FFFFFF', emissiveColor: '#6F53C1',
                scenarioTag: 'technical' },
            { id: 'books_techpark', name: 'Tech Library', promptText: '[E] Study',
                position: { x: -60, y: 0.5, z: -48 },
                size: { w: 1.5, h: 1.0, d: 0.6 }, color: '#5D4037', emissiveColor: '#20C997',
                scenarioTag: 'strategy', modelPath: F('books'), modelScale: 2.5 },
            { id: 'boss_techpark', name: 'Tech Lead Office', promptText: '[E] Interview: The Tech Lead',
                position: { x: -48, y: 0.8, z: -52 },
                size: { w: 1.2, h: 1.0, d: 0.6 }, color: '#1A1A2E', emissiveColor: '#EF4444',
                scenarioTag: 'boss', modelPath: F('deskCorner'), modelScale: 2.5 },
        );
    }

    if (currentStage >= 2) {
        all.push(
            { id: 'screen_business', name: 'Interview Screen', promptText: '[E] Mock Interview',
                position: { x: 55, y: 1.5, z: -45 },
                size: { w: 2, h: 1.2, d: 0.5 }, color: '#111111', emissiveColor: '#3B82F6',
                scenarioTag: 'interview', modelPath: F('computerScreen'), modelScale: 2.5 },
            { id: 'phone_business', name: 'Conference Phone', promptText: '[E] Cold Call',
                position: { x: 50, y: 0.8, z: -55 },
                size: { w: 0.4, h: 0.3, d: 0.4 }, color: '#333333', emissiveColor: '#6F53C1',
                scenarioTag: 'networking', modelPath: F('radio'), modelScale: 1.5 },
            { id: 'coffee_business', name: 'Networking Cafe', promptText: '[E] Network',
                position: { x: 60, y: 0.8, z: -48 },
                size: { w: 0.5, h: 0.6, d: 0.4 }, color: '#6B4226', emissiveColor: '#20C997',
                scenarioTag: 'networking', modelPath: F('kitchenCoffeeMachine'), modelScale: 2.0 },
            { id: 'boss_business', name: 'Director\'s Office', promptText: '[E] Interview: The Director',
                position: { x: 52, y: 0.8, z: -52 },
                size: { w: 1.2, h: 1.0, d: 0.6 }, color: '#1A1A2E', emissiveColor: '#EF4444',
                scenarioTag: 'boss', modelPath: F('deskCorner'), modelScale: 2.5 },
        );
    }

    if (currentStage >= 3) {
        all.push(
            { id: 'evidence_gov', name: 'Evidence Board', promptText: '[E] Analyze Scam',
                position: { x: -55, y: 1.5, z: 58 },
                size: { w: 2.5, h: 1.5, d: 0.3 }, color: '#2C1810', emissiveColor: '#EF4444',
                scenarioTag: 'strategy' },
            { id: 'computer_gov', name: 'Complaint Terminal', promptText: '[E] File Report',
                position: { x: -50, y: 0.8, z: 52 },
                size: { w: 1.0, h: 0.6, d: 0.3 }, color: '#111111', emissiveColor: '#3B82F6',
                scenarioTag: 'ATS', modelPath: F('computerScreen'), modelScale: 2.0 },
            { id: 'docs_gov', name: 'Legal Documents', promptText: '[E] Review Rights',
                position: { x: -60, y: 0.5, z: 55 },
                size: { w: 1.5, h: 0.3, d: 1.0 }, color: '#FFF8E1', emissiveColor: '#D7EF3F',
                scenarioTag: 'career', modelPath: F('books'), modelScale: 2.0 },
            { id: 'boss_gov', name: 'Inspector\'s Office', promptText: '[E] Interview: The Scam Buster',
                position: { x: -52, y: 0.8, z: 52 },
                size: { w: 1.2, h: 1.0, d: 0.6 }, color: '#1A1A2E', emissiveColor: '#EF4444',
                scenarioTag: 'boss', modelPath: F('deskCorner'), modelScale: 2.5 },
        );
    }

    if (currentStage >= 4) {
        all.push(
            { id: 'contract_exec', name: 'The Contract', promptText: '[E] Review Offer',
                position: { x: 55, y: 0.8, z: 58 },
                size: { w: 1.2, h: 0.3, d: 1 }, color: '#FFFFF0', emissiveColor: '#D7EF3F',
                scenarioTag: 'final', modelPath: F('books'), modelScale: 2.0 },
            { id: 'calculator_exec', name: 'Salary Calculator', promptText: '[E] Calculate Package',
                position: { x: 60, y: 0.8, z: 52 },
                size: { w: 0.5, h: 0.3, d: 0.4 }, color: '#1A237E', emissiveColor: '#3B82F6',
                scenarioTag: 'negotiation', modelPath: F('laptop'), modelScale: 2.0 },
            { id: 'boss_exec', name: 'CEO\'s Boardroom', promptText: '[E] Final Interview: The CEO',
                position: { x: 58, y: 0.8, z: 55 },
                size: { w: 1.5, h: 1.0, d: 0.8 }, color: '#1A1A2E', emissiveColor: '#EF4444',
                scenarioTag: 'boss', modelPath: F('deskCorner'), modelScale: 3.0 },
        );
    }

    return all;
}

// ═══════════════════════════════════════════════════════════════
// Zone Unlock / Position helpers
// ═══════════════════════════════════════════════════════════════

export function unlockZone(scene: any, stage: number): InteractableObjectDef[] {
    for (const mesh of [...scene.meshes]) {
        if (mesh.metadata?.isBarrier && mesh.metadata.stage === stage) mesh.dispose();
        if (mesh.metadata?.isFogWall && mesh.metadata.stage === stage) mesh.dispose();
    }
    return getDistrictInteractables(stage).filter(obj => {
        const zone = WORLD_ZONES.find(z => z.stage === stage);
        if (!zone) return false;
        const dx = obj.position.x - zone.centerX;
        const dz = obj.position.z - zone.centerZ;
        return dx * dx + dz * dz < zone.radius * zone.radius * 4;
    });
}

export function getZoneAtPosition(x: number, z: number): WorldZone | null {
    for (const zone of WORLD_ZONES) {
        const dx = x - zone.centerX;
        const dz = z - zone.centerZ;
        if (dx * dx + dz * dz < zone.radius * zone.radius) return zone;
    }
    return null;
}
