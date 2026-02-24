'use client';

import { Physics, RigidBody } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import Scene3DContainer from '../Scene3DContainer';
import PlayerController from '../PlayerController';
import NPCCharacter from '../NPCCharacter';
import SceneTransitionDoor from '../SceneTransitionDoor';
import Desk from '../furniture/Desk';
import Chair from '../furniture/Chair';
import { COLORS } from '../../../utils/environmentBuilder';
import { useGameStore } from '../../../store/gameStore';
import { SCENARIO_POOL } from '../../../engine/scenarios';
import { useState, useEffect } from 'react';

/**
 * Scene 1: Reception Lobby
 * Maya (Receptionist) asks Q1 (Professional Background) and Q2 (Financial Situation)
 * Door transitions to Scene 2 after Q2
 */
export default function OnboardingScene1_Reception() {
  const currentScenarioId = useGameStore((state) => state.currentScenarioId);
  const makeChoice = useGameStore((state) => state.makeChoice);

  // Get current scenario
  const currentScenario = SCENARIO_POOL.find(s => s.id === currentScenarioId);

  // Track if Q2 is completed to unlock door
  const [doorUnlocked, setDoorUnlocked] = useState(false);

  // Check if we're past setup_financial (Q2)
  useEffect(() => {
    const history = useGameStore.getState().history;
    if (history.includes('setup_financial')) {
      setDoorUnlocked(true);
    }
  }, [currentScenarioId]);

  return (
    <>
      <Scene3DContainer
        cameraPosition={[6, 8, 8]}
        enableControls={true}
        backgroundColor="#e8f4f8"
      >
        <Physics>
          {/* Room Structure */}
          <Room />

          {/* Player */}
          <PlayerController spawnPosition={[0, 1, 3]} />

          {/* Maya NPC - Receptionist */}
          <NPCCharacter
            position={[0, 1, -4]}
            npcId="maya"
            modelPath="/models/npc_maya.glb"
            name="Maya"
          />

          {/* Reception Desk */}
          <Desk
            width={3}
            depth={1}
            height={0.75}
            position={[0, 0, -4]}
            color={COLORS.wood}
          />

          {/* Waiting Area */}
          <Chair position={[-2, 0, 1]} rotation={[0, 0, 0]} />
          <Chair position={[2, 0, 1]} rotation={[0, Math.PI, 0]} />

          {/* Coffee Table */}
          <RigidBody type="fixed" position={[0, 0, 1]}>
            <mesh castShadow>
              <boxGeometry args={[1, 0.4, 0.6]} />
              <meshStandardMaterial color={COLORS.wood} />
            </mesh>
          </RigidBody>

          {/* Potted Plants (corners) */}
          <Plant position={[-4, 0, -4]} />
          <Plant position={[4, 0, -4]} />

          {/* Company Logo on North Wall */}
          <Text
            position={[0, 2, -4.95]}
            fontSize={0.3}
            color="#3498db"
            anchorX="center"
            anchorY="middle"
          >
            Career Hub
          </Text>

          {/* Exit Door to Scene 2 */}
          <SceneTransitionDoor
            position={[5, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            targetScene={2}
            isUnlocked={doorUnlocked}
          />
        </Physics>
      </Scene3DContainer>

      {/* Choice Overlay - OUTSIDE Canvas */}
      {currentScenario && currentScenario.choices && (
        <ChoiceOverlay
          scenario={currentScenario}
          onChoiceClick={makeChoice}
        />
      )}
    </>
  );
}

/**
 * Room component with walls, floor, ceiling
 */
function Room() {
  const width = 12;
  const depth = 10;
  const height = 3.5;

  return (
    <group>
      {/* Floor with collision */}
      <RigidBody type="fixed" position={[0, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[width, depth]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* North wall (behind reception) */}
      <RigidBody type="fixed" position={[0, height / 2, -depth / 2]}>
        <mesh castShadow>
          <boxGeometry args={[width, height, 0.1]} />
          <meshStandardMaterial color="#d0e8f0" />
        </mesh>
      </RigidBody>

      {/* South wall */}
      <RigidBody type="fixed" position={[0, height / 2, depth / 2]}>
        <mesh castShadow>
          <boxGeometry args={[width, height, 0.1]} />
          <meshStandardMaterial color="#d0e8f0" />
        </mesh>
      </RigidBody>

      {/* West wall */}
      <RigidBody type="fixed" position={[-width / 2, height / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, height, depth]} />
          <meshStandardMaterial color="#d0e8f0" />
        </mesh>
      </RigidBody>

      {/* East wall (with door cutout - door handles collision) */}
      {/* Top section */}
      <RigidBody type="fixed" position={[width / 2, height - 0.25, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.5, depth]} />
          <meshStandardMaterial color="#d0e8f0" />
        </mesh>
      </RigidBody>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/**
 * Potted Plant decoration
 */
function Plant({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" position={position}>
      <group>
        {/* Pot */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 0.4]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>

        {/* Plant (simple sphere cluster) */}
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#2ecc71" />
        </mesh>
        <mesh position={[-0.1, 0.6, 0.1]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#27ae60" />
        </mesh>
        <mesh position={[0.1, 0.6, -0.1]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#27ae60" />
        </mesh>
      </group>
    </RigidBody>
  );
}

/**
 * Choice Overlay Component (HTML over 3D canvas)
 */
function ChoiceOverlay({
  scenario,
  onChoiceClick,
}: {
  scenario: any;
  onChoiceClick: (choiceId: string) => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        zIndex: 1000,
      }}
    >
      {scenario.choices.map((choice: any) => (
        <button
          key={choice.id}
          onClick={() => onChoiceClick(choice.id)}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            background: 'linear-gradient(135deg, #3498db, #2980b9)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            transition: 'all 0.3s',
            minWidth: '400px',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{choice.text}</div>
          {choice.description && (
            <div style={{ fontSize: '13px', opacity: 0.9 }}>{choice.description}</div>
          )}
        </button>
      ))}
    </div>
  );
}
