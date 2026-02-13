/* ============================================================
   Narrative System Types — Dynamic Story Branching
   ============================================================ */

// ---- NPC System ----

export type NPCAttitude = 'hostile' | 'neutral' | 'friendly' | 'mentor';
export type NPCRole = 'recruiter' | 'mentor' | 'peer' | 'manager' | 'rival' | 'client';

/** Relationship object for a single NPC */
export interface NPCRelationship {
  npcId: string;
  name: string;
  role: NPCRole;
  trustLevel: number;        // 0-100
  attitude: NPCAttitude;
  sharedHistory: string[];   // scenario IDs they've interacted in
  
  // Context for NPC memory
  metadata?: {
    company?: string;
    title?: string;
    lastMeetAt?: number;     // game ticks
    memories?: string[];     // Specific events they remember
  };
}

// ---- Branch Conditions ----

/** Condition to show a scenario branch */
export type BranchCondition = 
  | { type: 'flag'; flag: string; value: boolean }
  | { type: 'stat'; stat: keyof Omit<StateVector, 'emotionalState'>; min?: number; max?: number }
  | { type: 'stat_equal'; stat: keyof Omit<StateVector, 'emotionalState'>; value: number }
  | { type: 'emotional'; state: EmotionalState }
  | { type: 'npcRelation'; npcId: string; minTrust?: number; attitude?: NPCAttitude }
  | { type: 'eventHistory'; scenarioId: string; choiceId?: string }
  | { type: 'threadActive'; threadId: string }
  | { type: 'AND'; conditions: BranchCondition[] }
  | { type: 'OR'; conditions: BranchCondition[] }
  | { type: 'NOT'; condition: BranchCondition };

// ---- Scenario Branching ----

/** An NPC interaction within a choice */
export interface NPCInteraction {
  npcId: string;
  trustDelta?: number;       // -50 to +50
  attitudeShift?: NPCAttitude;
  memory?: string;           // Specific thing they'll remember
}

/** Extended Choice with narrative effects */
export interface NarrativeChoice {
  id: string;
  text: string;
  description?: string;
  
  // Narrative flavor
  narrativeContext?: string;  // Optional text explaining WHY this choice matters
  
  // Original effects
  fx?: Record<string, number>;
  time?: number;
  energyCost?: number;
  
  // NPC interactions
  npcInteractions?: NPCInteraction[];
  
  // Flags set by this choice
  flags?: Record<string, boolean>;
  
  // This choice unlocks/triggers
  unlocks?: {
    scenarios?: string[];
    threads?: string[];
    events?: string[];
  };
}

/** A variant of a scenario with conditions */
export interface ScenarioBranch {
  id: string;  // e.g., "variant_mentor" or "variant_desperate"
  
  // Conditions to show this branch
  conditions: BranchCondition[];
  
  // Override the scenario for this path
  variantTitle?: string;
  variantText?: string;
  variantContext?: string;    // Extra narrative context
  variantChoices?: NarrativeChoice[];
  
  // NPC message/tone
  npcMessage?: string;        // Special thing the NPC says in this variant
}

/** Extended Scenario with branching support */
export interface BranchingScenario {
  id: string;
  phase: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  
  // Base scenario
  title: string;
  text: string;
  avatar: string;
  
  // Branching system
  branches?: ScenarioBranch[];
  
  // NPC involved in this scenario
  primaryNPC?: string;        // npcId of the main character
  
  // Thread this belongs to
  threadId?: string;
  threadChapter?: number;
  
  // Choices (used if no branches match)
  choices: NarrativeChoice[];
}

// ---- Narrative Threads ----

/** A chapter within a narrative thread */
export interface ThreadChapter {
  order: number;
  scenarioId: string;
  title: string;
  
  // Show this chapter only if conditions met
  triggerConditions?: BranchCondition[];
  
  // What happens when player completes this chapter
  onComplete?: {
    unlocks?: string[];       // Scenario IDs unlocked
    nextChapters?: number[];  // Which chapters can follow
    npcEffect?: {
      npcId: string;
      trust: number;
      attitude?: NPCAttitude;
    }[];
    globalFlag?: string;      // Set a game flag
    globalFlags?: Record<string, boolean>;
  };
}

/** Ending possibility in a narrative thread */
export interface ThreadEnding {
  id: string;
  title: string;
  description: string;
  
  // Condition to get this ending
  condition: BranchCondition[];
  
  // What this ending unlocks
  rewards?: {
    globalFlags?: Record<string, boolean>;
    statBonuses?: Record<string, number>;
    npcRelationUpdates?: { npcId: string; trust: number; attitude: NPCAttitude }[];
  };
}

/** A narrative arc connecting multiple scenarios */
export interface NarrativeThread {
  id: string;
  name: string;
  description?: string;
  
  // The starting point
  startScenario: string;
  startConditions?: BranchCondition[];  // When to offer this thread
  
  // The story
  chapters: ThreadChapter[];
  endings: ThreadEnding[];
  
  // NPCs involved in this thread
  keyNPCs?: string[];
  
  // Category (for UI/analytics)
  category?: 'job_pursuit' | 'skill_development' | 'relationship' | 'crisis' | 'opportunity';
  
  // Exclusivity options
  canBeBranching?: boolean;  // Can player pursue this AND other threads?
  maxPlayers?: number;       // Career limiting scenarios
}

// ---- Narrative Context ----

/** Lives in GameState - tracks narrative progression */
export interface NarrativeContext {
  // Active and completed threads
  activeThreads: string[];           // thread IDs currently in progress
  completedThreads: {
    threadId: string;
    endingId: string;
    completedAt: number;  // game ticks
  }[];
  
  // NPC relationships
  npcRelationships: Record<string, NPCRelationship>;
  
  // Scenario history (for branching logic)
  scenarioHistory: {
    scenarioId: string;
    choiceId: string;
    at: number;  // game ticks
  }[];
  
  // Narrative flags (things the story remembers about player)
  narrativeFlags: Record<string, boolean>;
  
  // Branch locks (prevent certain paths)
  lockedBranches?: string[];  // scenario IDs with locked branches
}

// ---- Scenario Selection Logic ----

export interface ScenarioSelectionContext {
  /**
   * Prioritize scenarios based on:
   * 1. Active narrative threads (continue the story)
   * 2. Triggered parallel stories (new threads unlocked)
   * 3. Contextually relevant pool (matching player difficulty/stats)
   */
  activeThread?: {
    threadId: string;
    nextChapterId: number;
  };
  
  triggeredThreads?: string[];  // New threads the player unlocked
  
  availablePool?: string[];     // Scenarios player can take
}
