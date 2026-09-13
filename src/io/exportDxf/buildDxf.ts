// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type {
  BlockSize,
  Edge,
  Layer,
  Point,
  Port,
  PortRef,
  SchematicModel,
  Units,
} from '../../core/types';
import { portLocalPoint } from '../../flow/portLocalPoint';
import { definitionOf, portWorldPoint } from '../../flow/Schematic';
import type { Doc } from '../../model/Doc';
import { DxfDocument } from './DxfDocument';
import { dxfBlockName } from './dxfBlockName';

/**
 * Serialise the sheet as conformant DXF R2000 text.
 *
 * Two things are written, and they are written differently on purpose:
 *
 *   · GEOMETRY goes into the ENTITIES section as LINE, ARC and CIRCLE. A group
 *     that is still an untouched circle stays one CIRCLE rather than two ARCs.
 *
 *   · FLOW BLOCKS go into the BLOCKS section as one real DXF `BLOCK` per
 *     DEFINITION, placed by one `INSERT` per placement. That is the point of
 *     the entity model: the reader receives the symbol once and every instance
 *     of it as a reference, so a block moves as one thing and a sheet with
 *     twelve of them is not twelve copies of the same strokes.
 *
 * The writer underneath is `DxfDocument`, the TypeScript port of
 * `.apk.scripts/dxf_writer.py` — this repository's one conformant emitter.
 */
export function buildDxf(
  doc: Doc,
  units: Units,
  layers: Iterable<Layer> = [],
  schematic?: SchematicModel,
): string {
  const dxf = new DxfDocument(
    Array.from(layers).map((l) => ({ name: l.name, color: l.dxfColorIndex ?? 7 })),
  );

  // ---------------------------------------------------------------- geometry
  const byGroup = new Map<number, Edge[]>();
  for (const e of doc.edges.values()) {
    const list = byGroup.get(e.groupId);
    if (list) list.push(e);
    else byGroup.set(e.groupId, [e]);
  }

  for (const [groupId, list] of byGroup) {
    const prim = doc.groupPrimitives.get(groupId);
    if (prim?.type === 'circle' && doc.groupIntact.has(groupId) && list.length === 2) {
      dxf.sheet.circle(prim.cx, prim.cy, prim.r, list[0]?.layerId || '0');
      continue;
    }
    for (const e of list) {
      const [a, b] = doc.endpointsOf(e);
      if (e.type === 'line') {
        dxf.sheet.line(a.x, a.y, b.x, b.y, e.layerId);
        continue;
      }
      // DXF arcs run counter-clockwise from start angle to end angle, which is
      // how they are stored here, so the angles map across directly.
      const a1 = ((Math.atan2(a.y - e.cy, a.x - e.cx) * 180) / Math.PI + 360) % 360;
      const a2 = ((Math.atan2(b.y - e.cy, b.x - e.cx) * 180) / Math.PI + 360) % 360;
      dxf.sheet.arc(e.cx, e.cy, e.r, a1, a2, e.layerId);
    }
  }

  // --------------------------------------------------------------- schematic
  if (schematic) {
    // One BLOCK per definition that is actually placed. A definition nobody
    // used is not written: a BLOCK_RECORD nothing INSERTs is dead weight in
    // the file and a reader has no way to tell it was deliberate.
    const used = new Set(schematic.placements.map((p) => p.definitionId));
    const blockNames = new Map<string, string>();

    for (const definitionId of used) {
      const def = definitionOf(schematic, definitionId);
      if (!def) continue;
      const name = dxfBlockName(def.name);
      if (dxf.hasBlock(name)) continue;
      blockNames.set(definitionId, name);

      const geometry = dxf.block(name);
      const hw = def.size.w / 2;
      const hh = def.size.h / 2;
      geometry.polyline(
        [
          { x: -hw, y: -hh },
          { x: -hw, y: hh },
          { x: hw, y: hh },
          { x: hw, y: -hh },
        ],
        '0',
        true,
      );
      for (const stroke of def.glyph) geometry.polyline(stroke, '0');
      // A port is a mark on the outline, and it is drawn in the block so that
      // every placement carries it: the ports ARE the symbol's meaning, and a
      // sheet that only draws them on the ones you wired is lying.
      for (const port of def.ports) {
        const local = portMark(def.size, def.ports, port);
        geometry.polyline(local, '0');
      }
    }

    for (const placement of schematic.placements) {
      const name = blockNames.get(placement.definitionId);
      if (!name) continue;
      dxf.sheet.insert(
        name,
        placement.at.x,
        placement.at.y,
        placement.layerId,
        placement.rotation ?? 0,
        placement.scale ?? 1,
      );
    }

    // Connectors are drawn between the ports' derived positions, on the sheet
    // rather than in a block — a wire belongs to two placements and to no
    // definition, so it cannot live inside either one.
    for (const connector of schematic.connectors) {
      const a = connectorEnd(schematic, connector.from);
      const b = connectorEnd(schematic, connector.to);
      if (!a || !b) continue;
      dxf.sheet.polyline([a, ...(connector.route ?? []), b], connector.layerId);
    }
  }

  return dxf.dxf(units);
}

/* -- helpers, kept below the entry point so the shape of the file reads first */

/** A short tick on the outline, pointing out of the side the port is on. */
function portMark(size: BlockSize, ports: Port[], port: Port): Point[] {
  const at = portLocalPoint({ id: '', name: '', size, glyph: [], ports }, port);
  const len = Math.min(size.w, size.h) * 0.18;
  switch (port.side) {
    case 'input':
      return [at, { x: at.x - len, y: at.y }];
    case 'output':
      return [at, { x: at.x + len, y: at.y }];
    case 'control':
      return [at, { x: at.x, y: at.y + len }];
    case 'power':
      return [at, { x: at.x, y: at.y - len }];
  }
}

function connectorEnd(model: SchematicModel, ref: PortRef): Point | null {
  return portWorldPoint(model, ref);
}
