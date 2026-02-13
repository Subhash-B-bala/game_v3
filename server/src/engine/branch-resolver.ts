/* ============================================================
   Branch Resolver — Evaluates Conditions & Selects Scenario Variants
   ============================================================ */

import type {
  BranchCondition,
  BranchingScenario,
  ScenarioBranch,
  NPCRelationship,
  NarrativeContext,
} from '../../shared/narrative.types';
import type { StateVector } from '../../shared/types';

/**
 * Evaluates a single condition against game state
 */
function evaluateCondition(
  condition: BranchCondition,
  stateVector: StateVector,
  narrativeContext: NarrativeContext | undefined,
): boolean {
  if (!narrativeContext) return false;

  switch (condition.type) {
    case 'flag': {
      return narrativeContext.narrativeFlags[condition.flag] === condition.value;
    }

    case 'stat': {
      const statValue = stateVector[condition.stat as keyof StateVector];
      if (typeof statValue !== 'number') return false;
      
      if (condition.min !== undefined && statValue < condition.min) return false;
      if (condition.max !== undefined && statValue > condition.max) return false;
      
      return true;
    }

    case 'stat_equal': {
      const statValue = stateVector[condition.stat as keyof StateVector];
      return statValue === condition.value;
    }

    case 'emotional': {
      return stateVector.emotionalState === condition.state;
    }

    case 'npcRelation': {
      const npc = narrativeContext.npcRelationships[condition.npcId];
      if (!npc) return false;
      
      if (condition.minTrust !== undefined && npc.trustLevel < condition.minTrust) {
        return false;
      }
      
      if (condition.attitude && npc.attitude !== condition.attitude) {
        return false;
      }
      
      return true;
    }

    case 'eventHistory': {
      return narrativeContext.scenarioHistory.some(
        event =>
          event.scenarioId === condition.scenarioId &&
          (!condition.choiceId || event.choiceId === condition.choiceId),
      );
    }

    case 'threadActive': {
      return narrativeContext.activeThreads.includes(condition.threadId);
    }

    case 'AND': {
      return condition.conditions.every(c =>
        evaluateCondition(c, stateVector, narrativeContext),
      );
    }

    case 'OR': {
      return condition.conditions.some(c =>
        evaluateCondition(c, stateVector, narrativeContext),
      );
    }

    case 'NOT': {
      return !evaluateCondition(condition.condition, stateVector, narrativeContext);
    }

    default:
      return false;
  }
}

/**
 * Select the best matching branch variant for a scenario
 * Returns null if no branches match (use default scenario)
 */
export function resolveBranchVariant(
  scenario: BranchingScenario,
  stateVector: StateVector,
  narrativeContext: NarrativeContext | undefined,
): ScenarioBranch | null {
  if (!scenario.branches || scenario.branches.length === 0) {
    return null;
  }

  // Find the first branch where ALL conditions are met
  for (const branch of scenario.branches) {
    const allConditionsMet = branch.conditions.every(condition =>
      evaluateCondition(condition, stateVector, narrativeContext),
    );

    if (allConditionsMet) {
      return branch;
    }
  }

  // No branch matched
  return null;
}

/**
 * Get the effective scenario content (base + branch override if applicable)
 * Returns the scenario exactly as the player should see it
 */
export function getEffectiveScenario(
  scenario: BranchingScenario,
  stateVector: StateVector,
  narrativeContext: NarrativeContext | undefined,
): {
  title: string;
  text: string;
  npcMessage?: string;
  choices: any[];  // NarrativeChoice[]
} {
  const branch = resolveBranchVariant(scenario, stateVector, narrativeContext);

  if (branch) {
    // Branch matched—use variant content
    return {
      title: branch.variantTitle || scenario.title,
      text: branch.variantText || scenario.text,
      npcMessage: branch.npcMessage,
      choices: branch.variantChoices || scenario.choices,
    };
  }

  // No branch matched—use base scenario
  return {
    title: scenario.title,
    text: scenario.text,
    choices: scenario.choices,
  };
}

/**
 * Check if a branch is "locked" for this player
 * (prevents certain narrative outcomes from being overused)
 */
export function isBranchLocked(
  branchId: string,
  narrativeContext: NarrativeContext | undefined,
): boolean {
  return narrativeContext?.lockedBranches?.includes(branchId) ?? false;
}

/**
 * Utility: Explain why a branch was NOT selected (for debugging/logging)
 */
export function explainBranchFailure(
  branch: ScenarioBranch,
  stateVector: StateVector,
  narrativeContext: NarrativeContext | undefined,
): string {
  const failures: string[] = [];

  for (const condition of branch.conditions) {
    const met = evaluateCondition(condition, stateVector, narrativeContext);
    if (!met) {
      failures.push(explainConditionFailure(condition, stateVector, narrativeContext));
    }
  }

  return `Branch "${branch.id}" failed: ${failures.join('; ')}`;
}

/**
 * Explain why a single condition failed
 */
function explainConditionFailure(
  condition: BranchCondition,
  stateVector: StateVector,
  narrativeContext: NarrativeContext | undefined,
): string {
  switch (condition.type) {
    case 'flag':
      return `Flag "${condition.flag}" is not ${condition.value}`;

    case 'stat': {
      const val = stateVector[condition.stat as keyof StateVector];
      let msg = `Stat "${condition.stat}" = ${val}`;
      if (condition.min !== undefined) msg += ` (need ≥ ${condition.min})`;
      if (condition.max !== undefined) msg += ` (need ≤ ${condition.max})`;
      return msg;
    }

    case 'stat_equal': {
      const val = stateVector[condition.stat as keyof StateVector];
      return `Stat "${condition.stat}" = ${val} (need ${condition.value})`;
    }

    case 'emotional':
      return `Emotional state is "${stateVector.emotionalState}" (need "${condition.state}")`;

    case 'npcRelation': {
      const npc = narrativeContext?.npcRelationships[condition.npcId];
      if (!npc) return `NPC "${condition.npcId}" not in relationships`;
      let msg = `NPC "${npc.name}" trust = ${npc.trustLevel}`;
      if (condition.minTrust) msg += ` (need ≥ ${condition.minTrust})`;
      if (condition.attitude) msg += ` attitude = "${npc.attitude}" (need "${condition.attitude}")`;
      return msg;
    }

    case 'eventHistory':
      return `Scenario "${condition.scenarioId}" not in history`;

    case 'threadActive':
      return `Thread "${condition.threadId}" not active`;

    case 'AND':
      return `AND condition failed`;

    case 'OR':
      return `OR condition failed (all sub-conditions failed)`;

    case 'NOT':
      return `NOT condition failed (sub-condition was true)`;

    default:
      return 'Unknown condition';
  }
}
