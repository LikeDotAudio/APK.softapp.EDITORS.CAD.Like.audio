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
* **Ports are read, not coined.** A Flow block's typed ports are read out of `APK:OS`'s `Interfaces.json` `Terminals` table (`src/flow/catalog.ts`); the connector catalogue (`src/connectors`) draws a badge per connector the system names.
* **A file a strict reader accepts.** The DXF writer is a port of the repository's one conformant emitter: handles, owners, AcDb subclasses, a BLOCK_RECORD table, and no dangling reference — every layer an entity names and every linetype a layer names is declared.
* **One bundle, two doors.** `#/drawing` and `#/big-picture` (`src/shell/entrance.ts`) are one application doing two jobs; an unknown fragment lands on the drawing board so old bookmarks still work.
* **Every failure is soft.** Served from apk.audio there is no `server.py`; the Big Picture file (`src/io/bigPicture`) is then simply unreachable and the IndexedDB session stays the working copy. A save quoting a stale digest is refused (409) rather than overwriting someone's drawing.
* **A door for softapps built on it.** Inside another softapp's iframe it speaks `cad.like.audio/host@1` over `postMessage` (`src/shell/hostBridge`): it tells the host the view, the geometry and the Virtual Mirror, and takes palettes, layers and placements back. EDITORS.Acoustic.Like.audio is that host.
* **Ratchets on every build.** `npm run build` runs `tsc`, `verifyFlow` (port geometry, neighbour graph, DXF BLOCK/INSERT resolution) and two gates (`check-mount-reach`, `check-effect-abort`) before Vite; their baselines only go down.

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
| `scripts` | `verifyFlow.ts` and the build gates with their baselines. |
| `Drawings` | The example Big Picture sheet as `.json` and `.dxf`. |
| `dist` | The built app. **Tracked** — the portal serves it as-is, so rebuild and commit it with the source. |
| `Documentation` | Architecture notes, known issues, roadmap. |

---

## 📤 DXF export & import

**File → Download DXF** writes an AutoCAD R2000 (`AC1015`) file that strict readers accept:

* **Every layer** in the LAYER table with its **name**, **colour** (ACI — a colour picked in the app goes out as the nearest index), **linetype**, **lineweight**, and whether it is **off** (hidden) or **locked**.
* **Every entity on its own layer** — lines, true arcs, circles, text, fills (HATCH), CAD block placements (INSERT) and the schematic's flow blocks and connectors.
* **Every linetype** a layer names is declared with its dash pattern — `DASHED`, `HIDDEN`, `CENTER`, `DASHDOT`, `PHANTOM`, `DOT`, `DIVIDE`, `BORDER` at acad.lin sizes (×25.4 on a mm sheet), and any other linetype that came in on an opened DXF with the pattern it came with.

**Open** reads the same things back: layers with colour, linetype, lineweight and off/frozen/locked state, and the entities on them. A file written by Export opens to the same layers — `npm test` checks that round trip.

Linetypes and lineweights arrive on a layer from an opened DXF; the app does not yet draw them on the canvas or offer a picker for them. See [Documentation/🧩Manual and Artifacts/ARCHITECTURE_NOTES.md](Documentation/🧩Manual and Artifacts/ARCHITECTURE_NOTES.md#dxf-in-and-out-srcioexportdxf-srcioimportdxf).

---

## 🚀 Usage & Integration
* **Web Portal Entry**: `dist/index.html#/drawing` (the drawing board) and `dist/index.html#/big-picture` (the schematic), as named in `display.json`.
* **Live**: https://likedotaudio.github.io/APK.softapp.EDITORS.CAD.Like.audio/ (see Hosting above).
* **Remote Repository**: https://github.com/LikeDotAudio/APK.softapp.EDITORS.CAD.Like.audio
* **Develop**: `npm run dev`; `npm test` (vitest); `npm run build` (typecheck, verify, gates, then `dist/`).
