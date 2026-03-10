# CLAUDE.md — CareerSim Game

## Project Overview

CareerSim is a 3D career simulation game. Players navigate an open-world city, interact with NPCs, fight scam recruiters, complete quests, and make career decisions across 4 chapters.

## How to Run

```bash
npm run setup    # Install all dependencies (first time only)
npm run dev      # Start both client (port 3002) and server (port 3001)
```

Open http://localhost:3002 in browser.

## Architecture

### Two Servers
- **Client** (port 3002): Next.js 15 + React 19 frontend
- **Server** (port 3001): Fastify backend serving scenarios and game data

### Two 3D Engines
- **Babylon.js** — Career city open world (`client/src/components/babylon/`)
- **Three.js + React Three Fiber** — Onboarding scenes (`client/src/components/3d/`)

### State Management
- **Zustand** store at `client/src/store/gameStore.ts`
- Game phases: intro → tony_room → jobhunt → scenarios → end

## Key Files

| File | Purpose |
|------|---------|
| `client/src/app/page.tsx` | Main game page, routes between phases |
| `client/src/store/gameStore.ts` | Zustand game state |
| `client/src/components/babylon/JobHuntWorld.tsx` | Career city (main 3D world) |
| `client/src/components/babylon/OpenWorldBuilder.ts` | City terrain, buildings, roads, lighting |
| `client/src/components/babylon/PlayerController.ts` | WASD movement + camera |
| `client/src/components/babylon/NPCSystem.ts` | NPC patrol and interaction |
| `client/src/components/babylon/EnemySystem.ts` | Scam recruiter enemies |
| `client/src/components/babylon/CharacterBuilder.ts` | Procedural character creation |
| `client/src/components/babylon/AssetLoader.ts` | GLB model loading + caching |
| `client/src/components/babylon/BabylonCanvas.tsx` | Babylon.js engine wrapper |
| `client/src/components/babylon/TonyRoom.tsx` | Onboarding room with Tony |
| `server/src/index.ts` | Fastify server entry |
| `server/src/data/` | Scenario JSON files |

## 3D Assets

All in `client/public/models/`:
- `city/` — Kenney City Kit GLB buildings (use shared `Textures/colormap.png`)
- `furniture/` — Kenney Furniture Kit GLB models
- `characters/` — Animated GLB characters (Soldier, Xbot, Michelle, RobotExpressive, etc.)
- `nature/` — Trees, plants, nature props

**Important:** City GLB models reference `Textures/colormap.png` — do NOT delete this file.

## Coding Rules

- TypeScript strict mode
- Use `async/await`, never `.then()`
- Client components use `"use client"` directive
- Babylon.js components are loaded with `dynamic(() => import(...), { ssr: false })`
- Console warnings from Babylon.js are suppressed in `BabylonCanvas.tsx` — this is intentional
- The client uses Next.js API rewrites to proxy `/api/*` to the Fastify server at localhost:3001

## Commands

```bash
npm run setup        # Install all deps (root + client + server)
npm run dev          # Start both servers
npm run dev:client   # Client only (port 3002)
npm run dev:server   # Server only (port 3001)
npm run build        # Production build
```

## Do NOT

- Do NOT delete `client/public/models/city/Textures/colormap.png`
- Do NOT remove Babylon.js console suppression in BabylonCanvas.tsx
- Do NOT use port 3000 for the client (reserved for other apps, use 3002)
- Do NOT import Babylon.js components without `{ ssr: false }` — they need browser APIs
