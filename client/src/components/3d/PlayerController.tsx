import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import { Vector3 } from 'three';
import * as THREE from 'three';
import PlayerCharacter from './PlayerCharacter';

interface PlayerControllerProps {
  onPositionChange?: (position: Vector3) => void;
  spawnPosition?: [number, number, number];
}

/**
 * Player Controller with WASD Movement
 * Third-person camera following the player
 * Physics-based collision detection
 */
export default function PlayerController({
  onPositionChange,
  spawnPosition = [0, 1, 0],
}: PlayerControllerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const characterRotation = useRef(0);

  // Keyboard input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Movement update loop
  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;
    const velocity = rb.linvel();
    const position = rb.translation();

    // Movement speed
    const moveSpeed = 5;
    const rotationSpeed = 3;

    // Calculate movement direction
    let moveX = 0;
    let moveZ = 0;

    if (keysPressed.current.has('w')) moveZ -= 1;
    if (keysPressed.current.has('s')) moveZ += 1;
    if (keysPressed.current.has('a')) moveX -= 1;
    if (keysPressed.current.has('d')) moveX += 1;

    // Normalize diagonal movement
    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (length > 0) {
      moveX /= length;
      moveZ /= length;
    }

    // Apply movement
    rb.setLinvel({
      x: moveX * moveSpeed,
      y: velocity.y, // Preserve gravity
      z: moveZ * moveSpeed,
    }, true);

    // Rotate character to face movement direction
    if (moveX !== 0 || moveZ !== 0) {
      const targetRotation = Math.atan2(moveX, moveZ);
      characterRotation.current = THREE.MathUtils.lerp(
        characterRotation.current,
        targetRotation,
        delta * rotationSpeed
      );
    }

    // Update camera to follow player
    const cameraDistance = 8;
    const cameraHeight = 4;

    state.camera.position.lerp(
      new THREE.Vector3(
        position.x + Math.sin(characterRotation.current) * cameraDistance,
        position.y + cameraHeight,
        position.z + Math.cos(characterRotation.current) * cameraDistance
      ),
      delta * 2
    );

    state.camera.lookAt(position.x, position.y + 1, position.z);

    // Notify position changes
    if (onPositionChange) {
      onPositionChange(new Vector3(position.x, position.y, position.z));
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={spawnPosition}
      enabledRotations={[false, true, false]} // Only rotate on Y axis
      lockRotations
    >
      <CapsuleCollider args={[0.5, 0.5]} />

      {/* Player Character */}
      <group rotation={[0, characterRotation.current, 0]}>
        <PlayerCharacter
          position={[0, -1, 0]}
          scale={1}
        />
      </group>
    </RigidBody>
  );
}
