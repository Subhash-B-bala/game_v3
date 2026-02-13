import { GameState, Scenario, RoleType } from "./types";

/**
 * Dynamic Scenario Picker for the Job Hunt Chapter
 * Based on the "Need Profile" and Pipeline Stage logic
 */

export function pickNextHuntScenario(
    scenarios: Scenario[],
    state: GameState,
    track: RoleType
): Scenario {
    // --- SELECTION TIERS ---

    // Tier 1: Strict Match (Role, Stage, Difficulty, UNSEEN)
    let pool = scenarios.filter(s => {
        if (s.phase !== "hunt") return false;
        if (state.history.includes(s.id)) return false; // ABSOLUTELY NO REPEATS if unseen exists
        if (state.stats.reputation >= 15 && s.difficulty === "beginner") return false;
        if (s.roleLock && !s.roleLock.includes(track)) return false;

        // Stage Check
        if (s.gates) {
            if (s.gates.stageMin !== undefined && state.huntStage < s.gates.stageMin) return false;
            if (s.gates.stageMax !== undefined && state.huntStage > s.gates.stageMax) return false;
        }
        return true;
    });

    // Tier 2: Role Match (Any Stage, UNSEEN) - Allows skipping ahead or looking back if stuck
    if (pool.length === 0) {
        pool = scenarios.filter(s => {
            if (s.phase !== "hunt" || state.history.includes(s.id)) return false;
            if (s.roleLock && !s.roleLock.includes(track)) return false;
            if (state.stats.reputation >= 15 && s.difficulty === "beginner") return false;
            return true;
        });
    }

    // Tier 3: Generic Unseen (Any Stage, UNSEEN)
    if (pool.length === 0) {
        pool = scenarios.filter(s => {
            if (s.phase !== "hunt" || state.history.includes(s.id)) return false;
            if (s.roleLock) return false; // Must be generic
            return true;
        });
    }

    // Tier 4: Emergency Fallback (Repeatable Filler/Maintenance)
    if (pool.length === 0) {
        pool = scenarios.filter(s => {
            if (s.phase !== "hunt") return false;
            if (state.stats.reputation >= 15 && s.difficulty === "beginner") return false; // Maintain senior filter
            if (s.roleLock && !s.roleLock.includes(track)) return false;
            return s.tags?.some(t => ["Maintenance", "Grind", "Filler"].includes(t));
        });

        // Final sanity check - if even filler is empty, just allow any relevant hunt scenario
        if (pool.length === 0) {
            pool = scenarios.filter(s => s.phase === "hunt" && (!s.roleLock || s.roleLock.includes(track)));
        }
    }

    // 2. Score scenarios
    const progressRatio = Math.min(state.months / 12, 1);
    const scoredPool = pool.map(s => {
        let score = 100;

        // A. Difficulty vs Progression
        if (progressRatio < 0.35) {
            if (s.difficulty === "beginner") score *= 1.5;
            if (s.difficulty === "advanced") score *= 0.2; // Harder for beginners
        } else if (progressRatio < 0.75) {
            if (s.difficulty === "intermediate") score *= 2.0;
        } else {
            if (s.difficulty === "advanced") score *= 2.5;
            if (s.difficulty === "beginner") score *= 0.1;
        }

        // B. Strict Role Priority
        if (s.roleLock && s.roleLock.includes(track)) {
            score *= 5.0; // Heavy weighting toward role-specific content
        }

        // C. Need Targeting (Boost weak areas)
        if (s.tags) {
            // Low Network?
            if (state.stats.network < 30 && s.tags.some(t => ["Networking", "LinkedIn", "Referral"].includes(t))) {
                score *= 1.35;
            }
            // Low Savings? (Pressure realism)
            if (state.stats.savings < 2000 && s.tags.includes("Scam")) {
                score *= 1.5; // Scams are more tempting/likely when desperate
            }
            // High Stress?
            if (state.stats.stress > 0.8 && s.tags.includes("Burnout")) {
                score *= 2.0; // Force burnout scenarios
            }
        }

        // D. Variety Penalty (Don't repeat same tags back-to-back)
        const lastScenario = scenarios.find(prev => prev.id === state.history[state.history.length - 1]);
        if (lastScenario && lastScenario.tags && s.tags) {
            const hasCommonTag = s.tags.some(t => lastScenario.tags?.includes(t));
            if (hasCommonTag) score *= 0.5;
        }

        return { scenario: s, score };
    });

    // 3. Weighted Random Selection
    const totalScore = scoredPool.reduce((acc, curr) => acc + curr.score, 0);
    let random = Math.random() * totalScore;

    for (const item of scoredPool) {
        random -= item.score;
        if (random <= 0) return item.scenario;
    }

    return scoredPool[0]?.scenario || scenarios[0];
}

/**
 * Checks if the pipeline should advance based on stats or progress
 */
export function checkStageAdvance(state: GameState): Partial<GameState> | null {
    const { huntStage, stats, flags } = state;

    // Stage 1 -> 2 (Outreach)
    if (huntStage === 1 && (stats.reputation >= 20 || flags["portfolio_done"])) {
        return { huntStage: 2, notifications: [...state.notifications, "Market Visibility Increased! Stage 2: Outreach Unlocked."] };
    }

    // Stage 4 -> 5 (Offer)
    if (huntStage === 4 && (stats.confidence >= 60 || stats.interviewPerformance >= 50)) {
        return { huntStage: 5, notifications: [...state.notifications, "Final Rounds Approaching. Stage 5: Negotiation Ready."] };
    }

    return null;
}
