/**
 * GAME2D COMPONENT — React wrapper for Phaser game
 *
 * Main entry point for 2D career simulator
 */

'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import styles from './Game2D.module.css';

// Dynamically import Phaser and GameConfig only on client
let Phaser: any;
let initializeGame: any;
let gameConfig: any;

interface Game2DProps {
  onGameLoaded?: (game: any) => void;
  onGameDestroyed?: () => void;
}

export function Game2D({ onGameLoaded, onGameDestroyed }: Game2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Dynamic import at runtime
    Promise.all([
      import('phaser'),
      import('@/game/GameConfig')
    ]).then(([phaserModule, configModule]) => {
      Phaser = phaserModule.default || phaserModule;
      const { initializeGame: init, gameConfig: config } = configModule;
      initializeGame = init;
      gameConfig = config;

      // Initialize Phaser game
      try {
        gameRef.current = initializeGame(containerRef.current);

        if (onGameLoaded) {
          onGameLoaded(gameRef.current);
        }

        console.log('✅ Game initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize game:', error);
      }
    }).catch(err => {
      console.error('❌ Failed to load Phaser:', err);
    });

    // Cleanup function
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;

        if (onGameDestroyed) {
          onGameDestroyed();
        }

        console.log('✅ Game destroyed');
      }
    };
  }, [onGameLoaded, onGameDestroyed]);

  return (
    <div className={styles.gameContainer} ref={containerRef}>
      <div className={styles.loadingOverlay}>
        <p>Initializing Career Simulator...</p>
      </div>
    </div>
  );
}

/**
 * Game2D with full screen support
 */
export function Game2DFullScreen() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Game2D />
    </div>
  );
}

export default Game2D;
