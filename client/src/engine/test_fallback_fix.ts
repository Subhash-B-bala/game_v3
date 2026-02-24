/**
 * Test script to verify fallback scenario doesn't repeat
 * Run this to simulate gameplay and check if fallback loops
 */

import { pickNextHuntScenario } from './JobHuntResolver';
import type { GameState } from './types';
import jobHuntScenarios from './chapter3_job_hunt/job_hunt_scenarios.json';

// Mock initial state at Stage 1 (GATED)
const mockState: GameState = {
    characterName: 'TestPlayer',
    characterAvatar: 'fresher',
    role: 'analyst',
    months: 3,
    huntStage: 1,
    huntProgress: 50,
    stats: {
        sql: 20, python: 15, excel: 10, powerbi: 5, cloud: 10, ml: 5,
        communication: 15, leadership: 10, problem_solving: 20, stakeholder_mgmt: 10,
        savings: 12000, salary: 0, burnRatePerMonth: 2000,
        energy: 0.6, stress: 40, network: 10,
        confidence: 55, grit: 60, aggression: 50, stability: 50,
        learningSpeed: 100, startupBias: 0, burnoutRisk: 100,
        interviewPerformance: 20,
        reputation: 15, ethics: 0.5,
        strategy: 10, intelligence: 12
    },
    flags: {},
    cooldowns: {},
    achievements: {},
    history: [],
    recentScenarioIds: [],
    recentTags: []
};

console.log('🧪 Testing Fallback Scenario Fix\n');
console.log('='.repeat(50));

// Simulate 20 turns to check for fallback repetition
let consecutiveFallbacks = 0;
let lastNonNullScenarioId = '';
let fallbackCount = 0;
let progressIncreases: number[] = [];

for (let turn = 1; turn <= 20; turn++) {
    const result = pickNextHuntScenario(jobHuntScenarios as any[], mockState, mockState.role);

    if (!result.scenario) {
        console.log(`\nTurn ${turn}:`);
        console.log(`  Scenario: NULL (no scenarios available, including fallback on cooldown)`);
        console.log(`  Cooldowns: ${JSON.stringify(result.updates?.cooldowns || {})}`);

        // Update cooldowns even when null
        if (result.updates?.cooldowns) {
            mockState.cooldowns = result.updates.cooldowns;
        }

        continue;
    }

    const currentScenarioId = result.scenario.id;

    console.log(`\nTurn ${turn}:`);
    console.log(`  Scenario: ${currentScenarioId}`);
    console.log(`  Title: ${result.scenario.title}`);

    if (currentScenarioId === 'fallback_grind') {
        fallbackCount++;

        // Check if it's consecutive (ignoring NULL scenarios)
        if (lastNonNullScenarioId === 'fallback_grind') {
            consecutiveFallbacks++;
            console.log(`  ❌ ERROR: Fallback repeated consecutively!`);
        } else {
            console.log(`  ✅ Fallback appeared (with gap from last fallback)`);
        }

        // Check huntProgress values for fallback choices
        const progressValues = result.scenario.choices.map(c => c.huntProgress || 0);
        progressIncreases.push(...progressValues);
        console.log(`  Progress values: ${progressValues.join(', ')}`);

        lastNonNullScenarioId = currentScenarioId;
    } else {
        lastNonNullScenarioId = currentScenarioId;
    }

    // Update mock state with cooldowns and recent tracking from result
    // Note: pickNextHuntScenario already decrements cooldowns, so we just use the returned state
    if (result.updates?.cooldowns) {
        mockState.cooldowns = result.updates.cooldowns;
    }
    if (result.updates?.recentScenarioIds) {
        mockState.recentScenarioIds = result.updates.recentScenarioIds;
    }
}

console.log('\n' + '='.repeat(50));
console.log('📊 Test Results:\n');

if (consecutiveFallbacks === 0) {
    console.log('✅ PASS: Fallback scenario did NOT repeat consecutively');
} else {
    console.log(`❌ FAIL: Fallback repeated ${consecutiveFallbacks} times consecutively`);
}

console.log(`\nFallback appeared ${fallbackCount} times in 20 turns`);

if (progressIncreases.length > 0) {
    const avgProgress = progressIncreases.reduce((a, b) => a + b, 0) / progressIncreases.length;
    console.log(`Average fallback huntProgress: ${avgProgress.toFixed(1)}`);

    if (avgProgress >= 6) {
        console.log('✅ PASS: Fallback huntProgress increased (avg >= 6)');
    } else {
        console.log('❌ FAIL: Fallback huntProgress still too low');
    }
}

console.log('\n' + '='.repeat(50));
console.log('\n✨ Test complete!\n');
