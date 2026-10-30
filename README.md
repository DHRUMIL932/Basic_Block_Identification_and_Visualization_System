# Basic Block Visualizer
Compiler Design / Lab 01 — Three Address Code control-flow analysis workbench.

**Stack:** React (Vite) frontend · Node.js + Express backend (the compiler engine runs on the server).

## Requirements
- Node.js 18 or newer (check with `node -v`)

## Run in development
```bash
cd basic-block-visualizer
npm run install:all     # installs root, server and client dependencies
npm run dev             # starts API (http://localhost:5050) + React app (http://localhost:5173)
```
Open **http://localhost:5173**, then click **Analyze code**.

## Run as a single production server
```bash
npm run install:all
npm run build           # builds the React app into client/dist
npm start               # one server on http://localhost:5050 (API + UI)
```

## Run the compiler tests
```bash
npm test                # leaders, blocks, CFG edges, labels, loops, unreachable code, errors
```

## API
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/examples` | Example TAC programs |
| POST | `/api/analyze` | Body `{ "source": "<TAC>" }` returns statements, leaders, blocks, CFG, reachability, dominators, complexity (or `{ ok:false, errors }`) |

## Structure
```
server/   index.js (Express) · engine.js (parser, leaders, blocks, CFG, reachability, dominators, complexity) · examples.js · engine.test.js
client/   src/App.jsx · components/{Editor,Results,Graph,Tooltip,icons}.jsx · styles.css · vite.config.js (proxies /api to :5050)
```

## Troubleshooting
- **"Backend offline" toast:** the API is not running. Use `npm run dev` from the project root.
- **Port 5050 busy:** `PORT=5051 npm start` (for dev, also change the proxy target in `client/vite.config.js`).
- Fonts (IBM Plex) load from Google Fonts; offline the app falls back to system fonts.
