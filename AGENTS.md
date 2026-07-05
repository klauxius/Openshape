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

### Driving the app headlessly (MCP tools, no GUI)
- Once `/cad-interface` has mounted, `initializeTools()` (called on mount) exposes
  `window.openshapeCAD` with `callTool(name, params)`, `listTools()`, and `getToolDefinitions()`.
  This is the programmatic/agent entry point - the same MCP tools the in-app AI assistant uses.
- Full sketch -> extrude example (browser console, no clicking required):
  `await window.openshapeCAD.callTool('cadCreateSketch', { plane: 'xy' })` then
  `await window.openshapeCAD.callTool('cadAddRectangleToSketch', { width: 12, height: 8 })`
  then `await window.openshapeCAD.callTool('cadExtrudeSketch', { height: 6 })`.
- Extrudable sketch profiles come from `cadAddRectangleToSketch`, `cadAddCircleToSketch`, or a
  closed loop of `cadAddLineToSketch` segments. `cadExtrudeSketch` reads `activeSketch.entities`;
  the `create_rectangle`/`create_circle`/`create_polygon` tools write straight to the model
  store and are NOT part of a sketch (so they are not extruded by `cadExtrudeSketch`).
- Sketches are parametric. Define named parameters on the sketch
  (`cadCreateSketch({ plane:'xy', parameters:{ w:12, h:8, d:6 } })`), then bind a dimension to a
  parameter by passing its NAME as a string, e.g. `cadAddRectangleToSketch({ width:'w', height:'h' })`
  and `cadExtrudeSketch({ height:'d' })`. `cadSetSketchParameter({ name:'w', value:24 })` updates the
  parameter and rebuilds every bound entity dimension and the linked extruded solid in place;
  `cadGetSketchParameters()` reads them. Numeric literals still work (no binding). Use
  `window.openshapeCAD.measureModel(id)` to confirm resulting dimensions headlessly.
- Sketch constraints (geometric relations): `cadAddConstraint({ type, entities, value })` adds a
  relation and immediately re-solves the sketch (iterative solver in `lib/constraintSolver.mjs`).
  Types: `coincident` (two point ids), `horizontal`/`vertical` (a line id or two point ids),
  `parallel`/`perpendicular`/`equal` (two line ids), `distance`/`length` (a line id + numeric
  value OR a parameter name), `fixed` (a point id). Constraints operate on POINTS and
  point-connected LINES, so build geometry with `cadAddPoint` + `cadConnectPoints` (not
  `cadAddRectangleToSketch`) when you want it constrained. The first point is auto-anchored if
  nothing is `fixed`. `distance` with a parameter name is parametric — `cadSetSketchParameter`
  re-solves and rebuilds the extrusion. `cadListConstraints` lists them. Solver has a Node unit
  test: `node lib/constraintSolver.test.mjs` (from `openshape/`).
- Datum planes: define a reference plane rigorously with `cadCreatePlane` — either an offset
  plane (`{ basePlane:'xy'|'yz'|'xz', offset }`) or a general plane (`{ origin:[x,y,z],
  normal:[x,y,z] }`) — then sketch on it via `cadCreateSketch({ planeId })`. Internally every
  sketch carries a `frame` (origin + orthonormal `u`/`v`/`w`) in `lib/planeFrame.js`; the base
  planes are just special-case frames, and all plane-aware math (2D↔3D transform, extrude
  orientation, camera, click-to-draw raycast, outline rendering) routes through the frame, so
  sketching/extruding works on arbitrary planes. `cadListPlanes` lists defined planes.
- The built-in AI assistant only uses simulated (offline) tool-calling when `CLAUDE_API_KEY` /
  `NEXT_PUBLIC_CLAUDE_API_KEY` is set or `NEXT_PUBLIC_USE_SIMULATED_RESPONSES=true`; otherwise it
  replies that the API key is not configured. The `window.openshapeCAD` path needs neither.

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
