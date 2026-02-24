import { useRef } from 'react';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';

interface SpriteCharacterProps {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  texturePath?: string;
}

/**
 * 2D Sprite Character Component
 * Uses billboard to always face the camera (like classic RPG sprites)
 */
export default function SpriteCharacter({
  position = [0, 0, 0],
  scale = 1,
  color = '#3498db',
  texturePath,
}: SpriteCharacterProps) {
  return (
    <Billboard position={position} follow={true} lockX={false} lockY={false} lockZ={false}>
      {texturePath ? (
        <SpriteWithTexture texturePath={texturePath} scale={scale} />
      ) : (
        <SimpleSpriteShape color={color} scale={scale} />
      )}
    </Billboard>
  );
}

/**
 * Sprite with texture image
 */
function SpriteWithTexture({ texturePath, scale }: { texturePath: string; scale: number }) {
  const texture = new THREE.TextureLoader().load(texturePath);
  texture.magFilter = THREE.NearestFilter; // Pixel-perfect rendering
  texture.minFilter = THREE.NearestFilter;

  return (
    <mesh scale={[scale, scale * 1.5, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent={true}
        side={THREE.DoubleSide}
        alphaTest={0.5}
        // Remove white background by using color key
      />
    </mesh>
  );
}

/**
 * Simple placeholder sprite (colored shape)
 * Used until real sprite art is available
 */
function SimpleSpriteShape({ color, scale }: { color: string; scale: number }) {
  return (
    <group scale={[scale, scale, scale]}>
      {/* Head */}
      <mesh position={[0, 0.6, 0]}>
        <circleGeometry args={[0.15, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      {/* Body */}
      <mesh position={[0, 0.2, 0]}>
        <planeGeometry args={[0.35, 0.5]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.22, 0.25, 0]}>
        <planeGeometry args={[0.1, 0.35]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.22, 0.25, 0]}>
        <planeGeometry args={[0.1, 0.35]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.1, -0.15, 0]}>
        <planeGeometry args={[0.12, 0.4]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.1, -0.15, 0]}>
        <planeGeometry args={[0.12, 0.4]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      {/* Shadow circle removed - user doesn't want it */}
    </group>
  );
}
