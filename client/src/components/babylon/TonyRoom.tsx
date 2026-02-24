'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { BabylonCanvas, type SceneReadyArgs } from './BabylonCanvas';
import { useGameStore } from '@/store/gameStore';
import { SCENARIO_POOL } from '@/engine/scenarios';
import { applyChoice } from '@/engine/reducer';

/**
 * Tony Sharma's Office — Onboarding Room
 *
 * A cozy office where Tony Sharma (mentor/well-wisher) asks the player
 * 7 setup questions through dialogue before entering the voxel world.
 */

const ONBOARDING_IDS = [
  'setup_background',
  'setup_financial',
  'setup_role',
  'setup_confidence',
  'setup_risk',
  'setup_target',
  'setup_pressure',
];

// Tony's intro/transition lines for each question
const TONY_INTROS: Record<string, string> = {
  setup_background: "Great to meet you! Now tell me about yourself. Where did your journey start?",
  setup_financial: "Good to know! Now let's talk about the practical side. How's your financial situation? This will affect how much pressure you feel.",
  setup_role: "Alright, let's get specific. What technical track are you pursuing? This will shape your early opportunities.",
  setup_confidence: "Got it. Now be honest with me — how confident are you in your current technical skills?",
  setup_risk: "Interesting. Here's an important one — how do you handle professional risk? This shapes your whole approach.",
  setup_target: "Almost there. What type of company environment are you aiming for?",
  setup_pressure: "Last question! What's your mindset right now, at the start of this journey?",
};

const TONY_REACTIONS: Record<string, string> = {
  setup_background: "That's a solid starting point. Everyone's path is different, and yours has its own strengths.",
  setup_financial: "I understand. Money pressure is real — but it can also be a great motivator.",
  setup_role: "Great choice! That field has amazing opportunities right now.",
  setup_confidence: "Honesty about your skills is the first step to growth. I respect that.",
  setup_risk: "There's no wrong answer here — it's about knowing yourself.",
  setup_target: "That's a smart target. Let me think about how to guide you there.",
  setup_pressure: "Perfect. I've got a good picture of who you are now. Let me show you something...",
};

interface TonyRoomProps {
  playerName: string;
  onComplete: () => void;
}

export default function TonyRoom({ playerName, onComplete }: TonyRoomProps) {
  const store = useGameStore();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [dialoguePhase, setDialoguePhase] = useState<'name_input' | 'intro' | 'question' | 'reaction' | 'complete'>('name_input');
  const [isTyping, setIsTyping] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const sceneRef = useRef<any>(null);

  // Get current scenario
  const currentScenarioId = ONBOARDING_IDS[questionIndex];
  const currentScenario = SCENARIO_POOL.find(s => s.id === currentScenarioId);

  // Typing animation effect
  useEffect(() => {
    let fullText = '';
    if (dialoguePhase === 'name_input') {
      fullText = "Welcome to Career City! I'm Tony Sharma — your career mentor and well-wisher. Before we begin, tell me... what's your name?";
    } else if (dialoguePhase === 'intro' || dialoguePhase === 'question') {
      fullText = TONY_INTROS[currentScenarioId] || '';
    } else if (dialoguePhase === 'reaction') {
      fullText = TONY_REACTIONS[currentScenarioId] || '';
    } else if (dialoguePhase === 'complete') {
      fullText = `You're ready, ${store.characterName}. The city is waiting for you out there. Go make your mark — and remember, I'm always here if you need guidance. Good luck!`;
    }

    if (!fullText) return;

    setIsTyping(true);
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [dialoguePhase, questionIndex, currentScenarioId, playerName]);

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleSceneReady = useCallback(async ({ scene, engine, canvas }: SceneReadyArgs) => {
    sceneRef.current = scene;
    const BABYLON = await import('@babylonjs/core');

    // === SCENE SETTINGS ===
    scene.clearColor = new BABYLON.Color4(0.08, 0.06, 0.12, 1);

    // === CAMERA — Fixed first-person view sitting across from Tony ===
    const camera = new BABYLON.FreeCamera(
      'cam',
      new BABYLON.Vector3(5, 2.8, 7.5),  // Seated position, across from Tony
      scene
    );
    camera.setTarget(new BABYLON.Vector3(5, 2.0, 0)); // Look at Tony & back wall
    camera.fov = 0.9;
    // DO NOT attach controls — camera is completely locked/static

    // === LIGHTING — bright, warm, well-lit office ===
    const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
    ambient.intensity = 1.0;
    ambient.diffuse = new BABYLON.Color3(1, 0.95, 0.88);
    ambient.groundColor = new BABYLON.Color3(0.4, 0.35, 0.3);

    const mainLight = new BABYLON.PointLight('mainLight', new BABYLON.Vector3(5, 4.5, 3), scene);
    mainLight.intensity = 1.5;
    mainLight.diffuse = new BABYLON.Color3(1, 0.93, 0.82);
    mainLight.range = 25;

    const fillLight = new BABYLON.PointLight('fillLight', new BABYLON.Vector3(5, 3, 7), scene);
    fillLight.intensity = 0.8;
    fillLight.diffuse = new BABYLON.Color3(1, 0.96, 0.92);
    fillLight.range = 18;

    // Window light from back wall
    const windowLight = new BABYLON.DirectionalLight('windowLight', new BABYLON.Vector3(0, -0.3, 1), scene);
    windowLight.intensity = 0.5;
    windowLight.diffuse = new BABYLON.Color3(0.85, 0.9, 1);

    // === HELPER ===
    const box = (name: string, w: number, h: number, d: number, color: string, px: number, py: number, pz: number, emissive?: string) => {
      const mesh = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
      const mat = new BABYLON.StandardMaterial(name + '_mat', scene);
      mat.diffuseColor = BABYLON.Color3.FromHexString(color);
      if (emissive) mat.emissiveColor = BABYLON.Color3.FromHexString(emissive).scale(0.25);
      mat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
      mesh.material = mat;
      mesh.position = new BABYLON.Vector3(px, py, pz);
      return mesh;
    };

    // === ROOM STRUCTURE (compact: 10 wide x 8 deep) ===
    // Room spans x: 0→10, z: -2→6, y: 0→4

    // Floor — dark wood
    const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: 12, height: 10 }, scene);
    const floorMat = new BABYLON.StandardMaterial('floor_mat', scene);
    floorMat.diffuseColor = BABYLON.Color3.FromHexString('#5D4037');
    floorMat.specularColor = new BABYLON.Color3(0.08, 0.06, 0.04);
    floor.material = floorMat;
    floor.position = new BABYLON.Vector3(5, 0, 2);

    // Back wall — warm cream
    box('wall_back', 12, 5, 0.3, '#C8B8A0', 5, 2.5, -2.85);
    // Left wall
    box('wall_left', 0.3, 5, 10, '#BBA88F', -0.85, 2.5, 2);
    // Right wall
    box('wall_right', 0.3, 5, 10, '#BBA88F', 10.85, 2.5, 2);

    // NO ceiling — we view from above-ish, ceiling blocks the camera

    // === WINDOWS on back wall (soft glow) ===
    box('window_1', 2.5, 1.8, 0.1, '#A8C8E8', 2.5, 3.2, -2.65, '#7BA8CC');
    box('window_2', 2.5, 1.8, 0.1, '#A8C8E8', 7.5, 3.2, -2.65, '#7BA8CC');
    // Window frames (dark wood)
    box('wf1_t', 2.7, 0.1, 0.15, '#3E2723', 2.5, 4.15, -2.65);
    box('wf1_b', 2.7, 0.1, 0.15, '#3E2723', 2.5, 2.25, -2.65);
    box('wf1_l', 0.1, 1.8, 0.15, '#3E2723', 1.2, 3.2, -2.65);
    box('wf1_r', 0.1, 1.8, 0.15, '#3E2723', 3.8, 3.2, -2.65);
    box('wf2_t', 2.7, 0.1, 0.15, '#3E2723', 7.5, 4.15, -2.65);
    box('wf2_b', 2.7, 0.1, 0.15, '#3E2723', 7.5, 2.25, -2.65);
    box('wf2_l', 0.1, 1.8, 0.15, '#3E2723', 6.2, 3.2, -2.65);
    box('wf2_r', 0.1, 1.8, 0.15, '#3E2723', 8.8, 3.2, -2.65);

    // === TONY'S DESK (center of room) ===
    box('desk_top', 3.5, 0.12, 1.6, '#6D4C41', 5, 1.1, 1);
    box('desk_panel', 3.3, 0.9, 0.1, '#5D4037', 5, 0.6, 0.25); // front panel
    box('desk_leg_l', 0.12, 1.05, 1.4, '#4E342E', 3.4, 0.53, 1);
    box('desk_leg_r', 0.12, 1.05, 1.4, '#4E342E', 6.6, 0.53, 1);

    // Monitor on desk (facing player)
    box('monitor_screen', 1.4, 0.9, 0.06, '#111827', 5, 1.95, 0.6, '#3B82F6');
    box('monitor_stand', 0.12, 0.35, 0.12, '#555', 5, 1.35, 0.6);
    box('monitor_base', 0.5, 0.04, 0.35, '#555', 5, 1.16, 0.6);

    // Keyboard & mouse
    box('keyboard', 0.7, 0.03, 0.25, '#333', 5, 1.17, 1.3);
    box('mouse', 0.12, 0.03, 0.18, '#444', 5.8, 1.17, 1.3);

    // Coffee mug (red)
    box('mug', 0.18, 0.28, 0.18, '#D32F2F', 3.6, 1.32, 1.2);

    // Papers
    box('notepad', 0.5, 0.02, 0.65, '#FFF8E1', 6.2, 1.16, 1.2);
    box('pen', 0.04, 0.04, 0.35, '#1565C0', 6.4, 1.17, 1.0);

    // === TONY'S CHAIR (behind desk) ===
    box('chair_seat', 0.7, 0.08, 0.7, '#3F4C78', 5, 0.85, -0.2);
    box('chair_back', 0.7, 1.0, 0.08, '#3F4C78', 5, 1.4, -0.55);

    // === BOOKSHELF (left wall) ===
    box('bookshelf', 0.6, 3.5, 2, '#4E342E', -0.35, 1.75, 0.5);
    for (let y = 0; y < 4; y++) {
      box(`shelf_${y}`, 0.55, 0.05, 1.9, '#5D4037', -0.35, 0.6 + y * 0.9, 0.5);
    }
    // Books (colorful)
    const bookColors = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00897B', '#F44336', '#3F51B5'];
    for (let y = 0; y < 3; y++) {
      for (let b = 0; b < 5; b++) {
        const c = bookColors[(y * 5 + b) % bookColors.length];
        box(`book_${y}_${b}`, 0.1, 0.6, 0.3 + Math.random() * 0.2, c,
          -0.35, 0.7 + y * 0.9 + 0.35, -0.1 + b * 0.38);
      }
    }

    // === PLANT (right side near back) ===
    box('pot', 0.4, 0.5, 0.4, '#5D4037', 9.5, 0.25, -1.5);
    box('plant1', 0.2, 1.0, 0.2, '#2E7D32', 9.5, 1.0, -1.5);
    box('leaf1', 0.35, 0.08, 0.15, '#4CAF50', 9.3, 1.3, -1.4);
    box('leaf2', 0.15, 0.08, 0.35, '#66BB6A', 9.6, 1.2, -1.6);

    // === FILING CABINET (right wall) ===
    box('cabinet', 0.7, 1.4, 0.5, '#78909C', 10.2, 0.7, 1.5);
    box('handle1', 0.25, 0.03, 0.04, '#B0BEC5', 10.2, 1.1, 1.78);
    box('handle2', 0.25, 0.03, 0.04, '#B0BEC5', 10.2, 0.5, 1.78);

    // === WALL DECORATIONS ===
    // Tony's framed portrait on back wall (center)
    box('portrait_frame', 2.0, 2.5, 0.08, '#3E2723', 5, 3.3, -2.65);
    const portraitPlane = BABYLON.MeshBuilder.CreatePlane('portrait_photo', { width: 1.7, height: 2.1 }, scene);
    const portraitMat = new BABYLON.StandardMaterial('portrait_mat', scene);
    portraitMat.diffuseTexture = new BABYLON.Texture('/tony_sharma.png', scene);
    portraitMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    portraitMat.specularColor = new BABYLON.Color3(0, 0, 0);
    portraitPlane.material = portraitMat;
    portraitPlane.position = new BABYLON.Vector3(5, 3.3, -2.58);

    // Small certificate frames on back wall
    box('cert_frame1', 0.8, 0.6, 0.04, '#4E342E', 1.5, 2.2, -2.7);
    box('cert1', 0.65, 0.45, 0.02, '#FFFDE7', 1.5, 2.2, -2.66);
    box('cert_frame2', 0.8, 0.6, 0.04, '#4E342E', 8.5, 2.2, -2.7);
    box('cert2', 0.65, 0.45, 0.02, '#FFFDE7', 8.5, 2.2, -2.66);

    // Whiteboard on right wall
    box('wb_frame', 0.06, 1.5, 2.2, '#6D4C41', 10.7, 2.8, 3);
    box('wb_surface', 0.04, 1.3, 2.0, '#F5F5F5', 10.68, 2.8, 3);

    // === RUG on floor ===
    const rug = BABYLON.MeshBuilder.CreateGround('rug', { width: 4, height: 5 }, scene);
    const rugMat = new BABYLON.StandardMaterial('rug_mat', scene);
    rugMat.diffuseColor = BABYLON.Color3.FromHexString('#3F4C78');
    rugMat.alpha = 0.6;
    rug.material = rugMat;
    rug.position = new BABYLON.Vector3(5, 0.02, 2);

    // === TONY SHARMA (voxel NPC — behind desk, facing player) ===
    box('tony_body', 0.65, 0.85, 0.35, '#1A1A1A', 5, 1.72, -0.2);  // black suit
    box('tony_head', 0.45, 0.45, 0.45, '#C68642', 5, 2.38, -0.2);  // skin
    box('tony_hair', 0.47, 0.13, 0.47, '#111111', 5, 2.65, -0.22);  // hair
    box('tony_beard', 0.3, 0.1, 0.12, '#222222', 5, 2.15, 0.02);  // beard
    box('tony_glasses', 0.42, 0.05, 0.04, '#333', 5, 2.42, 0.03); // glasses
    box('tony_arm_l', 0.18, 0.65, 0.18, '#1A1A1A', 4.5, 1.6, -0.2); // left arm
    box('tony_arm_r', 0.18, 0.65, 0.18, '#1A1A1A', 5.5, 1.6, -0.2); // right arm
    box('tony_leg_l', 0.22, 0.65, 0.22, '#111111', 4.8, 0.9, -0.2); // left leg
    box('tony_leg_r', 0.22, 0.65, 0.22, '#111111', 5.2, 0.9, -0.2); // right leg
    // Tie detail — brand blue
    box('tony_tie', 0.08, 0.4, 0.06, '#3B82F6', 5, 1.85, 0.0);

    // === NAME TAG ===
    const GUI = await import('@babylonjs/gui');
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');

    const nameRect = new GUI.Rectangle();
    nameRect.width = '170px';
    nameRect.height = '32px';
    nameRect.cornerRadius = 8;
    nameRect.color = '#3B82F6';
    nameRect.thickness = 1.5;
    nameRect.background = 'rgba(24, 24, 48, 0.8)';
    advancedTexture.addControl(nameRect);
    nameRect.linkWithMesh(scene.getMeshByName('tony_head'));
    nameRect.linkOffsetY = -55;

    const nameText = new GUI.TextBlock();
    nameText.text = 'TONY SHARMA';
    nameText.color = '#3B82F6';
    nameText.fontSize = 13;
    nameText.fontFamily = 'Saira Condensed, sans-serif';
    nameRect.addControl(nameText);

    const roleRect = new GUI.Rectangle();
    roleRect.width = '130px';
    roleRect.height = '20px';
    roleRect.cornerRadius = 6;
    roleRect.color = '#3B82F655';
    roleRect.thickness = 1;
    roleRect.background = 'rgba(24, 24, 48, 0.6)';
    advancedTexture.addControl(roleRect);
    roleRect.linkWithMesh(scene.getMeshByName('tony_head'));
    roleRect.linkOffsetY = -28;

    const roleText = new GUI.TextBlock();
    roleText.text = 'Career Mentor';
    roleText.color = '#E1E3FA';
    roleText.fontSize = 10;
    roleText.fontFamily = 'Kanit, sans-serif';
    roleRect.addControl(roleText);

    // === SUBTLE TONY IDLE ANIMATION ===
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      time += 0.02;
      const head = scene.getMeshByName('tony_head');
      if (head) head.position.y = 2.38 + Math.sin(time * 2) * 0.015;
      const body = scene.getMeshByName('tony_body');
      if (body) body.position.y = 1.72 + Math.sin(time * 2) * 0.008;
    });

    // NO fog — clean clear view

  }, []);

  const handleNameSubmit = () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) return;

    // Initialize the game state with the player's name
    store.initGame(trimmedName, "fresher");
    // initGame sets uiPhase to "tony_room", so TonyRoom stays mounted

    // Move to first question
    setDialoguePhase('intro');
  };

  const handleChoiceClick = (choiceId: string) => {
    if (!currentScenario) return;

    const choice = currentScenario.choices.find(c => c.id === choiceId);
    if (!choice) return;

    // Apply the choice to the game state
    const state = useGameStore.getState();
    const { newState, notifications } = applyChoice(state, choice);

    // Update store
    useGameStore.setState({
      ...newState,
      notifications: [...state.notifications, ...notifications],
      history: [...state.history, currentScenario.id],
    });

    // Show Tony's reaction
    setDialoguePhase('reaction');

    // After reaction, move to next question or complete
    setTimeout(() => {
      if (questionIndex < ONBOARDING_IDS.length - 1) {
        setQuestionIndex(prev => prev + 1);
        setDialoguePhase('question');
      } else {
        // All questions done
        setDialoguePhase('complete');
      }
    }, 2000);
  };

  const handleEnterWorld = () => {
    // Set the setup_complete flag and transition to Floor 0
    useGameStore.setState({
      flags: { ...useGameStore.getState().flags, setup_complete: true },
      huntStage: 0,
      huntProgress: 0,
    });
    onComplete();
  };

  const skipTyping = () => {
    setIsTyping(false);
    // Force display full text
    let fullText = '';
    if (dialoguePhase === 'name_input') {
      fullText = "Welcome to Career City! I'm Tony Sharma — your career mentor and well-wisher. Before we begin, tell me... what's your name?";
    } else if (dialoguePhase === 'intro' || dialoguePhase === 'question') {
      fullText = TONY_INTROS[currentScenarioId] || '';
    } else if (dialoguePhase === 'reaction') {
      fullText = TONY_REACTIONS[currentScenarioId] || '';
    } else if (dialoguePhase === 'complete') {
      fullText = `You're ready, ${store.characterName}. The city is waiting for you out there. Go make your mark — and remember, I'm always here if you need guidance. Good luck!`;
    }
    setDisplayedText(fullText);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#000',
      opacity: fadeIn ? 1 : 0,
      transition: 'opacity 0.8s ease',
    }}>
      {/* Babylon.js 3D Scene */}
      <BabylonCanvas onSceneReady={handleSceneReady} />

      {/* Subtle overlay only at bottom for dialogue readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(transparent 65%, rgba(0,0,0,0.3) 85%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Question progress indicator */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 8,
        zIndex: 20,
      }}>
        {dialoguePhase !== 'name_input' && ONBOARDING_IDS.map((_, i) => (
          <div key={i} style={{
            width: 32,
            height: 4,
            borderRadius: 2,
            background: i < questionIndex ? '#20C997'
              : i === questionIndex ? '#3B82F6'
              : 'rgba(255,255,255,0.2)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>

      {/* Question number */}
      <div style={{
        position: 'absolute',
        top: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#E1E3FA',
        fontSize: 11,
        fontFamily: '"Kanit", sans-serif',
        zIndex: 20,
      }}>
        {dialoguePhase === 'name_input' ? 'Getting Started'
          : dialoguePhase === 'complete' ? 'Setup Complete'
          : `Question ${questionIndex + 1} of ${ONBOARDING_IDS.length}`}
      </div>

      {/* Dialogue Box */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        pointerEvents: 'auto',
      }}>
        <div style={{
          maxWidth: 750,
          margin: '0 auto 24px auto',
          background: 'rgba(24, 24, 48, 0.95)',
          borderRadius: 16,
          border: '2px solid #3B82F6',
          padding: '20px 28px',
          color: 'white',
          fontFamily: '"Kanit", sans-serif',
          boxShadow: '0 -10px 40px rgba(59, 130, 246, 0.15)',
          backdropFilter: 'blur(10px)',
        }}>
          {/* Tony's name & role */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
          }}>
            {/* Tony avatar photo */}
            <img
              src="/tony_sharma.png"
              alt="Tony Sharma"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                objectFit: 'cover',
                objectPosition: 'top',
                border: '2px solid #3B82F6',
                flexShrink: 0,
              }}
              onError={(e) => {
                // Fallback to "T" circle if image not found
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.innerText = 'T';
                fallback.style.cssText = 'width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#6F53C1);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;color:#fff;flex-shrink:0';
                el.parentElement?.insertBefore(fallback, el);
              }}
            />
            <div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#3B82F6', fontFamily: '"Saira Condensed", sans-serif', textTransform: 'uppercase' as const, letterSpacing: 1 }}>Tony Sharma</div>
              <div style={{ fontSize: 11, color: '#E1E3FA' }}>Career Mentor & Well-Wisher</div>
            </div>
            {currentScenario && (dialoguePhase === 'intro' || dialoguePhase === 'question') && (
              <div style={{
                marginLeft: 'auto',
                padding: '4px 12px',
                borderRadius: 12,
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                fontSize: 11,
                color: '#D7EF3F',
              }}>
                {currentScenario.title}
              </div>
            )}
          </div>

          {/* Tony's speech */}
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: '#ddd',
              minHeight: 48,
              cursor: isTyping ? 'pointer' : 'default',
            }}
            onClick={isTyping ? skipTyping : undefined}
          >
            {displayedText}
            {isTyping && <span style={{ animation: 'blink 0.5s infinite', color: '#D7EF3F' }}>|</span>}
          </div>

          {/* Name input — show when typing is done and we're in name_input phase */}
          {!isTyping && dialoguePhase === 'name_input' && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSubmit();
                }}
                placeholder="Type your name..."
                maxLength={30}
                autoFocus
                style={{
                  flex: 1,
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#fff',
                  padding: '12px 18px',
                  borderRadius: 10,
                  fontSize: 15,
                  fontFamily: '"Kanit", sans-serif',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleNameSubmit}
                disabled={!nameInput.trim()}
                style={{
                  background: nameInput.trim()
                    ? 'linear-gradient(135deg, #3B82F6, #6F53C1)'
                    : 'rgba(59, 130, 246, 0.15)',
                  border: 'none',
                  color: nameInput.trim() ? '#fff' : '#666',
                  padding: '12px 24px',
                  borderRadius: 10,
                  cursor: nameInput.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  fontWeight: 'bold',
                  fontFamily: '"Saira Condensed", sans-serif',
                  transition: 'all 0.2s',
                }}
              >
                Continue &rarr;
              </button>
            </div>
          )}

          {/* Choice buttons — only show when typing is done and we're in question phase */}
          {!isTyping && (dialoguePhase === 'intro' || dialoguePhase === 'question') && currentScenario && (
            <div style={{
              marginTop: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              {currentScenario.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoiceClick(choice.id)}
                  style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#fff',
                    padding: '12px 18px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                    e.currentTarget.style.borderColor = '#3B82F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#D7EF3F', marginBottom: 2 }}>{choice.text}</div>
                    {choice.description && (
                      <div style={{ fontSize: 11, color: '#999' }}>{choice.description}</div>
                    )}
                  </div>
                  <span style={{ color: '#3B82F6', fontSize: 16, marginLeft: 12 }}>&rarr;</span>
                </button>
              ))}
            </div>
          )}

          {/* Reaction phase — show "Continue" */}
          {!isTyping && dialoguePhase === 'reaction' && (
            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#666' }}>Tony is thinking...</span>
            </div>
          )}

          {/* Complete — Enter World button */}
          {!isTyping && dialoguePhase === 'complete' && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button
                onClick={handleEnterWorld}
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #6F53C1)',
                  border: 'none',
                  color: '#fff',
                  padding: '14px 36px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 'bold',
                  fontFamily: '"Saira Condensed", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(59, 130, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.3)';
                }}
              >
                Enter Career City &rarr;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Blink cursor animation */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
