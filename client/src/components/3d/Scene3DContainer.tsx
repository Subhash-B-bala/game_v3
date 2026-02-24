import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid } from '@react-three/drei';
import { Suspense, ReactNode } from 'react';

interface Scene3DContainerProps {
  children?: ReactNode;
  enableControls?: boolean;
  cameraPosition?: [number, number, number];
  showGrid?: boolean;
  backgroundColor?: string;
  fov?: number;
}

/**
 * Main 3D scene container using React Three Fiber
 * Provides camera, lighting, and basic environment setup
 */
export default function Scene3DContainer({
  children,
  enableControls = true,
  cameraPosition = [0, 5, 10],
  showGrid = false,
  backgroundColor = '#1a1a2e',
  fov = 50,
}: Scene3DContainerProps) {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: false,
        }}
        dpr={[1, 2]}
        style={{ background: backgroundColor }}
        onCreated={({ gl }) => {
          // Prevent context loss
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            console.warn('WebGL context lost. Attempting to restore...');
          });
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored');
          });
        }}
      >
        {/* Camera Setup */}
        <PerspectiveCamera makeDefault position={cameraPosition} fov={fov} />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />

        {/* Environment (HDRI lighting) */}
        <Environment preset="city" />

        {/* Optional Grid Helper */}
        {showGrid && <Grid args={[20, 20]} />}

        {/* Camera Controls */}
        {enableControls && (
          <OrbitControls
            makeDefault
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2}
            enableDamping
            dampingFactor={0.05}
          />
        )}

        {/* Scene Content */}
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>

      {/* Loading Overlay */}
      <LoadingOverlay />
    </div>
  );
}

/**
 * Loading overlay shown while 3D assets load
 */
function LoadingOverlay() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        fontSize: '1.5rem',
        pointerEvents: 'none',
        opacity: 0,
        transition: 'opacity 0.3s',
      }}
      className="loading-overlay"
    >
      <div>Loading 3D Environment...</div>
    </div>
  );
}
