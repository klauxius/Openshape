# AGENTS.md

## Cursor Cloud specific instructions

### Overview
This repo is a single web application: **OpenShape**, a browser-based CAD tool built with
Next.js 15 (React 18) + Three.js + JSCAD. All app code lives in the `openshape/` directory
(the repo-root `package.json` is vestigial — only pulls in `uuid`). Run everything from
`openshape/`.

### Dependencies (installed by the update script)
- Node 22 / npm 10 are already available.
- Install with `--legacy-peer-deps` (required): `@react-three/fiber@9` declares a peer of
  React 19 but the project pins React 18, so a plain `npm install`/`npm ci` fails with an
  `ERESOLVE` peer conflict. The update script handles this.

### Running (dev)
- Start the dev server from `openshape/`: `npm run dev` (Next.js dev server on
  http://localhost:3000). Standard scripts are in `openshape/package.json`.
- **The real application UI is at `/cad-interface`** (http://localhost:3000/cad-interface),
  not `/`. The root `/` route is an older/simpler demo page.
- First load of a route triggers on-demand compilation (a few seconds) — the 3D viewport may
  briefly show "Loading 3D viewer..." before the WebGL canvas appears. This is normal.

### 3D / WebGL in the headless VM
- There is no GPU, so WebGL falls back to software (SwiftShader). Rendering works but the
  console logs benign warnings ("GPU stall due to ReadPixels", software-WebGL-deprecation,
  and "Failed to convert camera to isometric view"). These are not errors.

### Creating geometry (quick smoke test of core functionality)
- Open the JSCAD Terminal on `/cad-interface` (terminal icon in the top-right header, or
  press `` Ctrl+` ``) and run e.g. `result = jscad.primitives.cuboid({ size: [10, 10, 10] });`
  to create and render a solid. It appears in the viewport and in the sidebar under "Parts".

### Known caveats (pre-existing, do NOT try to "fix" as part of setup)
- `npm run build` (production build) currently FAILS: `components/JSCADViewer.js` (imported by
  the legacy `pages/index.js` and `pages/simple-fiber-test.js`) does `import ... from
  'jscad-fiber'`, but that package's `exports` field does not export the package root, so
  webpack reports "Package path . is not exported". The `/cad-interface` interface uses a
  different viewer (`components/JscadThreeViewer`) and works fine in dev. Develop/test in dev
  mode.
- `npm run lint` is NOT configured — `next lint` prompts interactively to set up ESLint (no
  eslint config is committed), so it cannot run non-interactively.
- The optional AI assistant proxies to Anthropic via `pages/api/claude.js` and needs
  `CLAUDE_API_KEY` (server-side env var). Core CAD functionality does not require it.
