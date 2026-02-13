/* ============================================================
   NPC Relationship Manager — Track & Update NPC Relationships
   ============================================================ */

import type {
  NPCRelationship,
  NPCAttitude,
  NPCInteraction,
  NarrativeContext,
} from '../../shared/narrative.types';

/**
 * Initialize a new NPC relationship
 */
export function createNPCRelationship(
  npcId: string,
  name: string,
  role: string,
  initialTrust: number = 0,
): NPCRelationship {
  return {
    npcId,
    name,
    role: role as any,
    trustLevel: Math.max(0, Math.min(100, initialTrust)),
    attitude: 'neutral',
    sharedHistory: [],
    metadata: {
      lastMeetAt: undefined,
      memories: [],
    },
  };
}

/**
 * Update an NPC's trust level
 */
export function updateNPCTrust(
  npc: NPCRelationship,
  delta: number,
): NPCRelationship {
  const newTrust = Math.max(0, Math.min(100, npc.trustLevel + delta));
  
  return {
    ...npc,
    trustLevel: newTrust,
    attitude: inferAttitudeFromTrust(newTrust, npc.attitude),
  };
}

/**
 * Update an NPC's attitude explicitly
 */
export function updateNPCAttitude(
  npc: NPCRelationship,
  newAttitude: NPCAttitude,
): NPCRelationship {
  return {
    ...npc,
    attitude: newAttitude,
  };
}

/**
 * Record that this NPC interacted in a scenario
 */
export function recordNPCInteraction(
  npc: NPCRelationship,
  scenarioId: string,
  memory?: string,
  timestamp?: number,
): NPCRelationship {
  const updated = { ...npc };
  
  // Add to history
  if (!updated.sharedHistory.includes(scenarioId)) {
    updated.sharedHistory.push(scenarioId);
  }
  
  // Update metadata
  if (!updated.metadata) updated.metadata = {};
  updated.metadata.lastMeetAt = timestamp || Date.now();
  
  if (memory) {
    if (!updated.metadata.memories) updated.metadata.memories = [];
    updated.metadata.memories.push(memory);
  }
  
  return updated;
}

/**
 * Get the current attitude based on trust level
 * (can be overridden by explicit attitude changes)
 */
function inferAttitudeFromTrust(trust: number, current: NPCAttitude): NPCAttitude {
  // If attitude was explicitly set, don't auto-downgrade
  // (trust can go up, attitude can be preserved)
  if (current === 'mentor' || current === 'hostile') {
    // These are explicit states
    return current;
  }
  
  // Otherwise, infer from trust
  if (trust >= 75) return 'mentor';
  if (trust >= 50) return 'friendly';
  if (trust >= 25) return 'neutral';
  return 'hostile';
}

/**
 * Get or create an NPC relationship
 */
export function getOrCreateNPC(
  npcId: string,
  narrativeContext: NarrativeContext,
): NPCRelationship {
  if (narrativeContext.npcRelationships[npcId]) {
    return narrativeContext.npcRelationships[npcId];
  }
  
  // Create with default values
  return createNPCRelationship(
    npcId,
    npcId,  // Use ID as name if not provided
    'peer', // Default role
    0,      // Start with 0 trust
  );
}

/**
 * Apply NPC interactions from a choice
 */
export function applyNPCInteractions(
  interactions: NPCInteraction[] | undefined,
  narrativeContext: NarrativeContext,
): NarrativeContext {
  if (!interactions || interactions.length === 0) {
    return narrativeContext;
  }
  
  const updated = { ...narrativeContext };
  
  for (const interaction of interactions) {
    let npc = updated.npcRelationships[interaction.npcId];
    
    if (!npc) {
      npc = getOrCreateNPC(interaction.npcId, updated);
    }
    
    // Apply trust delta
    if (interaction.trustDelta) {
      npc = updateNPCTrust(npc, interaction.trustDelta);
    }
    
    // Apply attitude shift
    if (interaction.attitudeShift) {
      npc = updateNPCAttitude(npc, interaction.attitudeShift);
    }
    
    // Record interaction memory
    if (interaction.memory) {
      npc = recordNPCInteraction(npc, `memory_${Date.now()}`, interaction.memory);
    }
    
    updated.npcRelationships[interaction.npcId] = npc;
  }
  
  return updated;
}

/**
 * Check if player has good standing with an NPC
 */
export function hasGoodStanding(npc: NPCRelationship, minTrust: number = 50): boolean {
  return npc.trustLevel >= minTrust && npc.attitude !== 'hostile';
}

/**
 * Check if player has excellent standing with an NPC (mentor-level)
 */
export function hasMentorRelationship(npc: NPCRelationship): boolean {
  return npc.attitude === 'mentor' && npc.trustLevel >= 75;
}

/**
 * Get a summary of all NPC relationships for display
 */
export function getNPCRelationshipsSummary(
  narrativeContext: NarrativeContext,
): Array<{ npcId: string; name: string; trust: number; attitude: string }> {
  return Object.values(narrativeContext.npcRelationships || {}).map(npc => ({
    npcId: npc.npcId,
    name: npc.name,
    trust: npc.trustLevel,
    attitude: npc.attitude,
  }));
}

/**
 * Degrade all NPC relationships slightly (time passing, people forget)
 */
export function decayNPCRelationships(
  narrativeContext: NarrativeContext,
  decayFactor: number = 0.98,
): NarrativeContext {
  const updated = { ...narrativeContext };
  
  for (const npcId in updated.npcRelationships) {
    const npc = updated.npcRelationships[npcId];
    const newTrust = Math.max(0, npc.trustLevel * decayFactor);
    
    updated.npcRelationships[npcId] = {
      ...npc,
      trustLevel: newTrust,
      attitude: inferAttitudeFromTrust(newTrust, npc.attitude),
    };
  }
  
  return updated;
}
