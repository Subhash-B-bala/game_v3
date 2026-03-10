# CareerSim - 3D Career Simulation Game

A 3D career simulation game where you navigate the corporate world, make tough career choices, and build your professional legacy.

Built with Next.js, Babylon.js, Three.js, and Fastify.

---

## Quick Start (3 steps)

### Prerequisites

- **Node.js v18+** — [Download here](https://nodejs.org/)
- **Git** — [Download here](https://git-scm.com/)

### 1. Clone & enter the project

```bash
git clone https://github.com/Subhash-B-bala/game_v3.git
cd game_v3
```

### 2. Install all dependencies

```bash
npm run setup
```

This installs dependencies for root, client, and server — all in one command.

### 3. Start the game

```bash
npm run dev
```

This starts both the **backend** (port 3001) and **frontend** (port 3002) simultaneously.

### 4. Play

Open your browser and go to:

```
http://localhost:3002
```

That's it — you're in the game!

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
├── client/          → Next.js 15 frontend (React 19, Babylon.js, Three.js, Tailwind CSS)
├── server/          → Fastify backend API (scenarios, game data)
├── shared/          → Shared TypeScript types
└── package.json     → Root scripts (setup + dev)
```

---

## Tech Stack

- **Frontend:** Next.js 15, React 19, Babylon.js, Three.js, React Three Fiber, Tailwind CSS, Zustand
- **Backend:** Fastify, TypeScript
- **3D Engine:** Babylon.js (career city), Three.js + React Three Fiber (onboarding)
- **Physics:** Rapier
- **State:** Zustand

---

## Game Flow

1. **Intro** — Career Simulator splash screen
2. **Tony's Room** — Meet your mentor Tony Sharma, answer onboarding questions
3. **Career City** — Open-world 3D city with NPCs, enemies, quests, and career challenges
4. **Scenarios** — Make career decisions that shape your professional journey

---

## Troubleshooting

**Port already in use?**
Kill the process on that port or change the client port:
```bash
cd client && npm run dev -- -p 3005
```

**3D scene not loading?**
- Make sure both servers are running (`npm run dev` from root)
- Hard refresh with `Ctrl + Shift + R`
- Check browser console (F12) for any errors

**"Module not found" errors?**
Run `npm run setup` again to reinstall all dependencies.

**Blank screen on first load?**
The 3D assets take a few seconds to load on first visit. Wait for the loading to complete.
