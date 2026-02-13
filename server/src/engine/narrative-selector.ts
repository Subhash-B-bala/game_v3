/* ============================================================
   Narrative Scenario Selector — Pick Next Scenario Responsively
   ============================================================ */

import type {
  NarrativeThread,
  ThreadChapter,
  NarrativeContext,
  ScenarioSelectionContext,
} from '../../shared/narrative.types';
import type { StateVector } from '../../shared/types';
import type { BranchCondition } from '../../shared/narrative.types';

// For evaluating conditions (reuse from branch-resolver)
import { evaluateConditionFromExternal } from './branch-resolver';

/**
 * Find which narrative threads are now active for the player
 * (based on completed scenarios and unlocks)
 */
export function findTriggeredThreads(
  availableThreads: NarrativeThread[],
  narrativeContext: NarrativeContext,
  completedScenarios: string[],
  stateVector: StateVector,
): string[] {
  const triggered: string[] = [];
  
  for (const thread of availableThreads) {
    // Already active or completed
    if (
      narrativeContext.activeThreads.includes(thread.id) ||
      narrativeContext.completedThreads.some(t => t.threadId === thread.id)
    ) {
      continue;
    }
    
    // Check start conditions
    if (thread.startConditions) {
      const conditionsMet = thread.startConditions.every(condition =>
        evaluateConditionSimple(condition, stateVector, narrativeContext),
      );
      
      if (!conditionsMet) continue;
    }
    
    // Check if start scenario is completed
    if (!completedScenarios.includes(thread.startScenario)) {
      continue;
    }
    
    // This thread is now available!
    triggered.push(thread.id);
  }
  
  return triggered;
}

/**
 * Get the next chapter to play in an active thread
 */
export function getNextThreadChapter(
  thread: NarrativeThread,
  narrativeContext: NarrativeContext,
  completedScenarios: string[],
  stateVector: StateVector,
): ThreadChapter | null {
  // Find chapters we haven't completed yet
  for (const chapter of thread.chapters) {
    // Already completed this scenario
    if (completedScenarios.includes(chapter.scenarioId)) {
      continue;
    }
    
    // Check if trigger conditions are met
    if (chapter.triggerConditions) {
      const conditionsMet = chapter.triggerConditions.every(condition =>
        evaluateConditionSimple(condition, stateVector, narrativeContext),
      );
      
      if (!conditionsMet) {
        continue;  // Can't play this chapter yet
      }
    }
    
    // This is the next chapter
    return chapter;
  }
  
  return null;  // All chapters completed
}

/**
 * Check if a thread can have a follow-up based on player's previous choice
 */
export function canContinueThread(
  thread: NarrativeThread,
  narrativeContext: NarrativeContext,
  completedScenarios: string[],
  stateVector: StateVector,
  lastChoiceScenarioId?: string,
  lastChoiceId?: string,
): boolean {
  // If thread is completed, can't continue
  if (narrativeContext.completedThreads.some(t => t.threadId === thread.id)) {
    return false;
  }
  
  // There must be an incomplete chapter with met conditions
  return getNextThreadChapter(thread, narrativeContext, completedScenarios, stateVector) !== null;
}

/**
 * Build the selection context for the next scenario
 * This determines what the game engine should offer to the player
 */
export function buildScenarioSelectionContext(
  availableThreads: NarrativeThread[],
  narrativeContext: NarrativeContext,
  stateVector: StateVector,
  completedScenarios: string[],
): ScenarioSelectionContext {
  const context: ScenarioSelectionContext = {};
  
  // 1. Check active threads first
  if (narrativeContext.activeThreads.length > 0) {
    const activeThreadId = narrativeContext.activeThreads[0];  // Primary active thread
    const thread = availableThreads.find(t => t.id === activeThreadId);
    
    if (thread) {
      const nextChapter = getNextThreadChapter(thread, narrativeContext, completedScenarios, stateVector);
      
      if (nextChapter) {
        context.activeThread = {
          threadId: activeThreadId,
          nextChapterId: nextChapter.order,
        };
        
        return context;  // Prioritize active thread
      }
    }
  }
  
  // 2. Check for newly triggered threads
  const triggered = findTriggeredThreads(
    availableThreads,
    narrativeContext,
    completedScenarios,
    stateVector,
  );
  
  if (triggered.length > 0) {
    context.triggeredThreads = triggered;
  }
  
  // 3. Otherwise, offer available pool scenarios
  // (These would be generic scenarios filtered by difficulty/playstyle)
  
  return context;
}

/**
 * Get the next scenario ID to show to the player
 * considering narrative threads and context
 */
export function getNextScenarioId(
  availableThreads: NarrativeThread[],
  narrativeContext: NarrativeContext,
  stateVector: StateVector,
  completedScenarios: string[],
  poolScenarios?: string[],  // Fallback generic scenarios
): string | null {
  const context = buildScenarioSelectionContext(
    availableThreads,
    narrativeContext,
    stateVector,
    completedScenarios,
  );
  
  // 1. Continue active thread if available
  if (context.activeThread) {
    const thread = availableThreads.find(t => t.id === context.activeThread!.threadId);
    const chapter = thread?.chapters[context.activeThread.nextChapterId - 1];
    
    if (chapter && !completedScenarios.includes(chapter.scenarioId)) {
      return chapter.scenarioId;
    }
  }
  
  // 2. Start a triggered thread
  if (context.triggeredThreads && context.triggeredThreads.length > 0) {
    const threadId = context.triggeredThreads[0];
    const thread = availableThreads.find(t => t.id === threadId);
    
    if (thread && thread.chapters[0]) {
      return thread.chapters[0].scenarioId;
    }
  }
  
  // 3. Fall back to pool
  if (poolScenarios && poolScenarios.length > 0) {
    // Pick a random pool scenario that hasn't been played recently
    // (In production, this would filter by difficulty/playstyle)
    return poolScenarios[Math.floor(Math.random() * poolScenarios.length)];
  }
  
  return null;
}

/**
 * Advance a narrative thread: mark chapter complete and check for endings
 */
export function advanceThread(
  thread: NarrativeThread,
  completedChapterOrder: number,
  narrativeContext: NarrativeContext,
  stateVector: StateVector,
): {
  updatedContext: NarrativeContext;
  threadComplete: boolean;
  endingId?: string;
} {
  const updated = { ...narrativeContext };
  
  // Find the chapter that was completed
  const completedChapter = thread.chapters.find(c => c.order === completedChapterOrder);
  
  if (completedChapter?.onComplete) {
    // Apply thread completion effects
    if (completedChapter.onComplete.globalFlag) {
      updated.narrativeFlags[completedChapter.onComplete.globalFlag] = true;
    }
    
    if (completedChapter.onComplete.globalFlags) {
      Object.assign(updated.narrativeFlags, completedChapter.onComplete.globalFlags);
    }
    
    // Apply NPC effects (handled elsewhere, but could update here)
  }
  
  // Check if thread is complete
  // (all chapters done or ending condition met)
  let endingId: string | undefined;
  let isComplete = true;
  
  // Check if there are unfinished chapters with met conditions
  for (const chapter of thread.chapters) {
    if (chapter.order <= completedChapterOrder) continue;
    
    // Check trigger conditions for this chapter
    if (chapter.triggerConditions) {
      const canReach = chapter.triggerConditions.every(c =>
        evaluateConditionSimple(c, stateVector, updated),
      );
      
      if (canReach) {
        isComplete = false;  // There's more to do
        break;
      }
    } else {
      isComplete = false;  // Unconditional chapter ahead
      break;
    }
  }
  
  // Check for endings
  if (isComplete) {
    for (const ending of thread.endings) {
      const meetsCondition = ending.condition.every(c =>
        evaluateConditionSimple(c, stateVector, updated),
      );
      
      if (meetsCondition) {
        endingId = ending.id;
        break;  // First matching ending
      }
    }
  }
  
  // Update state
  if (endingId) {
    // Thread is complete
    updated.activeThreads = updated.activeThreads.filter(id => id !== thread.id);
    updated.completedThreads.push({
      threadId: thread.id,
      endingId,
      completedAt: Date.now(),
    });
  }
  
  return {
    updatedContext: updated,
    threadComplete: isComplete,
    endingId,
  };
}

/**
 * Simple condition evaluator (reuses logic from branch-resolver)
 * Simplified to not require circular dependency imports
 */
function evaluateConditionSimple(
  condition: BranchCondition,
  stateVector: StateVector,
  narrativeContext: NarrativeContext,
): boolean {
  // This would reuse logic from branch-resolver.ts
  // Simplified inline for now
  
  if (condition.type === 'flag') {
    return narrativeContext.narrativeFlags[condition.flag] === condition.value;
  }
  
  if (condition.type === 'stat') {
    const val = stateVector[condition.stat as keyof StateVector];
    if (typeof val !== 'number') return false;
    if (condition.min !== undefined && val < condition.min) return false;
    if (condition.max !== undefined && val > condition.max) return false;
    return true;
  }
  
  // Add other condition types as needed
  
  return false;
}
