'use client';

import React, { useEffect, useRef } from 'react';

// ── Suppress noisy Babylon.js console warnings globally ──
// Babylon.js loaders, PBR materials, and WebGL internals spam console.warn/error
// directly (bypassing Logger.LogLevels). We filter these out to keep DevTools clean.
// Only suppressed during Babylon scenes — non-Babylon warnings pass through normally.
const BABYLON_WARN_PATTERNS = [
  /babylonjs/i,
  /PBR/i,
  /environment texture/i,
  /shader/i,
  /glTF/i,
  /GLTF/i,
  /Unable to/i,
  /WebGL/i,
  /texture/i,
  /material/i,
  /KHR_/i,
  /EXT_/i,
  /SceneLoader/i,
  /AnimationGroup/i,
  /BoundingInfo/i,
  /has no morph target manager/i,
  /has no skeleton/i,
  /VertexBuffer/i,
  /mesh\.material/i,
  /skinning/i,
  /tangent/i,
  /has been already released/i,
  /render target/i,
];

let babylonSuppressed = false;
const originalWarn = typeof window !== 'undefined' ? console.warn : null;
const originalError = typeof window !== 'undefined' ? console.error : null;

function isBabylonMessage(...args: any[]): boolean {
  const msg = args.map(a => (typeof a === 'string' ? a : String(a))).join(' ');
  return BABYLON_WARN_PATTERNS.some(p => p.test(msg));
}

function enableBabylonSuppression() {
  if (babylonSuppressed || typeof window === 'undefined') return;
  babylonSuppressed = true;

  console.warn = (...args: any[]) => {
    if (!isBabylonMessage(...args) && originalWarn) originalWarn.apply(console, args);
  };
  console.error = (...args: any[]) => {
    if (!isBabylonMessage(...args) && originalError) originalError.apply(console, args);
  };
}

function disableBabylonSuppression() {
  if (!babylonSuppressed || typeof window === 'undefined') return;
  babylonSuppressed = false;
  if (originalWarn) console.warn = originalWarn;
  if (originalError) console.error = originalError;
}

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

    // Start suppressing Babylon.js console noise
    enableBabylonSuppression();

    (async () => {
      const BABYLON = await import('@babylonjs/core');

      // Also suppress via Babylon's own Logger system
      BABYLON.Logger.LogLevels = BABYLON.Logger.NoneLogLevel;

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
      // Restore original console methods
      disableBabylonSuppression();
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
