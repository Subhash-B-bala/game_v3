import { GameState, Choice, GameStats } from "./types";

export interface TurnResult {
    nextState: GameState;
    unlockedAchievements: string[];
}

// Pure function to apply a player's choice to the game state
export function applyChoice(
    state: GameState,
    choice: Choice
): TurnResult {
    // 1. Deep clone state to ensure purity
    const nextState: GameState = JSON.parse(JSON.stringify(state));
    const unlocked: string[] = [];

    // 2. Apply Stat Effects
    if (choice.fx) {
        Object.entries(choice.fx).forEach(([key, value]) => {
            const k = key as keyof GameStats;
            if (typeof nextState.stats[k] === 'number') {
                const newValue = (nextState.stats[k] || 0) + (value as number);

                // Allow savings to go negative (Debt mechanic)
                if (k === 'savings') {
                    nextState.stats[k] = newValue;
                } else {
                    nextState.stats[k] = Math.max(0, newValue);
                }

                // Cap percentage-based or score-based stats
                if (['energy', 'stress'].includes(k)) {
                    nextState.stats[k] = Math.min(1.0, nextState.stats[k]);
                }
                if (['confidence', 'grit', 'aggression', 'stability', 'learningSpeed', 'startupBias', 'burnoutRisk'].includes(k)) {
                    nextState.stats[k] = Math.min(200, nextState.stats[k]); // Some cap at 200 for flexibility
                }
            }
        });
    }

    // 3. Apply Skill Bonus (Logic: +5 to +15 boost)
    if (choice.skillBonus) {
        const bonus = Math.floor(Math.random() * 11) + 5; // 5-15
        nextState.stats[choice.skillBonus] += bonus;
        // notification logic would handle messaging in the UI layer
    }

    // 4. Update Time & Job Income
    const timeDelta = choice.timeCost || 0;
    if (timeDelta > 0) {
        nextState.months += timeDelta;

        // If employed, add salary earnings
        if (nextState.stats.salary > 0) {
            // Salary is typically annual, so: (Salary / 12) * months
            const earnings = (nextState.stats.salary / 12) * timeDelta;
            nextState.stats.savings += Math.floor(earnings);
        }

        // Cost of living deduction (Example: 20k/month base burn)
        const burnRate = 20000;
        nextState.stats.savings -= (burnRate * timeDelta);
    }

    // 5. Set Flags & Role
    if (choice.flag) {
        nextState.flags[choice.flag] = true;
    }
    if (choice.setRole) {
        nextState.role = choice.setRole;
    }
    if (choice.huntStage !== undefined) {
        nextState.huntStage = choice.huntStage;
    }
    if (choice.huntProgress !== undefined) {
        nextState.huntProgress = Math.min(100, (nextState.huntProgress || 0) + choice.huntProgress);
    }

    // 6. Check for simple Achievements (Example logic)
    if (!state.flags['first_job'] && nextState.stats.salary > 0) {
        nextState.flags['first_job'] = true;
        unlocked.push("First Job Secured!");
    }

    if (nextState.stats.savings < 0 && state.stats.savings >= 0) {
        unlocked.push("In Debt! (Warning)");
    }

    return {
        nextState,
        unlockedAchievements: unlocked
    };
}
