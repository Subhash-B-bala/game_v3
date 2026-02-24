import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Text } from '@react-three/drei';
import * as THREE from 'three';

interface NPCCharacterProps {
  npcId: string;
  modelPath: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  animation?: string;
  name?: string;
  showNameTag?: boolean;
  onClick?: () => void;
}

/**
 * NPC character component
 * Displays non-player characters with animations and name tags
 */
export default function NPCCharacter({
  npcId,
  modelPath,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  animation = 'idle',
  name,
  showNameTag = true,
  onClick,
}: NPCCharacterProps) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
  }, [hovered]);

  try {
    const { scene, animations } = useGLTF(modelPath);
    const { actions, mixer } = useAnimations(animations, group);

    // Play animation
    useEffect(() => {
      if (animation && actions[animation]) {
        const action = actions[animation];
        if (action) {
          action.reset().play();
        }
      }
    }, [animation, actions]);

    // Update animation mixer
    useFrame((state, delta) => {
      if (mixer) {
        mixer.update(delta);
      }
    });

    return (
      <group
        ref={group}
        position={position}
        rotation={rotation}
        scale={scale}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <primitive object={scene} castShadow receiveShadow />

        {/* Name Tag */}
        {showNameTag && name && (
          <Text
            position={[0, 2.2, 0]}
            fontSize={0.3}
            color={hovered ? '#ffd700' : '#ffffff'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {name}
          </Text>
        )}

        {/* Interaction Indicator */}
        {hovered && (
          <mesh position={[0, 0.1, 0]}>
            <ringGeometry args={[0.8, 1, 32]} />
            <meshBasicMaterial color="#ffd700" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    );
  } catch (error) {
    console.warn(`Failed to load NPC model for ${npcId}, using fallback:`, error);
    // Fallback geometry
    return (
      <group
        ref={group}
        position={position}
        rotation={rotation}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <mesh castShadow>
          <capsuleGeometry args={[0.5, 1, 4, 8]} />
          <meshStandardMaterial color="#e74c3c" />
        </mesh>
        {showNameTag && name && (
          <Text position={[0, 2, 0]} fontSize={0.3} color="#ffffff" anchorX="center">
            {name}
          </Text>
        )}
      </group>
    );
  }
}
