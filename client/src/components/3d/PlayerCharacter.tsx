import SpriteCharacter from './SpriteCharacter';

interface PlayerCharacterProps {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  spritePath?: string;
}

/**
 * Player character component using 2D sprites
 * Much simpler and easier to manage than 3D FBX models
 */
export default function PlayerCharacter({
  position = [0, 0, 0],
  scale = 1,
  color = '#3498db',
  spritePath,
}: PlayerCharacterProps) {
  return <SpriteCharacter position={position} scale={scale} color={color} texturePath={spritePath} />;
}

/*
 * Note: Switched from 3D FBX models to 2D sprite-based characters
 * This is much simpler, easier to scale, and performs better.
 *
 * To use custom sprite images:
 * 1. Add sprite PNG files to /public/sprites/characters/
 * 2. Pass spritePath prop: <PlayerCharacter spritePath="/sprites/characters/player.png" />
 *
 * If no sprite path is provided, a simple colored placeholder shape is used.
 */
