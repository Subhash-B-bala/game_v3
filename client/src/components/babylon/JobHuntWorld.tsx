'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { BabylonCanvas, type SceneReadyArgs } from './BabylonCanvas';
import { useGameStore } from '@/store/gameStore';
import { applyChoice } from '@/engine/reducer';
import { pickNextHuntScenario, checkStageAdvance } from '@/engine/JobHuntResolver';
import { SCENARIO_LESSONS } from '@/engine/chapter3_job_hunt/scenario_lessons';
import { STAGE_CONTENT, FLOOR_META } from '@/engine/chapter3_job_hunt/stage_content';
import type { Scenario, Choice, GameState } from '@/engine/types';

// Systems
import { createPlayerController, type PlayerController } from './PlayerController';
import { createNPCSystem, type NPCSystemHandle } from './NPCSystem';
import { createInteractableObjectSystem, type InteractableObjectSystemHandle } from './InteractableObjectSystem';
import { createGameBridge, type GameBridgeHandle } from './GameBridge';
import { buildOpenWorld, unlockZone, getZoneAtPosition, type OpenWorldLayout, WORLD_ZONES } from './OpenWorldBuilder';
import { createEnemySystem, type EnemySystemHandle, type EnemyInstance } from './EnemySystem';
import CombatOverlay from './CombatOverlay';
import MiniGameOverlay from './MiniGameOverlay';
import { createQuestSystem, type QuestSystemHandle, type Quest } from './QuestSystem';
import BossInterview from './BossInterview';

// Scenario data
import huntScenariosData from '@/engine/chapter3_job_hunt/job_hunt_scenarios.json';
const HUNT_SCENARIOS = huntScenariosData as Scenario[];

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

type DialoguePhase =
    | 'exploring'           // Walking freely — objects glow
    | 'trigger'             // Scenario intro text
    | 'lesson'              // Tony's teaching slides
    | 'choices'             // Choice buttons
    | 'outcome'             // Stats + Tony reaction
    | 'tip'                 // Real-world tip card
    | 'stage_transition'    // Floor transition overlay
    | 'loading';            // Loading next scenario

interface StatFloater {
    id: number;
    text: string;
    color: string;
    x: number;
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function JobHuntWorld() {
    const store = useGameStore();

    // 3D systems ref
    const systemsRef = useRef<{
        scene: any;
        engine: any;
        canvas: HTMLCanvasElement;
        player: PlayerController | null;
        npcSystem: NPCSystemHandle | null;
        objectSystem: InteractableObjectSystemHandle | null;
        gameBridge: GameBridgeHandle | null;
        worldLayout: OpenWorldLayout | null;
        enemySystem: EnemySystemHandle | null;
    }>({
        scene: null,
        engine: null,
        canvas: null as any,
        player: null,
        npcSystem: null,
        objectSystem: null,
        gameBridge: null,
        worldLayout: null,
        enemySystem: null,
    });

    // Scenario state
    const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
    const [dialoguePhase, setDialoguePhase] = useState<DialoguePhase>('loading');
    const [lessonIndex, setLessonIndex] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
    const [pendingScenario, setPendingScenario] = useState<Scenario | null>(null);

    // UI state
    const [isTyping, setIsTyping] = useState(false);
    const [displayedText, setDisplayedText] = useState('');
    const [fadeIn, setFadeIn] = useState(false);
    const [statFloaters, setStatFloaters] = useState<StatFloater[]>([]);
    const [floaterCounter, setFloaterCounter] = useState(0);
    const [showStageTransition, setShowStageTransition] = useState(false);
    const [transitionStage, setTransitionStage] = useState(0);
    const [sceneReady, setSceneReady] = useState(false);
    const [currentZoneName, setCurrentZoneName] = useState('');
    const [showZoneBanner, setShowZoneBanner] = useState(false);
    const [combatEnemy, setCombatEnemy] = useState<EnemyInstance | null>(null);
    const [showCoinPopup, setShowCoinPopup] = useState<{ amount: number; id: number } | null>(null);
    const [enemyWarning, setEnemyWarning] = useState(false);
    const coinPopupCounter = useRef(0);

    // Mini-game state
    const [miniGame, setMiniGame] = useState<{ mode: 'typing' | 'spot_error' | 'quiz_rapid'; difficulty: number; stationName: string } | null>(null);

    // Quest state
    const questSystemRef = useRef<QuestSystemHandle | null>(null);
    const [activeQuestText, setActiveQuestText] = useState<{ title: string; objective: string } | null>(null);
    const [questCompletePopup, setQuestCompletePopup] = useState<{ title: string; coins: number; xp: number } | null>(null);

    // Boss state
    const [bossDistrict, setBossDistrict] = useState<number | null>(null);

    const prevStageRef = useRef(store.huntStage);

    // Minimap canvas ref
    const minimapCanvasRef = useRef<HTMLCanvasElement>(null);

    // Zone detection effect — check player position every 500ms
    useEffect(() => {
        if (!sceneReady) return;
        const interval = setInterval(() => {
            const systems = systemsRef.current;
            if (!systems.player) return;
            const pos = systems.player.getPosition();
            const zone = getZoneAtPosition(pos.x, pos.z);
            if (zone && zone.name !== currentZoneName) {
                setCurrentZoneName(zone.name);
                setShowZoneBanner(true);
                setTimeout(() => setShowZoneBanner(false), 3000);
            } else if (!zone && currentZoneName !== '') {
                setCurrentZoneName('');
            }
        }, 500);
        return () => clearInterval(interval);
    }, [sceneReady, currentZoneName]);

    // Minimap render loop
    useEffect(() => {
        if (!sceneReady) return;
        const canvas = minimapCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const MINIMAP_SIZE = 140;
        const WORLD_SIZE = 200;
        const scale = MINIMAP_SIZE / WORLD_SIZE;

        const toMinimap = (worldX: number, worldZ: number) => ({
            mx: MINIMAP_SIZE / 2 + worldX * scale,
            my: MINIMAP_SIZE / 2 - worldZ * scale, // flip Z
        });

        let animId: number;
        const drawMinimap = () => {
            const systems = systemsRef.current;
            if (!systems.player) { animId = requestAnimationFrame(drawMinimap); return; }

            ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

            // Background circle
            ctx.beginPath();
            ctx.arc(MINIMAP_SIZE / 2, MINIMAP_SIZE / 2, MINIMAP_SIZE / 2 - 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(10, 15, 30, 0.75)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Draw paths between zones
            ctx.strokeStyle = 'rgba(180, 150, 100, 0.3)';
            ctx.lineWidth = 1;
            for (const zone of WORLD_ZONES) {
                if (zone.stage === 0) continue;
                const from = toMinimap(0, 0);
                const to = toMinimap(zone.centerX, zone.centerZ);
                ctx.beginPath();
                ctx.moveTo(from.mx, from.my);
                ctx.lineTo(to.mx, to.my);
                ctx.stroke();
            }

            // Draw zone circles
            for (const zone of WORLD_ZONES) {
                const { mx, my } = toMinimap(zone.centerX, zone.centerZ);
                const r = zone.radius * scale;
                const isUnlocked = zone.stage <= store.huntStage;

                // Zone area
                ctx.beginPath();
                ctx.arc(mx, my, r, 0, Math.PI * 2);
                ctx.fillStyle = isUnlocked ? 'rgba(59, 130, 246, 0.15)' : 'rgba(100, 100, 120, 0.1)';
                ctx.fill();

                // Zone dot
                ctx.beginPath();
                ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = isUnlocked ? '#3B82F6' : '#555';
                ctx.fill();

                // Zone label (tiny)
                ctx.font = '7px sans-serif';
                ctx.fillStyle = isUnlocked ? 'rgba(225, 227, 250, 0.7)' : 'rgba(150, 150, 160, 0.4)';
                ctx.textAlign = 'center';
                ctx.fillText(`F${zone.stage}`, mx, my + 9);
            }

            // Draw enemies (red dots)
            if (systems.enemySystem) {
                const enemies = systems.enemySystem.getAllEnemies();
                for (const enemy of enemies) {
                    if (enemy.state === 'despawned' || enemy.state === 'defeated') continue;
                    const { mx, my } = toMinimap(enemy.position.x, enemy.position.z);
                    ctx.beginPath();
                    ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = enemy.state === 'chase' ? '#FF4444' : '#CC3333';
                    ctx.fill();
                }
            }

            // Draw NPCs
            if (systems.npcSystem) {
                const npcs = systems.npcSystem.getAllNPCs();
                for (const npc of npcs) {
                    const { mx, my } = toMinimap(npc.position.x, npc.position.z);
                    ctx.beginPath();
                    ctx.arc(mx, my, 2, 0, Math.PI * 2);
                    ctx.fillStyle = npc.id === 'tony' ? '#FFD600' : '#20C997';
                    ctx.fill();
                }
            }

            // Draw player (always on top)
            const pos = systems.player.getPosition();
            const { mx, my } = toMinimap(pos.x, pos.z);

            // Player direction indicator (triangle)
            ctx.save();
            ctx.translate(mx, my);
            const playerRot = systems.player.mesh?.rotation?.y || 0;
            ctx.rotate(-playerRot);
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(-3.5, 3);
            ctx.lineTo(3.5, 3);
            ctx.closePath();
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.restore();

            // Outer glow ring
            ctx.beginPath();
            ctx.arc(mx, my, 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();

            animId = requestAnimationFrame(drawMinimap);
        };

        animId = requestAnimationFrame(drawMinimap);
        return () => cancelAnimationFrame(animId);
    }, [sceneReady, store.huntStage]);

    // Fade in on mount
    useEffect(() => {
        const t = setTimeout(() => setFadeIn(true), 100);
        return () => clearTimeout(t);
    }, []);

    // Safety: ensure huntStage is 0 for first-time players
    useEffect(() => {
        const state = useGameStore.getState();
        if (state.history.length === 0 || !state.history.some(h => HUNT_SCENARIOS.some(s => s.id === h))) {
            useGameStore.setState({ huntStage: 0, huntProgress: 0 });
        }
    }, []);

    // ═══════════════════════════════════════════════════════════
    // TYPEWRITER EFFECT
    // ═══════════════════════════════════════════════════════════

    const typeText = useCallback((text: string, speed = 22) => {
        setIsTyping(true);
        setDisplayedText('');
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setDisplayedText(text.slice(0, i));
            if (i >= text.length) {
                clearInterval(interval);
                setIsTyping(false);
            }
        }, speed);
        return () => clearInterval(interval);
    }, []);

    const skipTyping = useCallback((fullText: string) => {
        setIsTyping(false);
        setDisplayedText(fullText);
    }, []);

    // Get full text for current phase
    const getCurrentFullText = useCallback((): string => {
        if (!currentScenario) return '';
        const lessons = SCENARIO_LESSONS[currentScenario.id];

        switch (dialoguePhase) {
            case 'trigger':
                return currentScenario.text;
            case 'lesson':
                return lessons?.lesson[lessonIndex] || '';
            case 'outcome':
                if (selectedChoice && lessons?.reactions[selectedChoice.id]) {
                    return lessons.reactions[selectedChoice.id];
                }
                return 'Interesting choice. Let me think about that...';
            case 'tip':
                return lessons?.tip || '';
            default:
                return '';
        }
    }, [currentScenario, dialoguePhase, lessonIndex, selectedChoice]);

    // Start typing when phase changes
    useEffect(() => {
        const text = getCurrentFullText();
        if (text && (dialoguePhase === 'trigger' || dialoguePhase === 'lesson' || dialoguePhase === 'outcome' || dialoguePhase === 'tip')) {
            const cleanup = typeText(text);
            return cleanup;
        }
    }, [dialoguePhase, lessonIndex, currentScenario?.id, selectedChoice?.id, getCurrentFullText, typeText]);

    // ═══════════════════════════════════════════════════════════
    // GAMEPLAY OBJECT MAPS (defined early so other systems can reference them)
    // ═══════════════════════════════════════════════════════════

    // Map object IDs to mini-game modes
    const MINIGAME_OBJECTS: Record<string, { mode: 'typing' | 'spot_error' | 'quiz_rapid'; difficulty: number }> = {
        'terminal_techpark': { mode: 'typing', difficulty: 2 },
        'whiteboard_techpark': { mode: 'quiz_rapid', difficulty: 2 },
        'screen_business': { mode: 'quiz_rapid', difficulty: 3 },
        'evidence_gov': { mode: 'spot_error', difficulty: 3 },
        'laptop_downtown': { mode: 'typing', difficulty: 1 },
        'jobboard_downtown': { mode: 'spot_error', difficulty: 1 },
        'resume_downtown': { mode: 'spot_error', difficulty: 1 },
        'computer_gov': { mode: 'typing', difficulty: 3 },
    };

    // Boss trigger map: objectId → district number
    const BOSS_OBJECTS: Record<string, number> = {
        'boss_downtown': 0,
        'boss_techpark': 1,
        'boss_business': 2,
        'boss_gov': 3,
        'boss_exec': 4,
    };

    // IDs of objects that should ALWAYS stay active (mini-games + bosses)
    const ALWAYS_ACTIVE_IDS = new Set([
        ...Object.keys(MINIGAME_OBJECTS),
        ...Object.keys(BOSS_OBJECTS),
    ]);

    // ═══════════════════════════════════════════════════════════
    // SCENARIO MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    const loadNextScenario = useCallback(() => {
        const state = useGameStore.getState();
        const track = state.role || 'analyst';

        const { scenario, updates } = pickNextHuntScenario(HUNT_SCENARIOS, state, track);

        if (scenario) {
            useGameStore.setState(updates);
            setPendingScenario(scenario);

            // Activate a random object for the scenario
            const objSystem = systemsRef.current.objectSystem;
            if (objSystem) {
                // Deactivate only scenario objects (NOT mini-game/boss stations)
                const allObjects = objSystem.getAllObjects();
                for (const obj of allObjects) {
                    if (!ALWAYS_ACTIVE_IDS.has(obj.id)) {
                        objSystem.setObjectActive(obj.id, false);
                    }
                }

                // Pick a scenario object based on tags
                const scenarioObjects = allObjects.filter(o => !ALWAYS_ACTIVE_IDS.has(o.id));
                let targetObj = scenarioObjects[0]; // default

                if (scenario.tags && scenarioObjects.length > 0) {
                    const match = scenarioObjects.find(o =>
                        o.scenarioTag && scenario.tags!.some(t =>
                            t.toLowerCase().includes(o.scenarioTag!.toLowerCase()) ||
                            o.scenarioTag!.toLowerCase().includes(t.toLowerCase())
                        )
                    );
                    if (match) targetObj = match;
                    else {
                        targetObj = scenarioObjects[Math.floor(Math.random() * scenarioObjects.length)];
                    }
                }

                if (targetObj) {
                    objSystem.setObjectActive(targetObj.id, true);
                }

                // Ensure all mini-game + boss objects stay active
                for (const id of ALWAYS_ACTIVE_IDS) {
                    objSystem.setObjectActive(id, true);
                }
            }

            setDialoguePhase('exploring');
        } else {
            useGameStore.setState({ uiPhase: 'end' });
        }
    }, []);

    // Handle object interaction (E key)
    const handleObjectInteract = useCallback((objectId: string, objectName: string) => {
        if (dialoguePhase !== 'exploring') return;

        // Check if this is a boss interview trigger
        const bossDistrictNum = BOSS_OBJECTS[objectId];
        if (bossDistrictNum !== undefined) {
            const player = systemsRef.current.player;
            if (player) player.setFrozen(true);
            setBossDistrict(bossDistrictNum);
            return;
        }

        // Check if this is a mini-game station
        const miniGameConfig = MINIGAME_OBJECTS[objectId];
        if (miniGameConfig) {
            const player = systemsRef.current.player;
            if (player) player.setFrozen(true);
            setMiniGame({
                mode: miniGameConfig.mode,
                difficulty: miniGameConfig.difficulty,
                stationName: objectName,
            });
            return;
        }

        // Standard scenario interaction
        if (!pendingScenario) return;

        // Freeze player
        const player = systemsRef.current.player;
        if (player) player.setFrozen(true);

        // Load the pending scenario
        setCurrentScenario(pendingScenario);
        setSelectedChoice(null);
        setLessonIndex(0);
        setDialoguePhase('trigger');

        // Deactivate the interacted object
        const objSystem = systemsRef.current.objectSystem;
        if (objSystem) objSystem.setObjectActive(objectId, false);
    }, [dialoguePhase, pendingScenario]);

    // Handle Tony NPC interaction
    const handleNPCInteract = useCallback((npcId: string, npcName: string, npcRole: string) => {
        if (dialoguePhase !== 'exploring' || !pendingScenario) return;

        const player = systemsRef.current.player;
        if (player) player.setFrozen(true);

        setCurrentScenario(pendingScenario);
        setSelectedChoice(null);
        setLessonIndex(0);
        setDialoguePhase('trigger');

        // Deactivate only scenario objects, keep mini-game/boss active
        const objSystem = systemsRef.current.objectSystem;
        if (objSystem) {
            const allObjects = objSystem.getAllObjects();
            for (const obj of allObjects) {
                if (!ALWAYS_ACTIVE_IDS.has(obj.id)) {
                    objSystem.setObjectActive(obj.id, false);
                }
            }
        }
    }, [dialoguePhase, pendingScenario]);

    // Handle choice selection
    const handleChoice = useCallback((choice: Choice) => {
        if (!currentScenario) return;

        setSelectedChoice(choice);

        const state = useGameStore.getState();
        const { newState, notifications } = applyChoice(state, choice);

        useGameStore.setState({
            ...newState,
            notifications: [...state.notifications, ...notifications],
            history: [...state.history, currentScenario.id],
        });

        // Show stat floaters
        const newFloaters: StatFloater[] = [];
        let counter = floaterCounter;

        if (choice.fx) {
            Object.entries(choice.fx).forEach(([key, value], i) => {
                const val = value as number;
                if (val === 0) return;
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                newFloaters.push({
                    id: counter++,
                    text: `${val > 0 ? '+' : ''}${val} ${label}`,
                    color: val > 0 ? '#20C997' : '#D63384',
                    x: 30 + (i % 3) * 35,
                });
            });
        }
        if (choice.huntProgress) {
            newFloaters.push({
                id: counter++,
                text: `${choice.huntProgress > 0 ? '+' : ''}${choice.huntProgress}% Progress`,
                color: '#3B82F6',
                x: 50,
            });
        }

        setFloaterCounter(counter);
        setStatFloaters(prev => [...prev, ...newFloaters]);
        setTimeout(() => {
            setStatFloaters(prev => prev.filter(f => !newFloaters.find(nf => nf.id === f.id)));
        }, 2000);

        // Check stage advance
        const stageAdvance = checkStageAdvance(newState);
        if (stageAdvance && newState.huntStage !== prevStageRef.current) {
            setTransitionStage(prevStageRef.current);
            prevStageRef.current = newState.huntStage;
        }

        setDialoguePhase('outcome');
    }, [currentScenario, floaterCounter]);

    // Advance dialogue flow
    const advanceDialogue = useCallback(() => {
        if (!currentScenario) return;
        const lessons = SCENARIO_LESSONS[currentScenario.id];

        switch (dialoguePhase) {
            case 'trigger': {
                if (lessons && lessons.lesson.length > 0) {
                    setLessonIndex(0);
                    setDialoguePhase('lesson');
                } else {
                    setDialoguePhase('choices');
                }
                break;
            }
            case 'lesson': {
                if (lessons && lessonIndex < lessons.lesson.length - 1) {
                    setLessonIndex(prev => prev + 1);
                } else {
                    setDialoguePhase('choices');
                }
                break;
            }
            case 'outcome': {
                if (lessons?.tip) {
                    setDialoguePhase('tip');
                } else {
                    handlePostScenario();
                }
                break;
            }
            case 'tip': {
                handlePostScenario();
                break;
            }
        }
    }, [currentScenario, dialoguePhase, lessonIndex]);

    // After scenario completes
    const handlePostScenario = useCallback(() => {
        const state = useGameStore.getState();

        // Check stage transition
        if (transitionStage < state.huntStage && STAGE_CONTENT[transitionStage]) {
            setShowStageTransition(true);
            setDialoguePhase('stage_transition');
            return;
        }

        // Check game end
        if (state.flags.has_job || state.flags.has_job_startup) {
            useGameStore.setState({ uiPhase: 'end' });
            return;
        }

        // Unfreeze player and load next scenario
        const player = systemsRef.current.player;
        if (player) player.setFrozen(false);

        setCurrentScenario(null);
        setDialoguePhase('loading');
        setTimeout(() => loadNextScenario(), 300);
    }, [transitionStage, loadNextScenario]);

    // Close stage transition — unlock next zone (NO world rebuild!)
    const closeStageTransition = useCallback(async () => {
        setShowStageTransition(false);
        const newStage = useGameStore.getState().huntStage;
        setTransitionStage(newStage);

        const systems = systemsRef.current;
        if (systems.scene) {
            // Unlock the zone for the new stage (removes barriers + fog)
            const newObjects = unlockZone(systems.scene, newStage);

            // Add new interactable objects for the unlocked zone
            if (systems.objectSystem && newObjects.length > 0) {
                // Dispose old object system and create new one with all objects
                systems.objectSystem.dispose();
                const allObjects = systems.worldLayout
                    ? [...systems.worldLayout.objects, ...newObjects]
                    : newObjects;
                // Update worldLayout with new objects
                if (systems.worldLayout) {
                    systems.worldLayout.objects = allObjects;
                }
                const objectSystem = await createInteractableObjectSystem(
                    systems.scene,
                    allObjects,
                    systems.player!.getPosition
                );
                systems.objectSystem = objectSystem;

                // Reconnect game bridge with new object system
                if (systems.gameBridge) systems.gameBridge.dispose();
                const gameBridge = await createGameBridge(
                    systems.scene,
                    systems.npcSystem,
                    null,
                    [],
                    systems.player!.getPosition,
                    {
                        onNPCInteract: (npcId: string, npcName: string, npcRole: string) => {
                            handleNPCInteract(npcId, npcName, npcRole);
                        },
                        onObjectInteract: (objectId: string, objectName: string) => {
                            handleObjectInteract(objectId, objectName);
                        },
                        onDoorEnter: () => {},
                        onZoneChange: () => {},
                        onPositionUpdate: () => {},
                    },
                    objectSystem
                );
                systems.gameBridge = gameBridge;
            }

            // Teleport player toward the new zone
            const newZone = WORLD_ZONES.find(z => z.stage === newStage);
            if (newZone && systems.player) {
                // Move player to edge of new zone
                const angle = Math.atan2(newZone.centerZ, newZone.centerX);
                const spawnDist = newZone.radius * 0.6;
                systems.player.mesh.position.x = newZone.centerX - Math.cos(angle) * spawnDist;
                systems.player.mesh.position.z = newZone.centerZ - Math.sin(angle) * spawnDist;
            }
        }

        // Unfreeze and load next
        const player = systemsRef.current.player;
        if (player) player.setFrozen(false);

        setDialoguePhase('loading');
        setTimeout(() => loadNextScenario(), 500);
    }, [loadNextScenario, handleObjectInteract, handleNPCInteract]);

    // ═══════════════════════════════════════════════════════════
    // MINI-GAME SYSTEM
    // ═══════════════════════════════════════════════════════════

    const handleMiniGameComplete = useCallback((score: number, maxScore: number, coins: number, xp: number) => {
        store.addCoins(coins);
        store.addXP(xp);
        store.completeMiniGame();

        coinPopupCounter.current++;
        setShowCoinPopup({ amount: coins, id: coinPopupCounter.current });
        setTimeout(() => setShowCoinPopup(null), 2000);

        // Notify quest system
        if (questSystemRef.current && miniGame) {
            // Check which object triggered this mini-game by looking at the MINIGAME_OBJECTS map
            for (const [objId, cfg] of Object.entries(MINIGAME_OBJECTS)) {
                if (cfg.mode === miniGame.mode && cfg.difficulty === miniGame.difficulty) {
                    questSystemRef.current.checkObjectiveProgress('complete_minigame', objId);
                    break;
                }
            }
            updateQuestTracker();
        }
    }, [store, miniGame]);

    const handleMiniGameClose = useCallback(() => {
        setMiniGame(null);
        const player = systemsRef.current.player;
        if (player) player.setFrozen(false);
    }, []);

    // ═══════════════════════════════════════════════════════════
    // QUEST SYSTEM
    // ═══════════════════════════════════════════════════════════

    const handleQuestComplete = useCallback((quest: Quest) => {
        store.addCoins(quest.reward.coins);
        store.addXP(quest.reward.xp);

        if (quest.reward.unlockDistrict !== undefined) {
            store.unlockDistrict(quest.reward.unlockDistrict);
        }

        setQuestCompletePopup({ title: quest.title, coins: quest.reward.coins, xp: quest.reward.xp });
        setTimeout(() => setQuestCompletePopup(null), 3000);

        // Auto-accept next quest after short delay
        setTimeout(() => updateQuestTracker(), 500);
    }, [store]);

    const initQuestSystem = useCallback(() => {
        const state = useGameStore.getState();
        const completedIds = (state.flags['completedQuests'] as unknown as string[]) || [];
        const qs = createQuestSystem(state.activeDistrict, Array.isArray(completedIds) ? completedIds : [], handleQuestComplete);
        questSystemRef.current = qs;
        updateQuestTracker();
    }, [handleQuestComplete]);

    const updateQuestTracker = useCallback(() => {
        if (!questSystemRef.current) return;
        const tracker = questSystemRef.current.getActiveQuestTracker();
        if (tracker) {
            setActiveQuestText({ title: tracker.quest.title, objective: tracker.objectiveText });
        } else {
            setActiveQuestText(null);
        }
    }, []);

    // Initialize quest system when scene is ready
    useEffect(() => {
        if (sceneReady) {
            initQuestSystem();
        }
    }, [sceneReady, initQuestSystem]);

    // ═══════════════════════════════════════════════════════════
    // BOSS SYSTEM
    // ═══════════════════════════════════════════════════════════

    const handleBossVictory = useCallback((district: number, coins: number, xp: number) => {
        store.addCoins(coins);
        store.addXP(xp);
        store.defeatBoss();
        store.unlockDistrict(district + 1);

        coinPopupCounter.current++;
        setShowCoinPopup({ amount: coins, id: coinPopupCounter.current });
        setTimeout(() => setShowCoinPopup(null), 2000);

        setBossDistrict(null);

        const player = systemsRef.current.player;
        if (player) player.setFrozen(false);
    }, [store]);

    const handleBossDefeat = useCallback((damageTaken: number) => {
        store.takeDamage(damageTaken);
        setBossDistrict(null);

        const player = systemsRef.current.player;
        if (player) player.setFrozen(false);
    }, [store]);

    const handleBossClose = useCallback(() => {
        setBossDistrict(null);
        const player = systemsRef.current.player;
        if (player) player.setFrozen(false);
    }, []);

    // ═══════════════════════════════════════════════════════════
    // COMBAT SYSTEM
    // ═══════════════════════════════════════════════════════════

    const handleCombatTrigger = useCallback((enemy: EnemyInstance) => {
        if (combatEnemy) return; // Already in combat
        if (dialoguePhase !== 'exploring') return; // Don't interrupt dialogue

        // Freeze player
        const player = systemsRef.current.player;
        if (player) player.setFrozen(true);

        setCombatEnemy(enemy);
    }, [combatEnemy, dialoguePhase]);

    const handleCombatVictory = useCallback((enemyId: string, coins: number, xp: number) => {
        const systems = systemsRef.current;
        if (systems.enemySystem) {
            systems.enemySystem.defeatEnemy(enemyId);
        }

        // Update store
        store.addCoins(coins);
        store.addXP(xp);
        store.defeatEnemy();
        store.identifyScam();

        // Show coin popup
        coinPopupCounter.current++;
        setShowCoinPopup({ amount: coins, id: coinPopupCounter.current });
        setTimeout(() => setShowCoinPopup(null), 2000);

        // Notify quest system about enemy defeat
        if (questSystemRef.current) {
            questSystemRef.current.checkObjectiveProgress('defeat_enemies');
            updateQuestTracker();
        }

        // Unfreeze player
        const player = systemsRef.current.player;
        if (player) player.setFrozen(false);

        setCombatEnemy(null);
    }, [store, updateQuestTracker]);

    const handleCombatDefeat = useCallback((damageTaken: number) => {
        store.takeDamage(damageTaken);

        // Unfreeze player
        const player = systemsRef.current.player;
        if (player) player.setFrozen(false);

        setCombatEnemy(null);

        // Check if player is KO'd
        if (store.hp - damageTaken <= 0) {
            // Respawn at downtown
            if (systemsRef.current.player) {
                systemsRef.current.player.mesh.position.x = 0;
                systemsRef.current.player.mesh.position.z = 8;
            }
            // Heal to 50%
            store.heal(Math.floor(store.maxHp * 0.5));
        }
    }, [store]);

    const handleCombatClose = useCallback(() => {
        setCombatEnemy(null);
        const player = systemsRef.current.player;
        if (player) player.setFrozen(false);
    }, []);

    // Enemy proximity warning
    useEffect(() => {
        if (!sceneReady || combatEnemy) return;
        const interval = setInterval(() => {
            const systems = systemsRef.current;
            if (!systems.enemySystem) return;
            const dist = systems.enemySystem.getNearestEnemyDistance();
            if (dist < 15 && dist > 4) {
                setEnemyWarning(true);
                setTimeout(() => setEnemyWarning(false), 2000);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [sceneReady, combatEnemy]);

    // ═══════════════════════════════════════════════════════════
    // 3D SCENE SETUP (Open World — built ONCE, not per floor)
    // ═══════════════════════════════════════════════════════════

    const setupOpenWorld = useCallback(async (scene: any, canvas: HTMLCanvasElement, stage: number) => {
        const systems = systemsRef.current;

        // Build the open world (terrain, skybox, buildings, trees, zones)
        const worldLayout = await buildOpenWorld(stage, scene);
        systems.worldLayout = worldLayout;

        // Create player — outdoor settings
        const player = await createPlayerController(scene, canvas, {
            spawnX: worldLayout.spawnPoint.x,
            spawnY: worldLayout.spawnPoint.y,
            spawnZ: worldLayout.spawnPoint.z,
            moveSpeed: 10,
            sprintSpeed: 18,
            worldBounds: worldLayout.worldBounds,
            cameraRadius: worldLayout.cameraRadius,
            cameraBeta: worldLayout.cameraBeta,
            cameraRadiusLimits: worldLayout.cameraRadiusLimits,
            terrain: worldLayout.terrain,
        });
        systems.player = player;

        // Create interactable objects (placed in zones)
        const objectSystem = await createInteractableObjectSystem(
            scene,
            worldLayout.objects,
            player.getPosition
        );
        systems.objectSystem = objectSystem;

        // Create Tony NPC in the open world
        const npcSystem = await createNPCSystem(
            scene,
            [{
                id: 'tony',
                name: 'Tony Sharma',
                role: 'Career Mentor',
                color: '#3B82F6',
                x: worldLayout.tonyPosition.x,
                y: worldLayout.tonyPosition.y,
                z: worldLayout.tonyPosition.z,
                zone: 'world',
            }],
            player.getPosition
        );
        systems.npcSystem = npcSystem;

        // Create enemy system
        const state = useGameStore.getState();
        const enemySystem = await createEnemySystem(
            scene,
            player.getPosition,
            state.activeDistrict,
            handleCombatTrigger
        );
        systems.enemySystem = enemySystem;

        // Create game bridge
        const gameBridge = await createGameBridge(
            scene,
            npcSystem,
            null, // no doors
            [],   // zones handled by OpenWorldBuilder
            player.getPosition,
            {
                onNPCInteract: (npcId: string, npcName: string, npcRole: string) => {
                    handleNPCInteract(npcId, npcName, npcRole);
                },
                onObjectInteract: (objectId: string, objectName: string) => {
                    handleObjectInteract(objectId, objectName);
                },
                onDoorEnter: () => {},
                onZoneChange: () => {},
                onPositionUpdate: () => {},
            },
            objectSystem
        );
        systems.gameBridge = gameBridge;

        setSceneReady(true);
    }, [handleObjectInteract, handleNPCInteract, handleCombatTrigger]);

    const handleSceneReady = useCallback(async ({ scene, engine, canvas }: SceneReadyArgs) => {
        const systems = systemsRef.current;
        systems.scene = scene;
        systems.engine = engine;
        systems.canvas = canvas;

        const state = useGameStore.getState();
        await setupOpenWorld(scene, canvas, state.huntStage);

        // Load first scenario
        setTimeout(() => loadNextScenario(), 500);
    }, [setupOpenWorld, loadNextScenario]);

    const disposeCurrentWorld = (systems: any) => {
        if (systems.player) { systems.player.dispose(); systems.player = null; }
        if (systems.npcSystem) { systems.npcSystem.dispose(); systems.npcSystem = null; }
        if (systems.objectSystem) { systems.objectSystem.dispose(); systems.objectSystem = null; }
        if (systems.gameBridge) { systems.gameBridge.dispose(); systems.gameBridge = null; }
        if (systems.enemySystem) { systems.enemySystem.dispose(); systems.enemySystem = null; }

        const scene = systems.scene;
        if (scene) {
            const meshes = [...scene.meshes];
            for (const mesh of meshes) mesh.dispose();
            const materials = [...scene.materials];
            for (const mat of materials) mat.dispose();
            const lights = [...scene.lights];
            for (const light of lights) light.dispose();
            const textures = [...scene.textures];
            for (const tex of textures) tex.dispose();
        }
    };

    // ESC to close dialogue and return to exploring
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && dialoguePhase !== 'exploring' && dialoguePhase !== 'loading' && dialoguePhase !== 'stage_transition') {
                // Only allow ESC to skip during trigger/lesson phases, not choices/outcome
                if (dialoguePhase === 'trigger' || dialoguePhase === 'lesson') {
                    // Skip to choices
                    setDialoguePhase('choices');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dialoguePhase]);

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════

    const lessons = currentScenario ? SCENARIO_LESSONS[currentScenario.id] : null;
    const currentFullText = getCurrentFullText();
    const floorMeta = FLOOR_META[store.huntStage] || FLOOR_META[0];
    const progressPercent = Math.min(100, store.huntProgress);
    const isDialogueActive = dialoguePhase !== 'exploring' && dialoguePhase !== 'loading';

    return (
        <div style={{
            position: 'relative',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            background: '#000',
            opacity: fadeIn ? 1 : 0,
            transition: 'opacity 0.8s ease',
        }}>
            {/* Babylon.js 3D Scene */}
            <BabylonCanvas onSceneReady={handleSceneReady} />

            {/* Bottom gradient for readability */}
            {isDialogueActive && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.3) 75%, rgba(0,0,0,0.65) 100%)',
                    pointerEvents: 'none',
                }} />
            )}

            {/* ══════ Zone Banner ══════ */}
            {showZoneBanner && currentZoneName && (
                <div style={{
                    position: 'absolute',
                    top: '15%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 40,
                    textAlign: 'center',
                    animation: 'fadeInOut 3s ease',
                    pointerEvents: 'none',
                }}>
                    <div style={{
                        fontFamily: '"Saira Condensed", sans-serif',
                        fontSize: 32,
                        fontWeight: 800,
                        color: '#E1E3FA',
                        textTransform: 'uppercase',
                        letterSpacing: 4,
                        textShadow: '0 2px 20px rgba(59, 130, 246, 0.6)',
                    }}>
                        {currentZoneName}
                    </div>
                    <div style={{
                        width: 60,
                        height: 2,
                        background: '#3B82F6',
                        margin: '8px auto',
                        borderRadius: 1,
                    }} />
                </div>
            )}

            {/* ══════ HUD — Top Bar ══════ */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 30,
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(rgba(24,24,48,0.85), transparent)',
            }}>
                {/* Floor indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        fontFamily: '"Saira Condensed", sans-serif',
                        textTransform: 'uppercase',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#3B82F6',
                        letterSpacing: 2,
                    }}>
                        Floor {store.huntStage}
                    </div>
                    <div style={{
                        fontSize: 11,
                        color: '#E1E3FA',
                        fontFamily: '"Kanit", sans-serif',
                    }}>
                        {floorMeta.name}
                    </div>
                </div>

                {/* RPG Stats */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Coins */}
                    <div style={{
                        padding: '4px 12px',
                        borderRadius: 8,
                        background: 'rgba(255, 214, 0, 0.12)',
                        border: '1px solid rgba(255, 214, 0, 0.3)',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#FFD600',
                        fontFamily: '"Saira Condensed", sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}>
                        <span style={{ fontSize: 14 }}>₹</span>
                        {store.coins.toLocaleString()}
                    </div>

                    {/* Level */}
                    <div style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: 'rgba(111, 83, 193, 0.15)',
                        border: '1px solid rgba(111, 83, 193, 0.35)',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#B794F6',
                        fontFamily: '"Saira Condensed", sans-serif',
                    }}>
                        LVL {store.level}
                    </div>

                    <StatPill label="Energy" value={`${Math.round(store.stats.energy * 100)}%`} color={store.stats.energy > 0.5 ? '#20C997' : store.stats.energy > 0.25 ? '#FD7E14' : '#D63384'} />
                    <StatPill label="Confidence" value={`${store.stats.confidence}`} color="#3B82F6" />
                </div>
            </div>

            {/* ══════ Progress Bar ══════ */}
            <div style={{
                position: 'absolute',
                top: 48,
                left: 20,
                right: 20,
                zIndex: 25,
            }}>
                <div style={{
                    height: 3,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        background: 'linear-gradient(90deg, #3B82F6, #6F53C1)',
                        borderRadius: 2,
                        transition: 'width 0.5s ease',
                    }} />
                </div>
                <div style={{
                    fontSize: 9,
                    color: '#888',
                    fontFamily: '"Kanit", sans-serif',
                    marginTop: 2,
                    textAlign: 'right',
                }}>
                    {progressPercent}% to next floor
                </div>
            </div>

            {/* ══════ HP & XP Bars (right side) ══════ */}
            <div style={{
                position: 'absolute',
                top: 62,
                right: 165,
                zIndex: 30,
                width: 140,
            }}>
                {/* HP Bar */}
                <div style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 9, color: '#EF4444', fontFamily: '"Saira Condensed", sans-serif', fontWeight: 700, letterSpacing: 1 }}>HP</span>
                        <span style={{ fontSize: 9, color: '#888', fontFamily: '"Kanit", sans-serif' }}>{store.hp}/{store.maxHp}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${(store.hp / store.maxHp) * 100}%`,
                            background: store.hp > store.maxHp * 0.5 ? '#20C997' : store.hp > store.maxHp * 0.25 ? '#FD7E14' : '#EF4444',
                            borderRadius: 3,
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                </div>

                {/* XP Bar */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 9, color: '#6F53C1', fontFamily: '"Saira Condensed", sans-serif', fontWeight: 700, letterSpacing: 1 }}>XP</span>
                        <span style={{ fontSize: 9, color: '#888', fontFamily: '"Kanit", sans-serif' }}>{store.xp}/{store.xpToNextLevel}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${(store.xp / store.xpToNextLevel) * 100}%`,
                            background: 'linear-gradient(90deg, #6F53C1, #3B82F6)',
                            borderRadius: 3,
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                </div>
            </div>

            {/* ══════ Minimap ══════ */}
            <div style={{
                position: 'absolute',
                top: 65,
                right: 15,
                zIndex: 30,
                borderRadius: '50%',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.5), inset 0 0 20px rgba(59,130,246,0.1)',
            }}>
                <canvas
                    ref={minimapCanvasRef}
                    width={140}
                    height={140}
                    style={{ display: 'block' }}
                />
            </div>

            {/* ══════ Quest Tracker ══════ */}
            {activeQuestText && !isDialogueActive && !combatEnemy && !miniGame && !bossDistrict && (
                <div style={{
                    position: 'absolute',
                    top: 110,
                    left: 15,
                    zIndex: 25,
                    background: 'rgba(24, 24, 48, 0.85)',
                    border: '1px solid rgba(215, 239, 63, 0.3)',
                    borderRadius: 10,
                    padding: '8px 14px',
                    maxWidth: 220,
                }}>
                    <div style={{
                        fontSize: 9,
                        color: '#D7EF3F',
                        fontFamily: '"Saira Condensed", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                        marginBottom: 4,
                    }}>
                        ACTIVE QUEST
                    </div>
                    <div style={{
                        fontSize: 12,
                        color: '#E1E3FA',
                        fontFamily: '"Kanit", sans-serif',
                        fontWeight: 600,
                        marginBottom: 2,
                    }}>
                        {activeQuestText.title}
                    </div>
                    <div style={{
                        fontSize: 10,
                        color: '#9CA3AF',
                        fontFamily: '"Kanit", sans-serif',
                    }}>
                        {activeQuestText.objective}
                    </div>
                </div>
            )}

            {/* ══════ Quest Complete Popup ══════ */}
            {questCompletePopup && (
                <div style={{
                    position: 'absolute',
                    top: '25%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 45,
                    background: 'rgba(24, 24, 48, 0.95)',
                    border: '2px solid #D7EF3F',
                    borderRadius: 14,
                    padding: '16px 30px',
                    textAlign: 'center',
                    animation: 'fadeInOverlay 0.3s ease',
                    pointerEvents: 'none',
                }}>
                    <div style={{ fontSize: 14, color: '#D7EF3F', fontFamily: '"Saira Condensed", sans-serif', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 4 }}>
                        QUEST COMPLETE
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#E1E3FA', fontFamily: '"Saira Condensed", sans-serif', marginBottom: 8 }}>
                        {questCompletePopup.title}
                    </div>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                        <span style={{ color: '#FFD600', fontSize: 14, fontWeight: 700, fontFamily: '"Kanit", sans-serif' }}>+₹{questCompletePopup.coins}</span>
                        <span style={{ color: '#3B82F6', fontSize: 14, fontWeight: 700, fontFamily: '"Kanit", sans-serif' }}>+{questCompletePopup.xp} XP</span>
                    </div>
                </div>
            )}

            {/* ══════ Explore hint (when walking around) ══════ */}
            {dialoguePhase === 'exploring' && (
                <div style={{
                    position: 'absolute',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 15,
                    color: '#888',
                    fontSize: 12,
                    fontFamily: '"Kanit", sans-serif',
                    textAlign: 'center',
                    pointerEvents: 'none',
                }}>
                    <span style={{ color: '#FFD600' }}>WASD</span> to move &nbsp;|&nbsp; Walk to <span style={{ color: '#3B82F6' }}>glowing objects</span> &nbsp;|&nbsp; Press <span style={{ color: '#FFD600' }}>E</span> to interact
                </div>
            )}

            {/* ══════ Stat Floaters ══════ */}
            {statFloaters.map(f => (
                <div key={f.id} style={{
                    position: 'absolute',
                    top: '35%',
                    left: `${f.x}%`,
                    transform: 'translateX(-50%)',
                    color: f.color,
                    fontSize: 16,
                    fontWeight: 'bold',
                    fontFamily: '"Saira Condensed", sans-serif',
                    textTransform: 'uppercase',
                    textShadow: `0 0 10px ${f.color}66`,
                    animation: 'floatUp 2s ease-out forwards',
                    pointerEvents: 'none',
                    zIndex: 40,
                }}>
                    {f.text}
                </div>
            ))}

            {/* ══════ Stage Transition Overlay ══════ */}
            {showStageTransition && STAGE_CONTENT[transitionStage] && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 50,
                    background: 'rgba(24, 24, 48, 0.97)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 40,
                    animation: 'fadeInOverlay 0.5s ease',
                    overflowY: 'auto',
                }}>
                    <div style={{ maxWidth: 650, width: '100%', textAlign: 'center' }}>
                        <div style={{
                            fontFamily: '"Saira Condensed", sans-serif',
                            fontSize: 14,
                            letterSpacing: 4,
                            color: '#3B82F6',
                            textTransform: 'uppercase',
                            marginBottom: 8,
                        }}>
                            Floor Complete
                        </div>
                        <h2 style={{
                            fontFamily: '"Saira Condensed", sans-serif',
                            fontSize: 42,
                            fontWeight: 800,
                            color: '#D7EF3F',
                            textTransform: 'uppercase',
                            letterSpacing: 3,
                            margin: '0 0 8px 0',
                        }}>
                            {STAGE_CONTENT[transitionStage].floorName}
                        </h2>
                        <div style={{
                            fontFamily: '"Kanit", sans-serif',
                            fontSize: 14,
                            color: '#E1E3FA',
                            marginBottom: 24,
                        }}>
                            {STAGE_CONTENT[transitionStage].subtitle}
                        </div>

                        {/* Tony's summary */}
                        <div style={{
                            background: 'rgba(59, 130, 246, 0.08)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: 12,
                            padding: '16px 20px',
                            marginBottom: 24,
                            textAlign: 'left',
                        }}>
                            <div style={{
                                fontSize: 11,
                                color: '#3B82F6',
                                fontFamily: '"Saira Condensed", sans-serif',
                                textTransform: 'uppercase',
                                letterSpacing: 2,
                                marginBottom: 8,
                            }}>
                                Tony Says
                            </div>
                            <div style={{
                                fontSize: 14,
                                color: '#ccc',
                                fontFamily: '"Kanit", sans-serif',
                                lineHeight: 1.7,
                            }}>
                                {STAGE_CONTENT[transitionStage].tonyDialogue}
                            </div>
                        </div>

                        {/* Key Takeaways */}
                        <div style={{ textAlign: 'left', marginBottom: 24 }}>
                            <div style={{
                                fontSize: 11,
                                color: '#D7EF3F',
                                fontFamily: '"Saira Condensed", sans-serif',
                                textTransform: 'uppercase',
                                letterSpacing: 2,
                                marginBottom: 10,
                            }}>
                                Key Takeaways
                            </div>
                            {STAGE_CONTENT[transitionStage].takeaways.map((t, i) => (
                                <div key={i} style={{
                                    fontSize: 12,
                                    color: '#aaa',
                                    fontFamily: '"Kanit", sans-serif',
                                    padding: '6px 0',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    gap: 8,
                                }}>
                                    <span style={{ color: '#20C997', flexShrink: 0 }}>✓</span>
                                    {t}
                                </div>
                            ))}
                        </div>

                        {/* Checklist */}
                        <div style={{ textAlign: 'left', marginBottom: 28 }}>
                            <div style={{
                                fontSize: 11,
                                color: '#FD7E14',
                                fontFamily: '"Saira Condensed", sans-serif',
                                textTransform: 'uppercase',
                                letterSpacing: 2,
                                marginBottom: 10,
                            }}>
                                Real-World Checklist
                            </div>
                            {STAGE_CONTENT[transitionStage].checklist.map((c, i) => (
                                <div key={i} style={{
                                    fontSize: 12,
                                    color: '#aaa',
                                    fontFamily: '"Kanit", sans-serif',
                                    padding: '6px 0',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    gap: 8,
                                }}>
                                    <span style={{ color: '#FD7E14', flexShrink: 0 }}>□</span>
                                    {c}
                                </div>
                            ))}
                        </div>

                        {/* Next floor teaser */}
                        <div style={{
                            fontSize: 12,
                            color: '#6F53C1',
                            fontFamily: '"Kanit", sans-serif',
                            marginBottom: 20,
                            fontStyle: 'italic',
                        }}>
                            {STAGE_CONTENT[transitionStage].nextFloorTeaser}
                        </div>

                        <button
                            onClick={closeStageTransition}
                            style={{
                                background: 'linear-gradient(135deg, #3B82F6, #6F53C1)',
                                border: 'none',
                                color: '#fff',
                                padding: '14px 40px',
                                borderRadius: 12,
                                cursor: 'pointer',
                                fontSize: 15,
                                fontWeight: 'bold',
                                fontFamily: '"Saira Condensed", sans-serif',
                                textTransform: 'uppercase',
                                letterSpacing: 2,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            Ascend to Next Floor →
                        </button>
                    </div>
                </div>
            )}

            {/* ══════ Main Dialogue Box ══════ */}
            {isDialogueActive && dialoguePhase !== 'stage_transition' && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    pointerEvents: 'auto',
                }}>
                    <div style={{
                        maxWidth: 750,
                        margin: '0 auto 20px auto',
                        background: 'rgba(24, 24, 48, 0.95)',
                        borderRadius: 16,
                        border: '2px solid #3B82F6',
                        padding: '18px 24px',
                        color: 'white',
                        fontFamily: '"Kanit", sans-serif',
                        boxShadow: '0 -10px 40px rgba(59, 130, 246, 0.15)',
                        backdropFilter: 'blur(10px)',
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 12,
                        }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #3B82F6, #6F53C1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: '#fff',
                                flexShrink: 0,
                                border: '2px solid #3B82F6',
                            }}>
                                T
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                    color: '#3B82F6',
                                    fontFamily: '"Saira Condensed", sans-serif',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}>
                                    Tony Sharma
                                </div>
                                <div style={{ fontSize: 10, color: '#888' }}>
                                    {dialoguePhase === 'lesson' ? 'Teaching Mode' : dialoguePhase === 'tip' ? 'Pro Tip' : 'Career Mentor'}
                                </div>
                            </div>
                            {currentScenario && (
                                <div style={{
                                    padding: '4px 12px',
                                    borderRadius: 12,
                                    background: dialoguePhase === 'lesson'
                                        ? 'rgba(111, 83, 193, 0.15)'
                                        : dialoguePhase === 'tip'
                                            ? 'rgba(253, 126, 20, 0.15)'
                                            : 'rgba(59, 130, 246, 0.12)',
                                    border: `1px solid ${dialoguePhase === 'lesson'
                                        ? 'rgba(111, 83, 193, 0.3)'
                                        : dialoguePhase === 'tip'
                                            ? 'rgba(253, 126, 20, 0.3)'
                                            : 'rgba(59, 130, 246, 0.3)'}`,
                                    fontSize: 11,
                                    color: dialoguePhase === 'lesson' ? '#B794F6' : dialoguePhase === 'tip' ? '#FD7E14' : '#D7EF3F',
                                }}>
                                    {dialoguePhase === 'lesson'
                                        ? `Lesson ${lessonIndex + 1}/${lessons?.lesson.length || 0}`
                                        : dialoguePhase === 'tip'
                                            ? 'Pro Tip'
                                            : currentScenario.title}
                                </div>
                            )}
                        </div>

                        {/* Text content */}
                        {(dialoguePhase === 'trigger' || dialoguePhase === 'lesson' || dialoguePhase === 'outcome') && (
                            <div
                                style={{
                                    fontSize: 14,
                                    lineHeight: 1.7,
                                    color: '#ddd',
                                    minHeight: 44,
                                    cursor: isTyping ? 'pointer' : 'default',
                                    marginBottom: dialoguePhase === 'outcome' ? 0 : 4,
                                }}
                                onClick={isTyping ? () => skipTyping(currentFullText) : undefined}
                            >
                                {displayedText}
                                {isTyping && <span style={{ animation: 'blink 0.5s infinite', color: '#D7EF3F' }}>|</span>}
                            </div>
                        )}

                        {/* Tip card */}
                        {dialoguePhase === 'tip' && (
                            <div style={{
                                background: 'rgba(253, 126, 20, 0.08)',
                                border: '1px solid rgba(253, 126, 20, 0.3)',
                                borderRadius: 10,
                                padding: '12px 16px',
                                marginBottom: 4,
                            }}>
                                <div
                                    style={{
                                        fontSize: 13,
                                        lineHeight: 1.7,
                                        color: '#eee',
                                        cursor: isTyping ? 'pointer' : 'default',
                                    }}
                                    onClick={isTyping ? () => skipTyping(currentFullText) : undefined}
                                >
                                    {displayedText}
                                    {isTyping && <span style={{ animation: 'blink 0.5s infinite', color: '#FD7E14' }}>|</span>}
                                </div>
                            </div>
                        )}

                        {/* Continue button */}
                        {!isTyping && (dialoguePhase === 'trigger' || dialoguePhase === 'lesson' || dialoguePhase === 'outcome' || dialoguePhase === 'tip') && (
                            <button
                                onClick={advanceDialogue}
                                style={{
                                    marginTop: 12,
                                    background: 'rgba(59, 130, 246, 0.12)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    color: '#3B82F6',
                                    padding: '10px 24px',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    fontFamily: '"Kanit", sans-serif',
                                    width: '100%',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                    e.currentTarget.style.borderColor = '#3B82F6';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.12)';
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                                }}
                            >
                                {dialoguePhase === 'trigger'
                                    ? (lessons ? 'Listen to Tony →' : 'Make your choice →')
                                    : dialoguePhase === 'lesson'
                                        ? (lessonIndex < (lessons?.lesson.length || 0) - 1 ? 'Next →' : 'Got it — show me the choices →')
                                        : 'Continue →'}
                            </button>
                        )}

                        {/* Choice buttons */}
                        {dialoguePhase === 'choices' && currentScenario && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{
                                    fontSize: 11,
                                    color: '#888',
                                    fontFamily: '"Saira Condensed", sans-serif',
                                    textTransform: 'uppercase',
                                    letterSpacing: 2,
                                    marginBottom: 4,
                                }}>
                                    What do you do?
                                </div>
                                {currentScenario.choices.map((choice) => (
                                    <button
                                        key={choice.id}
                                        onClick={() => handleChoice(choice)}
                                        style={{
                                            background: 'rgba(59, 130, 246, 0.08)',
                                            border: '1px solid rgba(59, 130, 246, 0.25)',
                                            color: '#fff',
                                            padding: '11px 16px',
                                            borderRadius: 10,
                                            cursor: 'pointer',
                                            fontSize: 13,
                                            textAlign: 'left',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                            e.currentTarget.style.borderColor = '#3B82F6';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.25)';
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#D7EF3F', marginBottom: 2 }}>{choice.text}</div>
                                            <div style={{ fontSize: 10, color: '#666', display: 'flex', gap: 8 }}>
                                                {choice.energyCost ? <span>⚡{choice.energyCost}</span> : null}
                                                {choice.timeCost ? <span>⏱ {choice.timeCost}mo</span> : null}
                                            </div>
                                        </div>
                                        <span style={{ color: '#3B82F6', fontSize: 16, marginLeft: 12 }}>→</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Loading state */}
            {dialoguePhase === 'loading' && (
                <div style={{
                    position: 'absolute',
                    bottom: 40,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 20,
                    color: '#666',
                    fontSize: 12,
                    fontFamily: '"Kanit", sans-serif',
                }}>
                    {!sceneReady ? 'Building room...' : 'Loading scenario...'}
                </div>
            )}

            {/* ══════ Combat Overlay ══════ */}
            {combatEnemy && (
                <CombatOverlay
                    enemy={combatEnemy}
                    playerHp={store.hp}
                    playerMaxHp={store.maxHp}
                    onVictory={handleCombatVictory}
                    onDefeat={handleCombatDefeat}
                    onClose={handleCombatClose}
                />
            )}

            {/* ══════ Mini-Game Overlay ══════ */}
            {miniGame && (
                <MiniGameOverlay
                    mode={miniGame.mode}
                    difficulty={miniGame.difficulty}
                    stationName={miniGame.stationName}
                    onComplete={handleMiniGameComplete}
                    onClose={handleMiniGameClose}
                />
            )}

            {/* ══════ Boss Interview Overlay ══════ */}
            {bossDistrict !== null && (
                <BossInterview
                    district={bossDistrict}
                    playerHp={store.hp}
                    playerMaxHp={store.maxHp}
                    playerLevel={store.level}
                    onVictory={handleBossVictory}
                    onDefeat={handleBossDefeat}
                    onClose={handleBossClose}
                />
            )}

            {/* ══════ Enemy Warning ══════ */}
            {enemyWarning && !combatEnemy && (
                <div style={{
                    position: 'absolute',
                    top: '12%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 35,
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: 10,
                    padding: '8px 20px',
                    animation: 'fadeInOut 2s ease',
                    pointerEvents: 'none',
                }}>
                    <span style={{
                        fontSize: 13,
                        color: '#EF4444',
                        fontFamily: '"Saira Condensed", sans-serif',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                    }}>
                        ⚠ Scam Recruiter Nearby!
                    </span>
                </div>
            )}

            {/* ══════ Coin Popup ══════ */}
            {showCoinPopup && (
                <div key={showCoinPopup.id} style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 45,
                    fontSize: 28,
                    fontWeight: 900,
                    color: '#FFD600',
                    fontFamily: '"Saira Condensed", sans-serif',
                    textShadow: '0 0 20px rgba(255, 214, 0, 0.5)',
                    animation: 'floatUp 2s ease-out forwards',
                    pointerEvents: 'none',
                }}>
                    +₹{showCoinPopup.amount}
                </div>
            )}

            {/* Animations */}
            <style>{`
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
                @keyframes floatUp {
                    0% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-80px); }
                }
                @keyframes fadeInOverlay {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                @keyframes fadeInOut {
                    0% { opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{
            padding: '4px 10px',
            borderRadius: 8,
            background: `${color}15`,
            border: `1px solid ${color}40`,
            fontSize: 10,
            fontFamily: '"Kanit", sans-serif',
            display: 'flex',
            gap: 4,
            alignItems: 'center',
        }}>
            <span style={{ color: '#888' }}>{label}</span>
            <span style={{ color, fontWeight: 600 }}>{value}</span>
        </div>
    );
}
