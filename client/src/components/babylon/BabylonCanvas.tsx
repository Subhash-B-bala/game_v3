'use client';

import React, { useEffect, useRef } from 'react';

export interface SceneReadyArgs {
  scene: any;
  engine: any;
  canvas: HTMLCanvasElement;
}

interface BabylonCanvasProps {
  onSceneReady: (args: SceneReadyArgs) => void;
  onDispose?: () => void;
}

export function BabylonCanvas({ onSceneReady, onDispose }: BabylonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    let disposed = false;

    (async () => {
      const BABYLON = await import('@babylonjs/core');

      if (disposed) return;

      const engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true,
      });
      engineRef.current = engine;

      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.98, 1); // Sky blue

      // Enable collisions
      scene.collisionsEnabled = true;
      scene.gravity = new BABYLON.Vector3(0, -9.81, 0);

      onSceneReady({ scene, engine, canvas });

      engine.runRenderLoop(() => {
        if (!disposed && scene.activeCamera) {
          scene.render();
        }
      });

      const handleResize = () => {
        engine.resize();
      };
      window.addEventListener('resize', handleResize);

      // Store cleanup ref
      (engine as any).__resizeHandler = handleResize;
    })();

    return () => {
      disposed = true;
      if (engineRef.current) {
        const engine = engineRef.current;
        const handler = (engine as any).__resizeHandler;
        if (handler) {
          window.removeEventListener('resize', handler);
        }
        engine.dispose();
        engineRef.current = null;
      }
      if (onDispose) onDispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        outline: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
