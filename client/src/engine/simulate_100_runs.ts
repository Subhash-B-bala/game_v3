import { pickNextHuntScenario, checkStageAdvance } from "./JobHuntResolver";
import { applyChoice } from "./reducer";
import { GameState, Scenario } from "./types";
import * as fs from 'fs';
import * as path from 'path';

// Load Scenarios
const scenarioPath = path.join(__dirname, 'chapter3_job_hunt', 'job_hunt_scenarios.json');
const allScenarios: Scenario[] = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'));

const RUNS = 100;

interface Result {
    outcome: 'hired' | 'burnout' | 'bankrupt' | 'stuck';
    months: number;
    finalStats: any;
}

const PRESETS = [
    { name: "Comfortable", savings: 25000, burn: 2200 },
    { name: "Middle Class", savings: 15000, burn: 2000 },
    { name: "Self-Dependent", savings: 10000, burn: 1800 },
    { name: "In Debt", savings: -3000, burn: 1600 },
];

console.log(`Starting Simulations across ${PRESETS.length} presets...`);

for (const preset of PRESETS) {
    const results: Result[] = [];

    for (let r = 0; r < RUNS; r++) {
        // Init State
        let state: GameState = {
            characterName: `Sim_${r}`,
            characterAvatar: "fresher",
            role: "engineer",
            months: 0,
            huntStage: 0,
            huntProgress: 0,
            stats: {
                sql: 10, python: 10, excel: 10, powerbi: 0, cloud: 0, ml: 0,
                communication: 10, leadership: 0, problem_solving: 10, stakeholder_mgmt: 0,
                savings: preset.savings,
                burnRatePerMonth: preset.burn,
                salary: 0,
                energy: 1.0,
                stress: 0.0,
                network: 0,
                confidence: 50,
                grit: 10, aggression: 10, stability: 10, learningSpeed: 50, startupBias: 10, burnoutRisk: 0, interviewPerformance: 0,
                reputation: 0, ethics: 50, strategy: 0, intelligence: 50
            },
            flags: {},
            history: [],
            currentScenarioId: null,
            notifications: [],
            slasherChances: 3,
            slasherLastRefill: null,
            recentScenarioIds: [],
            recentTags: [],
            cooldowns: {},
            momentumCounter: 0,
            momentumActive: false,
            achievements: {},
            achievementCount: 0,
            jobOutcome: null
        };

        let outcome: Result['outcome'] = 'stuck';

        while (state.months < 24) {
            const { scenario, updates } = pickNextHuntScenario(allScenarios, state, "engineer");
            if (updates.recentScenarioIds) state.recentScenarioIds = updates.recentScenarioIds;
            if (updates.recentTags) state.recentTags = updates.recentTags;
            if (updates.cooldowns) state.cooldowns = updates.cooldowns;

            if (!scenario) break;

            const choice = scenario.choices[Math.floor(Math.random() * scenario.choices.length)];
            const result = applyChoice(state, choice);
            state = result.newState;

            const advance = checkStageAdvance(state);
            if (advance) Object.assign(state, advance);

            if (state.flags['has_job'] || state.flags['has_job_startup']) {
                outcome = 'hired';
                break;
            }
            if (state.stats.stress >= 1.0 || state.stats.energy <= 0) {
                outcome = 'burnout';
                break;
            }
            // Bankrupt Logic:
            // Since savings can go negative, we define bankruptcy as effectively Game Over
            // But for "In Debt" preset, they restart at -3000. 
            // So we'll say if Savings drops below -15000? 
            // Or just stick to < 0 means bankrupt if NOT starting in debt?
            // Actually, let's say Bankrupt = Run out of runway completely.
            // If preset is "In Debt", maybe they have a different fail condition?
            // For this sim, let's assume Bankrupt is < -5000 (standard limit)
            if (state.stats.savings < -5000 && preset.name !== "In Debt") {
                outcome = 'bankrupt';
                break;
            }
            // For debt scenario, maybe limit is -15000
            if (state.stats.savings < -15000 && preset.name === "In Debt") {
                outcome = 'bankrupt';
                break;
            }
        }

        results.push({
            outcome,
            months: state.months,
            finalStats: state.stats
        });
    }

    const hired = results.filter(r => r.outcome === 'hired');
    const burnout = results.filter(r => r.outcome === 'burnout');
    const bankrupt = results.filter(r => r.outcome === 'bankrupt');
    const stuck = results.filter(r => r.outcome === 'stuck');
    const avgMonths = hired.reduce((sum, r) => sum + r.months, 0) / (hired.length || 1);

    console.log(`\n=== ${preset.name} ===`);
    console.log(`Win: ${hired.length}% | Burnout: ${burnout.length}% | Bankrupt: ${bankrupt.length}% | Stuck: ${stuck.length}%`);
    console.log(`Avg Months: ${avgMonths.toFixed(1)}`);
}
