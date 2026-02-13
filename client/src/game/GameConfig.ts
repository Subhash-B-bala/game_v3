/**
 * GAME CONFIGURATION — Phaser Setup
 *
 * Configures game instance, registers scenes, physics settings
 */

import * as Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import { DowntownScene } from './scenes/DowntownScene';
import { LibraryScene } from './scenes/LibraryScene';
import { TechOfficeScene } from './scenes/TechOfficeScene';
import { HomeScene } from './scenes/HomeScene';
import { ParkScene } from './scenes/ParkScene';
import { InterviewScene } from './scenes/InterviewScene';
import { CoffeeChatScene } from './scenes/CoffeeChatScene';
import { NetworkingEventScene } from './scenes/NetworkingEventScene';
import { MentoringScene } from './scenes/MentoringScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  // Type of rendering
  type: Phaser.AUTO,

  // Canvas size
  width: 1024,
  height: 768,

  // Physics
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // Top-down game, no gravity
      debug: process.env.NODE_ENV === 'development',
    },
  },

  // Rendering
  render: {
    pixelArt: true,
    antialias: false,
  },

  // Scenes - BootScene first (entry point), then all location/activity scenes
  scene: [
    BootScene,
    DowntownScene,
    LibraryScene,
    TechOfficeScene,
    HomeScene,
    ParkScene,
    InterviewScene,
    CoffeeChatScene,
    NetworkingEventScene,
    MentoringScene,
  ],

  // Scale mode
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

/**
 * Initialize game instance
 * Call this from React component
 */
export function initializeGame(container: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    ...gameConfig,
    parent: container,
  });
}

/**
 * Scene keys (constants for scene transitions)
 */
export const SCENE_KEYS = {
  BOOT: 'BootScene',
  DOWNTOWN: 'DowntownScene',
  LIBRARY: 'LibraryScene',
  TECH_OFFICE: 'TechOfficeScene',
  HOME: 'HomeScene',
  PARK: 'ParkScene',
  INTERVIEW: 'InterviewScene',
  CODING_CHALLENGE: 'CodingChallengeScene',
  NETWORKING_EVENT: 'NetworkingEventScene',
  COFFEE_CHAT: 'CoffeeChatScene',
};

/**
 * Get all scene keys
 */
export function getAllSceneKeys(): string[] {
  return Object.values(SCENE_KEYS);
}

/**
 * Get location-related scenes
 */
export const LOCATION_KEYS = {
  downtown: SCENE_KEYS.DOWNTOWN,
  library: SCENE_KEYS.LIBRARY,
  tech_office: SCENE_KEYS.TECH_OFFICE,
  home: SCENE_KEYS.HOME,
  park: SCENE_KEYS.PARK,
} as const;

/**
 * Get activity-related scenes
 */
export const ACTIVITY_KEYS = {
  interview: SCENE_KEYS.INTERVIEW,
  coding_challenge: SCENE_KEYS.CODING_CHALLENGE,
  networking_event: SCENE_KEYS.NETWORKING_EVENT,
  coffee_chat: SCENE_KEYS.COFFEE_CHAT,
} as const;

/**
 * Camera settings for top-down 2D view
 */
export const CAMERA_CONFIG = {
  width: 1024,
  height: 768,
  zoom: 1.0,
  followSmoothing: 0.1,
};

/**
 * World bounds
 */
export const WORLD_BOUNDS = {
  downtown: {
    width: 1024,
    height: 768,
  },
  library: {
    width: 1024,
    height: 768,
  },
  tech_office: {
    width: 1024,
    height: 768,
  },
  home: {
    width: 1024,
    height: 768,
  },
  park: {
    width: 1024,
    height: 768,
  },
} as const;

/**
 * Input settings
 */
export const INPUT_CONFIG = {
  // Movement keys
  moveUpKey: 'W',
  moveDownKey: 'S',
  moveLeftKey: 'A',
  moveRightKey: 'D',

  // Interaction key
  interactKey: 'E',

  // Menu keys
  menuKey: 'ESC',
  pauseKey: 'P',

  // Speed
  moveSpeed: 200, // pixels per second
  sprintSpeed: 300,
  sprintKey: 'SHIFT',
};

/**
 * UI layer constants
 */
export const UI_LAYERS = {
  world: 0,
  npcs: 1,
  player: 2,
  ui: 3,
  hud: 4,
  modal: 5,
};

/**
 * Animation config
 */
export const ANIMATION_CONFIG = {
  walkDuration: 150, // ms per frame
  walkFrameCount: 4,
  idleDuration: 100,
};

/**
 * Dialogue UI config
 */
export const DIALOGUE_UI_CONFIG = {
  width: 900,
  height: 250,
  x: 512,
  y: 600,
  backgroundColor: '#1a1a2e',
  borderColor: '#16c784',
  textColor: '#ffffff',
  fontSize: '16px',
  maxLineLength: 80,
};

/**
 * HUD config
 */
export const HUD_CONFIG = {
  width: 280,
  height: 150,
  x: 10,
  y: 10,
  backgroundColor: 'rgba(26, 26, 46, 0.8)',
  borderColor: '#16c784',
  textColor: '#ffffff',
  fontSize: '14px',
};

/**
 * NPCs config
 */
export const NPC_CONFIG = {
  interactionRadius: 50,
  nameTagOffsetY: -30,
  spriteScale: 1.0,
};

/**
 * Time settings (game hours = real seconds * TIME_SCALE)
 */
export const TIME_CONFIG = {
  TIME_SCALE: 1, // 1 real second = 1 game minute
  START_HOUR: 8, // Game starts at 8 AM
  START_DAY: 0,
  GAME_DAY_DURATION: 16 * 60 * 1000, // 16 hours, 16 minutes real time
};

/**
 * Debug settings
 */
export const DEBUG_CONFIG = {
  showBounds: false,
  showInteractionRadius: false,
  showColliders: false,
  logSceneTransitions: true,
  logDialogueSelection: true,
};
