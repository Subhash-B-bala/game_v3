'use client';

import Scene3DContainer from './Scene3DContainer';
import PlayerCharacter from './PlayerCharacter';

interface CharacterPreview3DProps {
  name?: string;
  selectedAvatar?: string;
}

/**
 * 3D Character Preview Component
 * Separated for dynamic import to avoid SSR hydration issues
 */
export default function CharacterPreview3D({ name = 'Your Character', selectedAvatar = 'fresher' }: CharacterPreview3DProps) {
  return (
    <>
      <Scene3DContainer
        cameraPosition={[0, 0.5, 3]}
        fov={50}
        enableControls={true}
        backgroundColor="#ffffff"
        showGrid={false}
      >
        {/* 2D Sprite Character - using custom sprite image */}
        <PlayerCharacter
          position={[0, 0, 0]}
          scale={0.8}
          color="#3498db"
          spritePath="/sprites/characters/player_sprite.png"
        />

        {/* Platform removed - just showing the character */}

        {/* Extra Lighting */}
        <pointLight position={[1, 1, 1]} intensity={1} color="#3498db" />
        <pointLight position={[-1, 1, 1]} intensity={1} color="#9b59b6" />
        <spotLight position={[0, 2, 1.5]} intensity={1.2} angle={0.6} penumbra={0.5} castShadow />
      </Scene3DContainer>

      {/* Instructions Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.8)',
          padding: '15px 20px',
          borderRadius: '8px',
          border: '2px solid #3498db',
        }}
      >
        <div style={{ color: '#3498db', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
          💡 Preview
        </div>
        <div style={{ color: '#ecf0f1', fontSize: '12px' }}>
          Drag to rotate • Scroll to zoom
        </div>
      </div>

      {/* Character Info Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.85)',
          padding: '20px 30px',
          borderRadius: '12px',
          border: '2px solid rgba(52, 152, 219, 0.5)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <h2 style={{
          color: '#ecf0f1',
          fontSize: '28px',
          marginBottom: '8px',
          fontWeight: 'bold',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)'
        }}>
          {name}
        </h2>
        <p style={{
          color: '#3498db',
          fontSize: '16px',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          margin: 0,
          fontWeight: '600'
        }}>
          {selectedAvatar.replace('_', ' ')}
        </p>
      </div>
    </>
  );
}

// Rotating ring removed - no longer needed
