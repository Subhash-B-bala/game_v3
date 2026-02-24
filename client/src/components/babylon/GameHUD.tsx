'use client';

import React from 'react';

interface GameHUDProps {
  playerName: string;
  energy: number;
  stress: number;
  day: number;
  month: number;
  savings: number;
  currentZone: string | null;
  confidence: number;
  network: number;
}

export function GameHUD({
  playerName,
  energy,
  stress,
  day,
  month,
  savings,
  currentZone,
  confidence,
  network,
}: GameHUDProps) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      pointerEvents: 'none',
      fontFamily: '"Press Start 2P", "Courier New", monospace',
      zIndex: 10,
    }}>
      {/* Top-left: Player stats */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 8,
        padding: '10px 14px',
        color: 'white',
        fontSize: 11,
        lineHeight: 1.8,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        minWidth: 180,
      }}>
        <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: '#FFD600' }}>
          {playerName || 'Player'}
        </div>
        <StatBar label="Energy" value={energy} max={100} color="#4CAF50" />
        <StatBar label="Stress" value={stress} max={100} color="#f44336" />
        <StatBar label="Confidence" value={confidence} max={100} color="#2196F3" />
        <div style={{ marginTop: 4, fontSize: 10, color: '#aaa' }}>
          Network: {Math.round(network)}
        </div>
        <div style={{ fontSize: 10, color: '#aaa' }}>
          Savings: ${Math.round(savings).toLocaleString()}
        </div>
      </div>

      {/* Top-right: Day/Time */}
      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 8,
        padding: '8px 14px',
        color: 'white',
        fontSize: 12,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        textAlign: 'right',
      }}>
        <div style={{ fontSize: 10, color: '#aaa' }}>Day {day}</div>
        <div style={{ fontSize: 10, color: '#aaa' }}>Month {month}</div>
      </div>

      {/* Bottom-left: Controls hint */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 6,
        padding: '6px 10px',
        color: '#888',
        fontSize: 9,
        lineHeight: 1.6,
      }}>
        <div>[WASD] Move</div>
        <div>[Shift] Sprint</div>
        <div>[E] Interact</div>
        <div>[Mouse] Look</div>
      </div>
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ marginBottom: 3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#ccc' }}>
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div style={{
        width: '100%',
        height: 6,
        background: 'rgba(255,255,255,0.15)',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 3,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

interface NPCDialogueOverlayProps {
  npcName: string;
  npcRole: string;
  onClose: () => void;
}

export function NPCDialogueOverlay({ npcName, npcRole, onClose }: NPCDialogueOverlayProps) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      pointerEvents: 'auto',
    }}>
      <div style={{
        maxWidth: 700,
        margin: '0 auto 30px auto',
        background: 'rgba(10, 10, 30, 0.92)',
        borderRadius: 12,
        border: '2px solid #FFD600',
        padding: '20px 24px',
        color: 'white',
        fontFamily: '"Courier New", monospace',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#FFD600' }}>{npcName}</span>
            <span style={{ fontSize: 12, color: '#888', marginLeft: 10 }}>{npcRole}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid #666',
              color: 'white',
              padding: '4px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Close [ESC]
          </button>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: '#ddd' }}>
          {getDialogue(npcName)}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {getDialogueOptions(npcName).map((option, i) => (
            <button
              key={i}
              onClick={onClose}
              style={{
                background: 'rgba(255, 214, 0, 0.15)',
                border: '1px solid #FFD600',
                color: '#FFD600',
                padding: '8px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 214, 0, 0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 214, 0, 0.15)'; }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function getDialogue(npcName: string): string {
  const dialogues: Record<string, string> = {
    Sarah: "Hey there! I've been hearing about some great openings in the tech industry. Have you updated your resume recently? I might be able to connect you with a few companies.",
    Alex: "Welcome to the library! Knowledge is your greatest asset in this job market. I've curated some excellent resources on interview techniques and portfolio building.",
    Casey: "Good to see you at the office! We're always looking for talented individuals. The interview process can be challenging, but preparation is key.",
    Jordan: "Hey! Nice day for a walk in the park. How's the job search going? Sometimes stepping back and networking casually can open unexpected doors.",
    Family: "We're so proud of you for putting yourself out there. Remember to take care of yourself during the job search. You've got this!",
  };
  return dialogues[npcName] || "Hello! Nice to meet you.";
}

function getDialogueOptions(npcName: string): string[] {
  const options: Record<string, string[]> = {
    Sarah: ["Ask about openings", "Get resume tips", "Goodbye"],
    Alex: ["Study resources", "Portfolio advice", "Goodbye"],
    Casey: ["Interview prep", "Company info", "Goodbye"],
    Jordan: ["Chat about industry", "Network together", "Goodbye"],
    Family: ["Share progress", "Take a break", "Goodbye"],
  };
  return options[npcName] || ["Talk", "Goodbye"];
}
