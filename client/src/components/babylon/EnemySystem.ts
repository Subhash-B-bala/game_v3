/**
 * EnemySystem — Spawns scam recruiter enemies that roam city streets
 *
 * Enemies patrol around their district, approach the player when nearby,
 * and trigger combat encounters (quiz-based) on contact.
 *
 * Uses GLB character models with a red tint for visual distinction.
 */

import type { AnimatedCharacter } from './CharacterBuilder';
import { createAnimatedCharacter, CHARACTER_PRESETS } from './CharacterBuilder';
import { WORLD_ZONES } from './OpenWorldBuilder';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface EnemyInstance {
    id: string;
    name: string;
    district: number;
    mesh: any;
    character: AnimatedCharacter;
    position: { x: number; y: number; z: number };
    state: 'patrol' | 'chase' | 'defeated' | 'despawned';
    hp: number;
    maxHp: number;
    difficulty: number;
    // Patrol
    waypoints: { x: number; z: number }[];
    currentWaypointIdx: number;
    isWaiting: boolean;
    waitTimer: number;
    speed: number;
    // Chase
    chaseSpeed: number;
    // Respawn
    respawnTimer: number;
    spawnX: number;
    spawnZ: number;
}

export interface EnemySystemHandle {
    getNearestEnemy: () => EnemyInstance | null;
    getNearestEnemyDistance: () => number;
    getEnemyInRange: () => EnemyInstance | null;
    defeatEnemy: (id: string) => void;
    getAllEnemies: () => EnemyInstance[];
    dispose: () => void;
}

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const DETECTION_RADIUS = 12;     // Start chasing at this distance
const COMBAT_RADIUS = 3.5;       // Trigger combat at this distance
const PATROL_SPEED = 1.5;
const CHASE_SPEED = 3.5;
const RESPAWN_TIME = 30;          // seconds before respawn
const ENEMIES_PER_DISTRICT = 2;

const SCAM_NAMES = [
    'Shady Sharma', 'Fake Recruiter Raj', 'Ponzi Patel', 'Phishing Priya',
    'Scam Singh', 'Fraudster Gupta', 'Advance-Fee Arora', 'MLM Mehta',
    'Fake HR Kapoor', 'Catfish Kumar', 'Clone Company Chawla', 'Telegram Tyagi',
];

function seededRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
}

// ═══════════════════════════════════════════════════════════════
// Main System
// ═══════════════════════════════════════════════════════════════

export async function createEnemySystem(
    scene: any,
    getPlayerPosition: () => { x: number; y: number; z: number },
    activeDistrict: number,
    onCombatTrigger: (enemy: EnemyInstance) => void
): Promise<EnemySystemHandle> {
    const BABYLON = await import('@babylonjs/core');
    const GUI = await import('@babylonjs/gui');

    const enemies: EnemyInstance[] = [];
    let nearestEnemy: EnemyInstance | null = null;
    let nearestDistance = Infinity;
    let enemyInRange: EnemyInstance | null = null;

    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('enemyUI', true, scene);

    // Spawn enemies for each unlocked district
    let enemyIndex = 0;
    for (let d = 0; d <= activeDistrict && d < WORLD_ZONES.length; d++) {
        const zone = WORLD_ZONES[d];
        for (let i = 0; i < ENEMIES_PER_DISTRICT; i++) {
            const angle = (i / ENEMIES_PER_DISTRICT) * Math.PI * 2 + seededRandom(d * 100 + i) * 0.5;
            const dist = zone.radius * 0.4 + seededRandom(d * 200 + i) * zone.radius * 0.3;
            const spawnX = zone.centerX + Math.cos(angle) * dist;
            const spawnZ = zone.centerZ + Math.sin(angle) * dist;

            try {
                const character = await createAnimatedCharacter(scene, {
                    ...CHARACTER_PRESETS.npcMale,
                    name: `enemy_${d}_${i}`,
                    shirtColor: '#DC2626',   // Red shirt for enemies
                    pantsColor: '#1C1917',
                    scale: 1.0,
                });

                character.root.position = new BABYLON.Vector3(spawnX, 0, spawnZ);
                character.setAnimation('idle');

                // Apply red tint to enemy meshes
                const meshes = character.root.getChildMeshes?.() || [];
                for (const mesh of meshes) {
                    if (mesh.material) {
                        const mat = mesh.material.clone(`enemy_mat_${enemyIndex}_${mesh.name}`);
                        if (mat.albedoColor) {
                            mat.albedoColor = new BABYLON.Color3(0.8, 0.15, 0.15);
                        } else if (mat.diffuseColor) {
                            mat.diffuseColor = new BABYLON.Color3(0.8, 0.15, 0.15);
                        }
                        if (mat.emissiveColor !== undefined) {
                            mat.emissiveColor = new BABYLON.Color3(0.3, 0.05, 0.05);
                        }
                        mesh.material = mat;
                    }
                }

                // Name billboard
                const nameIdx = (d * ENEMIES_PER_DISTRICT + i) % SCAM_NAMES.length;
                const enemyName = SCAM_NAMES[nameIdx];

                const rect = new GUI.Rectangle(`enemy_label_${enemyIndex}`);
                rect.width = '140px';
                rect.height = '32px';
                rect.cornerRadius = 8;
                rect.color = 'transparent';
                rect.thickness = 0;
                rect.background = 'rgba(180, 30, 30, 0.85)';
                advancedTexture.addControl(rect);
                rect.linkWithMesh(character.root);
                rect.linkOffsetY = -90;

                const nameText = new GUI.TextBlock(`enemy_name_${enemyIndex}`);
                nameText.text = `⚠ ${enemyName}`;
                nameText.color = '#FFFFFF';
                nameText.fontSize = 11;
                nameText.fontWeight = 'bold';
                nameText.fontFamily = '"Saira Condensed", sans-serif';
                rect.addControl(nameText);

                // Generate patrol waypoints
                const waypoints: { x: number; z: number }[] = [
                    { x: spawnX, z: spawnZ },
                ];
                const wpCount = 2 + Math.floor(seededRandom(d * 300 + i) * 2);
                for (let w = 0; w < wpCount; w++) {
                    const wAngle = (w / wpCount) * Math.PI * 2 + seededRandom(w * 400 + d) * 0.8;
                    const wDist = 5 + seededRandom(w * 500 + d) * 10;
                    waypoints.push({
                        x: spawnX + Math.cos(wAngle) * wDist,
                        z: spawnZ + Math.sin(wAngle) * wDist,
                    });
                }

                const enemy: EnemyInstance = {
                    id: `enemy_${d}_${i}`,
                    name: enemyName,
                    district: d,
                    mesh: character.root,
                    character,
                    position: { x: spawnX, y: 0, z: spawnZ },
                    state: 'patrol',
                    hp: 3, // 3 correct answers to defeat
                    maxHp: 3,
                    difficulty: d + 1,
                    waypoints,
                    currentWaypointIdx: 0,
                    isWaiting: true,
                    waitTimer: seededRandom(d * 600 + i) * 3,
                    speed: PATROL_SPEED * (0.8 + seededRandom(d * 700 + i) * 0.4),
                    chaseSpeed: CHASE_SPEED,
                    respawnTimer: 0,
                    spawnX,
                    spawnZ,
                };

                enemies.push(enemy);
                enemyIndex++;
            } catch (e) {
                console.warn(`Failed to create enemy ${d}_${i}:`, e);
            }
        }
    }

    // ── Update loop ──
    scene.onBeforeRenderObservable.add(() => {
        const dt = scene.getEngine().getDeltaTime() / 1000;
        const playerPos = getPlayerPosition();
        nearestEnemy = null;
        nearestDistance = Infinity;
        enemyInRange = null;

        for (const enemy of enemies) {
            if (enemy.state === 'despawned') {
                // Respawn timer
                enemy.respawnTimer -= dt;
                if (enemy.respawnTimer <= 0) {
                    enemy.state = 'patrol';
                    enemy.hp = enemy.maxHp;
                    enemy.mesh.position.x = enemy.spawnX;
                    enemy.mesh.position.z = enemy.spawnZ;
                    enemy.mesh.setEnabled(true);
                    enemy.position.x = enemy.spawnX;
                    enemy.position.z = enemy.spawnZ;
                    enemy.isWaiting = true;
                    enemy.waitTimer = 2;
                }
                continue;
            }

            if (enemy.state === 'defeated') continue;

            // Update animation
            enemy.character.update(dt);

            // Distance to player
            const dx = playerPos.x - enemy.mesh.position.x;
            const dz = playerPos.z - enemy.mesh.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            // Track nearest
            if (dist < nearestDistance) {
                nearestEnemy = enemy;
                nearestDistance = dist;
            }

            // Combat range check
            if (dist < COMBAT_RADIUS) {
                enemyInRange = enemy;
            }

            // ── State machine ──
            if (dist < DETECTION_RADIUS && enemy.state === 'patrol') {
                enemy.state = 'chase';
            } else if (dist > DETECTION_RADIUS * 1.5 && enemy.state === 'chase') {
                enemy.state = 'patrol';
            }

            if (enemy.state === 'chase') {
                // Chase player
                const speed = enemy.chaseSpeed * dt;
                const ndx = dx / dist;
                const ndz = dz / dist;
                enemy.mesh.position.x += ndx * speed;
                enemy.mesh.position.z += ndz * speed;
                enemy.position.x = enemy.mesh.position.x;
                enemy.position.z = enemy.mesh.position.z;
                enemy.character.lookAt(playerPos.x, playerPos.z);
                enemy.character.setAnimation('run');

                // Trigger combat if close enough
                if (dist < COMBAT_RADIUS) {
                    onCombatTrigger(enemy);
                }
            } else if (enemy.state === 'patrol') {
                // Patrol behavior
                if (enemy.isWaiting) {
                    enemy.waitTimer -= dt;
                    enemy.character.setAnimation('idle');
                    if (enemy.waitTimer <= 0) {
                        enemy.currentWaypointIdx = (enemy.currentWaypointIdx + 1) % enemy.waypoints.length;
                        enemy.isWaiting = false;
                    }
                } else {
                    const target = enemy.waypoints[enemy.currentWaypointIdx];
                    const tdx = target.x - enemy.mesh.position.x;
                    const tdz = target.z - enemy.mesh.position.z;
                    const tDist = Math.sqrt(tdx * tdx + tdz * tdz);

                    if (tDist < 0.5) {
                        enemy.isWaiting = true;
                        enemy.waitTimer = 2 + seededRandom(Date.now() * 0.001) * 3;
                        enemy.character.setAnimation('idle');
                    } else {
                        const moveX = (tdx / tDist) * enemy.speed * dt;
                        const moveZ = (tdz / tDist) * enemy.speed * dt;
                        enemy.mesh.position.x += moveX;
                        enemy.mesh.position.z += moveZ;
                        enemy.position.x = enemy.mesh.position.x;
                        enemy.position.z = enemy.mesh.position.z;
                        enemy.character.lookAt(target.x, target.z);
                        enemy.character.setAnimation('walk');
                    }
                }
            }
        }
    });

    return {
        getNearestEnemy: () => nearestEnemy,
        getNearestEnemyDistance: () => nearestDistance,
        getEnemyInRange: () => enemyInRange,

        defeatEnemy: (id: string) => {
            const enemy = enemies.find(e => e.id === id);
            if (!enemy) return;
            enemy.state = 'despawned';
            enemy.mesh.setEnabled(false);
            enemy.respawnTimer = RESPAWN_TIME;
        },

        getAllEnemies: () => enemies.filter(e => e.state !== 'despawned'),

        dispose: () => {
            for (const enemy of enemies) {
                enemy.character.dispose();
            }
            advancedTexture.dispose();
        },
    };
}
