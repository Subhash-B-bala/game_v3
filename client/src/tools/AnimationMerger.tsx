// @ts-nocheck
'use client';

import { useState, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import * as THREE from 'three';

interface AnimationClip {
  name: string;
  clip: THREE.AnimationClip;
  file: File;
}

interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

/**
 * Animation Merger Tool
 * Combine multiple animation clips into a single GLB file
 * Based on the LinkedIn post approach
 */
export default function AnimationMerger() {
  const [baseModel, setBaseModel] = useState<LoadedModel | null>(null);
  const [animationClips, setAnimationClips] = useState<AnimationClip[]>([]);
  const [currentPreview, setCurrentPreview] = useState<number>(0);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string>('Load a base character model to start');

  // Load base model
  const handleModelUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('Loading model...');
    const loader = new GLTFLoader();
    const reader = new FileReader();

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const blob = new Blob([arrayBuffer]);
      const url = URL.createObjectURL(blob);

      loader.load(
        url,
        (gltf) => {
          setBaseModel({
            scene: gltf.scene,
            animations: gltf.animations,
          });
          setStatus(`Model loaded: ${file.name} with ${gltf.animations.length} animations`);
          URL.revokeObjectURL(url);
        },
        undefined,
        (error) => {
          setStatus(`Error loading model: ${error.message}`);
          URL.revokeObjectURL(url);
        }
      );
    };

    reader.readAsArrayBuffer(file);
  }, []);

  // Add animation clip
  const handleAnimationUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('Loading animation...');
    const loader = new GLTFLoader();
    const reader = new FileReader();

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const blob = new Blob([arrayBuffer]);
      const url = URL.createObjectURL(blob);

      loader.load(
        url,
        (gltf) => {
          if (gltf.animations.length === 0) {
            setStatus('No animations found in file');
            URL.revokeObjectURL(url);
            return;
          }

          const newClips: AnimationClip[] = gltf.animations.map((clip) => ({
            name: clip.name || `Animation ${animationClips.length + 1}`,
            clip: clip,
            file: file,
          }));

          setAnimationClips((prev) => [...prev, ...newClips]);
          setStatus(`Added ${newClips.length} animation(s): ${newClips.map(c => c.name).join(', ')}`);
          URL.revokeObjectURL(url);
        },
        undefined,
        (error) => {
          setStatus(`Error loading animation: ${error.message}`);
          URL.revokeObjectURL(url);
        }
      );
    };

    reader.readAsArrayBuffer(file);
  }, [animationClips.length]);

  // Export merged GLB
  const handleExport = useCallback(() => {
    if (!baseModel) {
      setStatus('Please load a base model first');
      return;
    }

    setIsExporting(true);
    setStatus('Exporting merged GLB...');

    const exporter = new GLTFExporter();

    // Clone the model
    const exportScene = baseModel.scene.clone(true);

    // Add all animation clips
    const allAnimations = [...baseModel.animations, ...animationClips.map(ac => ac.clip)];

    exporter.parse(
      exportScene,
      (result) => {
        // Create blob and download
        const blob = new Blob([result as ArrayBuffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `merged-animations-${Date.now()}.glb`;
        link.click();
        URL.revokeObjectURL(url);

        setStatus(`✅ Exported GLB with ${allAnimations.length} animations!`);
        setIsExporting(false);
      },
      (error) => {
        setStatus(`❌ Export error: ${error.message}`);
        setIsExporting(false);
      },
      {
        binary: true,
        animations: allAnimations,
      }
    );
  }, [baseModel, animationClips]);

  // Remove animation
  const removeAnimation = (index: number) => {
    setAnimationClips((prev) => prev.filter((_, i) => i !== index));
    setStatus('Animation removed');
  };

  // Clear all
  const clearAll = () => {
    setBaseModel(null);
    setAnimationClips([]);
    setCurrentPreview(0);
    setStatus('Cleared. Load a base model to start');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#1a1a2e', color: '#ecf0f1' }}>
      {/* Left Panel - Controls */}
      <div style={{ width: '400px', padding: '20px', borderRight: '1px solid #34495e', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px', color: '#3498db' }}>
          🎨 Animation Merger
        </h1>

        <p style={{ fontSize: '14px', color: '#95a5a6', marginBottom: '20px' }}>
          Combine multiple animation clips into a single GLB file. Just like the LinkedIn post!
        </p>

        {/* Base Model Upload */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>1. Load Base Model</h3>
          <input
            type="file"
            accept=".glb,.gltf"
            onChange={handleModelUpload}
            style={{
              width: '100%',
              padding: '10px',
              background: '#2c3e50',
              border: '1px solid #34495e',
              borderRadius: '4px',
              color: '#ecf0f1',
              cursor: 'pointer',
            }}
          />
          {baseModel && (
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#2ecc71' }}>
              ✓ Model loaded with {baseModel.animations.length} base animations
            </div>
          )}
        </div>

        {/* Animation Clips Upload */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>2. Add Animation Clips</h3>
          <input
            type="file"
            accept=".glb,.gltf,.fbx"
            onChange={handleAnimationUpload}
            disabled={!baseModel}
            style={{
              width: '100%',
              padding: '10px',
              background: baseModel ? '#2c3e50' : '#1a1a2e',
              border: '1px solid #34495e',
              borderRadius: '4px',
              color: baseModel ? '#ecf0f1' : '#7f8c8d',
              cursor: baseModel ? 'pointer' : 'not-allowed',
            }}
          />

          {/* Animation List */}
          <div style={{ marginTop: '15px' }}>
            {animationClips.map((clip, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  background: currentPreview === index ? '#3498db' : '#2c3e50',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                }}
                onClick={() => setCurrentPreview(index)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{clip.name}</div>
                  <div style={{ fontSize: '12px', color: '#95a5a6' }}>
                    Duration: {clip.clip.duration.toFixed(2)}s
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAnimation(index);
                  }}
                  style={{
                    padding: '5px 10px',
                    background: '#e74c3c',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Export Section */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>3. Export Merged GLB</h3>
          <button
            onClick={handleExport}
            disabled={!baseModel || isExporting}
            style={{
              width: '100%',
              padding: '15px',
              background: baseModel && !isExporting ? '#2ecc71' : '#7f8c8d',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: baseModel && !isExporting ? 'pointer' : 'not-allowed',
              marginBottom: '10px',
            }}
          >
            {isExporting ? 'Exporting...' : `Export GLB (${(baseModel?.animations.length || 0) + animationClips.length} animations)`}
          </button>

          <button
            onClick={clearAll}
            style={{
              width: '100%',
              padding: '10px',
              background: '#34495e',
              border: '1px solid #7f8c8d',
              borderRadius: '4px',
              color: '#ecf0f1',
              cursor: 'pointer',
            }}
          >
            Clear All
          </button>
        </div>

        {/* Status */}
        <div
          style={{
            padding: '15px',
            background: '#2c3e50',
            borderRadius: '4px',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        >
          <strong>Status:</strong> {status}
        </div>

        {/* Instructions */}
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#95a5a6', lineHeight: '1.6' }}>
          <h4 style={{ color: '#3498db', marginBottom: '8px' }}>How to use:</h4>
          <ol style={{ paddingLeft: '20px' }}>
            <li>Load a rigged character model (GLB format)</li>
            <li>Add animation clips one by one</li>
            <li>Click animations to preview them</li>
            <li>Export merged GLB with all animations</li>
          </ol>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div style={{ flex: 1, position: 'relative' }}>
        {baseModel ? (
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[0, 1.5, 4]} fov={50} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
            <Environment preset="studio" />
            <Grid args={[20, 20]} />
            <OrbitControls target={[0, 1, 0]} />

            <AnimatedModel
              model={baseModel}
              currentClip={animationClips[currentPreview]?.clip || baseModel.animations[0]}
            />
          </Canvas>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontSize: '24px',
              color: '#7f8c8d',
            }}
          >
            Load a model to see preview
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Animated model preview component
 */
function AnimatedModel({
  model,
  currentClip,
}: {
  model: LoadedModel;
  currentClip?: THREE.AnimationClip;
}) {
  const group = useRef<THREE.Group>(null);
  const mixer = useRef<THREE.AnimationMixer | null>(null);

  // Set up animation mixer
  React.useEffect(() => {
    if (!group.current) return;

    mixer.current = new THREE.AnimationMixer(group.current);

    return () => {
      mixer.current?.stopAllAction();
      mixer.current = null;
    };
  }, []);

  // Play current animation
  React.useEffect(() => {
    if (!mixer.current || !currentClip) return;

    mixer.current.stopAllAction();
    const action = mixer.current.clipAction(currentClip);
    action.reset().play();

    return () => {
      action.stop();
    };
  }, [currentClip]);

  // Update mixer
  useFrame((state, delta) => {
    mixer.current?.update(delta);
  });

  return (
    <group ref={group}>
      <primitive object={model.scene.clone(true)} scale={1} position={[0, 0, 0]} />
    </group>
  );
}

// Fix React import
import React from 'react';
