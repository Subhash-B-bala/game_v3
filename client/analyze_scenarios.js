const scenarios = require('./src/engine/chapter3_job_hunt/job_hunt_scenarios.json');

console.log('=== JOB HUNT MODULE SCENARIO ANALYSIS ===\n');

// Total scenarios
console.log('📊 Total Scenarios:', scenarios.length);

// Count scenarios by stage gates
const byStage = {};
scenarios.forEach(s => {
  if (s.gates) {
    const min = s.gates.stageMin || 0;
    const max = s.gates.stageMax !== undefined ? s.gates.stageMax : 5;
    const key = `Stage ${min}-${max}`;
    byStage[key] = (byStage[key] || 0) + 1;
  } else {
    byStage['No Gate'] = (byStage['No Gate'] || 0) + 1;
  }
});

console.log('\n📈 Scenarios by Stage:');
Object.entries(byStage).sort().forEach(([stage, count]) => {
  console.log(`  ${stage}: ${count}`);
});

// Count role-locked scenarios
const roleLocked = scenarios.filter(s => s.roleLock);
console.log('\n🔒 Role-Specific Scenarios:', roleLocked.length);
console.log('🌐 Universal Scenarios:', scenarios.length - roleLocked.length);

// Detailed role breakdown
const roleBreakdown = {};
roleLocked.forEach(s => {
  s.roleLock.forEach(role => {
    if (!roleBreakdown[role]) roleBreakdown[role] = [];
    roleBreakdown[role].push(s.id);
  });
});

console.log('\n👔 Scenarios by Role:');
Object.entries(roleBreakdown).forEach(([role, ids]) => {
  console.log(`  ${role}: ${ids.length} scenarios`);
});

// Count total choices
let totalChoices = 0;
scenarios.forEach(s => {
  totalChoices += s.choices.length;
});

console.log('\n🎯 Total Choices Across All Scenarios:', totalChoices);
console.log('📊 Average Choices per Scenario:', (totalChoices / scenarios.length).toFixed(1));

// Calculate unique paths
console.log('\n\n=== PERMUTATION & COMBINATION ANALYSIS ===\n');

// User inputs from orientation
const roles = ['analyst', 'engineer', 'ai_engineer', 'fullstack'];
console.log('🎭 Available Roles:', roles.length);

// For each role, count accessible scenarios
console.log('\n📋 Scenarios Accessible per Role:');
roles.forEach(role => {
  const accessible = scenarios.filter(s => {
    // Universal scenarios OR scenarios locked to this role
    return !s.roleLock || s.roleLock.includes(role);
  });
  console.log(`  ${role}: ${accessible.length} scenarios (${roleLocked.filter(s => s.roleLock && s.roleLock.includes(role)).length} exclusive + ${scenarios.length - roleLocked.length} universal)`);
});

// Calculate total unique question-choice combinations
let totalCombinations = 0;
roles.forEach(role => {
  const accessible = scenarios.filter(s => !s.roleLock || s.roleLock.includes(role));
  const choiceCount = accessible.reduce((sum, s) => sum + s.choices.length, 0);
  totalCombinations += choiceCount;
  console.log(`  ${role}: ${choiceCount} total choices available`);
});

console.log('\n🔢 TOTAL UNIQUE QUESTION-CHOICE COMBINATIONS:');
console.log(`   Across all ${roles.length} roles: ${totalCombinations}`);

// Fallback scenario
console.log('\n🔄 Fallback Scenario: 1 (with 4 choices)');
console.log('   Total including fallback: ' + (scenarios.length + 1));
