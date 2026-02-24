import { RigidBody } from '@react-three/rapier';
import { COLORS } from '../../../utils/environmentBuilder';

interface ChairProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Office/waiting chair with seat, backrest, and legs
 * Includes physics collision
 */
export default function Chair({ position = [0, 0, 0], rotation = [0, 0, 0] }: ChairProps) {
  const legHeight = 0.5;
  const seatHeight = 0.5;
  const legPositions: [number, number, number][] = [
    [-0.2, legHeight / 2, -0.2],
    [0.2, legHeight / 2, -0.2],
    [-0.2, legHeight / 2, 0.2],
    [0.2, legHeight / 2, 0.2],
  ];

  return (
    <RigidBody type="fixed" position={position} rotation={rotation}>
      <group>
        {/* Seat */}
        <mesh position={[0, seatHeight, 0]} castShadow>
          <boxGeometry args={[0.5, 0.05, 0.5]} />
          <meshStandardMaterial color={COLORS.fabric} />
        </mesh>

        {/* Backrest */}
        <mesh position={[0, seatHeight + 0.25, -0.2]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.05]} />
          <meshStandardMaterial color={COLORS.fabric} />
        </mesh>

        {/* 4 legs */}
        {legPositions.map((pos, i) => (
          <mesh key={i} position={pos}>
            <cylinderGeometry args={[0.03, 0.03, legHeight]} />
            <meshStandardMaterial color={COLORS.metal} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  );
}
