# Architecture Notes & Technical Specs — CAD.Like.audio

## 🛠 Technical Specifications & Integration
Built with Vite, React 19, TypeScript and Tailwind 4; the drawing is painted on a Canvas 2D context. `src/colorsStyle.ts` is the canvas palette; its accent and greys come from `src/tokens/brand.json`, a copy of `APK:BareMetal`'s `contracts/tokens/brand.json` imported at build time (no runtime fetch).

## DXF in and out (`src/io/exportDxf`, `src/io/importDxf`)

**Export** — `buildDxf(doc, units, layers, schematic)` serialises the sheet through `DxfDocument`, the TypeScript port of `.apk.scripts/dxf_writer.py`: R2000 (`AC1015`), a handle and owner on every entity, AcDb subclass markers, a real BLOCK_RECORD table.

* **LAYER table** — every layer in the store, layer `0` first (its own colour and linetype if the user styled it). Each record carries name (cleaned of the characters DXF forbids; two names that clean alike get `_2`), ACI colour (`Layer.dxfColorIndex`, else `hexToAci` of the CSS colour), group 6 linetype, group 370 lineweight snapped to a DXF step (`-3` = default when unset), negative colour when the layer is hidden, flag 4 when it is locked.
* **Entities on their layers** — `DxfGeometry` asks `DxfDocument.layer(layerId)` for the DXF name of each entity's layer; a layer an entity reaches that the store never listed (a block's, a schematic's) is declared then, in white, so nothing dangles.
* **LTYPE table** — `ByBlock`, `ByLayer`, `CONTINUOUS`, plus every linetype a layer names: the standard set (`DASHED HIDDEN CENTER DASHDOT PHANTOM DOT DIVIDE BORDER`, `dxfLinetypes.ts`) in inches, ×25.4 on a mm sheet; any other name with the pattern it came in with (`Layer.linetypePattern`).

**Import** — `parseDxf` reads the LTYPE and LAYER tables and the ENTITIES section; `layersFromDxf(result, factor)` turns them into the store's layers (colour, linetype + unknown patterns scaled by the unit factor, lineweight, off/frozen → hidden, locked) and adds a layer for any entity whose layer the file did not declare; `loadDxfIntoDoc` places the entities. A HATCH's outline is read from its first boundary only (between group 93 and 97), so the elevation point and seed points do not become vertices; a non-SOLID pattern comes back as a `hatch` fill.

**Round trip** — `src/io/exportDxf/buildDxf.test.ts` writes a sheet, parses it back and checks layers, linetypes, lineweights, state and the layer of every entity.

**Not carried** — linetypes are not drawn on the canvas and have no picker yet; entity-level colour/linetype overrides are not written (everything is BYLAYER); the BLOCKS section is not read back on import, so an INSERT re-opens as a reference to a block the drawing must already know.
