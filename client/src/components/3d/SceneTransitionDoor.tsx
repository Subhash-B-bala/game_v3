import { RigidBody } from '@react-three/rapier';
import { useState } from 'react';
import InteractiveObject from './InteractiveObject';
import { useGameStore } from '../../store/gameStore';

interface SceneTransitionDoorProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  targetScene: 2 | 3 | 'roadmap';
  isUnlocked?: boolean;
}

/**
 * Door component with glow effect when unlocked
 * Transitions between onboarding scenes or exits to roadmap
 */
export default function SceneTransitionDoor({
  position,
  rotation = [0, 0, 0],
  targetScene,
  isUnlocked = true,
}: SceneTransitionDoorProps) {
  const [hovered, setHovered] = useState(false);
  const setOnboardingScene = useGameStore((state) => state.setOnboardingScene);
  const setUiPhase = useGameStore((state) => state.setUiPhase);

  const handleClick = () => {
    if (!isUnlocked) return;

    if (targetScene === 'roadmap') {
      setUiPhase('roadmap');
    } else {
      setOnboardingScene(targetScene);
    }
  };

  const doorColor = isUnlocked ? (hovered ? '#44ff88' : '#22cc66') : '#666666';
  const emissiveIntensity = isUnlocked ? (hovered ? 0.6 : 0.3) : 0;

  return (
    <InteractiveObject
      name={isUnlocked ? 'Enter Next Room' : 'Locked'}
      position={position}
      onInteract={handleClick}
      glowColor={doorColor}
    >
      <RigidBody type="fixed" rotation={rotation}>
        <group
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          {/* Door frame */}
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[0.1, 2, 0.8]} />
            <meshStandardMaterial
              color={doorColor}
              emissive={doorColor}
              emissiveIntensity={emissiveIntensity}
              roughness={0.4}
            />
          </mesh>

          {/* Door handle */}
          <mesh position={[-0.05, 1, 0.3]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      </RigidBody>
    </InteractiveObject>
  );
}
