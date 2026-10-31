# Architecture — CAD.Like.audio

How to use the editor, and how it works inside. Vite + React 19 + TypeScript + Tailwind 4; the drawing is painted on one Canvas 2D context. No server of its own: everything runs in the browser.

## Using it

* **Two doors, one bundle.** `dist/index.html#/drawing` is the drawing board, `#/big-picture` the system schematic. `src/shell/entrance.ts` (`entranceFromHash`) picks the door; anything unrecognised is the drawing board. `main.tsx` sets the tab title per door.
* **Draw** with the toolbar tools — one file each in `src/tools/` (line, parallel, angle/orthogonal line, polyline, spline, rect, circle / 2-point / 3-point / tangent, ellipse, break, rotate, measure, text, fill, block, group, symmetry, palette, and the schematic's flow + wire), registered in `src/tools/registry.ts`.
* **Layers** carry colour, linetype, lineweight, off and locked (`Layer` in `src/core/types.ts`). The canvas draws each layer's linetype and lineweight (see Rendering).
* **Files.** File → Open DXF, File → Download DXF, paste DXF/JSON/text from the clipboard (`state/actions/createFromClipboard.ts`), import an image to trace. The working copy autosaves to IndexedDB (`src/io/browserStorage`) and recent files are kept there too.
* **Develop:** `npm run dev`; `npm test` (vitest); `npm run build` (typecheck, `verify`, `gates`, then Vite into `dist/`).

## Inside

```
main.tsx → App.tsx → EditorStore (src/state)  ← pointer/keys via state/actions/handle*.ts
                         │  doc: Doc (src/model)  vertices + line/true-arc edges, texts, fills, blocks
                         │  schematic: SchematicModel (src/flow)  placements, ports, connectors
                         │  layers, units, view: Viewport (src/viewport)
                         ▼
                 render/renderScene.ts  → grid, image, fills, edges, blocks, texts, schematic, overlays
                 io/exportDxf, io/importDxf  ↔  .dxf
                 shell/hostBridge  ↔  parent softapp (postMessage cad.like.audio/host@1)
```

* **The model** — `src/model/Doc.ts`: a graph of vertices joined by `line` or true-`arc` edges (`ArcEdge` runs counter-clockwise about `cx, cy`), plus texts, fills, block definitions (`blocks`, seeded with `STANDARD_CAD_BLOCKS`) and block instances. A circle drawn whole remembers its primitive (`groupPrimitives` / `groupIntact`) so it exports as one CIRCLE.
* **The store** — `src/state/EditorStore.ts` owns the doc, history, selection, tool state, layers and units; each action is its own file in `src/state/actions/`. React reads it through `useStore` / `useUi`.
* **Rendering** — `src/render/renderScene.ts` paints a `Scene` each frame. Edges go through `render/edges/drawEdges.ts` → `renderEdge.ts`; `render/edges/layerStroke.ts` turns the edge's layer into a stroke: the linetype pattern (the same drawing-unit pattern the DXF writer emits, `standardLinetype` or the layer's own `linetypePattern`) × zoom as a canvas dash, and the lineweight as a display width (≤ 0.25 mm = 1.5 px, 0.50 mm = 3 px, capped at 12 px). A pattern finer than 4 px per repeat draws solid.
* **Colours** — `src/colorsStyle.ts` is the canvas palette; its accent and greys come from `src/tokens/brand.json`, a vendored copy of the monorepo's `contracts/tokens/brand.json` (no runtime fetch; copy it again when the source changes). `index.css`'s `@theme` is the chrome's paper palette.
* **Big Picture file** — `src/io/bigPicture/bigPictureApi.ts` reads/writes the sheet through `server.py` when one is there; a save quoting a stale digest gets 409 and is not overwritten. With no server the IndexedDB session is the working copy.
* **Host bridge** — `src/shell/hostBridge/hostBridge.ts` (`HOST_PROTOCOL = 'cad.like.audio/host@1'`). Inside another softapp's iframe (`#/drawing?host=…`) it posts `view` and `geometry` (`sceneForHost`) and takes palettes, layers, walls, marks and placements back; `HOST_HANDLERS` is the inbound vocabulary, `HOST_OUTBOUND_TYPES` the outbound one. EDITORS.Acoustic.Like.audio is the host. When the host pops the editor out to a window (`&resume&handover=<token>`), the drawing moves CAD to CAD over a BroadcastChannel (`hostHandover.ts`, `handover` { token }); the new window says `ready` only once it has it, and the host never holds the session.
* **Published contracts** — `contract/` holds what other repos build against, each a JSON Schema plus one sample of every message, checked by the dependency-free `contract/validate.mjs`: `host@1/` (the host bridge, tested here by `hostContract.test.ts`; EDITORS.Acoustic.Like.audio vendors the directory and tests its side against the same samples) and `big-picture@1/` (the Big Picture route, tested by `bigPictureContract.test.ts`; WEB.OsApi is the supplier). Change rule: a new optional field or message stays `@1`; a rename or removal is `@2`, and both versions are answered for one release. Every change to `contract/` bumps `package.json` `version`.
* **Big Picture route** — `src/io/bigPicture/bigPictureApi.ts` asks `/api/v1/big-picture`, falling back to the legacy `/api/big-picture` on a 404 for one release; writes carry `schema: 'cad.like.audio/big-picture@1'`, reads are shape-checked (`isBigPictureRead`).
* **Declared surfaces** — code outside `src/state/` and `src/io/` reaches them as `@state/…` and `@io/…` (tsconfig `paths`, Vite `resolve.alias`), never by a `../../../` climb.

## DXF in and out (`src/io/exportDxf`, `src/io/importDxf`)

**Export** — `buildDxf(doc, units, layers, schematic)` serialises the sheet through `DxfDocument` (first ported from the since-removed `.apk.scripts/dxf_writer.py`; now the suite's only conformant DXF emitter): R2000 (`AC1015`), a handle and owner on every entity, AcDb subclass markers, a real BLOCK_RECORD table. `saveDxf` offers it under the drawing's own name (`dxfFileName(units, currentFileName)`: `bracket.dxf` stays `bracket.dxf`; only an unnamed drawing is `my-part-<units>.dxf`), via the File System Access picker when the browser has one.

* **LAYER table** — every layer in the store, layer `0` first. Each record carries name (cleaned of the characters DXF forbids; two names that clean alike get `_2`), ACI colour (`Layer.dxfColorIndex`, else `hexToAci` of the CSS colour), group 6 linetype, group 370 lineweight snapped to a DXF step (`-3` = default when unset), negative colour when the layer is hidden, flag 4 when it is locked. No 390 plot-style pointer is written: there is no OBJECTS section for it to point into.
* **Entities on their layers** — `DxfGeometry` asks `DxfDocument.layer(layerId)` for the DXF name of each entity's layer; a layer an entity reaches that the store never listed (a block's, a schematic's) is declared then, in white, so nothing dangles.
* **Entity colour** — a text or fill with a colour of its own writes it as group 62 (`overrideAci` in `buildDxf.ts`); everything else is BYLAYER. A pattern fill writes its own hatch name (`GRID` goes out as `NET`).
* **LTYPE table** — `ByBlock`, `ByLayer`, `CONTINUOUS`, plus every linetype a layer names: the standard set (`DASHED HIDDEN CENTER DASHDOT PHANTOM DOT DIVIDE BORDER`, `dxfLinetypes.ts`) in inches, ×25.4 on a mm sheet; any other name with the pattern it came in with (`Layer.linetypePattern`).
* **Blocks** — one BLOCK per CAD block definition and per placed Flow definition, one INSERT per placement; connectors are LWPOLYLINEs on the sheet.

**Import** — `parseDxf` reads the HEADER (`$INSUNITS`), the LTYPE and LAYER tables, the BLOCKS section (every BLOCK but `*Model_Space` / `*Paper_Space`, with its base point and entities) and the ENTITIES section. `loadDxfText` scales everything by the unit factor (a file-defined block once, in its definition — its INSERTs keep their scale), `layersFromDxf(result, factor)` builds the store's layers, and `loadDxfIntoDoc` first adds the file's blocks (`blockFromDxf`, geometry moved so the base point is the origin; a file's definition replaces a same-named session one) and then places the entities. A HATCH's outline is read from its first boundary only (between group 93 and 97); a non-SOLID pattern comes back as a `hatch` fill; group 62 comes back as a text's or fill's colour (0 and 256 are BYBLOCK/BYLAYER and do not).

**Round trip** — `src/io/exportDxf/buildDxf.test.ts` writes a sheet, parses it back and checks layers, linetypes, lineweights, state, the layer of every entity, entity colour, the BLOCKS section and a session block's round trip. `scripts/verifyFlow.ts` checks port geometry, the neighbour graph and BLOCK/INSERT resolution on every build.

**Not carried** — no picker for linetype or lineweight on the layer row (they arrive from an opened DXF); edges have no colour of their own, so they are always BYLAYER; a DIMENSION is read as the lines, arrows and text of its anonymous block (the measurement is no longer live); a SPLINE and an oval ELLIPSE arrive as polylines (a round ELLIPSE as a true arc); a nested INSERT inside a file's BLOCK is flattened into that block's geometry (`src/io/importDxf/normalizeDxf.ts`), so the inner block is no longer its own symbol there. An old-style POLYLINE is read with its VERTEX/SEQEND run as the LWPOLYLINE it draws (bulges and closure kept); a polygon or polyface mesh POLYLINE is a 3D surface and is not drawn. A placement has one scale, so a model-space INSERT whose x and y scale differ (a mirror in one axis included) inserts a derived block `<NAME>_X<sx>_Y<sy>` holding the stretched geometry — from the file's BLOCK, or from the session's definition when the file does not define it (`dxfBlockFromDef`; a fill's opacity is not carried into the stretch). Whatever an open reads past — entity types the importer has no reader for (3DFACE, LEADER, IMAGE, ATTRIB, …) and mesh POLYLINEs — is counted by type in `DxfParseResult.skipped` and named in the open's hint (`Not imported: 3DFACE ×12, …`) and in the console.

## Files

| Path | What |
| --- | --- |
| `src/main.tsx`, `src/App.tsx` | Entry; door; React root. |
| `src/state/` | `EditorStore` and one file per action. |
| `src/model/` | `Doc`, CAD blocks, palette, validation. |
| `src/tools/` | One file per tool + `registry.ts`. |
| `src/render/` | Canvas painters, one folder per kind. |
| `src/io/` | DXF out/in, IndexedDB session, recent files, Big Picture file, images. |
| `src/flow/`, `src/connectors/` | The schematic and the connector catalogue (ports read from `Interfaces.json`'s `Terminals`; the build check reads only the vendored `scripts/fixtures/Interfaces.json`, kept identical to the OS copy by `scripts/check-interfaces.mjs`). |
| `src/shell/` | Entrance and host bridge. |
| `contract/` | The published contracts: `host@1/`, `big-picture@1/`, `validate.mjs`. |
| `scripts/` | `verifyFlow.ts`, the four gates (two with baselines), `emitExampleDrawing.ts` (`npm run example` → `Drawings/`). |
| `dist/` | The built app, **tracked**: rebuild and commit it with the source. |
