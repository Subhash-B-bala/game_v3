import Scene3DContainer from './Scene3DContainer';
import PlayerCharacter from './PlayerCharacter';
import NPCCharacter from './NPCCharacter';
import { Text } from '@react-three/drei';

/**
 * Test scene to verify 3D infrastructure is working
 * This can be used for development and testing before integrating with game phases
 */
export default function Test3DScene() {
  const handleNPCClick = () => {
    console.log('NPC clicked!');
    alert('NPC interaction works! This will trigger scenarios in the full game.');
  };

  return (
    <Scene3DContainer
      enableControls={true}
      showGrid={true}
      cameraPosition={[5, 3, 8]}
    >
      {/* Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>

      {/* Player Character (using fallback geometry for now) */}
      <PlayerCharacter
        position={[0, 0, 0]}
        scale={1}
      />

      {/* NPC Character (using fallback geometry for now) */}
      <NPCCharacter
        npcId="test_npc"
        modelPath="/models/npcs/recruiter.glb" // Will fallback to geometry
        position={[3, 0, 0]}
        name="Sarah (Recruiter)"
        showNameTag={true}
        onClick={handleNPCClick}
      />

      {/* Test Text */}
      <Text
        position={[0, 3, 0]}
        fontSize={0.5}
        color="#3498db"
        anchorX="center"
        anchorY="middle"
      >
        3D Infrastructure Test
      </Text>

      {/* Instruction Text */}
      <Text
        position={[0, -1, 0]}
        fontSize={0.3}
        color="#ecf0f1"
        anchorX="center"
        anchorY="middle"
      >
        Click the NPC (red character) to test interactions
      </Text>

      {/* Some decorative cubes */}
      <mesh position={[-3, 0.5, -2]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#e74c3c" />
      </mesh>

      <mesh position={[2, 0.5, -3]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2ecc71" />
      </mesh>
    </Scene3DContainer>
  );
}
