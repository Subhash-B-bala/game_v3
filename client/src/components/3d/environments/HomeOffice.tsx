import { RigidBody, Physics } from '@react-three/rapier';
import InteractiveObject from '../InteractiveObject';
import { COLORS, LIGHTING_PRESETS } from '@/utils/environmentBuilder';
import PlayerController from '../PlayerController';
import GameHUD from '../GameHUD';
import Scene3DContainer from '../Scene3DContainer';
import { useGameStore } from '@/store/gameStore';

/**
 * Home Office Environment
 * Player's personal workspace with desk, computer, bookshelf
 */
export default function HomeOffice() {
  const makeChoice = useGameStore((state) => state.makeChoice);

  const handleComputerClick = () => {
    console.log('Computer clicked - opening work menu');
    alert('Computer clicked! This will open work scenarios in the full game.');
  };

  const handleDoorClick = () => {
    console.log('Door clicked - navigate to office building');
    alert('Door clicked! This will navigate to the office building.');
  };

  const handleDeskClick = () => {
    console.log('Desk clicked - view stats');
    alert('Desk clicked! This will show your stats panel.');
  };

  return (
    <>
      <Scene3DContainer
        enableControls={false}
        cameraPosition={[0, 5, 10]}
        backgroundColor="#0a0a0f"
        showGrid={false}
      >
        <Physics gravity={[0, -9.81, 0]}>
          {/* Lighting */}
          <Lighting />

          {/* Player */}
          <PlayerController spawnPosition={[0, 1, 2]} />

          {/* Room Structure */}
          <Room />

          {/* Furniture */}
          <Desk onDeskClick={handleDeskClick} onComputerClick={handleComputerClick} />
          <Chair />
          <Bookshelf />
          <Window />
          <Door onDoorClick={handleDoorClick} />
          <Plant />
        </Physics>
      </Scene3DContainer>

      {/* HUD Overlay (outside Canvas) */}
      <GameHUD />
    </>
  );
}

/**
 * Lighting setup for home office
 */
function Lighting() {
  const preset = LIGHTING_PRESETS.home;

  return (
    <>
      <ambientLight intensity={preset.ambient.intensity} color={preset.ambient.color} />
      <directionalLight
        position={preset.directional.position as [number, number, number]}
        intensity={preset.directional.intensity}
        color={preset.directional.color}
        castShadow
      />
      {preset.points.map((light, i) => (
        <pointLight
          key={i}
          position={light.position as [number, number, number]}
          intensity={light.intensity}
          color={light.color}
          distance={light.distance}
        />
      ))}
    </>
  );
}

/**
 * Room with walls, floor, ceiling
 */
function Room() {
  const width = 10;
  const depth = 8;
  const height = 3;

  return (
    <group>
      {/* Floor with collision */}
      <RigidBody type="fixed" position={[0, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[width, depth]} />
          <meshStandardMaterial color={COLORS.floor} roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Walls with collision */}
      {/* North wall */}
      <RigidBody type="fixed" position={[0, height / 2, -depth / 2]}>
        <mesh castShadow>
          <boxGeometry args={[width, height, 0.1]} />
          <meshStandardMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* South wall */}
      <RigidBody type="fixed" position={[0, height / 2, depth / 2]}>
        <mesh castShadow>
          <boxGeometry args={[width, height, 0.1]} />
          <meshStandardMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* West wall (with window) */}
      <RigidBody type="fixed" position={[-width / 2, height / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, height, depth]} />
          <meshStandardMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* East wall */}
      <RigidBody type="fixed" position={[width / 2, height / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, height, depth]} />
          <meshStandardMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={COLORS.ceiling} />
      </mesh>
    </group>
  );
}

/**
 * Desk with computer
 */
function Desk({
  onDeskClick,
  onComputerClick,
}: {
  onDeskClick: () => void;
  onComputerClick: () => void;
}) {
  return (
    <InteractiveObject
      name="Work Desk"
      position={[0, 0, -2]}
      onInteract={onDeskClick}
      glowColor="#8B4513"
    >
      <RigidBody type="fixed" colliders="cuboid">
        <group>
          {/* Tabletop */}
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[2, 0.05, 1]} />
            <meshStandardMaterial color={COLORS.wood} roughness={0.7} />
          </mesh>

          {/* Legs */}
          {[
            [-0.8, 0.4, -0.4],
            [0.8, 0.4, -0.4],
            [-0.8, 0.4, 0.4],
            [0.8, 0.4, 0.4],
          ].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.7]} />
              <meshStandardMaterial color={COLORS.darkWood} />
            </mesh>
          ))}

          {/* Computer on desk */}
          <Computer position={[0, 0.85, -0.2]} onClick={onComputerClick} />
        </group>
      </RigidBody>
    </InteractiveObject>
  );
}

/**
 * Computer with glowing screen
 */
function Computer({ position, onClick }: { position: [number, number, number]; onClick: () => void }) {
  return (
    <InteractiveObject name="Computer" position={position} onInteract={onClick} glowColor="#4488ff">
      <group>
        {/* Monitor */}
        <mesh>
          <boxGeometry args={[0.6, 0.4, 0.05]} />
          <meshStandardMaterial
            color={COLORS.screen}
            emissive={COLORS.screenActive}
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Screen glow */}
        <pointLight position={[0, 0, 0.1]} intensity={0.3} color="#4488ff" distance={2} />

        {/* Keyboard */}
        <mesh position={[0, -0.3, 0.2]}>
          <boxGeometry args={[0.4, 0.02, 0.15]} />
          <meshStandardMaterial color="#333" />
        </mesh>

        {/* Mouse */}
        <mesh position={[0.3, -0.3, 0.2]}>
          <boxGeometry args={[0.05, 0.02, 0.07]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      </group>
    </InteractiveObject>
  );
}

/**
 * Office chair
 */
function Chair() {
  return (
    <RigidBody type="fixed" position={[0, 0, -0.5]} colliders="cuboid">
      <group>
        {/* Seat */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.5, 0.05, 0.5]} />
          <meshStandardMaterial color={COLORS.fabric} />
        </mesh>

        {/* Backrest */}
        <mesh position={[0, 0.85, -0.2]} castShadow>
          <boxGeometry args={[0.5, 0.6, 0.05]} />
          <meshStandardMaterial color={COLORS.fabric} />
        </mesh>

        {/* Legs */}
        {[
          [-0.2, 0.25, -0.2],
          [0.2, 0.25, -0.2],
          [-0.2, 0.25, 0.2],
          [0.2, 0.25, 0.2],
        ].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.4]} />
            <meshStandardMaterial color={COLORS.metal} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  );
}

/**
 * Bookshelf
 */
function Bookshelf() {
  return (
    <RigidBody type="fixed" position={[3, 0, -2]} colliders="cuboid">
      <group>
        {/* Back panel */}
        <mesh position={[0, 1, -0.2]} castShadow>
          <boxGeometry args={[1.5, 2, 0.05]} />
          <meshStandardMaterial color={COLORS.darkWood} />
        </mesh>

        {/* Shelves */}
        {[0.2, 0.8, 1.4].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <boxGeometry args={[1.5, 0.03, 0.4]} />
            <meshStandardMaterial color={COLORS.wood} />
          </mesh>
        ))}

        {/* Books (simple colored blocks) */}
        {[
          { x: -0.5, y: 0.3, color: '#c0392b' },
          { x: -0.3, y: 0.3, color: '#2980b9' },
          { x: -0.1, y: 0.3, color: '#27ae60' },
          { x: 0.3, y: 0.9, color: '#8e44ad' },
          { x: 0.5, y: 0.9, color: '#d35400' },
        ].map((book, i) => (
          <mesh key={i} position={[book.x, book.y, 0]}>
            <boxGeometry args={[0.15, 0.25, 0.3]} />
            <meshStandardMaterial color={book.color} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  );
}

/**
 * Window with view
 */
function Window() {
  return (
    <group position={[-4.9, 1.5, 0]}>
      {/* Window frame */}
      <mesh>
        <boxGeometry args={[0.1, 1.5, 1.5]} />
        <meshStandardMaterial color={COLORS.wall} />
      </mesh>

      {/* Glass */}
      <mesh position={[0.05, 0, 0]}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshStandardMaterial color={COLORS.glass} transparent opacity={0.3} />
      </mesh>

      {/* Light from window */}
      <pointLight position={[0.5, 0, 0]} intensity={0.4} color="#fff5e6" distance={5} />
    </group>
  );
}

/**
 * Door to exit room
 */
function Door({ onDoorClick }: { onDoorClick: () => void }) {
  return (
    <InteractiveObject
      name="Exit Door"
      position={[4, 0, 0]}
      onInteract={onDoorClick}
      glowColor="#2ecc71"
    >
      <RigidBody type="fixed" colliders="cuboid">
        <group rotation={[0, -Math.PI / 2, 0]}>
          {/* Door frame */}
          <mesh position={[0, 1.1, 0]} castShadow>
            <boxGeometry args={[1, 2.2, 0.1]} />
            <meshStandardMaterial color={COLORS.wall} />
          </mesh>

          {/* Door */}
          <mesh position={[0, 1, 0.05]} castShadow>
            <boxGeometry args={[0.9, 2, 0.05]} />
            <meshStandardMaterial color={COLORS.darkWood} />
          </mesh>

          {/* Door handle */}
          <mesh position={[-0.3, 1, 0.1]}>
            <cylinderGeometry args={[0.02, 0.02, 0.1]} />
            <meshStandardMaterial color={COLORS.metal} />
          </mesh>
        </group>
      </RigidBody>
    </InteractiveObject>
  );
}

/**
 * Decorative plant
 */
function Plant() {
  return (
    <group position={[-3, 0, 2]}>
      {/* Pot */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.4]} />
        <meshStandardMaterial color="#654321" />
      </mesh>

      {/* Plant (simple sphere for leaves) */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color={COLORS.plant} />
      </mesh>
    </group>
  );
}
