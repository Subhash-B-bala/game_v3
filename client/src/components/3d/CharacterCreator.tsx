import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AvatarType } from '@/engine/types';
import { useGameStore } from '@/store/gameStore';

// Dynamically import 3D preview with SSR disabled to prevent hydration errors
const CharacterPreview3D = dynamic(() => import('./CharacterPreview3D'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid #3498db',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ color: '#95a5a6', fontSize: '14px' }}>Loading 3D Preview...</p>
    </div>
  )
});

/**
 * 3D Character Creator
 * Lets players customize their character appearance before starting the game
 */
export default function CharacterCreator() {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>('fresher');
  const [customization, setCustomization] = useState({
    skinTone: 'light',
    hairStyle: 'short',
    clothing: 'casual',
  });

  const initGame = useGameStore((state) => state.initGame);
  const setUiPhase = useGameStore((state) => state.setUiPhase);

  // Available avatar types from your existing system
  const avatarTypes: AvatarType[] = [
    'fresher',
    'analyst',
    'engineer',
    'manager',
    'mentor',
    'recruiter',
    'founder',
    'peer',
    'stressed',
    'success',
  ];

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }

    // Initialize game with selected character
    initGame(name, selectedAvatar);

    // TODO: Save customization to game store
    // This will be used to customize the 3D model appearance

    // Move to next phase (onboarding or briefing)
    setUiPhase('briefing');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f1419' }}>
      {/* Left Panel - Customization Controls */}
      <div style={{ width: '400px', padding: '30px', borderRight: '2px solid #34495e', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '32px', color: '#3498db', marginBottom: '10px' }}>
          Create Your Character
        </h1>
        <p style={{ color: '#95a5a6', fontSize: '14px', marginBottom: '30px' }}>
          Customize your professional persona for the journey ahead
        </p>

        {/* Name Input */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', color: '#ecf0f1', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={30}
            style={{
              width: '100%',
              padding: '12px',
              background: '#1a1a2e',
              border: '2px solid #34495e',
              borderRadius: '8px',
              color: '#ecf0f1',
              fontSize: '16px',
            }}
          />
        </div>

        {/* Avatar Type Selection */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', color: '#ecf0f1', fontSize: '14px', marginBottom: '12px', fontWeight: 'bold' }}>
            Professional Archetype
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {avatarTypes.map((avatar) => (
              <button
                key={avatar}
                onClick={() => setSelectedAvatar(avatar)}
                style={{
                  padding: '12px',
                  background: selectedAvatar === avatar ? '#3498db' : '#2c3e50',
                  border: selectedAvatar === avatar ? '2px solid #3498db' : '2px solid #34495e',
                  borderRadius: '8px',
                  color: '#ecf0f1',
                  fontSize: '13px',
                  fontWeight: selectedAvatar === avatar ? 'bold' : 'normal',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedAvatar !== avatar) {
                    e.currentTarget.style.background = '#34495e';
                    e.currentTarget.style.borderColor = '#3498db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAvatar !== avatar) {
                    e.currentTarget.style.background = '#2c3e50';
                    e.currentTarget.style.borderColor = '#34495e';
                  }
                }}
              >
                {avatar.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Customization Options (Future Integration with 3D Models) */}
        <div style={{ marginBottom: '30px', opacity: 0.5, pointerEvents: 'none' }}>
          <label style={{ display: 'block', color: '#ecf0f1', fontSize: '14px', marginBottom: '12px', fontWeight: 'bold' }}>
            Appearance (Coming Soon)
          </label>

          {/* Skin Tone */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '6px' }}>Skin Tone</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['light', 'medium', 'tan', 'dark'].map((tone) => (
                <button
                  key={tone}
                  onClick={() => setCustomization({ ...customization, skinTone: tone })}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: customization.skinTone === tone ? '3px solid #3498db' : '2px solid #34495e',
                    background: tone === 'light' ? '#FFE0BD' : tone === 'medium' ? '#E6B88D' : tone === 'tan' ? '#C68642' : '#8D5524',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Hair Style */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '6px' }}>Hair Style</div>
            <select
              value={customization.hairStyle}
              onChange={(e) => setCustomization({ ...customization, hairStyle: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                background: '#1a1a2e',
                border: '2px solid #34495e',
                borderRadius: '8px',
                color: '#ecf0f1',
                fontSize: '14px',
              }}
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
              <option value="bald">Bald</option>
            </select>
          </div>

          {/* Clothing */}
          <div>
            <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '6px' }}>Clothing Style</div>
            <select
              value={customization.clothing}
              onChange={(e) => setCustomization({ ...customization, clothing: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                background: '#1a1a2e',
                border: '2px solid #34495e',
                borderRadius: '8px',
                color: '#ecf0f1',
                fontSize: '14px',
              }}
            >
              <option value="casual">Casual</option>
              <option value="business">Business Casual</option>
              <option value="formal">Formal</option>
              <option value="tech">Tech Startup</option>
            </select>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          style={{
            width: '100%',
            padding: '16px',
            background: name.trim() ? 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' : '#7f8c8d',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: name.trim() ? 'pointer' : 'not-allowed',
            boxShadow: name.trim() ? '0 4px 15px rgba(52, 152, 219, 0.4)' : 'none',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            if (name.trim()) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(52, 152, 219, 0.6)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            if (name.trim()) {
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(52, 152, 219, 0.4)';
            }
          }}
        >
          Begin Your Journey →
        </button>

        {/* Info Text */}
        <p style={{ marginTop: '20px', fontSize: '12px', color: '#7f8c8d', lineHeight: '1.5', textAlign: 'center' }}>
          Your character will navigate a 3D world as you progress through your career journey.
          Character appearance customization will be available once 3D models are integrated.
        </p>
      </div>

      {/* Right Panel - 3D Character Preview */}
      <div style={{ flex: 1, position: 'relative', background: '#0f1419' }}>
        <CharacterPreview3D name={name} selectedAvatar={selectedAvatar} />
      </div>
    </div>
  );
}
