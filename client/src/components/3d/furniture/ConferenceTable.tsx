import { RigidBody } from '@react-three/rapier';

interface ConferenceTableProps {
  position?: [number, number, number];
}

/**
 * Large conference table for boardroom
 * Metallic/glossy material with central pedestal leg
 * Includes physics collision
 */
export default function ConferenceTable({ position = [0, 0, 0] }: ConferenceTableProps) {
  const tableHeight = 0.75;

  return (
    <RigidBody type="fixed" position={position}>
      <group>
        {/* Tabletop - Dark glossy finish */}
        <mesh position={[0, tableHeight, 0]} castShadow receiveShadow>
          <boxGeometry args={[4, 0.08, 1.5]} />
          <meshStandardMaterial
            color="#1a1a1a"
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>

        {/* Central pedestal leg */}
        <mesh position={[0, tableHeight / 2, 0]}>
          <cylinderGeometry args={[0.3, 0.4, tableHeight]} />
          <meshStandardMaterial color="#2c2c2c" />
        </mesh>
      </group>
    </RigidBody>
  );
}
