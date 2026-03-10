# CareerSim - 3D Career Simulation Game

A 3D career simulation game where you navigate the corporate world, make tough career choices, and build your professional legacy.

Built with Next.js, Babylon.js, Three.js, and Fastify.

---

## Prerequisites

Before you start, make sure you have these installed:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18 or higher | [nodejs.org](https://nodejs.org/) |
| **npm** | Comes with Node.js | Included with Node.js |
| **Git** | Any recent version | [git-scm.com](https://git-scm.com/) |

To verify, run these in your terminal:
```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
git --version     # Should show any version
```

---

## Quick Start (3 commands)

### 1. Clone the repo

```bash
git clone https://github.com/Subhash-B-bala/game_v3.git
cd game_v3
```

### 2. Install all dependencies

```bash
npm run setup
```

This installs dependencies for root, client, and server — all in one command. Takes 1-2 minutes on first run.

### 3. Start the game

```bash
npm run dev
```

This starts both:
- **Backend API** on http://localhost:3001
- **Frontend game** on http://localhost:3002

### 4. Play

Open your browser and go to:

```
http://localhost:3002
```

That's it — you're in the game!

---

## Using with Claude Code

If you're using [Claude Code](https://claude.ai/claude-code) to work on this project:

1. **Install the Claude GitHub App** when prompted — click "Install app" and authorize for `Subhash-B-bala/game_v3`
2. Open the project in Claude Code
3. Tell Claude: `npm run setup` to install dependencies
4. Tell Claude: `npm run dev` to start the game
5. Open http://localhost:3002 in your browser

### Key things Claude should know

- The project has **two servers** — client (Next.js) and server (Fastify). Always start both with `npm run dev` from root.
- The **3D career city** uses Babylon.js (`client/src/components/babylon/`).
- The **onboarding scenes** use Three.js + React Three Fiber (`client/src/components/3d/`).
- Game state is managed with Zustand (`client/src/store/gameStore.ts`).
- Scenarios and game data come from the Fastify backend (`server/src/`).
- 3D model assets are in `client/public/models/` (city, furniture, characters, nature).
- The main game page is `client/src/app/page.tsx` — it routes between game phases.

---

## Commands Reference

| Command | What it does |
|---------|-------------|
| `npm run setup` | Install all dependencies (run once after cloning) |
| `npm run dev` | Start both servers (client + backend) |
| `npm run dev:client` | Start only the frontend (port 3002) |
| `npm run dev:server` | Start only the backend (port 3001) |
| `npm run build` | Production build |

---

## Project Structure

```
game_v3/
├── client/                → Next.js 15 frontend
│   ├── src/
│   │   ├── app/           → Pages and routing
│   │   ├── components/
│   │   │   ├── babylon/   → Babylon.js 3D city (career world)
│   │   │   ├── 3d/        → Three.js scenes (onboarding)
│   │   │   └── ...        → UI components
│   │   ├── store/         → Zustand state management
│   │   ├── hooks/         → Custom React hooks
│   │   ├── lib/           → API client, utilities
│   │   └── engine/        → Game engine (chapters, scenarios)
│   └── public/
│       └── models/        → 3D assets (GLB files)
│           ├── city/      → Kenney City Kit buildings
│           ├── furniture/ → Interior furniture models
│           ├── characters/→ Animated character models
│           └── nature/    → Trees, plants, nature props
├── server/                → Fastify backend API
│   └── src/
│       ├── index.ts       → Server entry point
│       ├── routes/        → API routes
│       └── data/          → Scenarios and game data (JSON)
├── shared/                → Shared TypeScript types
├── package.json           → Root scripts (setup + dev)
└── README.md              → You are here
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15, React 19 |
| **3D (City)** | Babylon.js |
| **3D (Onboarding)** | Three.js, React Three Fiber, React Three Drei |
| **Physics** | Rapier |
| **Styling** | Tailwind CSS |
| **State** | Zustand |
| **Backend** | Fastify, TypeScript |
| **3D Assets** | Kenney City Kit, Kenney Furniture Kit, GLB character models |

---

## Game Flow

1. **Intro** — Career Simulator splash screen
2. **Tony's Room** — Meet your mentor Tony Sharma, answer onboarding questions
3. **Career City** — Open-world 3D city with NPCs, enemies (scam recruiters), quests, and career challenges
4. **Scenarios** — Make career decisions across 4 chapters that shape your professional journey
5. **Mirror** — See the reflection of every choice you made

---

## Troubleshooting

**Port already in use?**
Kill the process or use a different port:
```bash
# Use port 3005 instead
cd client && npm run dev -- -p 3005
```

**3D scene not loading?**
- Make sure both servers are running (`npm run dev` from the root folder)
- Hard refresh: `Ctrl + Shift + R`
- Check browser console (F12) for errors

**"Module not found" errors?**
```bash
npm run setup
```

**Blank screen on first load?**
The 3D assets (500+ models) take a few seconds to load on first visit. Wait for loading to complete.

**Server crashes on restart?**
If port 3001 or 3002 is stuck, kill the old process:
```bash
# On Windows
taskkill /F /PID $(netstat -ano | grep :3001 | head -1 | awk '{print $5}')

# On Mac/Linux
kill $(lsof -ti:3001)
```
