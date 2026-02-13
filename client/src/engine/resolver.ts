import { GameState, Scenario, RoleType } from "./types";

/**
 * Selects the next scenario based on game state, history, and randomness.
 */
export function getNextScenario(
    state: GameState,
    pool: Scenario[]
): Scenario | null {
    // 1. Filter by Validity
    const candidates = pool.filter(scenario => {
        // A. Filter by Role (if specified)
        if (scenario.role && scenario.role !== state.role) {
            return false;
        }

        // B. Filter by Phase (Map current state to phase)
        // Simple mapping logic for now:
        // Loading/Intro -> setup
        // Unemployed -> job_hunt
        // Employed -> early_career / mid / senior based on months/exp
        let requiredPhase = "setup";
        if (state.flags["setup_complete"]) {
            if (state.stats.salary > 0) {
                // Job phases
                if (state.months > 24) requiredPhase = "mid_level";
                else requiredPhase = "early_career";
            } else {
                requiredPhase = "job_hunt";
            }
        }

        // Allow scenarios that match phase OR are explicit overrides (like "any")
        if (scenario.phase !== requiredPhase && scenario.phase !== "any" as any) {
            return false;
        }

        // C. Filter by History (Standard Cooldown)
        // Don't show if already seen (unless re-playable flagged, assumed standard is once-only for now)
        if (state.history.includes(scenario.id)) {
            return false;
        }

        // D. Filter by Prerequisites (if any)
        // (Future: check stats requirements here)

        return true;
    });

    if (candidates.length === 0) {
        return null;
    }

    // 2. Select Weighted Random
    // For now, simple uniform random
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
}
