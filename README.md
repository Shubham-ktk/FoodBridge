# Treasure Learn (Prototype)

A lightweight 3D adventure learning game for kids (ages 8–14). Explore a jungle, find treasure chests, and answer questions to unlock new areas.

## Features
- Jungle scene with trees, fog, lighting
- Third-person player controller (WASD + mouse look via pointer lock)
- Treasure chests that open when you answer questions
- Score tracking and level gate that unlocks after 3 correct answers

## Run Locally
This is a static web project. Serve it with any simple HTTP server.

### Option 1: Python
```bash
cd /workspace
python3 -m http.server 5173
```
Open `http://localhost:5173` in your browser and navigate to `index.html` if needed.

### Option 2: Node (serve)
```bash
cd /workspace
npx --yes serve -l 5173
```
Open `http://localhost:5173` in your browser.

### Option 3: VS Code / Cursor Live Server
Use a Live Server extension and open `index.html`.

## Controls
- WASD: Move
- Mouse: Look (click canvas to capture the mouse)
- E: Interact with nearby chest

## Structure
- `index.html`: markup and UI overlays
- `styles.css`: UI styles
- `src/questions.js`: question bank
- `src/main.js`: game logic and rendering

## Notes
- Uses `three@0.160.0` from a CDN; internet is required on first load.
- No external models; all scene geometry is procedural for quick loading.

