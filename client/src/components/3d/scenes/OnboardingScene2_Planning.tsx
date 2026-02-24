'use client';

import { Physics, RigidBody } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import Scene3DContainer from '../Scene3DContainer';
import PlayerController from '../PlayerController';
import NPCCharacter from '../NPCCharacter';
import SceneTransitionDoor from '../SceneTransitionDoor';
import Desk from '../furniture/Desk';
import { COLORS } from '../../../utils/environmentBuilder';
import { useGameStore } from '../../../store/gameStore';
import { SCENARIO_POOL } from '../../../engine/scenarios';
import { useState, useEffect } from 'react';

/**
 * Scene 2: Career Planning Office
 * Arjun asks Q3 (Technical Track)
 * Priya asks Q4 (Confidence) and Q5 (Risk Appetite)
 * Door transitions to Scene 3 after Q5
 */
export default function OnboardingScene2_Planning() {
  const currentScenarioId = useGameStore((state) => state.currentScenarioId);
  const makeChoice = useGameStore((state) => state.makeChoice);

  const currentScenario = SCENARIO_POOL.find(s => s.id === currentScenarioId);

  // Track if Q5 is completed to unlock door
  const [doorUnlocked, setDoorUnlocked] = useState(false);

  useEffect(() => {
    const history = useGameStore.getState().history;
    if (history.includes('setup_risk')) {
      setDoorUnlocked(true);
    }
  }, [currentScenarioId]);

  return (
    <>
      <Scene3DContainer
        cameraPosition={[5, 6, 6]}
        enableControls={true}
        backgroundColor="#fff5e6"
      >
        <Physics>
          <Room />
          <PlayerController spawnPosition={[0, 1, 2]} />

          {/* Arjun NPC - Tech Counselor (left desk) */}
          <NPCCharacter
            position={[-2, 1, -2.5]}
            npcId="arjun"
            modelPath="/models/npc_arjun.glb"
            name="Arjun"
          />

          {/* Priya NPC - Strategy Counselor (right desk) */}
          <NPCCharacter
            position={[2, 1, -2.5]}
            npcId="priya"
            modelPath="/models/npc_priya.glb"
            name="Priya"
          />

          {/* Arjun's Desk */}
          <Desk width={2} depth={1} position={[-2, 0, -3]} />
          <Computer position={[-2, 0.8, -3]} />

          {/* Priya's Desk */}
          <Desk width={2} depth={1} position={[2, 0, -3]} />
          <Computer position={[2, 0.8, -3]} />

          {/* Whiteboard */}
          <Whiteboard />

          {/* Bookshelf */}
          <Bookshelf position={[-4, 0, -4]} />

          {/* Doors */}
          <SceneTransitionDoor
            position={[-5, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            targetScene={2 as any}
            isUnlocked={true}
          />
          <SceneTransitionDoor
            position={[5, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            targetScene={3}
            isUnlocked={doorUnlocked}
          />

          {/* Point Lights at desks */}
          <pointLight position={[-2, 2, -3]} intensity={0.5} color="#f39c12" />
          <pointLight position={[2, 2, -3]} intensity={0.5} color="#2ecc71" />
        </Physics>
      </Scene3DContainer>

      {/* Choice Overlay - OUTSIDE Canvas */}
      {currentScenario && currentScenario.choices && (
        <ChoiceOverlay scenario={currentScenario} onChoiceClick={makeChoice} />
      )}
    </>
  );
}

function Room() {
  const width = 10;
  const depth = 12;
  const height = 3.5;

  return (
    <group>
      <RigidBody type="fixed" position={[0, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[width, depth]} />
          <meshStandardMaterial color="#fef5e7" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Walls */}
      <RigidBody type="fixed" position={[0, height / 2, -depth / 2]}>
        <mesh castShadow>
          <boxGeometry args={[width, height, 0.1]} />
          <meshStandardMaterial color="#fadbd8" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" position={[0, height / 2, depth / 2]}>
        <mesh castShadow>
          <boxGeometry args={[width, height, 0.1]} />
          <meshStandardMaterial color="#fadbd8" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" position={[-width / 2, height / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, height, depth]} />
          <meshStandardMaterial color="#fadbd8" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" position={[width / 2, height / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, height, depth]} />
          <meshStandardMaterial color="#fadbd8" />
        </mesh>
      </RigidBody>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function Computer({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.4, 0.3, 0.05]} />
        <meshStandardMaterial color="#222" emissive="#4488ff" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, -0.2, 0.1]}>
        <boxGeometry args={[0.3, 0.02, 0.15]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

function Whiteboard() {
  return (
    <group position={[0, 1.5, -4.95]}>
      <mesh>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      <Text position={[0, 0.5, 0.01]} fontSize={0.15} color="#2980b9">
        Analyst → Engineer → ML
      </Text>
    </group>
  );
}

function Bookshelf({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" position={position}>
      <group>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.8, 1, 0.3]} />
          <meshStandardMaterial color={COLORS.darkWood} />
        </mesh>
        {[0.2, 0.5, 0.8].map((h, i) => (
          <mesh key={i} position={[0, h, 0]}>
            <boxGeometry args={[0.75, 0.02, 0.28]} />
            <meshStandardMaterial color={COLORS.wood} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  );
}

function ChoiceOverlay({ scenario, onChoiceClick }: { scenario: any; onChoiceClick: (id: string) => void }) {
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
            background: 'linear-gradient(135deg, #f39c12, #e67e22)',
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
