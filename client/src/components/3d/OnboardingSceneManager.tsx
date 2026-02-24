'use client';

import { useGameStore } from '../../store/gameStore';
import dynamic from 'next/dynamic';

// Dynamically import scenes to prevent SSR issues with Three.js
const OnboardingScene1_Reception = dynamic(() => import('./scenes/OnboardingScene1_Reception'), { ssr: false });
const OnboardingScene2_Planning = dynamic(() => import('./scenes/OnboardingScene2_Planning'), { ssr: false });
const OnboardingScene3_Boardroom = dynamic(() => import('./scenes/OnboardingScene3_Boardroom'), { ssr: false });

/**
 * Manages the 3D onboarding scenes
 * Switches between Reception → Planning → Boardroom based on game state
 */
export default function OnboardingSceneManager() {
  const onboardingScene = useGameStore((state) => state.onboardingScene);

  // Render current scene
  switch (onboardingScene) {
    case 1:
      return <OnboardingScene1_Reception />;
    case 2:
      return <OnboardingScene2_Planning />;
    case 3:
      return <OnboardingScene3_Boardroom />;
    default:
      return <OnboardingScene1_Reception />;
  }
}
