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
    uiPhase: "intro" | "setup" | "briefing" | "game" | "jobhunt" | "roadmap" | "end";
    setUiPhase: (phase: "intro" | "setup" | "briefing" | "game" | "jobhunt" | "roadmap" | "end") => void;
    isLoading: boolean;
    activeText: string | null; // For typewriter effects?
    updateStats: (stats: Partial<GameStats>) => void;
    setMonths: (months: number) => void;

    // Mini-game Specific
    slasherChances: number;
    slasherLastRefill: number | null;
    useSlasherChance: () => boolean;
    getRefilledSlasherChances: () => number;
}

const INITIAL_STATS: GameStats = {
    sql: 0, python: 0, excel: 0, powerbi: 0, cloud: 0, ml: 0,
    communication: 0, leadership: 0, problem_solving: 0, stakeholder_mgmt: 0,
    savings: 5000, salary: 0, energy: 1.0, stress: 0.0, network: 0,
    confidence: 50, grit: 50, aggression: 50, stability: 50,
    learningSpeed: 100, startupBias: 0, burnoutRisk: 100,
    interviewPerformance: 0,
    reputation: 0, ethics: 0.5
};

const INITIAL_STATE: GameState & { uiPhase: "intro" | "setup" | "game" | "jobhunt" | "roadmap" | "end" } = {
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
    uiPhase: "intro" as const, // Default start
    slasherChances: 3,
    slasherLastRefill: null
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

            initGame: (name, avatar, role) => {
                set({
                    ...INITIAL_STATE,
                    characterName: name,
                    characterAvatar: avatar,
                    role: role || null,
                    flags: { "intro_complete": true },
                    uiPhase: "briefing",
                    currentScenarioId: ONBOARDING_SEQUENCE[0] // Start with first onboarding
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
                const { nextState, unlockedAchievements } = applyChoice(state, choice);

                // 2. Queue Notifications
                const newNotifications = [...state.notifications, ...unlockedAchievements];

                // 3. Update State
                set({
                    ...nextState,
                    notifications: newNotifications,
                    history: [...state.history, scenario.id]
                });

                // 4. Handle Progression
                const currentIdx = ONBOARDING_SEQUENCE.indexOf(scenario.id);

                setTimeout(() => {
                    if (currentIdx !== -1 && currentIdx < ONBOARDING_SEQUENCE.length - 1) {
                        // Still in onboarding sequence -> pick next fixed one
                        get().loadScenario(ONBOARDING_SEQUENCE[currentIdx + 1]);
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
                set({ ...INITIAL_STATE });
                // Clean URL params if any
                if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', '/');
                }
            },

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
                slasherChances: state.slasherChances,
                slasherLastRefill: state.slasherLastRefill
            }),
        }
    )
);
