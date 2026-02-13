/**
 * DIALOGUE ROUTER — Dialogue Branching Logic for 2D Game
 *
 * Evaluates branch conditions and returns effective dialogue variant
 * Used by DialoguePanel in Phaser scenes
 */

import type { SeedStats } from '@/server/src/engine/stat-seeder';

// Type definitions (moved from npc-database)
export interface DialogueChoice {
  id: string;
  text: string;
  conditions?: DialogueCondition[];
  fx?: DialogueEffects;
  npcEffects?: { trust: number };
  triggerActivity?: string;
  nextNodeId?: string;
}

export interface DialogueNode {
  id: string;
  npcId: string;
  text: string;
  choices: DialogueChoice[];
  conditions?: DialogueCondition[];
}

export interface DialogueBranch {
  conditions: DialogueCondition[];
  variant: DialogueNode;
}

export interface DialogueCondition {
  type: 'stat' | 'npc_trust' | 'flag' | 'track' | 'history';
  stat?: keyof SeedStats;
  npcId?: string;
  flagId?: string;
  track?: string;
  operator?: '>' | '<' | '==' | '>=' | '<=';
  value?: number;
}

export interface DialogueEffects {
  stat_changes?: Partial<SeedStats>;
  flags?: Record<string, boolean>;
}

export interface NPCRelationship {
  npcId: string;
  trust: number;
  flags?: Record<string, boolean>;
}

export interface GameState {
  stats: SeedStats;
  npcRelationships: Record<string, NPCRelationship>;
  narrativeFlags: Record<string, boolean>;
  scenarioHistory: Array<{ scenarioId: string; choiceId: string; at: number }>;
  playerTrack: string; // 'analyst' | 'engineer' | 'ai_engineer'
}

/**
 * Get effective dialogue node based on player state
 * Evaluates branches and returns matching variant
 */
export function getEffectiveDialogueNode(
  baseNode: DialogueNode,
  gameState: GameState,
  npcId: string
): DialogueNode {
  // If node has branches, find the best match
  if (baseNode.branches && baseNode.branches.length > 0) {
    for (const branch of baseNode.branches) {
      if (conditionsMet(branch.conditions, gameState, npcId)) {
        // Return branch as effective node
        return {
          id: baseNode.id,
          text: branch.variantText,
          emotion: baseNode.emotion,
          choices: branch.variantChoices || baseNode.choices,
          // Don't expose branches to UI
        };
      }
    }
  }

  // No branch matched—return base node
  return baseNode;
}

/**
 * Check if all conditions in a branch are met
 */
export function conditionsMet(
  conditions: DialogueBranch['conditions'] | undefined,
  gameState: GameState,
  npcId: string
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) =>
    evaluateCondition(condition, gameState, npcId)
  );
}

/**
 * Evaluate a single condition
 */
export function evaluateCondition(
  condition: any,
  gameState: GameState,
  npcId: string
): boolean {
  switch (condition.type) {
    case 'stat': {
      // Check player stat
      const statValue = (gameState.stats as any)[condition.stat];
      if (statValue === undefined) return false;

      if (condition.min !== undefined && statValue < condition.min) {
        return false;
      }
      if (condition.max !== undefined && statValue > condition.max) {
        return false;
      }
      return true;
    }

    case 'npc_trust': {
      // Check NPC trust level
      const npc = gameState.npcRelationships[npcId];
      if (!npc) return false;

      if (condition.min !== undefined && npc.trustLevel < condition.min) {
        return false;
      }
      if (condition.max !== undefined && npc.trustLevel > condition.max) {
        return false;
      }
      return true;
    }

    case 'flag': {
      // Check narrative flag
      const flagValue = gameState.narrativeFlags[condition.flag];
      if (condition.value === undefined) {
        return flagValue === true;
      }
      return flagValue === condition.value;
    }

    case 'track': {
      // Check player track match
      return gameState.playerTrack === condition.track;
    }

    case 'history': {
      // Check if scenario was completed
      return gameState.scenarioHistory.some(
        (h) => h.scenarioId === condition.scenarioId
      );
    }

    default:
      return true;
  }
}

/**
 * Apply dialogue choice effects to game state
 * Returns updates to be applied by caller
 */
export function applyDialogueChoice(
  choice: DialogueChoice,
  gameState: GameState,
  npcId: string
): {
  statUpdates: Record<string, number>;
  npcUpdates: Partial<NPCRelationship>;
  flagUpdates: Record<string, boolean>;
  nextNodeId?: string;
  triggerActivity?: string;
} {
  const statUpdates: Record<string, number> = {};
  let npcUpdates: Partial<NPCRelationship> = {};
  const flagUpdates: Record<string, boolean> = {};

  // Apply player stat effects
  if (choice.playerEffects) {
    Object.assign(statUpdates, choice.playerEffects);
  }

  // Apply NPC effects
  if (choice.npcEffects) {
    const npc = gameState.npcRelationships[npcId];
    if (npc) {
      // Update trust
      if (choice.npcEffects.trust) {
        npcUpdates.trustLevel = Math.max(
          0,
          Math.min(100, npc.trustLevel + choice.npcEffects.trust)
        );
      }

      // Update attitude
      if (choice.npcEffects.attitude) {
        npcUpdates.attitude = choice.npcEffects.attitude;
      }

      // Record history
      if (!npcUpdates.sharedHistory) {
        npcUpdates.sharedHistory = npc.sharedHistory || [];
      }
      npcUpdates.sharedHistory.push({
        event: choice.text,
        timestamp: Date.now(),
      });
    }
  }

  // Apply flags
  if (choice.flags) {
    Object.assign(flagUpdates, choice.flags);
  }

  return {
    statUpdates,
    npcUpdates,
    flagUpdates,
    nextNodeId: choice.nextNodeId,
    triggerActivity: choice.triggerActivity,
  };
}

/**
 * Get dialogue variant by stat profile
 * Used for debug/testing
 */
export function getDialogueVariantForProfile(
  baseNode: DialogueNode,
  profile: {
    confidence?: number;
    savings?: number;
    reputation?: number;
    trustLevel?: number;
    track?: string;
  }
): DialogueBranch | null {
  if (!baseNode.branches || baseNode.branches.length === 0) {
    return null;
  }

  // Create mock game state
  const mockGameState: GameState = {
    stats: {
      confidence: profile.confidence || 50,
      savings: profile.savings || 100000,
      reputation: profile.reputation || 30,
      stress: 50,
      energy: 80,
      spending_monthly: 3000,
      network: 30,
      linkedin_presence: 40,
      resume_strength: 50,
      portfolio_strength: 40,
      interview_skill: 45,
      technical_depth: 50,
      python_skill: 50,
      sql_skill: 40,
      scam_awareness: 60,
      months_unemployed: 0,
      applications_sent: 0,
    },
    npcRelationships: {},
    narrativeFlags: {},
    scenarioHistory: [],
    playerTrack: profile.track || 'analyst',
  };

  for (const branch of baseNode.branches) {
    if (conditionsMet(branch.conditions, mockGameState, 'mock_npc')) {
      return branch;
    }
  }

  return null;
}

/**
 * Calculate dialogue "persona" based on stats
 * For dev/debug purposes
 */
export function getPlayerPersona(stats: SeedStats): string {
  if (stats.confidence < 30 && stats.stress > 60) {
    return 'desperate';
  }
  if (stats.confidence > 70 && stats.reputation > 50) {
    return 'confident';
  }
  if (stats.savings < 20000) {
    return 'pressured';
  }
  if (stats.network > 70) {
    return 'well-connected';
  }
  return 'neutral';
}

/**
 * Debug: Print all dialogue branches for an NPC
 */
export function debugNPCDialogue(
  node: DialogueNode,
  depth: number = 0
): string {
  const indent = '  '.repeat(depth);
  let output = `${indent}Node: ${node.id}\n`;
  output += `${indent}Text: ${node.text}\n`;

  if (node.branches && node.branches.length > 0) {
    output += `${indent}Branches:\n`;
    node.branches.forEach((branch) => {
      output += `${indent}  [${branch.id}]\n`;
      output += `${indent}  Conditions: ${JSON.stringify(branch.conditions)}\n`;
      output += `${indent}  Text: ${branch.variantText}\n`;
    });
  }

  return output;
}
