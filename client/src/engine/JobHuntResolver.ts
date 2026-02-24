import { GameState, Scenario, RoleType } from "./types";

// --- Seeded RNG helpers (deterministic picks) ---
function cyrb128(str: string) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return (h1 ^ h2 ^ h3 ^ h4) >>> 0;
}

function mulberry32(a: number) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

/**
 * Dynamic Scenario Picker for the Job Hunt Chapter
 * Based on the "Need Profile" and Pipeline Stage logic
 */

export function pickNextHuntScenario(
    scenarios: Scenario[],
    state: GameState,
    track: RoleType
): { scenario: Scenario | null, updates: Partial<GameState> } {

    // 1. Decrement Cooldowns
    const nextCooldowns = { ...state.cooldowns };
    for (const key in nextCooldowns) {
        if (nextCooldowns[key] > 0) {
            nextCooldowns[key] -= 1;
        }
        if (nextCooldowns[key] <= 0) delete nextCooldowns[key];
    }

    // 2. Filter Eligibility
    const validScenarios = scenarios.filter(s => {
        // A. Basic Phases & Role
        if (s.phase !== "hunt") return false;
        if (s.roleLock && !s.roleLock.includes(track)) return false;

        // B. Progression Gates
        if (s.gates) {
            if (s.gates.stageMin !== undefined && state.huntStage < s.gates.stageMin) return false;
            // Strict Max: specific scenarios for early stages shouldn't appear later if irrelevant
            if (s.gates.stageMax !== undefined && state.huntStage > s.gates.stageMax) return false;
        }

        // C. History & Cooldowns
        if (state?.recentScenarioIds?.includes(s.id)) return false;
        if (nextCooldowns[s.id] > 0) return false;

        // D. Stat Requirements
        if (s.minReq) {
            for (const [stat, minValue] of Object.entries(s.minReq)) {
                if ((state.stats[stat as keyof typeof state.stats] || 0) < minValue) return false;
            }
        }

        return true;
    });

    // Fallback Scenario Object
    const FALLBACK_SCENARIO: Scenario = {
        id: 'fallback_grind',
        title: 'Quiet Market',
        sender: { name: 'System', role: 'AI', avatar: 'system' },
        text: 'The job market is quiet today. No new leads match your current profile.',
        phase: 'hunt',
        difficulty: 'beginner',
        cooldown: 0,
        choices: [
            {
                id: 'grind',
                text: 'Grind LeetCode (XP)',
                timeCost: 0.2,
                energyCost: 10,
                fx: { python: 2, stress: 5 },
                huntProgress: 8
            },
            {
                id: 'review_jobs',
                text: 'Review Job Postings (Research)',
                timeCost: 0.3,
                energyCost: 8,
                fx: { reputation: 3, strategy: 2 },
                huntProgress: 6
            },
            {
                id: 'network_linkedin',
                text: 'Network on LinkedIn (Outreach)',
                timeCost: 0.4,
                energyCost: 15,
                fx: { network: 5, communication: 2 },
                huntProgress: 10
            },
            {
                id: 'update_resume',
                text: 'Update Resume (Polish)',
                timeCost: 0.5,
                energyCost: 12,
                fx: { reputation: 5, confidence: 3 },
                huntProgress: 8
            }
        ]
    };

    // 3. Fallback: If no valid scenarios, return fallback (unless fallback itself is on cooldown)
    if (validScenarios.length === 0) {
        // Check if fallback is on cooldown
        if (nextCooldowns['fallback_grind'] && nextCooldowns['fallback_grind'] > 0) {
            // Fallback is on cooldown, but we have no other scenarios
            // Force return null to avoid infinite loop - game will need to handle this
            return { scenario: null, updates: { cooldowns: nextCooldowns } };
        }

        // Add fallback to cooldowns to prevent immediate repeat
        nextCooldowns['fallback_grind'] = 5;

        // Add to recent tracking (maintain 6-scenario window)
        const nextRecent = [...(state.recentScenarioIds || []), 'fallback_grind'];
        if (nextRecent.length > 6) nextRecent.shift();

        return {
            scenario: FALLBACK_SCENARIO,
            updates: {
                cooldowns: nextCooldowns,
                recentScenarioIds: nextRecent
            }
        };
    }

    // 4. Weight Calculation
    const weightedPool = validScenarios.map(s => {
        let weight = 10;

        // A. Difficulty vs Stage Match
        // Beginner (0-1), Intermediate (2-3), Advanced (4-5)
        const diff = s.difficulty || "intermediate";
        if (state.huntStage <= 1 && diff === "beginner") weight += 15;
        if (state.huntStage >= 2 && state.huntStage <= 3 && diff === "intermediate") weight += 15;
        if (state.huntStage >= 4 && diff === "advanced") weight += 20;

        // Penalty for mismatch
        if (state.huntStage <= 1 && diff === "advanced") weight = 0; // Impossible
        if (state.huntStage >= 4 && diff === "beginner") weight = 1; // Too easy

        // B. Tag Fatigue (Avoid repeating themes)
        if (s.tags && state.recentTags) {
            const overlap = s.tags.filter(t => state.recentTags.includes(t)).length;
            if (overlap > 0) weight /= (overlap + 1); // 1 tag -> 50%, 2 tags -> 33%
        }

        return { s, weight };
    });

    // 5. Weighted Random Pick
    const activePool = weightedPool.filter(wp => wp.weight > 0);

    // Fallback: If all weights are 0, return fallback
    if (activePool.length === 0) {
        return {
            scenario: FALLBACK_SCENARIO,
            updates: { cooldowns: nextCooldowns }
        };
    }

    const totalWeight = activePool.reduce((sum, item) => sum + item.weight, 0);

    // Seeded RNG: Deterministic based on state state
    const seedStr = `${state.characterName}|${state.months}|${state.huntStage}|${track}`;
    const seed = cyrb128(seedStr);
    const rng = mulberry32(seed);

    let random = rng() * totalWeight;
    let selected = activePool[0].s;

    for (const item of activePool) {
        random -= item.weight;
        if (random <= 0) {
            selected = item.s;
            break;
        }
    }

    // 6. Prepare State Updates
    const newRecentIds = [selected.id, ...(state.recentScenarioIds || [])].slice(0, 6);

    // Push new tags (Rolling History, allow duplicates to push out old ones)
    const newRecentTags = [...(state.recentTags || [])];
    if (selected.tags) {
        if (selected.tags[1]) newRecentTags.unshift(selected.tags[1]);
        if (selected.tags[0]) newRecentTags.unshift(selected.tags[0]);
    }
    const cappedTags = newRecentTags.slice(0, 3); // Keep last 3 tags encountered

    // Set Cooldown
    if (selected.cooldown) {
        nextCooldowns[selected.id] = selected.cooldown;
    } else {
        nextCooldowns[selected.id] = 3; // Default 3 turn cooldown
    }

    return {
        scenario: selected,
        updates: {
            recentScenarioIds: newRecentIds,
            recentTags: cappedTags,
            cooldowns: nextCooldowns
        }
    };
}

/**
 * Checks if the pipeline should advance based on stats or progress
 */
export function checkStageAdvance(state: GameState): Partial<GameState> | null {
    const { huntStage, huntProgress, stats, flags } = state;

    // Stage 0 -> 1 (Foundational to Gated)
    if (huntStage === 0 && huntProgress >= 100) {
        return {
            huntStage: 1,
            huntProgress: 0,
            notifications: [...state.notifications, "✓ Market Access Unlocked! Stage 1: GATED"]
        };
    }

    // Stage 1 -> 2 (Gated to Scan)
    if (huntStage === 1 && (huntProgress >= 100 || stats.reputation >= 20 || flags["portfolio_done"])) {
        return {
            huntStage: 2,
            huntProgress: 0,
            notifications: [...state.notifications, "✓ Visibility Increased! Stage 2: SCAN"]
        };
    }

    // Stage 2 -> 3 (Scan to Reach)
    if (huntStage === 2 && (huntProgress >= 100 || stats.network >= 30)) {
        return {
            huntStage: 3,
            huntProgress: 0,
            notifications: [...state.notifications, "✓ Response Rate Up! Stage 3: REACH"]
        };
    }

    // Stage 3 -> 4 (Reach to Interview)
    if (huntStage === 3 && (huntProgress >= 100 || stats.confidence >= 40)) {
        return {
            huntStage: 4,
            huntProgress: 0,
            notifications: [...state.notifications, "✓ Interview Ready! Stage 4: INTERVIEW"]
        };
    }

    // Stage 4 -> End (Interview to Offer/Outcome)
    // Note: Don't auto-advance to stage 5; instead, scenarios set has_job flag
    if (huntStage === 4 && flags["has_job"]) {
        return {
            notifications: [...state.notifications, "🎉 Job Secured! Congratulations!"]
        };
    }

    return null;
}
