import { useState, ReactNode } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface InteractiveObjectProps {
  children: ReactNode;
  name: string;
  onInteract: () => void;
  position?: [number, number, number];
  showPrompt?: boolean;
  glowColor?: string;
}

/**
 * Interactive Object Base Component
 * Provides hover effects, click handling, and interaction prompts
 */
export default function InteractiveObject({
  children,
  name,
  onInteract,
  position = [0, 0, 0],
  showPrompt = true,
  glowColor = '#4488ff',
}: InteractiveObjectProps) {
  const [hovered, setHovered] = useState(false);

  const handleClick = (e: any) => {
    e?.stopPropagation?.();
    onInteract();
  };

  return (
    <group position={position}>
      {/* Main object with hover effect */}
      <group
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {children}

        {/* Glow effect when hovered */}
        {hovered && (
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2.2, 2.2, 2.2]} />
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={0.15}
              side={THREE.BackSide}
            />
          </mesh>
        )}
      </group>

      {/* Interaction prompt */}
      {hovered && showPrompt && (
        <group position={[0, 1.5, 0]}>
          {/* Background panel */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[name.length * 0.15 + 0.6, 0.4]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.7} />
          </mesh>

          {/* Text */}
          <Text
            position={[0, 0, 0]}
            fontSize={0.2}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {`[E] ${name}`}
          </Text>
        </group>
      )}

      {/* Highlight ring at base when hovered */}
      {hovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[1, 1.2, 32]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
