'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { BabylonCanvas, type SceneReadyArgs } from './BabylonCanvas';
import { useGameStore } from '@/store/gameStore';
import { applyChoice } from '@/engine/reducer';
import { pickNextHuntScenario, checkStageAdvance } from '@/engine/JobHuntResolver';
import { SCENARIO_LESSONS } from '@/engine/chapter3_job_hunt/scenario_lessons';
import { STAGE_CONTENT, FLOOR_META } from '@/engine/chapter3_job_hunt/stage_content';
import type { Scenario, Choice, GameState } from '@/engine/types';

/**
 * JobHuntRoom — "The Climb"
 *
 * 3D room progression system for the job hunt module.
 * Phase 1: Floor 0 (The Grind) — studio apartment with full learning flow.
 */

// Import scenario data
import huntScenariosData from '@/engine/chapter3_job_hunt/job_hunt_scenarios.json';
const HUNT_SCENARIOS = huntScenariosData as Scenario[];

type DialoguePhase =
    | 'trigger'      // Scenario intro — phone buzz / email
    | 'lesson'       // Tony's teaching slides (1-4 slides)
    | 'choices'      // Player picks a choice
    | 'outcome'      // Stats update + Tony's reaction
    | 'tip'          // Real-world tip card
    | 'next'         // Waiting to load next scenario
    | 'stage_transition' // Floor transition overlay
    | 'idle';        // No scenario loaded yet

interface StatFloater {
    id: number;
    text: string;
    color: string;
    x: number;
}

export default function JobHuntRoom() {
    const store = useGameStore();
    const sceneRef = useRef<any>(null);

    // Scenario state
    const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
    const [dialoguePhase, setDialoguePhase] = useState<DialoguePhase>('idle');
    const [lessonIndex, setLessonIndex] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);

    // UI state
    const [isTyping, setIsTyping] = useState(false);
    const [displayedText, setDisplayedText] = useState('');
    const [fadeIn, setFadeIn] = useState(false);
    const [statFloaters, setStatFloaters] = useState<StatFloater[]>([]);
    const [floaterCounter, setFloaterCounter] = useState(0);
    const [showStageTransition, setShowStageTransition] = useState(false);
    const [transitionStage, setTransitionStage] = useState(0);

    // Track previous stage for transitions
    const prevStageRef = useRef(store.huntStage);

    // Fade in on mount
    useEffect(() => {
        const t = setTimeout(() => setFadeIn(true), 100);
        return () => clearTimeout(t);
    }, []);

    // Load first scenario on mount
    useEffect(() => {
        if (dialoguePhase === 'idle' && !currentScenario) {
            // Safety: ensure huntStage is valid for Floor 0 scenarios on first entry
            const state = useGameStore.getState();
            if (state.history.length === 0 || !state.history.some(h => HUNT_SCENARIOS.some(s => s.id === h))) {
                // Player hasn't played any hunt scenarios yet — reset to stage 0
                useGameStore.setState({ huntStage: 0, huntProgress: 0 });
            }
            loadNextScenario();
        }
    }, []);

    // Typewriter effect
    useEffect(() => {
        if (!displayedText && !isTyping) return;
        // Reset is handled by the caller
    }, []);

    const typeText = (text: string, speed = 22) => {
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
    };

    const skipTyping = (fullText: string) => {
        setIsTyping(false);
        setDisplayedText(fullText);
    };

    // Get current full text based on dialogue phase
    const getCurrentFullText = (): string => {
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
    };

    // Start typing whenever phase or lesson index changes
    useEffect(() => {
        const text = getCurrentFullText();
        if (text) {
            const cleanup = typeText(text);
            return cleanup;
        }
    }, [dialoguePhase, lessonIndex, currentScenario?.id, selectedChoice?.id]);

    // Load next scenario from resolver
    const loadNextScenario = () => {
        const state = useGameStore.getState();
        const track = state.role || 'analyst';

        const { scenario, updates } = pickNextHuntScenario(
            HUNT_SCENARIOS,
            state,
            track
        );

        if (scenario) {
            // Apply resolver updates (cooldowns, recent tracking)
            useGameStore.setState(updates);

            setCurrentScenario(scenario);
            setSelectedChoice(null);
            setLessonIndex(0);
            setDialoguePhase('trigger');
        } else {
            // No scenarios available — end game or show fallback
            useGameStore.setState({ uiPhase: 'end' });
        }
    };

    // Handle choice selection
    const handleChoice = (choice: Choice) => {
        if (!currentScenario) return;

        setSelectedChoice(choice);

        // Apply choice to game state
        const state = useGameStore.getState();
        const { newState, notifications } = applyChoice(state, choice);

        // Update store
        useGameStore.setState({
            ...newState,
            notifications: [...state.notifications, ...notifications],
            history: [...state.history, currentScenario.id],
        });

        // Show stat floaters
        showStatChanges(choice, state);

        // Check for stage advance
        const stageAdvance = checkStageAdvance(newState);
        if (stageAdvance && newState.huntStage !== prevStageRef.current) {
            // Stage changed — show transition after outcome
            setTransitionStage(prevStageRef.current);
            prevStageRef.current = newState.huntStage;
        }

        // Move to outcome phase
        setDialoguePhase('outcome');
    };

    // Show floating stat changes
    const showStatChanges = (choice: Choice, prevState: GameState) => {
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
            const prog = choice.huntProgress;
            newFloaters.push({
                id: counter++,
                text: `${prog > 0 ? '+' : ''}${prog}% Progress`,
                color: prog > 0 ? '#3B82F6' : '#D63384',
                x: 50,
            });
        }

        setFloaterCounter(counter);
        setStatFloaters(prev => [...prev, ...newFloaters]);

        // Remove floaters after animation
        setTimeout(() => {
            setStatFloaters(prev => prev.filter(f => !newFloaters.find(nf => nf.id === f.id)));
        }, 2000);
    };

    // Advance dialogue flow
    const advanceDialogue = () => {
        if (!currentScenario) return;
        const lessons = SCENARIO_LESSONS[currentScenario.id];

        switch (dialoguePhase) {
            case 'trigger': {
                // Check if lessons exist
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
            default:
                break;
        }
    };

    // After scenario completes, check for stage transition or load next
    const handlePostScenario = () => {
        const state = useGameStore.getState();

        // Check if stage advanced
        if (transitionStage < state.huntStage && STAGE_CONTENT[transitionStage]) {
            setShowStageTransition(true);
            setDialoguePhase('stage_transition');
        } else {
            // Check for game end
            if (state.flags.has_job || state.flags.has_job_startup) {
                useGameStore.setState({ uiPhase: 'end' });
                return;
            }
            setDialoguePhase('next');
            setTimeout(() => loadNextScenario(), 500);
        }
    };

    // Close stage transition and load next scenario
    const closeStageTransition = () => {
        setShowStageTransition(false);
        setTransitionStage(useGameStore.getState().huntStage);
        setDialoguePhase('next');
        setTimeout(() => loadNextScenario(), 500);
    };

    // ═══════════════════════════════════
    // BABYLON.JS 3D SCENE
    // ═══════════════════════════════════

    const handleSceneReady = useCallback(async ({ scene, engine, canvas }: SceneReadyArgs) => {
        sceneRef.current = scene;
        const BABYLON = await import('@babylonjs/core');

        // === SCENE SETTINGS ===
        scene.clearColor = new BABYLON.Color4(0.06, 0.05, 0.1, 1);

        // === CAMERA — Seated in small room ===
        const camera = new BABYLON.FreeCamera(
            'cam',
            new BABYLON.Vector3(4, 2.2, 6.5),
            scene
        );
        camera.setTarget(new BABYLON.Vector3(4, 1.8, 0));
        camera.fov = 0.95;
        // Static camera — no controls

        // === LIGHTING — dim, single bulb feel ===
        const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
        ambient.intensity = 0.5;
        ambient.diffuse = new BABYLON.Color3(1, 0.9, 0.75);
        ambient.groundColor = new BABYLON.Color3(0.2, 0.18, 0.15);

        const bulb = new BABYLON.PointLight('bulb', new BABYLON.Vector3(4, 3.5, 3), scene);
        bulb.intensity = 1.2;
        bulb.diffuse = new BABYLON.Color3(1, 0.88, 0.7);
        bulb.range = 15;

        // Laptop screen glow
        const screenLight = new BABYLON.PointLight('screenLight', new BABYLON.Vector3(4, 1.7, 2.2), scene);
        screenLight.intensity = 0.4;
        screenLight.diffuse = new BABYLON.Color3(0.6, 0.7, 1);
        screenLight.range = 5;

        // === HELPER ===
        const box = (name: string, w: number, h: number, d: number, color: string, px: number, py: number, pz: number, emissive?: string) => {
            const mesh = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
            const mat = new BABYLON.StandardMaterial(name + '_mat', scene);
            mat.diffuseColor = BABYLON.Color3.FromHexString(color);
            if (emissive) mat.emissiveColor = BABYLON.Color3.FromHexString(emissive).scale(0.25);
            mat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
            mesh.material = mat;
            mesh.position = new BABYLON.Vector3(px, py, pz);
            return mesh;
        };

        // ═══════════════════════════════════
        // FLOOR 0 — THE GRIND (Studio Apartment)
        // Small, cramped, single bulb, folding table, cardboard boxes
        // ═══════════════════════════════════

        // Floor — cheap linoleum/tile
        const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: 9, height: 9 }, scene);
        const floorMat = new BABYLON.StandardMaterial('floor_mat', scene);
        floorMat.diffuseColor = BABYLON.Color3.FromHexString('#4A4A4A');
        floorMat.specularColor = new BABYLON.Color3(0.02, 0.02, 0.02);
        floor.material = floorMat;
        floor.position = new BABYLON.Vector3(4, 0, 2.5);

        // Walls — dull concrete gray
        box('wall_back', 9, 4, 0.25, '#6B6B6B', 4, 2, -1.3);
        box('wall_left', 0.25, 4, 9, '#636363', -0.4, 2, 2.5);
        box('wall_right', 0.25, 4, 9, '#636363', 8.4, 2, 2.5);

        // Window on back wall — small, blocked by brick wall view
        box('window_glass', 1.8, 1.2, 0.08, '#3A3A4A', 6.5, 2.8, -1.15, '#222244');
        box('wf_t', 2.0, 0.08, 0.12, '#555', 6.5, 3.44, -1.15);
        box('wf_b', 2.0, 0.08, 0.12, '#555', 6.5, 2.16, -1.15);
        box('wf_l', 0.08, 1.2, 0.12, '#555', 5.55, 2.8, -1.15);
        box('wf_r', 0.08, 1.2, 0.12, '#555', 7.45, 2.8, -1.15);
        // Window bars (old apartment feel)
        box('wbar1', 0.04, 1.2, 0.05, '#666', 6.1, 2.8, -1.1);
        box('wbar2', 0.04, 1.2, 0.05, '#666', 6.9, 2.8, -1.1);

        // === FOLDING TABLE (center) ===
        box('table_top', 2.5, 0.06, 1.2, '#8B7355', 4, 1.05, 2.2);
        box('table_leg_l', 0.06, 1.0, 0.06, '#777', 2.85, 0.52, 2.2);
        box('table_leg_r', 0.06, 1.0, 0.06, '#777', 5.15, 0.52, 2.2);
        // Cross brace
        box('table_brace', 2.3, 0.04, 0.04, '#666', 4, 0.3, 2.2);

        // === SCRATCHED LAPTOP on table ===
        box('laptop_base', 0.9, 0.03, 0.6, '#333', 4, 1.09, 2.0);
        box('laptop_screen', 0.85, 0.55, 0.04, '#111', 4, 1.4, 1.68, '#3B82F6');
        // Laptop hinge
        box('laptop_hinge', 0.85, 0.03, 0.04, '#222', 4, 1.1, 1.7);

        // === PHONE on table (Tony's presence — phone screen) ===
        box('phone', 0.2, 0.02, 0.4, '#1A1A2E', 5, 1.1, 2.3, '#3B82F6');
        // Phone screen glow
        box('phone_screen', 0.16, 0.005, 0.32, '#3B82F6', 5, 1.115, 2.3, '#3B82F6');

        // === RAMEN CUP ===
        box('ramen_cup', 0.2, 0.3, 0.2, '#E8D5B0', 3.0, 1.23, 2.4);
        box('ramen_lid', 0.22, 0.02, 0.22, '#C0A878', 3.0, 1.39, 2.4);

        // Notepad with scribbles
        box('notepad', 0.4, 0.015, 0.55, '#FFF8E1', 3.4, 1.08, 1.8);
        box('pen', 0.03, 0.03, 0.3, '#1565C0', 3.55, 1.09, 1.65);

        // === CARDBOARD BOXES (stacked near left wall) ===
        box('box1', 0.8, 0.7, 0.6, '#A0855B', 0.5, 0.35, 0);
        box('box2', 0.65, 0.6, 0.55, '#B89A6A', 0.6, 1.0, 0.1);
        box('box3', 0.7, 0.5, 0.5, '#9B7F55', 0.3, 0.25, 1.2);
        // Box tape strips
        box('tape1', 0.6, 0.03, 0.04, '#C4A86D', 0.5, 0.72, 0);
        box('tape2', 0.5, 0.03, 0.04, '#C4A86D', 0.6, 1.32, 0.1);

        // === CHEAP FOLDING CHAIR ===
        box('chair_seat', 0.55, 0.05, 0.5, '#555', 4, 0.7, 3.5);
        box('chair_back', 0.55, 0.6, 0.05, '#555', 4, 1.05, 3.75);
        box('chair_leg_fl', 0.04, 0.68, 0.04, '#666', 3.73, 0.34, 3.25);
        box('chair_leg_fr', 0.04, 0.68, 0.04, '#666', 4.27, 0.34, 3.25);
        box('chair_leg_bl', 0.04, 0.68, 0.04, '#666', 3.73, 0.34, 3.72);
        box('chair_leg_br', 0.04, 0.68, 0.04, '#666', 4.27, 0.34, 3.72);

        // === SINGLE HANGING BULB ===
        box('bulb_wire', 0.02, 0.8, 0.02, '#333', 4, 3.6, 3);
        box('bulb_body', 0.12, 0.15, 0.12, '#FFFDE7', 4, 3.15, 3, '#FFE082');

        // === WALL DECORATIONS ===
        // Motivational sticky note on wall
        box('sticky1', 0.25, 0.25, 0.02, '#D7EF3F', 2, 2.2, -1.15);
        // Calendar on wall
        box('calendar', 0.5, 0.6, 0.02, '#FFF', 1.5, 2.8, -1.15);
        box('calendar_top', 0.5, 0.08, 0.03, '#D63384', 1.5, 3.12, -1.15);

        // === FLOOR ITEMS ===
        // Old sneakers
        box('shoe1', 0.15, 0.1, 0.35, '#333', 7, 0.05, 1.5);
        box('shoe2', 0.15, 0.1, 0.35, '#333', 7.3, 0.05, 1.6);

        // Water bottle
        box('bottle', 0.1, 0.35, 0.1, '#2196F3', 7.5, 0.18, 3);

        // Extension cord on floor
        box('cord1', 2, 0.02, 0.04, '#222', 5, 0.01, 4.5);
        box('cord2', 0.04, 0.02, 2, '#222', 6, 0.01, 3.5);

        // === SUBTLE AMBIENT ANIMATION ===
        let time = 0;
        scene.onBeforeRenderObservable.add(() => {
            time += 0.015;
            // Bulb flicker
            bulb.intensity = 1.2 + Math.sin(time * 8) * 0.03;
            // Phone screen pulse
            const phoneScreen = scene.getMeshByName('phone_screen');
            if (phoneScreen && phoneScreen.material) {
                const mat = phoneScreen.material as any;
                mat.emissiveColor = BABYLON.Color3.FromHexString('#3B82F6').scale(0.25 + Math.sin(time * 3) * 0.08);
            }
        });

    }, []);

    // ═══════════════════════════════════
    // RENDER
    // ═══════════════════════════════════

    const lessons = currentScenario ? SCENARIO_LESSONS[currentScenario.id] : null;
    const currentFullText = getCurrentFullText();
    const floorMeta = FLOOR_META[store.huntStage] || FLOOR_META[0];
    const progressPercent = Math.min(100, store.huntProgress);

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

            {/* Bottom gradient overlay for readability */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(transparent 60%, rgba(0,0,0,0.3) 82%, rgba(0,0,0,0.65) 100%)',
                pointerEvents: 'none',
            }} />

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

                {/* Stats pills */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <StatPill label="Energy" value={`${Math.round(store.stats.energy * 100)}%`} color={store.stats.energy > 0.5 ? '#20C997' : store.stats.energy > 0.25 ? '#FD7E14' : '#D63384'} />
                    <StatPill label="Savings" value={`₹${store.stats.savings.toLocaleString()}`} color={store.stats.savings > 0 ? '#20C997' : '#D63384'} />
                    <StatPill label="Confidence" value={`${store.stats.confidence}`} color="#3B82F6" />
                    {store.momentumActive && (
                        <div style={{
                            padding: '4px 10px',
                            borderRadius: 8,
                            background: 'rgba(215, 239, 63, 0.15)',
                            border: '1px solid rgba(215, 239, 63, 0.4)',
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#D7EF3F',
                            fontFamily: '"Kanit", sans-serif',
                        }}>
                            🔥 MOMENTUM
                        </div>
                    )}
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
                }}>
                    <div style={{ maxWidth: 650, width: '100%', textAlign: 'center' }}>
                        {/* Floor title */}
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
                        <div style={{
                            textAlign: 'left',
                            marginBottom: 24,
                        }}>
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
                        <div style={{
                            textAlign: 'left',
                            marginBottom: 28,
                        }}>
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

                        {/* Continue button */}
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
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            Ascend to Next Floor →
                        </button>
                    </div>
                </div>
            )}

            {/* ══════ Main Dialogue Box ══════ */}
            {dialoguePhase !== 'idle' && dialoguePhase !== 'next' && dialoguePhase !== 'stage_transition' && (
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
                            {/* Tony avatar circle */}
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

                            {/* Scenario title badge */}
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
                                            ? '💡 Pro Tip'
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

                        {/* Tip — styled as a card */}
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

                        {/* Continue button — for trigger, lesson, outcome, tip */}
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
                                        : dialoguePhase === 'tip'
                                            ? 'Continue →'
                                            : 'Continue →'}
                            </button>
                        )}

                        {/* Choice buttons */}
                        {dialoguePhase === 'choices' && currentScenario && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                            }}>
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
            {dialoguePhase === 'next' && (
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
                    Loading next scenario...
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
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════
// Sub-Components
// ═══════════════════════════════════

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
