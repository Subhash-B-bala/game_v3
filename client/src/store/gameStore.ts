"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { GameState, Scenario, Choice, GameStats, RoleType, AvatarType } from "../engine/types";
import { applyChoice } from "../engine/reducer";
import { getNextScenario } from "../engine/resolver";
import { SCENARIO_POOL } from "../engine/scenarios";

/* ============================================================
   Game Store — Scenario Engine Powered
   ============================================================ */

interface StoreState extends GameState {
    // Actions
    initGame: (name: string, avatar: AvatarType, role?: RoleType) => void;
    loadScenario: (scenarioId: string) => void;
    makeChoice: (choiceId: string) => void;
    nextTurn: () => void;
    resetGame: () => void;

    // UI/Meta State
    uiPhase: "intro" | "setup" | "tony_room" | "briefing" | "game" | "jobhunt" | "roadmap" | "end";
    setUiPhase: (phase: "intro" | "setup" | "tony_room" | "briefing" | "game" | "jobhunt" | "roadmap" | "end") => void;
    isLoading: boolean;
    activeText: string | null; // For typewriter effects?
    updateStats: (stats: Partial<GameStats>) => void;
    setMonths: (months: number) => void;

    // 3D Onboarding State
    onboardingScene: 1 | 2 | 3;
    setOnboardingScene: (scene: 1 | 2 | 3) => void;
    currentNPCDialogue: { npcName: string; text: string } | null;
    setNPCDialogue: (dialogue: { npcName: string; text: string } | null) => void;

    // Voxel World State
    worldPosition: { x: number; y: number; z: number } | null;
    currentZone: string | null;
    currentIndoorMap: string | null;
    worldInteraction: { type: 'npc' | 'door'; id: string; name?: string; role?: string } | null;
    setWorldPosition: (pos: { x: number; y: number; z: number }) => void;
    setCurrentZone: (zone: string | null) => void;
    setCurrentIndoorMap: (map: string | null) => void;
    setWorldInteraction: (interaction: { type: 'npc' | 'door'; id: string; name?: string; role?: string } | null) => void;
    clearWorldInteraction: () => void;

    // Mini-game Specific
    slasherChances: number;
    slasherLastRefill: number | null;
    useSlasherChance: () => boolean;
    getRefilledSlasherChances: () => number;

    // ── RPG Actions (Career Quest) ──
    hp: number;
    maxHp: number;
    coins: number;
    xp: number;
    level: number;
    xpToNextLevel: number;
    enemiesDefeated: number;
    scamsIdentified: number;
    miniGamesCompleted: number;
    bossesDefeated: number;
    activeDistrict: number;

    takeDamage: (amount: number) => void;
    heal: (amount: number) => void;
    addCoins: (amount: number) => void;
    addXP: (amount: number) => void;
    defeatEnemy: () => void;
    identifyScam: () => void;
    completeMiniGame: () => void;
    defeatBoss: () => void;
    unlockDistrict: (district: number) => void;
}

const INITIAL_STATS: GameStats = {
    sql: 0, python: 0, excel: 0, powerbi: 0, cloud: 0, ml: 0,
    communication: 0, leadership: 0, problem_solving: 0, stakeholder_mgmt: 0,
    savings: 15000, salary: 0, burnRatePerMonth: 2000, energy: 1.0, stress: 0.0, network: 0,
    confidence: 50, grit: 50, aggression: 50, stability: 50,
    learningSpeed: 100, startupBias: 0, burnoutRisk: 100,
    interviewPerformance: 0,
    reputation: 0, ethics: 0.5,
    strategy: 0, intelligence: 0
};

const INITIAL_STATE: GameState & { uiPhase: "intro" | "setup" | "tony_room" | "game" | "jobhunt" | "roadmap" | "end"; onboardingScene: 1 | 2 | 3; currentNPCDialogue: { npcName: string; text: string } | null } = {
    characterName: "Player",
    characterAvatar: "fresher",
    role: null,
    months: 0,
    huntStage: 0,
    huntProgress: 0,
    stats: INITIAL_STATS,
    flags: {},
    history: [],
    currentScenarioId: null,
    notifications: [],
    recentScenarioIds: [],
    recentTags: [],
    cooldowns: {},
    momentumCounter: 0,
    momentumActive: false,
    achievements: {},
    achievementCount: 0,
    jobOutcome: null,
    uiPhase: "intro" as const, // Default start
    onboardingScene: 1, // Start at Scene 1 (Reception)
    currentNPCDialogue: null,
    slasherChances: 3,
    slasherLastRefill: null,

    // RPG Stats
    hp: 100,
    maxHp: 100,
    coins: 0,
    xp: 0,
    level: 1,
    xpToNextLevel: 100,
    enemiesDefeated: 0,
    scamsIdentified: 0,
    miniGamesCompleted: 0,
    bossesDefeated: 0,
    activeDistrict: 0,
};

const ONBOARDING_SEQUENCE = [
    'setup_background',
    'setup_financial',
    'setup_role',
    'setup_confidence',
    'setup_risk',
    'setup_target',
    'setup_pressure'
];

// Exported for compatibility with legacy components (TaskBoard, VideoMeeting)
export const SCENE_FLOW: any[] = [];

export const useGameStore = create<StoreState>()(
    persist(
        (set, get) => ({
            ...INITIAL_STATE,
            isLoading: false,
            activeText: null,
            updateStats: (newStats: Partial<GameStats>) => set((state) => ({
                stats: { ...state.stats, ...newStats }
            })),
            setMonths: (months: number) => set({ months }),
            setUiPhase: (phase) => set({ uiPhase: phase }),

            // 3D Onboarding actions
            setOnboardingScene: (scene) => set({ onboardingScene: scene }),
            setNPCDialogue: (dialogue) => set({ currentNPCDialogue: dialogue }),

            // Voxel World actions
            worldPosition: null,
            currentZone: null,
            currentIndoorMap: null,
            worldInteraction: null,
            setWorldPosition: (pos) => set({ worldPosition: pos }),
            setCurrentZone: (zone) => set({ currentZone: zone }),
            setCurrentIndoorMap: (map) => set({ currentIndoorMap: map }),
            setWorldInteraction: (interaction) => set({ worldInteraction: interaction }),
            clearWorldInteraction: () => set({ worldInteraction: null }),

            initGame: (name, avatar, role) => {
                set({
                    ...INITIAL_STATE,
                    characterName: name,
                    characterAvatar: avatar,
                    role: role || null,
                    flags: { "intro_complete": true },
                    uiPhase: "tony_room",
                    currentScenarioId: ONBOARDING_SEQUENCE[0], // Start with first onboarding
                    // Explicit new references for safety
                    recentScenarioIds: [],
                    recentTags: [],
                    cooldowns: {},
                    momentumCounter: 0,
                    momentumActive: false,
                });
            },

            loadScenario: (scenarioId) => {
                set({ currentScenarioId: scenarioId });
            },

            makeChoice: (choiceId) => {
                const state = get();
                const scenario = SCENARIO_POOL.find(s => s.id === state.currentScenarioId);
                if (!scenario) return;

                const choice = scenario.choices.find(c => c.id === choiceId);
                if (!choice) return;

                // 1. Apply Reducer
                const { newState, notifications } = applyChoice(state, choice);

                // 2. Queue Notifications
                const newNotifications = [...state.notifications, ...notifications];

                // 3. Update State
                set({
                    ...newState,
                    notifications: newNotifications,
                    history: [...state.history, scenario.id]
                });

                // 4. Handle Progression
                const currentIdx = ONBOARDING_SEQUENCE.indexOf(scenario.id);

                // Scene transition mapping for 3D onboarding
                const SCENE_TRANSITIONS: Record<string, 2 | 3 | null> = {
                    'setup_financial': 2,    // After Q2 → Scene 2
                    'setup_risk': 3,         // After Q5 → Scene 3
                    'setup_pressure': null   // After Q7 → Exit to Roadmap
                };

                setTimeout(() => {
                    if (currentIdx !== -1 && currentIdx < ONBOARDING_SEQUENCE.length - 1) {
                        // Still in onboarding sequence -> pick next fixed one
                        get().loadScenario(ONBOARDING_SEQUENCE[currentIdx + 1]);

                        // Check if we need to transition 3D scenes
                        const nextScene = SCENE_TRANSITIONS[scenario.id];
                        if (nextScene) {
                            set({ onboardingScene: nextScene });
                        }
                    } else if (currentIdx === ONBOARDING_SEQUENCE.length - 1) {
                        // Just finished onboarding -> Move to Roadmap phase
                        set({ uiPhase: "roadmap", currentScenarioId: null });
                    } else {
                        // Sequence finished or not in onboarding -> use resolver for nextTurn
                        get().nextTurn();
                    }
                }, 300);
            },

            nextTurn: () => {
                const state = get();
                const next = getNextScenario(state, SCENARIO_POOL);

                if (next) {
                    set({ currentScenarioId: next.id });
                } else if (state.flags.setup_complete) {
                    // Setup finished but no next scenario in pool? Fallback to Job Hunt
                    set({ uiPhase: "jobhunt" });
                } else {
                    // No scenario found -> End Game
                    set({ uiPhase: "end" });
                }
            },

            resetGame: () => {
                set({
                    ...INITIAL_STATE,
                    recentScenarioIds: [],
                    recentTags: [],
                    cooldowns: {}
                });
                // Clean URL params if any
                if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', '/');
                }
            },

            // ── RPG State ──
            hp: 100,
            maxHp: 100,
            coins: 0,
            xp: 0,
            level: 1,
            xpToNextLevel: 100,
            enemiesDefeated: 0,
            scamsIdentified: 0,
            miniGamesCompleted: 0,
            bossesDefeated: 0,
            activeDistrict: 0,

            takeDamage: (amount: number) => set((state) => ({
                hp: Math.max(0, state.hp - amount),
            })),

            heal: (amount: number) => set((state) => ({
                hp: Math.min(state.maxHp, state.hp + amount),
            })),

            addCoins: (amount: number) => set((state) => ({
                coins: state.coins + amount,
            })),

            addXP: (amount: number) => {
                const state = get();
                let newXP = state.xp + amount;
                let newLevel = state.level;
                let newXpToNext = state.xpToNextLevel;
                let newMaxHp = state.maxHp;
                let newHp = state.hp;

                // Level up loop
                while (newXP >= newXpToNext) {
                    newXP -= newXpToNext;
                    newLevel++;
                    newXpToNext = Math.floor(100 * Math.pow(1.3, newLevel - 1)); // Increasing XP per level
                    newMaxHp = 100 + (newLevel - 1) * 10; // +10 HP per level
                    newHp = newMaxHp; // Full heal on level up
                }

                set({
                    xp: newXP,
                    level: newLevel,
                    xpToNextLevel: newXpToNext,
                    maxHp: newMaxHp,
                    hp: newHp,
                });
            },

            defeatEnemy: () => set((state) => ({
                enemiesDefeated: state.enemiesDefeated + 1,
            })),

            identifyScam: () => set((state) => ({
                scamsIdentified: state.scamsIdentified + 1,
            })),

            completeMiniGame: () => set((state) => ({
                miniGamesCompleted: state.miniGamesCompleted + 1,
            })),

            defeatBoss: () => set((state) => ({
                bossesDefeated: state.bossesDefeated + 1,
            })),

            unlockDistrict: (district: number) => set((state) => ({
                activeDistrict: Math.max(state.activeDistrict, district),
            })),

            // Slasher Logic
            getRefilledSlasherChances: () => {
                const state = get();
                if (state.slasherChances >= 3) return state.slasherChances;
                if (!state.slasherLastRefill) return 3;

                const twoHours = 2 * 60 * 60 * 1000;
                const now = Date.now();
                const timePassed = now - state.slasherLastRefill;

                if (timePassed >= twoHours) {
                    return 3;
                }
                return state.slasherChances;
            },

            useSlasherChance: () => {
                const currentChances = get().getRefilledSlasherChances();
                if (currentChances > 0) {
                    set((state) => ({
                        slasherChances: currentChances - 1,
                        slasherLastRefill: currentChances === 3 ? Date.now() : state.slasherLastRefill
                    }));
                    return true;
                }
                return false;
            }
        }),
        {
            name: 'careersim-storage', // localStorage key
            storage: createJSONStorage(() => localStorage), // explicit storage
            partialize: (state) => ({
                // Only persist game state, not UI state
                characterName: state.characterName,
                role: state.role,
                months: state.months,
                stats: state.stats,
                flags: state.flags,
                history: state.history,
                currentScenarioId: state.currentScenarioId,
                recentScenarioIds: state.recentScenarioIds,
                recentTags: state.recentTags,
                cooldowns: state.cooldowns,
                slasherChances: state.slasherChances,
                slasherLastRefill: state.slasherLastRefill,
                momentumCounter: state.momentumCounter,
                momentumActive: state.momentumActive,
                huntStage: state.huntStage,
                huntProgress: state.huntProgress,
                achievements: state.achievements,
                achievementCount: state.achievementCount,
                jobOutcome: state.jobOutcome,
                // RPG
                hp: state.hp,
                maxHp: state.maxHp,
                coins: state.coins,
                xp: state.xp,
                level: state.level,
                xpToNextLevel: state.xpToNextLevel,
                enemiesDefeated: state.enemiesDefeated,
                scamsIdentified: state.scamsIdentified,
                miniGamesCompleted: state.miniGamesCompleted,
                bossesDefeated: state.bossesDefeated,
                activeDistrict: state.activeDistrict,
            }),
        }
    )
);
