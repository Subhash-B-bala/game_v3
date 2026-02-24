/**
 * Utility functions for building 3D environments using procedural geometry
 * These create furniture and room elements without requiring model downloads
 */

export interface FurnitureProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  onClick?: () => void;
  interactive?: boolean;
}

// Color palette for consistent styling
export const COLORS = {
  wood: '#8B4513',
  darkWood: '#654321',
  metal: '#888888',
  screen: '#222222',
  screenActive: '#4488ff',
  wall: '#F5F5F5',
  floor: '#D3D3D3',
  ceiling: '#FFFFFF',
  glass: '#88CCFF',
  fabric: '#444444',
  plant: '#228B22',
};

// Reusable geometry configurations
export const FURNITURE_CONFIGS = {
  desk: {
    tabletop: { width: 2, height: 0.05, depth: 1 },
    leg: { radius: 0.05, height: 0.7 },
    legPositions: [
      [-0.8, 0.4, -0.4],
      [0.8, 0.4, -0.4],
      [-0.8, 0.4, 0.4],
      [0.8, 0.4, 0.4],
    ] as [number, number, number][],
  },
  chair: {
    seat: { width: 0.5, height: 0.05, depth: 0.5 },
    back: { width: 0.5, height: 0.6, depth: 0.05 },
    leg: { radius: 0.03, height: 0.4 },
    legPositions: [
      [-0.2, 0.2, -0.2],
      [0.2, 0.2, -0.2],
      [-0.2, 0.2, 0.2],
      [0.2, 0.2, 0.2],
    ] as [number, number, number][],
  },
  computer: {
    monitor: { width: 0.6, height: 0.4, depth: 0.05 },
    keyboard: { width: 0.4, height: 0.02, depth: 0.15 },
    mouse: { radius: 0.04, height: 0.02 },
  },
  bookshelf: {
    shelf: { width: 1.5, height: 0.03, depth: 0.4 },
    back: { width: 1.5, height: 2, depth: 0.05 },
    shelfCount: 4,
  },
  door: {
    frame: { width: 1, height: 2.2, depth: 0.1 },
    door: { width: 0.9, height: 2, depth: 0.05 },
  },
  window: {
    frame: { width: 1.5, height: 1.5, depth: 0.1 },
    glass: { width: 1.4, height: 1.4, depth: 0.02 },
  },
};

/**
 * Helper to create box collision geometry
 */
export function createCollisionBox(
  width: number,
  height: number,
  depth: number,
  position: [number, number, number]
) {
  return {
    type: 'box' as const,
    args: [width, height, depth] as [number, number, number],
    position,
  };
}

/**
 * Helper to create wall collision
 */
export function createWallCollision(
  width: number,
  height: number,
  position: [number, number, number],
  rotation?: [number, number, number]
) {
  return {
    type: 'box' as const,
    args: [width, height, 0.1] as [number, number, number],
    position,
    rotation: rotation || [0, 0, 0],
  };
}

/**
 * Calculate room dimensions and collision boxes
 */
export function createRoomCollisions(
  width: number,
  depth: number,
  height: number
) {
  return [
    // North wall
    createWallCollision(width, height, [0, height / 2, -depth / 2]),
    // South wall
    createWallCollision(width, height, [0, height / 2, depth / 2]),
    // West wall
    createWallCollision(depth, height, [-width / 2, height / 2, 0], [0, Math.PI / 2, 0]),
    // East wall
    createWallCollision(depth, height, [width / 2, height / 2, 0], [0, Math.PI / 2, 0]),
  ];
}

/**
 * Standard furniture collision boxes
 */
export const FURNITURE_COLLISIONS = {
  desk: createCollisionBox(2, 0.75, 1, [0, 0.375, 0]),
  chair: createCollisionBox(0.5, 0.5, 0.5, [0, 0.25, 0]),
  bookshelf: createCollisionBox(1.5, 2, 0.4, [0, 1, 0]),
  table: createCollisionBox(3, 0.75, 1.5, [0, 0.375, 0]),
};

/**
 * Lighting presets for different rooms
 */
export const LIGHTING_PRESETS = {
  office: {
    ambient: { intensity: 0.4, color: '#ffffff' },
    directional: { intensity: 0.6, position: [5, 8, 3], color: '#fff5e6' },
    points: [
      { intensity: 0.3, position: [0, 2.5, 0], color: '#fff5e6', distance: 8 },
    ],
  },
  home: {
    ambient: { intensity: 0.5, color: '#fff5e6' },
    directional: { intensity: 0.5, position: [-5, 6, 3], color: '#ffedd5' },
    points: [
      { intensity: 0.4, position: [0, 2, 0], color: '#fff5e6', distance: 6 },
    ],
  },
  interview: {
    ambient: { intensity: 0.3, color: '#ffffff' },
    directional: { intensity: 0.7, position: [0, 8, 0], color: '#ffffff' },
    points: [],
  },
};
