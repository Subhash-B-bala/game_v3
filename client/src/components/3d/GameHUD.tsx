import { useGameStore } from '@/store/gameStore';

/**
 * Game HUD Overlay
 * Displays stats, objectives, and controls over the 3D scene
 */
export default function GameHUD() {
  const characterName = useGameStore((s) => s.characterName);
  const stats = useGameStore((s) => s.stats);
  const months = useGameStore((s) => s.months);
  const currentScenarioId = useGameStore((s) => s.currentScenarioId);

  // Convert energy (0-1) to percentage
  const energyPercent = Math.round((stats?.energy ?? 0) * 100);
  const stressPercent = Math.round((stats?.stress ?? 0) * 100);

  // Create progress bars
  const createBar = (percent: number, color: string) => {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return (
      <span>
        <span style={{ color }}>{'\u2588'.repeat(filled)}</span>
        <span style={{ color: '#444' }}>{'\u2591'.repeat(empty)}</span>
      </span>
    );
  };

  return (
    <>
      {/* Top-Left: Character Stats */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.8)',
          padding: '15px 20px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#ecf0f1',
          border: '2px solid #34495e',
          minWidth: '250px',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px', color: '#3498db' }}>
          {characterName || 'Player'}
        </div>

        <div style={{ marginBottom: '5px' }}>
          Energy: {createBar(energyPercent, '#2ecc71')} {energyPercent}%
        </div>

        <div style={{ marginBottom: '5px' }}>
          Stress: {createBar(stressPercent, '#e74c3c')} {stressPercent}%
        </div>

        <div style={{ marginTop: '10px', color: '#95a5a6', fontSize: '12px' }}>
          Day: {Math.floor(months * 30)} | Month: {months}
        </div>
      </div>

      {/* Top-Right: Mini-map placeholder */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          padding: '15px',
          borderRadius: '8px',
          border: '2px solid #34495e',
        }}
      >
        <div
          style={{
            width: '150px',
            height: '150px',
            background: '#1a1a1a',
            border: '1px solid #444',
            position: 'relative',
          }}
        >
          {/* Placeholder mini-map */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
              background: '#e74c3c',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '5px',
              left: '5px',
              fontSize: '10px',
              color: '#7f8c8d',
            }}
          >
            Location
          </div>
        </div>
      </div>

      {/* Bottom-Center: Current Objective */}
      {currentScenarioId && (
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(52,73,94,0.95)',
            padding: '12px 24px',
            borderRadius: '20px',
            border: '2px solid #3498db',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#ecf0f1',
            textAlign: 'center',
            minWidth: '300px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '4px' }}>
            Current Objective
          </div>
          <div style={{ fontWeight: 'bold', color: '#3498db' }}>
            {currentScenarioId || 'Explore the world'}
          </div>
        </div>
      )}

      {/* Bottom-Right: Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#95a5a6',
          border: '2px solid #34495e',
        }}
      >
        <div style={{ marginBottom: '4px' }}>
          <span style={{ color: '#3498db', fontWeight: 'bold' }}>[WASD]</span> Move
        </div>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ color: '#3498db', fontWeight: 'bold' }}>[E]</span> Interact
        </div>
        <div>
          <span style={{ color: '#3498db', fontWeight: 'bold' }}>[Mouse]</span> Look
        </div>
      </div>

      {/* Bottom-Left: Hint/Tutorial */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(41,128,185,0.15)',
          padding: '10px 15px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#3498db',
          border: '1px solid rgba(52,152,219,0.5)',
          maxWidth: '300px',
        }}
      >
        💡 <strong>Tip:</strong> Use WASD to explore. Click glowing objects to interact.
      </div>
    </>
  );
}
