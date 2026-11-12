# EDITORS.CAD.Like.audio

> 📐 **CAD.LIKE.AUDIO** — the 2D drawing board and Big Picture schematic of the APK.audio ecosystem: lines and true arcs, layers, blocks, typed Flow ports, and a strict DXF R2000 out and in.

---

## Hosting

Published by `.github/workflows/deploy.yml` on every push to `main`: to GitHub Pages, and over FTPS to the Varial host that serves https://cad.like.audio/ today.

**Live now:** https://likedotaudio.github.io/APK.softapp.EDITORS.CAD.Like.audio/

> **Note:** the custom domain `cad.like.audio` is switched off until its DNS is in place. GitHub redirects the github.io address to the custom domain as soon as one is set, so setting it before DNS resolves breaks the link above. To switch it on:
>
> 1. At the `like.audio` DNS host (Varial Hosting), add a CNAME `cad.like.audio` → `likedotaudio.github.io` (and remove the old A record pointing at the FTPS host).
> 2. Wait until `dig +short cad.like.audio` answers with GitHub's addresses.
> 3. Set the domain: `gh api -X PUT repos/LikeDotAudio/APK.softapp.EDITORS.CAD.Like.audio/pages -f cname=cad.like.audio`, then tick *Enforce HTTPS* in Settings → Pages once the certificate is issued.

---

## 🧩 Architectural Role
* **Family**: EDITORS — the Design, CAD & Schematic editors, alongside EDITORS.Acoustic.Like.audio, which is built on this one.
* **Category**: 2D CAD — a drawing board (`#/drawing`) and a schematic of the system (`#/big-picture`) in one bundle.
* **Pipeline Stage**: Drawing — `07b · Drawing` in `display.json` (group *Pipeline*); the same bundle is the `06a · Big Picture` door through its `#/big-picture` fragment.

---

## 🧭 Philosophy

What the code holds itself to, with where each one lives:

* **Arcs stay arcs.** The drawing (`src/model/Doc.ts`) is a graph of vertices joined by line or *true-arc* edges, not a polyline approximation — an arc is an arc in the editor, in the snap, and in the DXF. A circle nobody has cut stays one `CIRCLE`.
* **Define once, place by reference.** A block — a CAD symbol or a Flow block — is one `BLOCK` and every placement an `INSERT` (`src/io/exportDxf/buildDxf.ts`), so a sheet with twelve of them moves as twelve things and carries the strokes once.
* **Ports are read, not coined.** A Flow block's typed ports are read out of `APK:OS`'s `Interfaces.json` `Terminals` table (the BIM library's concept entries, vendored at `src/vendor/bim/concepts.json`); the connector palette (`src/connectors`) draws every connector of `contracts/ifc/connectors.json` and every port type of `contracts/ifc/signal-formats.json` it is given (both vendored at `src/vendor/ifc/`).
* **A file a strict reader accepts.** The DXF writer is a port of the repository's one conformant emitter: handles, owners, AcDb subclasses, a BLOCK_RECORD table, and no dangling reference — every layer an entity names and every linetype a layer names is declared.
* **One bundle, two doors.** `#/drawing` and `#/big-picture` (`src/shell/entrance.ts`) are one application doing two jobs; an unknown fragment lands on the drawing board so old bookmarks still work.
* **Every failure is soft.** Served from apk.audio there is no `server.py`; the Big Picture file (`src/io/bigPicture`) is then simply unreachable and the IndexedDB session stays the working copy. A save quoting a stale digest is refused (409) rather than overwriting someone's drawing.
* **A door for softapps built on it.** Inside another softapp's iframe it speaks `cad.like.audio/host@1` over `postMessage` (`src/shell/hostBridge`): it tells the host the view, the geometry and the Virtual Mirror, and takes palettes, layers and placements back. EDITORS.Acoustic.Like.audio is that host. The protocol is published as a schema with samples in `contract/host@1/`.
* **Ratchets on every build.** `npm run build` runs `tsc`, `verifyFlow` (port geometry, neighbour graph, DXF BLOCK/INSERT resolution) and five gates (`check-mount-reach`, `check-effect-abort`, `check-brand-tokens`, `check-interfaces`, `check-brand-literals`) before Vite; the two baselines only go down, and the vendored brand tokens and Interfaces table must match the monorepo's.

---

## ⚙️ Repository Overview
This repository is a modular, standalone component of the APK.audio Softapps suite. It operates as an independent Git repository ([`LikeDotAudio/APK.softapp.EDITORS.CAD.Like.audio`](https://github.com/LikeDotAudio/APK.softapp.EDITORS.CAD.Like.audio)), integrated as a submodule of APK.audio at `PODS/POD.THIN/Softapps/EDITORS/EDITORS.CAD.Like.audio`.

| Path | Purpose |
| --- | --- |
| `src/model` | The drawing: `Doc` (vertices, line/arc edges, texts, fills, blocks), palette regions, validation. |
| `src/tools` | One file per drawing tool — line, arc/circle variants, polyline, spline, fill, text, block, Flow, wire, measure, symmetry. |
| `src/flow` | The Big Picture schematic: Flow block catalogue, placement, ports. |
| `src/connectors` | The connector catalogue and its badges. |
| `src/io` | DXF export (`exportDxf`) and import (`importDxf`), the browser session, recent files, the Big Picture file, images. |
| `src/shell` | Which door the app came in by, and the host bridge for softapps that embed it. |
| `src/state`, `src/components`, `src/render`, `src/viewport` | The store and its actions, the React chrome, the canvas renderer, pan/zoom. |
| `contract` | Published contracts (`host@1`, `big-picture@2` — the Big Picture filed as IFC; `big-picture@1` JSON read-only until it is removed on 2027-01-01) — JSON Schema, samples, `validate.mjs`. |
| `scripts` | `verifyFlow.ts` and the build gates with their baselines. |
| `Drawings` | The example Big Picture sheet as `.json` and `.dxf`. |
| `dist` | The built app. **Tracked** — the portal serves it as-is, so rebuild and commit it with the source. |
| `Documentation` | The wiki — [Documentation/README.md](Documentation/README.md): principles, architecture, delivery, audits. |

---

## 📤 DXF export & import

**File → Download DXF** writes an AutoCAD R2000 (`AC1015`) file that strict readers accept:

* **Every layer** in the LAYER table with its **name**, **colour** (ACI — a colour picked in the app goes out as the nearest index), **linetype**, **lineweight**, and whether it is **off** (hidden) or **locked**.
* **Every entity on its own layer** — lines, true arcs, circles, text, fills (HATCH), CAD block placements (INSERT) and the schematic's flow blocks and connectors.
* **Every linetype** a layer names is declared with its dash pattern — `DASHED`, `HIDDEN`, `CENTER`, `DASHDOT`, `PHANTOM`, `DOT`, `DIVIDE`, `BORDER` at acad.lin sizes (×25.4 on a mm sheet), and any other linetype that came in on an opened DXF with the pattern it came with.

**Open** reads the same things back: layers with colour, linetype, lineweight and off/frozen/locked state, and the entities on them. A file written by Export opens to the same layers — `npm test` checks that round trip.

The canvas draws each layer's linetype and lineweight; a text's or fill's own colour goes out as an entity override, and a file's own BLOCKS come back on Open. Linetypes and lineweights still arrive on a layer only from an opened DXF — there is no picker for them yet. See [Documentation/🧩Manual and Artifacts/ARCHITECTURE.md](Documentation/🧩Manual%20and%20Artifacts/ARCHITECTURE.md#dxf-in-and-out-srcioexportdxf-srcioimportdxf).

---

## 🏗️ IFC in & out (the model)

The drawing is also an **IFC4X3_ADD2** model (ISO 16739-1:2024) — `src/io/ifc`, written with the monorepo's own STEP codec and GlobalId rule (`contracts/src/ifc`, vendored byte for byte in `src/vendor/ifc`, held equal by `vendored.test.ts`):

* **IfcProject → IfcSite → IfcBuilding → IfcBuildingStorey 'Level 0' → IfcSpace** per room; every coordinate in **mm** (a session in inches is multiplied out, its display unit kept).
* **Walls are classified, not inferred:** a layer with `ifc: { entity: 'IfcWall', height_mm?, thickness_mm? }` (host@1 `layer { ifc }`) makes each of its edges an `IfcWall` with an Axis (and a SweptSolid Body when both are known), contained in the storey. Every room those walls enclose is an `IfcSpace` with `IfcRelSpaceBoundary` to each wall around it; rooms the user declares (`session.spaces`) are spaces too.
* **The user says it:** right-click a layer row ▸ **Walls (IfcWall)**, **Wall Size...** (height × thickness, mm) and **External** (Pset_WallCommon.IsExternal; true / false / not said). Select the edges round a room ▸ Modify ▸ **Declare Room (IfcSpace) from Selection** (name, floor-to-ceiling mm); **Undeclare Room in Selection** takes it off. Both persist in the session and its .ifc twin (`src/state/actions/roomsAndWalls.ts`).
* **One wall where the builder builds one:** collinear edges the CAD welded apart (a partition cuts the wall it meets) are one `IfcWall` (`src/io/ifc/wallRuns.ts`, GlobalId from the lowest edge id); walls that meet are `IfcRelConnectsPathElements` (ATSTART / ATEND, ATPATH at a T). A declared room over a wall face is that face's one `IfcSpace`.
* **Quantities:** `Qto_WallBaseQuantities` (Length, Width, Height, GrossFootPrintArea, GrossSideArea, GrossVolume — what is known) and `Qto_SpaceBaseQuantities` (Height, Gross/Net Perimeter, FloorArea, Volume: gross on the wall axes, net inside the walls). Lengths mm, areas m², volumes m³ (`src/io/ifc/quantities.ts`).
* **Placed BIM blocks are occurrences of their part's own type** — the library's type object (`GET /api/bim/parts/<id>.ifc`) copied in with its GlobalId, Psets and RepresentationMap — at an `IfcLocalPlacement` in mm (z = `z_mm`), contained in the space they stand in, with their own ports. A device on a wall (`mountedOn`) is an `IfcRelConnectsElements` wall → device. Identity is serial / MAC, never an IP.
* **Virtual Mirror:** the axis is an `IfcAnnotation` 'MIRROR_AXIS'; a reflected copy is a second placement with `APK_Symmetry` on each partner — never a negative scale, which IFC forbids.
* Linework, texts, fills and symbols are `IfcAnnotation`s carrying `APK_Cad*` sets, so the welded vertex graph re-welds; what IFC has no word for yet (the Flow schematic's wiring — cad-6) rides in `APK_CadSession`. The `APK_*` sets are declared in DATABASE.server.BIM `SRC/tools/ifc/apk_psets.py`.

**A foreign .ifc opens through web-ifc** (ROAD-3598): a file another tool wrote (FILE_NAME does not name APK.audio — Revit, ArchiCAD, IfcOpenShell …) carries swept solids, Breps and booleans the codec does not evaluate, so File ▸ Open Model (and a host's `open { ifc }`) hands it to the shared lazy loader `public/vendor/apk-webifc/apk-webifc.js` (FrontEnd/shared, `vendor_shared_web.py`; web-ifc **0.0.78**, **MPL-2.0**, verified in its `package.json` and `LICENSE.md`, served unmodified as separate files beside its licence). `src/io/ifc/foreignIfc.ts` turns its meshes into a plan: each product's feature edges (mesh boundary, or faces turning > 20°) projected to the floor in mm, one drawing layer per IFC class. Our own files — the CAD's and every APK writer's — still go through the codec and never fetch the engine (`foreignIfc.test.ts`); without the engine a foreign file the codec can parse opens the codec's way. `node scripts/webifc-headless.mjs [dist]` opens `src/io/ifc/fixtures/foreign-room.ifc` (IfcOpenShell-written, `scripts/foreignIfcFixture.py`) in headless Chrome and photographs it.

**Wires, flown with a real mouse** (ROAD-3689): `node scripts/wire-gestures-headless.mjs [url] [out-dir]` (default the CAD on :8080) writes a drawing with this app's own exporter (`scripts/wireGesturesFixture.ts`: four of one real BIM part, a wire with two bends, a plain wire, a drawn line pin to pin), opens it with File ▸ Open Model, reads the sheet's scale off the cursor readout, then with the Select tool only slides a run, drags a bend, double-clicks a bend in and out, deletes a wire, discovers and accepts the drawn line in 🧵 Wire Manager, downloads both CSVs and Save Model's .ifc, and checks each against the saved file read back by `importIfc`. A connector dropped on a placed project instance is that instance's own port, written back to BIM (`PUT /api/bim/projects/<id>/instances/<i>/ports`, ROAD-3688; `shell/bimProjects.ts installInstancePortsSync`), flown in `scripts/blocks-palette-headless.mjs`; a guessed port takes only a connector of its family (`flow/dropConnector.ts connectorFamily`).

**File → Save Model (.ifc + .json) / Open Model (.ifc / .json)...** write and read it through the shared `APKSoftapp.saveModel` / `openModel` (the .ifc and the session's native .json, both or neither, into one folder picked once; without the client the .ifc alone; DXF is untouched — it stays the 2D drawing exchange). **Every autosave writes the native session AND its .ifc twin** in one IndexedDB transaction (`current_active_session_ifc`). host@1: `session { format: 'ifc' }` answers with `ifc` beside `session`, `open { ifc }` opens one, a `floorplan` .ifc opens the same way. `importIfc(exportIfc(s))` is `s` (`src/io/ifc/ifcSession.test.ts`); `CAD_IFC_OUT=<dir> npx vitest run src/io/ifc` writes the test drawings out for IfcOpenShell's validator and the IDS.

---

## 🚀 Usage & Integration
* **Web Portal Entry**: `dist/index.html#/drawing` (the drawing board) and `dist/index.html#/big-picture` (the schematic), as named in `display.json`.
* **Live**: https://likedotaudio.github.io/APK.softapp.EDITORS.CAD.Like.audio/ (see Hosting above).
* **Remote Repository**: https://github.com/LikeDotAudio/APK.softapp.EDITORS.CAD.Like.audio
* **Wiki**: [Documentation/README.md](Documentation/README.md) — [principles](Documentation/🏛Philosophy/PRINCIPLES.md), [architecture](Documentation/🧩Manual%20and%20Artifacts/ARCHITECTURE.md), [delivery](Documentation/🌍Publishing/DELIVERY.md).
* **Develop**: `npm run dev`; `npm test` (vitest); `npm run build` (typecheck, verify, gates, then `dist/`).

<!-- wiki:smoke -->
**Smoke test** — ✅ PASS 2/2 since 2026-10-30 12:51 EDT — [results](Documentation/%F0%9F%A7%A9Manual%20and%20Artifacts/SMOKE.md)
<!-- /wiki:smoke -->
