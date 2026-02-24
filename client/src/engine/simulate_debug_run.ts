import { pickNextHuntScenario, checkStageAdvance } from "./JobHuntResolver";
import { applyChoice } from "./reducer";
import { GameState, Scenario } from "./types";
import * as fs from 'fs';
import * as path from 'path';

// Load Scenarios
const scenarioPath = path.join(__dirname, 'chapter3_job_hunt', 'job_hunt_scenarios.json');
const allScenarios: Scenario[] = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'));

console.log(`Starting DEBUG Simulation (1 Run only)...`);

// 1. Init State
let state: GameState = {
    characterName: "SIM_DEBUG", // Deterministic
    characterAvatar: "fresher",
    role: "engineer",
    months: 0,
    huntStage: 0,
    huntProgress: 0,
    stats: {
        sql: 10, python: 10, excel: 10, powerbi: 0, cloud: 0, ml: 0,
        communication: 10, leadership: 0, problem_solving: 10, stakeholder_mgmt: 0,
        savings: 5000,
        burnRatePerMonth: 2000,
        salary: 0,
        energy: 1.0,
        stress: 0.0,
        network: 0,
        confidence: 50,
        grit: 10, aggression: 10, stability: 10, learningSpeed: 50, startupBias: 10, burnoutRisk: 0, interviewPerformance: 0,
        reputation: 0, ethics: 50, strategy: 0, intelligence: 50
    },
    flags: {}, // NO pre-set portfolio
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

let turns = 0;
while (turns < 100) { // Max 100 turns safety
    turns++;

    // SNAPSHOT BEFORE
    const before = {
        months: state.months,
        huntStage: state.huntStage,
        huntProgress: state.huntProgress
    };

    // A. Pick Scenario
    const { scenario, updates } = pickNextHuntScenario(allScenarios, state, "engineer");

    // Apply immediate updates (cooldowns, history, etc)
    if (updates.recentScenarioIds) state.recentScenarioIds = updates.recentScenarioIds;
    if (updates.recentTags) state.recentTags = updates.recentTags;
    if (updates.cooldowns) state.cooldowns = updates.cooldowns;

    if (!scenario) {
        console.log("NO SCENARIO! BREAK.");
        break;
    }

    // B. Make Random Choice (Deterministic seed would be better, but let's stick to randomness for simulation)
    // Actually, to debug properly, let's pick first choice always to be deterministic? No, Math.random() is fine for trace log.
    const choice = scenario.choices[Math.floor(Math.random() * scenario.choices.length)];

    // C. Apply Choice
    const result = applyChoice(state, choice);
    state = result.newState;

    // D. Check Stage Advance
    const advance = checkStageAdvance(state);
    if (advance) {
        Object.assign(state, advance);
    }

    // LOG TRACE
    console.log(JSON.stringify({
        turn: turns,
        monthPre: before.months.toFixed(2),
        stagePre: before.huntStage,
        progPre: before.huntProgress,
        scenario: scenario.id,
        choice: choice.text.substring(0, 20),
        timeCost: choice.timeCost,
        progGain: choice.huntProgress,
        monthPost: state.months.toFixed(2),
        stagePost: state.huntStage,
        progPost: state.huntProgress,
        hasJob: state.flags['has_job'],
        term: ""
    }));

    // E. Check End Conditions
    if (state.flags['has_job'] || state.flags['has_job_startup']) {
        console.log("!!! HIRED !!!");
        break;
    }
    if (state.stats.stress >= 1.0) {
        console.log("!!! BURNOUT (Stress) !!!");
        break;
    }
    if (state.stats.energy <= 0) {
        console.log("!!! BURNOUT (Energy) !!!");
        break;
    }
    if (state.stats.savings < -5000) {
        console.log("!!! BANKRUPT !!!");
        break;
    }
}

console.log("\n--- FINAL SUMMARY ---");
console.log(`Turns: ${turns}`);
console.log(`Months: ${state.months.toFixed(2)}`);
console.log(`Stage: ${state.huntStage}`);
console.log(`Progress: ${state.huntProgress}`);
console.log(`Savings: ${state.stats.savings}`);
console.log(`Energy: ${state.stats.energy}`);
console.log(`Stress: ${state.stats.stress}`);
console.log(`Flags: ${JSON.stringify(state.flags)}`);
