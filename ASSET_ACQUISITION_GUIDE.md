# 3D Asset Acquisition Guide

This guide will walk you through downloading and organizing 3D assets for your game.

## Quick Start Checklist

- [ ] Sign up for Mixamo account
- [ ] Sign up for Ready Player Me account
- [ ] Download 1 test character
- [ ] Download 10 essential animations
- [ ] Download 1 test environment
- [ ] Optimize assets
- [ ] Test in game

---

## Part 1: Get Your First Character (Mixamo)

### Step 1: Sign Up
1. Go to https://www.mixamo.com/
2. Click "Sign In" → Create Adobe ID (free)
3. Complete registration

### Step 2: Download Base Character
1. Click "Characters" tab
2. Search for: "**Y Bot**" (simple, professional humanoid)
   - Alternative: "X Bot" or "Aj"
3. Click the character
4. Download Settings:
   - Format: **FBX for Unity (.fbx)**
   - Pose: **T-Pose**
   - Click **DOWNLOAD**
5. Save to: `Downloads/game_assets/characters/ybot_base.fbx`

### Step 3: Convert FBX to GLB

You'll need to convert the FBX file to GLB format. Two options:

**Option A: Use Online Converter (Easiest)**
1. Go to https://products.aspose.app/3d/conversion/fbx-to-glb
2. Upload your `ybot_base.fbx`
3. Click "Convert"
4. Download the GLB file
5. Save to: `client/src/assets/models/characters/player_default.glb`

**Option B: Use Blender (More Control)**
1. Download Blender (free): https://www.blender.org/download/
2. Open Blender
3. File → Import → FBX → Select your `ybot_base.fbx`
4. File → Export → glTF 2.0 (.glb)
   - Format: **glTF Binary (.glb)**
   - Check "Apply Modifiers"
   - Check "Compression" → **Draco**
5. Export to: `client/src/assets/models/characters/player_default.glb`

---

## Part 2: Download Essential Animations

Back on Mixamo with Y Bot character selected:

### Step 1: Select Character
1. Make sure Y Bot is selected (shows in preview)
2. Click "Animations" tab

### Step 2: Download Each Animation

**For each animation below**:
1. Search for the animation name
2. Click the animation (it will play in preview)
3. Click **DOWNLOAD**
4. Settings:
   - Format: **FBX for Unity**
   - Skin: **Without Skin** (important!)
   - FPS: **30**
   - Keyframe Reduction: **none**
5. Save to: `Downloads/game_assets/animations/[animation_name].fbx`

**Essential Animations to Download** (in order of priority):

### Core Animations (Must Have)
1. **Idle** - Search: "Idle"
   - Use: Default standing animation
   - File: `idle.fbx`

2. **Walking** - Search: "Walking"
   - Use: Character movement
   - File: `walking.fbx`

3. **Sitting** - Search: "Sitting"
   - Use: At desk, in meetings
   - File: `sitting.fbx`

4. **Typing** - Search: "Typing"
   - Use: Working at computer
   - File: `typing.fbx`

### Emotional Animations (High Priority)
5. **Thinking** - Search: "Thinking"
   - Use: Decision making, problem solving
   - File: `thinking.fbx`

6. **Excited** or **Victory** - Search: "Victory" or "Excited"
   - Use: Celebration, success
   - File: `celebrate.fbx`

7. **Defeated** or **Sad** - Search: "Defeated" or "Sad Idle"
   - Use: Rejection, disappointment
   - File: `disappointed.fbx`

8. **Stressed** - Search: "Worried" or "Anxious"
   - Use: High stress situations
   - File: `stressed.fbx`

### Professional Animations (Nice to Have)
9. **Talking** - Search: "Talking"
   - Use: Conversations, interviews
   - File: `talking.fbx`

10. **Waving** - Search: "Waving"
    - Use: Greetings
    - File: `waving.fbx`

11. **Handshake** - Search: "Handshake" or "Agree"
    - Use: Meeting NPCs, accepting offers
    - File: `handshake.fbx`

12. **Presenting** - Search: "Presenting" or "Explaining"
    - Use: Presentations, demos
    - File: `presenting.fbx`

---

## Part 3: Merge Animations into Character

### Option A: Use Animation Merger Tool (Built!)

1. Start your dev server:
   ```bash
   cd client
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/tools/animation-merger`

3. **Load Base Model**:
   - Click "Load Base Model"
   - Select your converted `player_default.glb`

4. **Add Animations** (one by one):
   - Convert each FBX animation to GLB first (same process as character)
   - Click "Add Animation Clips"
   - Select converted GLB animation file
   - Repeat for all animations

5. **Export Merged GLB**:
   - Click "Export GLB"
   - Save as: `client/src/assets/models/characters/player_complete.glb`

### Option B: Batch Convert in Blender

1. Open Blender
2. Import base character (Y Bot)
3. For each animation FBX:
   - Import as separate action
   - Rename action to match animation name
4. Export all as single GLB with all animations

---

## Part 4: Get Environment Models

### Sketchfab (Free Models)

1. Go to https://sketchfab.com/
2. Sign up for free account
3. Search with these filters:
   - **Downloadable**: Check "Downloadable" filter
   - **Animated**: No
   - **License**: Creative Commons

### Recommended Searches:

**Office Environment**:
- Search: "office interior" or "modern office"
- Look for: Low-poly, clean, professional
- Download: GLB format (preferred) or GLTF
- Save to: `client/src/assets/models/environments/office.glb`

**Coffee Shop**:
- Search: "coffee shop interior" or "cafe"
- Download: GLB format
- Save to: `client/src/assets/models/environments/coffee_shop.glb`

**Conference Room**:
- Search: "conference room" or "meeting room"
- Download: GLB format
- Save to: `client/src/assets/models/environments/conference_room.glb`

**Home Office**:
- Search: "home office" or "desk setup"
- Download: GLB format
- Save to: `client/src/assets/models/environments/home_office.glb`

### Alternative: Use Simple Procedural Environments

If you can't find good models, you can start with simple Three.js-generated environments:
- Basic room with walls and floor
- Add simple furniture (cubes, planes)
- Focus on lighting and colors
- Upgrade to detailed models later

---

## Part 5: Optimize Assets

After downloading all assets, optimize them for web:

### Install glTF-Transform CLI

```bash
npm install -g @gltf-transform/cli
```

### Optimize Each Model

```bash
# Character models
gltf-transform optimize client/src/assets/models/characters/player_complete.glb client/src/assets/models/characters/player_complete_optimized.glb --compress

# Environment models
gltf-transform optimize client/src/assets/models/environments/office.glb client/src/assets/models/environments/office_optimized.glb --compress
```

### Target File Sizes

- Character with animations: **< 5MB**
- Environment: **< 3MB**
- Props: **< 500KB**

### If Files Are Still Too Large

```bash
# Reduce texture size
gltf-transform resize input.glb output.glb --width 1024 --height 1024

# More aggressive compression
gltf-transform draco input.glb output.glb
```

---

## Part 6: Organize Assets

Your final folder structure should look like:

```
client/src/assets/
├── models/
│   ├── characters/
│   │   ├── player_default.glb          (5MB - test character)
│   │   ├── player_complete.glb         (optimized with animations)
│   │   ├── npc_recruiter.glb          (future)
│   │   └── npc_mentor.glb             (future)
│   ├── environments/
│   │   ├── office.glb                 (3MB)
│   │   ├── coffee_shop.glb            (3MB)
│   │   ├── conference_room.glb        (3MB)
│   │   └── home_office.glb            (3MB)
│   └── props/
│       ├── laptop.glb
│       ├── desk.glb
│       └── chair.glb
└── manifests/
    ├── character_manifest.json
    └── environment_manifest.json
```

---

## Part 7: Test Assets in Game

### Test the Animation Merger Tool

1. Start dev server: `npm run dev`
2. Go to: `http://localhost:3000/tools/animation-merger`
3. Load your character
4. Add animations
5. Preview each animation
6. Export merged GLB

### Test the 3D Scene

1. Create a test page or route
2. Import `Test3DScene` component
3. Update model paths in `PlayerCharacter` component
4. Check browser console for loading errors
5. Verify animations play correctly

---

## Part 8: Create Asset Manifest

Create a manifest file to track your assets:

**File**: `client/src/assets/manifests/character_manifest.json`

```json
{
  "characters": {
    "player_default": {
      "path": "/models/characters/player_complete.glb",
      "animations": [
        "idle",
        "walking",
        "sitting",
        "typing",
        "thinking",
        "celebrate",
        "disappointed",
        "stressed",
        "talking",
        "waving",
        "handshake",
        "presenting"
      ],
      "fileSize": "4.8MB",
      "polyCount": 12500
    }
  }
}
```

---

## Troubleshooting

### "Model not loading in browser"

1. Check file path is correct (use `/models/...` not `client/src/assets/models/...`)
2. Check file size (must be < 10MB)
3. Check browser console for errors
4. Try model in online GLB viewer: https://gltf-viewer.donmccurdy.com/

### "Animations not playing"

1. Verify animations are included in GLB file
2. Check animation names match your code
3. Ensure animations were exported "Without Skin"
4. Check browser console for mixer errors

### "Files too large"

1. Use more aggressive compression
2. Reduce texture sizes
3. Simplify geometry (use lower poly models)
4. Consider using texture atlases

### "FBX to GLB conversion failed"

1. Try different online converter
2. Use Blender (more reliable)
3. Check FBX file isn't corrupted
4. Download animation again from Mixamo

---

## Quick Reference: Commands

```bash
# Start dev server
cd client && npm run dev

# Optimize GLB
gltf-transform optimize input.glb output.glb --compress

# Resize textures
gltf-transform resize input.glb output.glb --width 1024

# View model info
gltf-transform inspect model.glb

# Validate model
gltf-transform validate model.glb
```

---

## Next Steps After Asset Acquisition

1. ✅ Test assets load in browser
2. ✅ Update component paths to use real models
3. ✅ Verify animations play correctly
4. ✅ Test performance (should maintain 60fps)
5. ✅ Create NPC characters (repeat process)
6. ✅ Add more environment variations
7. ✅ Integrate with onboarding flow

---

## Useful Resources

- **Mixamo**: https://www.mixamo.com/
- **Ready Player Me**: https://readyplayer.me/
- **Sketchfab**: https://sketchfab.com/
- **Online GLB Viewer**: https://gltf-viewer.donmccurdy.com/
- **FBX to GLB Converter**: https://products.aspose.app/3d/conversion/fbx-to-glb
- **Blender**: https://www.blender.org/
- **glTF-Transform Docs**: https://gltf-transform.dev/

---

## Estimated Time

- Setting up accounts: **10 minutes**
- Downloading character + 12 animations: **30 minutes**
- Converting FBX to GLB: **20 minutes**
- Merging animations: **15 minutes**
- Downloading environments: **20 minutes**
- Optimizing assets: **10 minutes**
- Testing: **15 minutes**

**Total: ~2 hours** for complete asset acquisition

---

**Need Help?** Check the troubleshooting section or refer to the main 3D README at `client/src/components/3d/README.md`
