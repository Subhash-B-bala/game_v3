'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

/**
 * SUPER SIMPLE 3D TEST
 * Go to: http://localhost:3003/test/simple-3d
 *
 * This should load INSTANTLY!
 */
export default function Simple3DTest() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas>
        {/* Light */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        {/* Camera controls */}
        <OrbitControls />

        {/* Simple objects */}
        {/* Red cube */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>

        {/* Blue sphere */}
        <mesh position={[2, 0, 0]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="blue" />
        </mesh>

        {/* Green floor */}
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="green" />
        </mesh>
      </Canvas>

      {/* Instructions */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: 'white',
          background: 'rgba(0,0,0,0.7)',
          padding: '20px',
          borderRadius: '8px',
          fontFamily: 'monospace',
        }}
      >
        <h2>✅ 3D WORKS!</h2>
        <p>Drag to rotate • Scroll to zoom</p>
        <p>Red cube + Blue sphere</p>
      </div>
    </div>
  );
}
