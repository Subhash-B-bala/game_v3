import { useState, useCallback } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import Scene3DContainer from './Scene3DContainer';
import PlayerCharacter from './PlayerCharacter';
import { useGameStore } from '@/store/gameStore';
import { SCENARIO_POOL } from '@/engine/scenarios';

/**
 * 3D Onboarding World - Career Preparation Center
 * 7 interactive zones for character setup, replacing text-based MCQ
 */
export default function OnboardingWorld() {
  const [currentZone, setCurrentZone] = useState<number>(0);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 0, 8]);
  const makeChoice = useGameStore((state) => state.makeChoice);
  const currentScenarioId = useGameStore((state) => state.currentScenarioId);
  const currentScenario = SCENARIO_POOL.find(s => s.id === currentScenarioId);

  // Zone configuration based on ONBOARDING_SEQUENCE
  const zones = [
    {
      id: 'setup_background',
      name: 'Origin Story Room',
      position: [0, 0, 0] as [number, number, number],
      color: '#3498db',
      icon: '👤',
      description: 'Choose your professional background',
    },
    {
      id: 'setup_financial',
      name: 'Financial Planning Office',
      position: [6, 0, 0] as [number, number, number],
      color: '#2ecc71',
      icon: '💰',
      description: 'Set your financial runway',
    },
    {
      id: 'setup_role',
      name: 'Tech Lab',
      position: [12, 0, 0] as [number, number, number],
      color: '#9b59b6',
      icon: '💻',
      description: 'Select your technical track',
    },
    {
      id: 'setup_confidence',
      name: 'Skill Assessment Center',
      position: [0, 0, -6] as [number, number, number],
      color: '#e67e22',
      icon: '📊',
      description: 'Rate your confidence level',
    },
    {
      id: 'setup_risk',
      name: 'Risk Chamber',
      position: [6, 0, -6] as [number, number, number],
      color: '#e74c3c',
      icon: '🎲',
      description: 'Choose your risk appetite',
    },
    {
      id: 'setup_target',
      name: 'Company Showcase',
      position: [12, 0, -6] as [number, number, number],
      color: '#1abc9c',
      icon: '🏢',
      description: 'Target company type',
    },
    {
      id: 'setup_pressure',
      name: 'Mental Health Lounge',
      position: [6, 0, -12] as [number, number, number],
      color: '#f39c12',
      icon: '🧘',
      description: 'Set your mental state',
    },
  ];

  const handleZoneClick = (zoneIndex: number) => {
    setCurrentZone(zoneIndex);
    setPlayerPosition([zones[zoneIndex].position[0], 0, zones[zoneIndex].position[2] + 3]);
  };

  const handleChoiceClick = (choiceId: string) => {
    makeChoice(choiceId);
    // Auto-advance to next zone after 1 second
    setTimeout(() => {
      if (currentZone < zones.length - 1) {
        handleZoneClick(currentZone + 1);
      }
    }, 1000);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <Scene3DContainer
        enableControls={true}
        cameraPosition={[10, 15, 15]}
        backgroundColor="#0f1419"
      >
        {/* Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[6, -0.01, -6]}>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>

        {/* Player Character */}
        <PlayerCharacter
          position={playerPosition}
          scale={1}
        />

        {/* Zone Rooms */}
        {zones.map((zone, index) => (
          <ZoneRoom
            key={zone.id}
            zone={zone}
            index={index}
            isActive={currentZone === index}
            isCompleted={currentZone > index}
            onClick={() => handleZoneClick(index)}
          />
        ))}

        {/* Pathway connecting zones */}
        <Pathway zones={zones} />

        {/* Central Info Display */}
        <Text
          position={[6, 4, -6]}
          fontSize={0.8}
          color="#3498db"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          Career Preparation Center
        </Text>

        <Text
          position={[6, 3, -6]}
          fontSize={0.4}
          color="#ecf0f1"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          Zone {currentZone + 1} of {zones.length}: {zones[currentZone].name}
        </Text>
      </Scene3DContainer>

      {/* UI Overlay - Choice Selection */}
      {currentScenario && (
        <ChoiceOverlay
          scenario={currentScenario}
          zone={zones[currentZone]}
          onChoice={handleChoiceClick}
        />
      )}

      {/* Progress Indicator */}
      <ProgressIndicator current={currentZone + 1} total={zones.length} zones={zones} />
    </div>
  );
}

/**
 * Individual zone room component
 */
function ZoneRoom({
  zone,
  index,
  isActive,
  isCompleted,
  onClick,
}: {
  zone: any;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const roomColor = isCompleted ? '#2ecc71' : isActive ? zone.color : '#34495e';
  const emissive = isActive || hovered ? zone.color : '#000000';

  return (
    <group position={zone.position}>
      {/* Room Platform */}
      <mesh
        position={[0, 0.1, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
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
        <boxGeometry args={[4, 0.2, 4]} />
        <meshStandardMaterial
          color={roomColor}
          emissive={emissive}
          emissiveIntensity={isActive ? 0.5 : hovered ? 0.3 : 0}
        />
      </mesh>

      {/* Room Walls (transparent) */}
      <mesh position={[0, 1.5, -2]}>
        <boxGeometry args={[4, 3, 0.1]} />
        <meshStandardMaterial color={zone.color} transparent opacity={0.3} />
      </mesh>

      {/* Zone Icon */}
      <Text
        position={[0, 1.5, 0]}
        fontSize={1.2}
        color={isActive ? '#ffffff' : '#ecf0f1'}
        anchorX="center"
        anchorY="middle"
      >
        {zone.icon}
      </Text>

      {/* Zone Name */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.25}
        color={isActive ? '#ffffff' : '#bdc3c7'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
        maxWidth={3.5}
      >
        {zone.name}
      </Text>

      {/* Completion Checkmark */}
      {isCompleted && (
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.5}
          color="#2ecc71"
          anchorX="center"
          anchorY="middle"
        >
          ✓
        </Text>
      )}

      {/* Active Indicator Ring */}
      {isActive && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.2, 2.5, 32]} />
          <meshBasicMaterial color={zone.color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Pathway connecting zones
 */
function Pathway({ zones }: { zones: any[] }) {
  return (
    <>
      {zones.map((zone, index) => {
        if (index === zones.length - 1) return null;
        const nextZone = zones[index + 1];
        const midX = (zone.position[0] + nextZone.position[0]) / 2;
        const midZ = (zone.position[2] + nextZone.position[2]) / 2;
        const distance = Math.sqrt(
          Math.pow(nextZone.position[0] - zone.position[0], 2) +
            Math.pow(nextZone.position[2] - zone.position[2], 2)
        );
        const angle = Math.atan2(
          nextZone.position[2] - zone.position[2],
          nextZone.position[0] - zone.position[0]
        );

        return (
          <mesh
            key={`path-${index}`}
            position={[midX, 0.01, midZ]}
            rotation={[-Math.PI / 2, 0, angle]}
          >
            <planeGeometry args={[distance - 4, 0.5]} />
            <meshStandardMaterial color="#7f8c8d" transparent opacity={0.5} />
          </mesh>
        );
      })}
    </>
  );
}

/**
 * Choice overlay UI
 */
function ChoiceOverlay({
  scenario,
  zone,
  onChoice,
}: {
  scenario: any;
  zone: any;
  onChoice: (choiceId: string) => void;
}) {
  if (!scenario) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '1000px',
        background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,46,0.95) 100%)',
        borderRadius: '16px',
        padding: '30px',
        border: `3px solid ${zone.color}`,
        boxShadow: `0 10px 40px ${zone.color}40`,
      }}
    >
      {/* Zone Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '48px', marginRight: '15px' }}>{zone.icon}</div>
        <div>
          <h2 style={{ margin: 0, color: zone.color, fontSize: '24px' }}>{scenario.title}</h2>
          <p style={{ margin: '5px 0 0 0', color: '#95a5a6', fontSize: '14px' }}>
            {zone.description}
          </p>
        </div>
      </div>

      {/* Scenario Text */}
      <p style={{ color: '#ecf0f1', fontSize: '16px', lineHeight: '1.6', marginBottom: '25px' }}>
        {scenario.text}
      </p>

      {/* Choices Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '15px',
        }}
      >
        {scenario.choices.map((choice: any) => (
          <button
            key={choice.id}
            onClick={() => onChoice(choice.id)}
            style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
              border: `2px solid ${zone.color}40`,
              borderRadius: '12px',
              color: '#ecf0f1',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${zone.color}40 0%, ${zone.color}60 100%)`;
              e.currentTarget.style.borderColor = zone.color;
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = `0 8px 20px ${zone.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)';
              e.currentTarget.style.borderColor = `${zone.color}40`;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Progress indicator
 */
function ProgressIndicator({
  current,
  total,
  zones,
}: {
  current: number;
  total: number;
  zones: any[];
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.8)',
        borderRadius: '12px',
        padding: '15px 20px',
        border: '2px solid #34495e',
      }}
    >
      <div style={{ color: '#ecf0f1', fontSize: '14px', marginBottom: '10px' }}>
        Progress: {current} / {total}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {zones.map((zone, index) => (
          <div
            key={zone.id}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: current > index + 1 ? '#2ecc71' : current === index + 1 ? zone.color : '#34495e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              border: current === index + 1 ? `2px solid ${zone.color}` : 'none',
            }}
          >
            {current > index + 1 ? '✓' : zone.icon}
          </div>
        ))}
      </div>
    </div>
  );
}
