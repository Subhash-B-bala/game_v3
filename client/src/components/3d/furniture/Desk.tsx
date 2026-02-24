import { RigidBody } from '@react-three/rapier';
import { COLORS } from '../../../utils/environmentBuilder';

interface DeskProps {
  width?: number;
  depth?: number;
  height?: number;
  position?: [number, number, number];
  color?: string;
}

/**
 * Configurable desk with tabletop and 4 cylindrical legs
 * Includes physics collision
 */
export default function Desk({
  width = 2,
  depth = 1,
  height = 0.75,
  position = [0, 0, 0],
  color = COLORS.wood,
}: DeskProps) {
  const legPositions: [number, number, number][] = [
    [-width / 2 + 0.1, height / 2, -depth / 2 + 0.1],
    [width / 2 - 0.1, height / 2, -depth / 2 + 0.1],
    [-width / 2 + 0.1, height / 2, depth / 2 - 0.1],
    [width / 2 - 0.1, height / 2, depth / 2 - 0.1],
  ];

  return (
    <RigidBody type="fixed" position={position}>
      <group>
        {/* Tabletop */}
        <mesh position={[0, height, 0]} castShadow>
          <boxGeometry args={[width, 0.05, depth]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>

        {/* 4 legs at corners */}
        {legPositions.map((pos, i) => (
          <mesh key={i} position={pos}>
            <cylinderGeometry args={[0.05, 0.05, height]} />
            <meshStandardMaterial color={COLORS.darkWood} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  );
}
