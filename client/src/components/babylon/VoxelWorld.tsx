'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { BabylonCanvas, type SceneReadyArgs } from './BabylonCanvas';
import { GameHUD, NPCDialogueOverlay } from './GameHUD';
import { generateWorld, renderWorld } from './VoxelWorldGenerator';
import { createPlayerController, type PlayerController } from './PlayerController';
import { createNPCSystem, type NPCSystemHandle } from './NPCSystem';
import { createDoorSystem, type DoorSystemHandle } from './DoorSystem';
import { createGameBridge, type GameBridgeHandle } from './GameBridge';
import { generateIndoorRoom, renderIndoorRoom } from './DoorSystem';

interface VoxelWorldProps {
  playerName?: string;
  onStatsUpdate?: (stats: any) => void;
}

interface WorldState {
  currentZone: string | null;
  isIndoor: boolean;
  currentBuilding: string | null;
  dialogueNPC: { id: string; name: string; role: string } | null;
}

export function VoxelWorld({ playerName = 'Player' }: VoxelWorldProps) {
  const [worldState, setWorldState] = useState<WorldState>({
    currentZone: null,
    isIndoor: false,
    currentBuilding: null,
    dialogueNPC: null,
  });

  // Game stats (will connect to Zustand store)
  const [stats, setStats] = useState({
    energy: 80,
    stress: 25,
    confidence: 50,
    network: 10,
    savings: 5000,
    day: 1,
    month: 1,
  });

  const systemsRef = useRef<{
    scene: any;
    engine: any;
    canvas: HTMLCanvasElement;
    player: PlayerController | null;
    npcSystem: NPCSystemHandle | null;
    doorSystem: DoorSystemHandle | null;
    gameBridge: GameBridgeHandle | null;
    worldData: any;
    outdoorPosition: { x: number; y: number; z: number } | null;
  }>({
    scene: null,
    engine: null,
    canvas: null as any,
    player: null,
    npcSystem: null,
    doorSystem: null,
    gameBridge: null,
    worldData: null,
    outdoorPosition: null,
  });

  const handleSceneReady = useCallback(async ({ scene, engine, canvas }: SceneReadyArgs) => {
    const systems = systemsRef.current;
    systems.scene = scene;
    systems.engine = engine;
    systems.canvas = canvas;

    await loadOutdoorWorld(scene, canvas, systems);
  }, []);

  const loadOutdoorWorld = async (scene: any, canvas: HTMLCanvasElement, systems: any) => {
    // Generate the city
    const worldData = generateWorld();
    systems.worldData = worldData;

    // Render it
    const { collisionMeshes, doorMeshes } = await renderWorld(worldData, scene);

    // Determine spawn position
    const spawn = systems.outdoorPosition || worldData.playerSpawn;

    // Create player
    const player = await createPlayerController(scene, canvas, {
      spawnX: spawn.x,
      spawnY: spawn.y,
      spawnZ: spawn.z,
    });
    systems.player = player;

    // Create NPC system
    const npcSystem = await createNPCSystem(
      scene,
      worldData.npcs,
      player.getPosition
    );
    systems.npcSystem = npcSystem;

    // Create door system
    const doorSystem = await createDoorSystem(
      scene,
      worldData.doors,
      player.getPosition
    );
    systems.doorSystem = doorSystem;

    // Create game bridge
    const gameBridge = await createGameBridge(
      scene,
      npcSystem,
      doorSystem,
      worldData.zones,
      player.getPosition,
      {
        onNPCInteract: (npcId, npcName, npcRole) => {
          player.setFrozen(true);
          setWorldState(prev => ({
            ...prev,
            dialogueNPC: { id: npcId, name: npcName, role: npcRole },
          }));
        },
        onDoorEnter: async (doorId, targetBuilding) => {
          await handleEnterBuilding(targetBuilding);
        },
        onZoneChange: (zoneName) => {
          setWorldState(prev => ({ ...prev, currentZone: zoneName }));
        },
        onPositionUpdate: (x, y, z) => {
          // Could update Zustand store here
        },
      }
    );
    systems.gameBridge = gameBridge;

    setWorldState(prev => ({ ...prev, isIndoor: false, currentBuilding: null }));
  };

  const handleEnterBuilding = async (buildingName: string) => {
    const systems = systemsRef.current;
    if (!systems.scene || !systems.player) return;

    // Save outdoor position
    systems.outdoorPosition = systems.player.getPosition();

    // Dispose current scene content
    disposeCurrentWorld(systems);

    // Generate indoor room
    const roomData = generateIndoorRoom(buildingName);

    // Clear scene (keep engine)
    // We need to dispose all meshes except the engine
    const scene = systems.scene;

    // Render indoor room
    await renderIndoorRoom(roomData, scene);

    // Create player inside room
    const player = await createPlayerController(scene, systems.canvas, {
      spawnX: roomData.width / 2,
      spawnY: 1.5,
      spawnZ: roomData.depth - 3,
    });
    systems.player = player;

    // Indoor NPC (if applicable)
    const indoorNPCs = getIndoorNPC(buildingName, roomData);
    if (indoorNPCs.length > 0) {
      const npcSystem = await createNPCSystem(scene, indoorNPCs, player.getPosition);
      systems.npcSystem = npcSystem;
    }

    // Door system for exit
    const exitDoors = [{
      id: 'exit_door',
      x: roomData.exitDoor.x,
      y: roomData.exitDoor.y,
      z: roomData.exitDoor.z,
      targetBuilding: 'outdoor',
      label: 'Exit',
    }];
    const doorSystem = await createDoorSystem(scene, exitDoors, player.getPosition);
    systems.doorSystem = doorSystem;

    // Game bridge for indoor
    const gameBridge = await createGameBridge(
      scene,
      systems.npcSystem!,
      doorSystem,
      [],
      player.getPosition,
      {
        onNPCInteract: (npcId, npcName, npcRole) => {
          player.setFrozen(true);
          setWorldState(prev => ({
            ...prev,
            dialogueNPC: { id: npcId, name: npcName, role: npcRole },
          }));
        },
        onDoorEnter: async () => {
          await handleExitBuilding();
        },
        onZoneChange: () => {},
        onPositionUpdate: () => {},
      }
    );
    systems.gameBridge = gameBridge;

    setWorldState(prev => ({
      ...prev,
      isIndoor: true,
      currentBuilding: buildingName,
      currentZone: buildingName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    }));
  };

  const handleExitBuilding = async () => {
    const systems = systemsRef.current;
    if (!systems.scene) return;

    // Dispose indoor content
    disposeCurrentWorld(systems);

    // Reload outdoor world
    await loadOutdoorWorld(systems.scene, systems.canvas, systems);
  };

  const disposeCurrentWorld = (systems: any) => {
    if (systems.player) { systems.player.dispose(); systems.player = null; }
    if (systems.npcSystem) { systems.npcSystem.dispose(); systems.npcSystem = null; }
    if (systems.doorSystem) { systems.doorSystem.dispose(); systems.doorSystem = null; }
    if (systems.gameBridge) { systems.gameBridge.dispose(); systems.gameBridge = null; }

    // Dispose all meshes in scene
    const scene = systems.scene;
    if (scene) {
      const meshes = [...scene.meshes];
      for (const mesh of meshes) {
        mesh.dispose();
      }
      const materials = [...scene.materials];
      for (const mat of materials) {
        mat.dispose();
      }
      const lights = [...scene.lights];
      for (const light of lights) {
        light.dispose();
      }
      const textures = [...scene.textures];
      for (const tex of textures) {
        tex.dispose();
      }
    }
  };

  const handleCloseDialogue = useCallback(() => {
    setWorldState(prev => ({ ...prev, dialogueNPC: null }));
    if (systemsRef.current.player) {
      systemsRef.current.player.setFrozen(false);
    }
  }, []);

  // ESC key to close dialogue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && worldState.dialogueNPC) {
        handleCloseDialogue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [worldState.dialogueNPC, handleCloseDialogue]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      {/* Babylon.js Canvas */}
      <BabylonCanvas onSceneReady={handleSceneReady} />

      {/* HUD Overlay */}
      <GameHUD
        playerName={playerName}
        energy={stats.energy}
        stress={stats.stress}
        day={stats.day}
        month={stats.month}
        savings={stats.savings}
        currentZone={worldState.currentZone}
        confidence={stats.confidence}
        network={stats.network}
      />

      {/* Indoor indicator */}
      {worldState.isIndoor && (
        <div style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: 8,
          padding: '6px 16px',
          color: '#FFD600',
          fontSize: 14,
          fontFamily: 'monospace',
          fontWeight: 'bold',
          zIndex: 10,
          border: '1px solid rgba(255, 214, 0, 0.3)',
        }}>
          {worldState.currentZone || 'Indoor'}
        </div>
      )}

      {/* NPC Dialogue Overlay */}
      {worldState.dialogueNPC && (
        <NPCDialogueOverlay
          npcName={worldState.dialogueNPC.name}
          npcRole={worldState.dialogueNPC.role}
          onClose={handleCloseDialogue}
        />
      )}

      {/* Loading indicator (shows briefly on first load) */}
      <LoadingOverlay />
    </div>
  );
}

function LoadingOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      transition: 'opacity 0.5s ease',
      opacity: visible ? 1 : 0,
    }}>
      <div style={{ fontSize: 28, fontWeight: 'bold', color: '#FFD600', marginBottom: 12, fontFamily: 'monospace' }}>
        Career City
      </div>
      <div style={{ fontSize: 14, color: '#888', fontFamily: 'monospace' }}>
        Generating voxel world...
      </div>
      <div style={{
        width: 200,
        height: 4,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        marginTop: 20,
        overflow: 'hidden',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: '#FFD600',
          borderRadius: 2,
          animation: 'loadProgress 2s ease-in-out',
        }} />
      </div>
      <style>{`
        @keyframes loadProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}

function getIndoorNPC(buildingName: string, roomData: any) {
  const npcMap: Record<string, { id: string; name: string; color: string; role: string }> = {
    library: { id: 'alex_indoor', name: 'Alex', color: '#2196F3', role: 'Mentor' },
    tech_office: { id: 'casey_indoor', name: 'Casey', color: '#FF9800', role: 'HR Manager' },
    coffee_shop: { id: 'barista', name: 'Barista', color: '#795548', role: 'Barista' },
    home: { id: 'family_indoor', name: 'Family', color: '#9C27B0', role: 'Support' },
  };

  const npc = npcMap[buildingName];
  if (!npc || !roomData.npcSpawn) return [];

  return [{
    ...npc,
    x: roomData.npcSpawn.x,
    y: roomData.npcSpawn.y,
    z: roomData.npcSpawn.z,
    zone: buildingName,
  }];
}

export default VoxelWorld;
