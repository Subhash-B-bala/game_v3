'use client';

import { Physics, RigidBody } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import Scene3DContainer from '../Scene3DContainer';
import PlayerController from '../PlayerController';
import NPCCharacter from '../NPCCharacter';
import SceneTransitionDoor from '../SceneTransitionDoor';
import ConferenceTable from '../furniture/ConferenceTable';
import Chair from '../furniture/Chair';
import { useGameStore } from '../../../store/gameStore';
import { SCENARIO_POOL } from '../../../engine/scenarios';
import { useState, useEffect } from 'react';

/**
 * Scene 3: Executive Boardroom
 * Dravid asks Q6 (Target Company) and Q7 (Mental State)
 * Exit door appears after Q7 → transitions to Roadmap
 */
export default function OnboardingScene3_Boardroom() {
  const currentScenarioId = useGameStore((state) => state.currentScenarioId);
  const makeChoice = useGameStore((state) => state.makeChoice);

  const currentScenario = SCENARIO_POOL.find(s => s.id === currentScenarioId);

  const [showConfetti, setShowConfetti] = useState(false);
  const [exitUnlocked, setExitUnlocked] = useState(false);

  useEffect(() => {
    const history = useGameStore.getState().history;
    if (history.includes('setup_pressure')) {
      setExitUnlocked(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [currentScenarioId]);

  return (
    <>
      <Scene3DContainer
        cameraPosition={[0, 10, 10]}
        enableControls={true}
        backgroundColor="#1a1a2e"
      >
        <Physics>
          <Room />
          <PlayerController spawnPosition={[0, 1, 3]} />

          {/* Dravid NPC - Career Mentor */}
          <NPCCharacter
            position={[0, 1, -3]}
            npcId="dravid"
            modelPath="/models/npc_dravid.glb"
            name="Dravid"
          />

          {/* Conference Table */}
          <ConferenceTable position={[0, 0, -2]} />

          {/* Chairs around table */}
          <Chair position={[-1.5, 0, -1.5]} rotation={[0, -Math.PI / 4, 0]} />
          <Chair position={[1.5, 0, -1.5]} rotation={[0, Math.PI / 4, 0]} />
          <Chair position={[-1.5, 0, -2.5]} rotation={[0, -Math.PI / 4, 0]} />
          <Chair position={[1.5, 0, -2.5]} rotation={[0, Math.PI / 4, 0]} />

          {/* City Window View */}
          <CityWindow />

          {/* Entrance Door */}
          <SceneTransitionDoor
            position={[-6, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            targetScene={2}
            isUnlocked={true}
          />

          {/* Exit Door */}
          {exitUnlocked && (
            <SceneTransitionDoor
              position={[6, 0, 0]}
              rotation={[0, -Math.PI / 2, 0]}
              targetScene="roadmap"
              isUnlocked={true}
            />
          )}

          {/* Confetti Effect */}
          {showConfetti && <Confetti />}

          {/* Dramatic window light */}
          <directionalLight
            position={[0, 5, -5]}
            intensity={1.5}
            color="#aaccff"
            castShadow
          />
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
  const width = 14;
  const depth = 8;
  const height = 4;

  return (
    <group>
      <RigidBody type="fixed" position={[0, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[width, depth]} />
          <meshStandardMaterial color="#2c3e50" roughness={0.6} metalness={0.2} />
        </mesh>
      </RigidBody>

      {/* North wall with window */}
      <RigidBody type="fixed" position={[0, height / 2, -depth / 2]}>
        <mesh>
          <boxGeometry args={[width, height, 0.1]} />
          <meshStandardMaterial color="#34495e" transparent opacity={0.3} />
        </mesh>
      </RigidBody>

      {/* Other walls */}
      <RigidBody type="fixed" position={[0, height / 2, depth / 2]}>
        <mesh castShadow>
          <boxGeometry args={[width, height, 0.1]} />
          <meshStandardMaterial color="#34495e" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" position={[-width / 2, height / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, height, depth]} />
          <meshStandardMaterial color="#34495e" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" position={[width / 2, height / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, height, depth]} />
          <meshStandardMaterial color="#34495e" />
        </mesh>
      </RigidBody>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#1c2833" />
      </mesh>
    </group>
  );
}

function CityWindow() {
  return (
    <group position={[0, 2, -3.95]}>
      {/* Skyline gradient */}
      <mesh>
        <planeGeometry args={[12, 3]} />
        <meshBasicMaterial color="#4a90e2" />
      </mesh>

      {/* Simple city buildings */}
      {[-4, -2, 0, 2, 4].map((x, i) => (
        <mesh key={i} position={[x, -0.5, 0.01]}>
          <planeGeometry args={[0.8, 1.5 + Math.random()]} />
          <meshBasicMaterial color="#2c3e50" opacity={0.8} transparent />
        </mesh>
      ))}

      <Text position={[0, -1.3, 0.02]} fontSize={0.12} color="#ffffff">
        Your Future Awaits
      </Text>
    </group>
  );
}

function Confetti() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    x: (Math.random() - 0.5) * 10,
    y: 3 + Math.random() * 2,
    z: (Math.random() - 0.5) * 6,
    color: ['#f39c12', '#e74c3c', '#3498db', '#2ecc71'][Math.floor(Math.random() * 4)],
  }));

  return (
    <group>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <boxGeometry args={[0.1, 0.1, 0.02]} />
          <meshBasicMaterial color={p.color} />
        </mesh>
      ))}
    </group>
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
            background: 'linear-gradient(135deg, #f1c40f, #f39c12)',
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
