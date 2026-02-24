/**
 * GameBridge — Connects Babylon.js world events to Zustand game store
 *
 * Handles:
 * - E key interaction routing (NPC talk, door enter)
 * - Player position updates to store
 * - Zone detection and name display
 * - Interaction prompt UI
 */

import type { NPCSystemHandle } from './NPCSystem';
import type { DoorSystemHandle } from './DoorSystem';
import type { InteractableObjectSystemHandle } from './InteractableObjectSystem';
import type { ZoneArea } from './VoxelWorldGenerator';

export interface GameBridgeCallbacks {
  onNPCInteract: (npcId: string, npcName: string, npcRole: string) => void;
  onObjectInteract?: (objectId: string, objectName: string) => void;
  onDoorEnter: (doorId: string, targetBuilding: string) => void;
  onZoneChange: (zoneName: string) => void;
  onPositionUpdate: (x: number, y: number, z: number) => void;
}

export interface GameBridgeHandle {
  getPromptText: () => string | null;
  getCurrentZone: () => string | null;
  dispose: () => void;
}

export async function createGameBridge(
  scene: any,
  npcSystem: NPCSystemHandle | null,
  doorSystem: DoorSystemHandle | null,
  zones: ZoneArea[],
  getPlayerPosition: () => { x: number; y: number; z: number },
  callbacks: GameBridgeCallbacks,
  objectSystem?: InteractableObjectSystemHandle | null
): Promise<GameBridgeHandle> {
  const BABYLON = await import('@babylonjs/core');
  const GUI = await import('@babylonjs/gui');

  let currentPrompt: string | null = null;
  let currentZone: string | null = null;
  let positionUpdateTimer = 0;

  // ---- Interaction prompt UI ----
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('bridgeUI', true, scene);

  // Prompt panel at bottom of screen
  const promptPanel = new GUI.Rectangle('promptPanel');
  promptPanel.width = '300px';
  promptPanel.height = '50px';
  promptPanel.cornerRadius = 10;
  promptPanel.color = 'white';
  promptPanel.thickness = 2;
  promptPanel.background = 'rgba(0, 0, 0, 0.7)';
  promptPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
  promptPanel.top = '-80px';
  promptPanel.isVisible = false;
  advancedTexture.addControl(promptPanel);

  const promptText = new GUI.TextBlock('promptText');
  promptText.color = '#FFD600';
  promptText.fontSize = 16;
  promptText.fontWeight = 'bold';
  promptPanel.addControl(promptText);

  // Zone name display (center-top, fades in/out)
  const zonePanel = new GUI.Rectangle('zonePanel');
  zonePanel.width = '250px';
  zonePanel.height = '45px';
  zonePanel.cornerRadius = 8;
  zonePanel.color = 'transparent';
  zonePanel.thickness = 0;
  zonePanel.background = 'rgba(0, 0, 0, 0.5)';
  zonePanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
  zonePanel.top = '60px';
  zonePanel.alpha = 0;
  advancedTexture.addControl(zonePanel);

  const zoneText = new GUI.TextBlock('zoneText');
  zoneText.color = 'white';
  zoneText.fontSize = 18;
  zoneText.fontWeight = 'bold';
  zonePanel.addControl(zoneText);

  let zoneFadeTimer = 0;
  let zoneFading = false;

  // ---- E key handler (priority: NPC → Object → Door) ----
  scene.onKeyboardObservable.add((kbInfo: any) => {
    if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN && kbInfo.event.key.toLowerCase() === 'e') {
      // 1. Check NPCs first
      if (npcSystem) {
        const nearestNPC = npcSystem.getNearestNPC();
        if (nearestNPC) {
          callbacks.onNPCInteract(nearestNPC.id, nearestNPC.name, nearestNPC.role);
          return;
        }
      }

      // 2. Check interactable objects
      if (objectSystem && callbacks.onObjectInteract) {
        const nearObj = objectSystem.getNearestActiveObject();
        if (nearObj) {
          callbacks.onObjectInteract(nearObj.id, nearObj.name);
          return;
        }
      }

      // 3. Check doors
      if (doorSystem) {
        const nearestDoor = doorSystem.getNearestDoor();
        if (nearestDoor) {
          callbacks.onDoorEnter(nearestDoor.id, nearestDoor.targetBuilding);
          return;
        }
      }
    }
  });

  // ---- Per-frame updates ----
  scene.onBeforeRenderObservable.add(() => {
    const deltaTime = scene.getEngine().getDeltaTime() / 1000;
    const playerPos = getPlayerPosition();

    // Update interaction prompt (NPC → Object → Door priority)
    const nearestNPC = npcSystem ? npcSystem.getNearestNPC() : null;
    const nearestActiveObj = objectSystem ? objectSystem.getNearestActiveObject() : null;
    const nearestDoor = doorSystem ? doorSystem.getNearestDoor() : null;

    if (nearestNPC) {
      currentPrompt = `[E] Talk to ${nearestNPC.name}`;
      promptText.text = currentPrompt;
      promptPanel.isVisible = true;
    } else if (nearestActiveObj) {
      currentPrompt = nearestActiveObj.promptText;
      promptText.text = currentPrompt;
      promptPanel.isVisible = true;
    } else if (nearestDoor) {
      currentPrompt = `[E] Enter ${nearestDoor.label}`;
      promptText.text = currentPrompt;
      promptPanel.isVisible = true;
    } else {
      currentPrompt = null;
      promptPanel.isVisible = false;
    }

    // Zone detection
    let detectedZone: string | null = null;
    for (const zone of zones) {
      if (
        playerPos.x >= zone.xMin && playerPos.x <= zone.xMax &&
        playerPos.z >= zone.zMin && playerPos.z <= zone.zMax
      ) {
        detectedZone = zone.name;
        break;
      }
    }

    if (detectedZone && detectedZone !== currentZone) {
      currentZone = detectedZone;
      callbacks.onZoneChange(detectedZone);

      // Show zone name with fade animation
      zoneText.text = detectedZone;
      zonePanel.alpha = 1;
      zoneFadeTimer = 3; // Show for 3 seconds
      zoneFading = true;
    }

    // Zone name fade
    if (zoneFading) {
      zoneFadeTimer -= deltaTime;
      if (zoneFadeTimer <= 0) {
        zonePanel.alpha = Math.max(0, zonePanel.alpha - deltaTime * 2);
        if (zonePanel.alpha <= 0) {
          zoneFading = false;
        }
      }
    }

    // Throttled position update (every 0.5 seconds)
    positionUpdateTimer += deltaTime;
    if (positionUpdateTimer >= 0.5) {
      positionUpdateTimer = 0;
      callbacks.onPositionUpdate(playerPos.x, playerPos.y, playerPos.z);
    }
  });

  return {
    getPromptText: () => currentPrompt,
    getCurrentZone: () => currentZone,
    dispose: () => {
      advancedTexture.dispose();
    },
  };
}
