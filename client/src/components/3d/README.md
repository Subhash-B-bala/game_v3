# 3D System - Game V3

## Overview

This directory contains the 3D infrastructure for transforming the game into a professional 3D animated experience.

## Current Status

✅ **Completed**:
- Three.js + React Three Fiber dependencies installed
- Folder structure created
- Base components implemented:
  - `Scene3DContainer.tsx` - Main 3D canvas wrapper
  - `PlayerCharacter.tsx` - Player 3D model loader
  - `NPCCharacter.tsx` - NPC 3D model loader with interactions
  - `Test3DScene.tsx` - Test scene for verification
- Animation hook (`use3DAnimations.ts`) created

🔄 **In Progress**:
- Asset acquisition (models and animations)
- Integration with existing game phases

## Testing the 3D System

To test the 3D infrastructure, add the test scene to your app:

```tsx
// In client/src/app/page.tsx or create a test route

import Test3DScene from '@/components/3d/Test3DScene';

export default function TestPage() {
  return <Test3DScene />;
}
```

You should see:
- Blue player character (capsule shape)
- Red NPC character (capsule shape) with name tag
- Clickable NPC with interaction
- Orbit controls (drag to rotate, scroll to zoom)
- Grid floor

## Next Steps

### 1. Acquire 3D Assets

**Characters (Ready Player Me)**:
1. Go to https://readyplayer.me/
2. Create a developer account
3. Generate custom avatars
4. Export as GLB with rig
5. Save to `client/src/assets/models/characters/`

**Animations (Mixamo)**:
1. Go to https://www.mixamo.com/
2. Sign in with Adobe ID (free)
3. Download these animations for your character:
   - Idle (Standing)
   - Walking
   - Sitting
   - Typing
   - Thinking
   - Stressed/Worried
   - Celebrating/Victory
   - Disappointed/Sad
   - Talking
   - Wave
   - Handshake
4. Export as FBX for Unity (works with Three.js)
5. Save to `client/src/assets/animations/clips/`

**Environments (Sketchfab)**:
1. Go to https://sketchfab.com/
2. Search for:
   - "office interior" (filter: downloadable, rigged: no)
   - "coffee shop interior"
   - "conference room"
   - "co-working space"
3. Download CC-licensed models
4. Save to `client/src/assets/models/environments/`

### 2. Model Optimization

After downloading models, optimize them:

```bash
# Install gltf-transform CLI
npm install -g @gltf-transform/cli

# Optimize a model
gltf-transform optimize input.glb output.glb --compress

# Compress textures
gltf-transform resize input.glb output.glb --width 1024 --height 1024
```

### 3. Animation Merging

Use the Animation Merger tool (to be built) to combine multiple animation clips into a single GLB file:

```tsx
import AnimationMerger from '@/tools/AnimationMerger';

// Tool will allow you to:
// 1. Load base character model
// 2. Import multiple animation clips
// 3. Preview each animation
// 4. Export merged GLB with all animations
```

### 4. Update Models in Components

Once you have real models, update the paths:

```tsx
// PlayerCharacter usage
<PlayerCharacter
  modelPath="/models/characters/player_main.glb"
  position={[0, 0, 0]}
  currentAnimation="idle"
/>

// NPCCharacter usage
<NPCCharacter
  npcId="recruiter_sarah"
  modelPath="/models/characters/npc_recruiter_female.glb"
  position={[3, 0, 0]}
  animation="idle"
  name="Sarah"
  onClick={handleInteraction}
/>
```

## Component Documentation

### Scene3DContainer

Main wrapper for all 3D scenes.

**Props**:
- `children`: React nodes to render in 3D space
- `enableControls`: Enable orbit controls (default: true)
- `cameraPosition`: Camera position [x, y, z] (default: [0, 5, 10])
- `showGrid`: Show grid helper (default: false)
- `backgroundColor`: Scene background color (default: '#1a1a2e')

### PlayerCharacter

Player character model loader with animation support.

**Props**:
- `modelPath`: Path to GLB model file
- `position`: Position [x, y, z] (default: [0, 0, 0])
- `scale`: Model scale (default: 1)
- `currentAnimation`: Animation clip name to play
- `onModelLoaded`: Callback when model loads

### NPCCharacter

NPC character with interactions and name tags.

**Props**:
- `npcId`: Unique NPC identifier
- `modelPath`: Path to GLB model file
- `position`: Position [x, y, z]
- `rotation`: Rotation [x, y, z] (default: [0, 0, 0])
- `scale`: Model scale (default: 1)
- `animation`: Animation clip name (default: 'idle')
- `name`: NPC name for display
- `showNameTag`: Show floating name tag (default: true)
- `onClick`: Callback when NPC is clicked

## Animation System

### use3DAnimations Hook

Maps game state to appropriate animations automatically.

```tsx
import { use3DAnimations } from '@/hooks/use3DAnimations';

const gameState = useGameStore(state => state);
const animationState = use3DAnimations(gameState, 'working');

// Returns: { primary: 'typing' }
```

**Animation Mapping**:
- High stress (>0.7) → 'stressed'
- Low energy (<0.3) → 'tired'
- Working → 'typing'
- Interview + high confidence → 'confident_talk'
- Interview + low confidence → 'nervous_talk'
- Success → 'celebrate'
- Failure → 'disappointed'
- Default → 'idle'

## Performance Tips

1. **Model Optimization**:
   - Keep models under 5MB each
   - Use Draco compression
   - Reduce texture sizes (max 2K)

2. **Loading Strategy**:
   - Preload common models
   - Lazy load environment-specific models
   - Use React Suspense for loading states

3. **Animation**:
   - Limit active animations to visible characters
   - Use animation blending (fadeIn/fadeOut)
   - Dispose unused animation mixers

4. **Rendering**:
   - Enable frustum culling
   - Use instanced meshes for repeated objects
   - Bake lighting where possible

## File Structure

```
client/src/
├── components/3d/
│   ├── Scene3DContainer.tsx       # Main 3D canvas
│   ├── PlayerCharacter.tsx        # Player model
│   ├── NPCCharacter.tsx           # NPC model
│   ├── AnimationController.tsx    # Animation state machine (todo)
│   ├── WorldHub.tsx               # World navigation (todo)
│   ├── OnboardingWorld.tsx        # 3D onboarding (todo)
│   ├── Scenario3DRenderer.tsx     # 3D scenario display (todo)
│   ├── Test3DScene.tsx            # Test scene
│   └── environments/              # Environment components
│       ├── HomeOffice.tsx         # (todo)
│       ├── CoffeeShop.tsx         # (todo)
│       └── ...
├── hooks/
│   └── use3DAnimations.ts         # Animation mapping hook
├── utils/
│   └── modelCache.ts              # Model caching (todo)
└── assets/
    ├── models/
    │   ├── characters/            # Character GLB files
    │   ├── environments/          # Environment GLB files
    │   └── props/                 # Prop GLB files
    └── animations/
        └── clips/                 # Individual animation files
```

## Troubleshooting

### Models Not Loading

1. Check browser console for errors
2. Verify model path is correct
3. Ensure model is in GLB format
4. Check model file size (<5MB recommended)
5. Try model in online GLB viewer first

### Animations Not Playing

1. Check animation names in GLB file
2. Verify animation mapping in `use3DAnimations.ts`
3. Check console for animation mixer errors
4. Ensure model has proper rigging

### Performance Issues

1. Reduce model polygon count
2. Compress textures
3. Limit number of active animations
4. Use simpler geometry for distant objects
5. Enable production build optimization

## Resources

- **Three.js Docs**: https://threejs.org/docs/
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber
- **R3F Drei (Helpers)**: https://github.com/pmndrs/drei
- **Ready Player Me**: https://readyplayer.me/
- **Mixamo Animations**: https://www.mixamo.com/
- **Sketchfab Models**: https://sketchfab.com/
- **glTF-Transform**: https://gltf-transform.dev/
