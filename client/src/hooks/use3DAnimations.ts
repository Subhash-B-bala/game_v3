import { useState, useEffect } from 'react';
import { GameStats } from '../engine/types';

/**
 * Animation state mapping based on game stats
 */
export interface AnimationState {
  primary: string;
  blend?: string;
  blendWeight?: number;
}

/**
 * Maps game state to appropriate character animations
 */
export function use3DAnimations(gameState: Partial<GameStats>, currentAction?: string): AnimationState {
  const [animationState, setAnimationState] = useState<AnimationState>({ primary: 'idle' });

  useEffect(() => {
    // Priority-based animation selection
    const { stress, energy, confidence } = gameState;

    // High stress overrides everything
    if (stress !== undefined && stress > 0.7) {
      setAnimationState({ primary: 'stressed' });
      return;
    }

    // Low energy shows tiredness
    if (energy !== undefined && energy < 0.3) {
      setAnimationState({ primary: 'tired' });
      return;
    }

    // Action-based animations
    if (currentAction) {
      switch (currentAction) {
        case 'working':
        case 'coding':
          setAnimationState({ primary: 'typing' });
          return;
        case 'interview':
          if (confidence !== undefined && confidence > 60) {
            setAnimationState({ primary: 'confident_talk' });
          } else {
            setAnimationState({ primary: 'nervous_talk' });
          }
          return;
        case 'celebration':
          setAnimationState({ primary: 'celebrate' });
          return;
        case 'disappointment':
          setAnimationState({ primary: 'disappointed' });
          return;
        case 'thinking':
          setAnimationState({ primary: 'thinking' });
          return;
        case 'walking':
          setAnimationState({ primary: 'walk' });
          return;
      }
    }

    // Default to idle with confidence variation
    if (confidence !== undefined && confidence > 70) {
      setAnimationState({ primary: 'idle_confident' });
    } else {
      setAnimationState({ primary: 'idle' });
    }
  }, [gameState, currentAction]);

  return animationState;
}

/**
 * Animation name mappings for different character models
 * Maps our internal animation names to actual animation clip names in GLB files
 */
export const ANIMATION_MAPPINGS: Record<string, Record<string, string>> = {
  mixamo: {
    idle: 'Idle',
    idle_confident: 'Idle',
    walk: 'Walking',
    run: 'Running',
    sit: 'Sitting',
    typing: 'Typing',
    thinking: 'Thinking',
    stressed: 'Stressed',
    tired: 'Tired',
    celebrate: 'Victory',
    disappointed: 'Defeat',
    confident_talk: 'Talking',
    nervous_talk: 'Nervous',
    wave: 'Waving',
    handshake: 'Agree',
  },
  readyPlayerMe: {
    idle: 'idle',
    walk: 'walk',
    sit: 'sit',
    typing: 'typing',
    thinking: 'thinking',
    celebrate: 'celebrate',
  },
};

/**
 * Get the actual animation clip name for a given model type
 */
export function getAnimationClipName(
  animationKey: string,
  modelType: 'mixamo' | 'readyPlayerMe' = 'mixamo'
): string {
  return ANIMATION_MAPPINGS[modelType][animationKey] || animationKey;
}

/**
 * Hook to preload animation clips
 */
export function usePreloadAnimations(modelPaths: string[]) {
  useEffect(() => {
    // Preload GLB models
    modelPaths.forEach((path) => {
      // Using dynamic import to preload
      fetch(path).catch((err) => console.warn(`Failed to preload ${path}:`, err));
    });
  }, [modelPaths]);
}
