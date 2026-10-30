# Roadmap & Development Plans — CAD.Like.audio

## 🛣 Development Goals
* **Interactive BOM Component Linking**: ✅ Delivered. Interactive Bill of Materials table aggregating schematic flow blocks and CAD block instances with live canvas locate/zoom, bulk attribute editing, CSV export, and markdown table copying.
* **Multi-Layer DXF Export**: ✅ Delivered. File → Download DXF writes an R2000 file whose LAYER table carries every layer with its name, ACI colour (the nearest index for a colour picked in the app), linetype, lineweight, and off/locked state; every entity sits on its own layer; every linetype a layer names is declared in LTYPE with its dash pattern (acad.lin in inches, acadiso ×25.4 in mm). Opening that file brings the same layers back — tested end to end in `src/io/exportDxf/buildDxf.test.ts`. The canvas draws each layer's linetype and lineweight (`src/render/edges/layerStroke.ts`). Still to come: a linetype/lineweight picker on the layer row (today they arrive only from an opened DXF).
* **WebGL 3D Canvas Integration**: Planned 3D wireframe / enclosure model visualization.
