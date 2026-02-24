# Open World Career City - Implementation Plan

## Vision
Transform the current room-based 3D game into an **open 3D world** inspired by Tiger Abrodi's Spawn game. Instead of separate enclosed rooms per floor, create a single continuous **Career City** with zones the player walks between.

## Current Architecture (What We Have)
- 5 separate enclosed rooms (15x10 to 30x20) built per floor
- On floor transition: dispose ALL meshes, rebuild entire room
- Player confined to room bounds with WASD + ArcRotateCamera
- Furniture loaded from 140 Kenney GLB models
- 30 scenarios with teaching lessons, choices, stats
- Tony NPC + interactable objects + GameBridge (E key)

## Target Architecture (What We're Building)
- **One persistent 200x200 open world** with grass terrain, trees, paths, buildings
- **5 zones** representing career stages (unlocked progressively)
- Player walks freely between zones on outdoor terrain
- Buildings/structures mark each zone (no going inside - interact at the door)
- Same scenario engine, same dialogue system, same HUD
- Skybox, fog, directional sunlight for outdoor atmosphere

---

## Phase 1: Asset Download & Setup

### 1.1 Download Kenney Asset Packs
Download and extract to `client/public/models/`:
- **Nature Kit** (~330 models) → `/models/nature/` — trees, rocks, bushes, flowers
- **City Kit Commercial** (~50 models) → `/models/city/` — office buildings, shops
- **Building Kit** (~80 models) → `/models/buildings/` — modular houses, structures

### 1.2 Create Texture Assets
Create `client/public/textures/`:
- `grass_diffuse.jpg` — tileable grass texture (can generate procedurally or download CC0)
- `dirt_path.jpg` — dirt/path texture for walkways
- `heightmap.png` — 512x512 grayscale heightmap for gentle terrain

---

## Phase 2: Core Open World System

### 2.1 New File: `OpenWorldBuilder.ts`
**Replaces:** `JobHuntRoomBuilder.ts` for the open world approach
**Returns:** Same `RoomLayout` interface (extended) for compatibility

Key components:
1. **Ground Terrain** — `CreateGroundFromHeightMap` or flat `CreateGround` (200x200 units)
   - Grass PBR material with tiling texture
   - Gentle hills around edges (optional heightmap)
   - Flat center area for player spawn

2. **Skybox** — Gradient shader sphere (no image files needed)
   - Blue sky gradient: dark blue top → light blue horizon
   - `infiniteDistance = true`

3. **Atmosphere** — Fog + Lighting
   - `FOGMODE_LINEAR`: start=150, end=400
   - DirectionalLight "sun" for shadows
   - HemisphericLight for ambient fill
   - Fog color matches clear color (seamless blend)

4. **Environment Objects** — Trees, rocks, bushes using thin instances
   - ~200 trees (merged cylinder+sphere, thin instances = 1 draw call)
   - ~100 rocks (deformed icospheres, thin instances)
   - ~150 bushes (small spheres, thin instances)
   - Avoid placing in zone centers (leave space for buildings)

5. **Zone Buildings** — One structure per zone
   - Zone 0: Small apartment building (starter area, center of world)
   - Zone 1: Office building with desk visible through windows
   - Zone 2: Modern coworking hub (glass building)
   - Zone 3: Corporate tower (taller, imposing)
   - Zone 4: Executive summit building (at the top of a small hill)
   - Each building: simple box/cylinder geometry with materials (no GLB needed initially)
   - Later: swap in Kenney City Kit GLB models

6. **Paths** — Visual dirt paths connecting zones
   - Decal or ground plane strips with path texture
   - Guide the player between zones

7. **Zone Signs** — Floating text billboards at zone entrances
   - "THE GRIND - Floor 0", "THE WORKBENCH - Floor 1", etc.

### 2.2 Zone Layout (200x200 world)

```
              N (+Z)
              |
    Zone 2    |    Zone 4
   COWORK     |    SUMMIT
  (-50,0,60)  |   (60,0,70) ← on a hill
              |
W ────────── CENTER ────────── E (+X)
              |
    Zone 1    |    Zone 3
   WORKBENCH  |    NEGOTIATION
  (-60,0,-50) |   (50,0,-60)
              |
              S (-Z)

Zone 0: THE GRIND — Center (0, 0, 0) — Always accessible
```

- **World bounds:** -95 to +95 on both X and Z
- **Zone radius:** ~30 units each (enough for building + interactables)
- **Paths:** Dirt strips connecting center to each zone

### 2.3 Zone Unlocking
- **Stage 0:** Only Zone 0 (center) is accessible. Other zones have fog/barrier
- **Stage 1:** Zone 1 unlocks (path lights up, barrier removed)
- **Stage 2:** Zone 2 unlocks
- **Stage 3:** Zone 3 unlocks
- **Stage 4:** Zone 4 unlocks (summit on hill)

Implementation: Invisible collision walls at zone entrances, removed when stage unlocks.

---

## Phase 3: System Modifications

### 3.1 Modify `PlayerController.ts`
- **World bounds:** Expand to -95..+95 (instead of room-size bounds)
- **Camera:** Wider radius (15-20), slightly lower beta for outdoor feel
- **Ground tracking:** Each frame, set player Y to terrain height + offset
- **Sprint speed:** Increase slightly for larger world (moveSpeed=10, sprint=18)

### 3.2 Modify `JobHuntWorld.tsx`
**Key change:** Don't rebuild world on stage transition!

Current flow:
```
stage_transition → disposeCurrentWorld() → buildFloorRoom(newStage) → setupRoom()
```

New flow:
```
stage_transition → unlockNextZone() → movePlayerToZone() → loadNextScenario()
```

Changes:
- `handleSceneReady` → call `buildOpenWorld()` instead of `buildFloorRoom()`
- `closeStageTransition` → DON'T dispose world. Instead:
  - Remove barrier for next zone
  - Optionally teleport player to new zone spawn
  - Add new interactable objects for new zone
- `setupRoom` becomes `setupOpenWorld` (called ONCE)
- Zone-specific interactable objects placed per zone
- Tony NPC can be in center zone always, or teleport to current zone

### 3.3 Modify `InteractableObjectSystem.ts`
- Objects spread across zones (not inside a room)
- Each object tagged with zone ID + scenario tag
- Only objects in current/unlocked zones are active

### 3.4 Modify `NPCSystem.ts`
- Tony walks in the open world (idle near player's current zone)
- Other NPCs can be added per zone later

### 3.5 Modify `GameBridge.ts`
- Zone detection: Check which zone player is in
- Show zone name on HUD when entering a new zone
- Interaction prompts work the same (E key proximity)

---

## Phase 4: Visual Polish

### 4.1 Zone Visual Identity
Each zone gets a subtle color/mood:
- Zone 0: Warm, homey (warm ambient light, warmer fog)
- Zone 1: Cool, focused (blue tint, clean lighting)
- Zone 2: Bright, collaborative (brighter ambient)
- Zone 3: Dark, intense (slightly darker, golden accents)
- Zone 4: Grand, triumphant (brightest, sun beams)

### 4.2 Progressive Environment
As player advances stages:
- More trees/bushes appear (world feels more alive)
- Paths become clearer/wider
- Buildings get subtle improvements (lights in windows, etc.)

### 4.3 Minimap (Later)
- Small circular minimap in corner
- Shows zone positions and player dot
- Highlights current objective zone

---

## Implementation Order

1. **Download assets** (Nature Kit + textures)
2. **Create `OpenWorldBuilder.ts`** with:
   - Ground plane (200x200, grass material)
   - Gradient skybox
   - Fog + sun + ambient lights
   - 5 zone buildings (simple boxes first)
   - Trees/rocks via thin instances
   - Zone signs
   - Paths
3. **Update `PlayerController.ts`** (wider bounds, outdoor camera, terrain following)
4. **Update `JobHuntWorld.tsx`** (use OpenWorldBuilder, change transition logic)
5. **Place interactable objects** in open world zones
6. **Test full game flow** (splash → onboarding → open world → scenarios → transitions)
7. **Polish** (swap in GLB buildings, add more environment detail)

---

## Performance Targets
- Thin instances for all repeated objects (trees, rocks, bushes) = single draw call each
- Fog hides distant objects (no need for LOD initially)
- Total draw calls target: < 50
- Ground: single mesh with tiled texture
- Freeze static meshes (`freezeWorldMatrix()`)
- Scene optimizer enabled

## Files Changed
- **NEW:** `OpenWorldBuilder.ts` (~500 lines)
- **MODIFIED:** `JobHuntWorld.tsx` (~100 lines changed)
- **MODIFIED:** `PlayerController.ts` (~30 lines changed)
- **MODIFIED:** `InteractableObjectSystem.ts` (~20 lines changed)
- **MODIFIED:** `GameBridge.ts` (~20 lines changed)
- **KEPT AS-IS:** `AssetLoader.ts`, `NPCSystem.ts`, `BabylonCanvas.tsx`, all engine files
- **KEPT AS-IS:** All 30 scenarios, lessons, stage content, game store
