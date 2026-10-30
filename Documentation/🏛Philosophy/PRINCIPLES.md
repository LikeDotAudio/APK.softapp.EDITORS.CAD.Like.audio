# Principles — CAD.Like.audio

What this editor holds itself to, each pointed at the code that keeps it. The ecosystem's own rules — the Soft Apps laws in the monorepo's `Documentation/🏛Philosophy/Soft Apps/readme.Soft Apps.md` and the mm rule for drawings — are cited here, not copied.

## Kept

* **Arcs stay arcs.** The drawing is a graph of vertices joined by `line` or true-`arc` edges (`src/core/types.ts` `ArcEdge`, `src/model/Doc.ts`); the canvas strokes a real `ctx.arc` (`src/render/edges/renderEdge.ts`), the DXF writes ARC, and a circle nobody cut stays one CIRCLE (`src/io/exportDxf/buildDxf.ts:61`).
* **Define once, place by reference.** A CAD block or a placed Flow definition is one BLOCK; each placement an INSERT (`buildDxf.ts:139`, `:147`, `:183`). On Open, a file's own BLOCKS become definitions before any INSERT is placed (`src/io/importDxf/loadDxfIntoDoc.ts` `blockFromDxf`), so an INSERT means the file's geometry.
* **A file a strict reader accepts — no dangling reference.** Every entity carries a handle, owner and AcDb subclass (`src/io/exportDxf/DxfGeometry.ts` `head`); every layer an entity names is declared (`DxfDocument.ts:88` `layer`); every linetype a layer names is in LTYPE; no 390 pointer is written to an object the file lacks.
* **What you see is what you export.** The canvas draws a layer's linetype and lineweight from the same pattern the DXF writer emits (`src/render/edges/layerStroke.ts:31`, `standardLinetype`); a text's or fill's own colour leaves as group 62 rather than being flattened to BYLAYER (`buildDxf.ts` `overrideAci`).
* **Ports are read, not coined.** Flow block ports come out of `Interfaces.json`'s `Terminals` table (`src/flow/catalog.ts:131`); `scripts/verifyFlow.ts` checks them on every build.
* **Two jobs, two doors, one bundle** (Soft Apps law 4). `#/drawing` and `#/big-picture` (`src/shell/entrance.ts:61` `entranceFromHash`); an unknown fragment lands on the drawing board so old bookmarks work.
* **A soft app declares itself** (Soft Apps law 1). `display.json` names the app, group and `dist/index.html` entry.
* **Every failure is soft; nobody's drawing is overwritten.** With no `server.py` the Big Picture file is unreachable and the IndexedDB session stays the working copy; a save quoting a stale digest is refused with 409 (`src/io/bigPicture/bigPictureApi.ts:75`).
* **Ship the gate with the hazard** (Soft Apps law 7). `npm run build` runs `tsc`, `verify` and two ratchets — `scripts/check-mount-reach.mjs` (components unreachable from `main.tsx`, ceiling 2) and `scripts/check-effect-abort.mjs` (ceiling 0) — before Vite. Baselines only go down.
* **Same sources, same bytes.** The build stamp is a hash of the sources (`vite.config.ts:31` `buildStamp`), not the clock, so the tracked `dist/` is a fixed point; `base: './'` (`vite.config.ts:52`) lets the bundle run from any folder.

## Broken, said plainly

* **Colours are not tokens** (Soft Apps law 6). `src/components/` carries ~540 inline hex literals (`grep -rn '#[0-9a-fA-F]\{6\}' src/components | wc -l`); only the canvas palette (`src/colorsStyle.ts`) and its accent are tokenised, and the accent is a *vendored copy* (`src/tokens/brand.json`) of the monorepo's `contracts/tokens/brand.json` that must be re-copied by hand (the `check-brand-tokens` build gate catches a stale copy inside the monorepo).
* **The bus is not its door out** (Soft Apps law 2). It talks to `server.py` over HTTP (`bigPictureApi.ts`) and to a host softapp over `postMessage` (`src/shell/hostBridge/hostBridge.ts:99`, `cad.like.audio/host@1`), not over MQTT; `display.json`'s `topic` is declared but nothing in `src/` publishes on it.
