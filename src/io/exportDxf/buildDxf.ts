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
import { hexToAci } from '../../core/dxfColors/hexToAci';
import { DxfDocument, type DxfLayerSpec } from './DxfDocument';
import { dxfBlockName } from './dxfBlockName';

/**
 * Serialise the sheet as conformant DXF R2000 text.
 *
 * Three things are written, each the way DXF means it to be:
 *
 *   · GEOMETRY goes into the ENTITIES section as LINE, ARC and CIRCLE. A group
 *     that is still an untouched circle stays one CIRCLE rather than two ARCs.
 *
 *   · LAYERS go into the LAYER table, every one the sheet has, each with its
 *     name, colour, linetype, lineweight, and whether it is off or locked —
 *     and every entity is written on its own layer, by that layer's name.
 *     A text or fill with a colour of its own also writes that colour (62);
 *     everything else is BYLAYER.
 *
 *   · FLOW BLOCKS go into the BLOCKS section as one real DXF `BLOCK` per
 *     DEFINITION, placed by one `INSERT` per placement. That is the point of
 *     the entity model: the reader receives the symbol once and every instance
 *     of it as a reference, so a block moves as one thing and a sheet with
 *     twelve of them is not twelve copies of the same strokes.
 *
 * The writer underneath is `DxfDocument` — first ported from the since-removed
 * `.apk.scripts/dxf_writer.py`, now the suite's one conformant DXF emitter.
 */
export function buildDxf(
  doc: Doc,
  units: Units,
  layers: Iterable<Layer> = [],
  schematic?: SchematicModel,
): string {
  const dxf = new DxfDocument(Array.from(layers, dxfLayerSpec));

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

  // ------------------------------------------------------------- texts
  for (const t of doc.texts.values()) {
    let hAlign = 0;
    if (t.align === 'center') hAlign = 1;
    else if (t.align === 'right') hAlign = 2;

    let vAlign = 0;
    if (t.vAlign === 'bottom') vAlign = 1;
    else if (t.vAlign === 'middle') vAlign = 2;
    else if (t.vAlign === 'top') vAlign = 3;

    dxf.sheet.text(
      t.text,
      t.x,
      t.y,
      t.height,
      t.layerId,
      t.rotation ?? 0,
      hAlign,
      vAlign,
      overrideAci(t.color),
    );
  }

  // ------------------------------------------------------------- fills
  for (const f of doc.fills.values()) {
    if (f.points.length >= 3) {
      dxf.sheet.hatch(f.points, f.layerId, f.type === 'solid', overrideAci(f.color), hatchName(f.hatchPattern));
    }
  }

  // ------------------------------------------------------------- CAD blocks
  for (const [name, blockDef] of doc.blocks.entries()) {
    const bName = dxfBlockName(name);
    if (dxf.hasBlock(bName)) continue;
    const geom = dxf.block(bName);
    for (const l of blockDef.lines) {
      geom.line(l.x1, l.y1, l.x2, l.y2, l.layerId || '0');
    }
    for (const a of blockDef.arcs) {
      geom.arc(a.cx, a.cy, a.r, a.a1, a.a2, a.layerId || '0');
    }
    for (const c of blockDef.circles) {
      geom.circle(c.cx, c.cy, c.r, c.layerId || '0');
    }
    if (blockDef.texts) {
      for (const t of blockDef.texts) {
        geom.text(t.text, t.x, t.y, t.height, t.layerId || '0', t.rotation ?? 0);
      }
    }
    if (blockDef.fills) {
      for (const f of blockDef.fills) {
        const solid = !f.hatchPattern || f.hatchPattern.toUpperCase() === 'SOLID';
        geom.hatch(f.points, f.layerId || '0', solid, overrideAci(f.color), hatchName(f.hatchPattern));
      }
    }
  }

  for (const inst of doc.blockInstances.values()) {
    const bName = dxfBlockName(inst.blockName);
    dxf.sheet.insert(bName, inst.x, inst.y, inst.layerId, inst.rotation ?? 0, inst.scale ?? 1);
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

/**
 * An entity's own colour as an ACI override (group 62), or undefined for
 * BYLAYER. Only texts and fills carry a colour of their own in this app;
 * edges always draw in their layer's colour, so they stay BYLAYER.
 */
function overrideAci(color: string | undefined): number | undefined {
  return color ? hexToAci(color) : undefined;
}

/** A DXF hatch pattern name from the app's, or undefined for the default. 'GRID' has no ACAD pattern; NET is its look-alike. */
function hatchName(pattern: string | undefined): string | undefined {
  if (!pattern) return undefined;
  const p = pattern.toUpperCase();
  if (p === 'SOLID') return undefined;
  return p === 'GRID' ? 'NET' : p;
}

/**
 * A layer as the LAYER table wants it. The colour index is the one the layer
 * carries, or — for a layer made in the app, which has only a CSS colour —
 * the nearest one to what it shows.
 */
function dxfLayerSpec(l: Layer): DxfLayerSpec {
  return {
    id: l.id,
    name: l.name,
    color: l.dxfColorIndex ?? hexToAci(l.color),
    linetype: l.linetype,
    linetypePattern: l.linetypePattern,
    lineweight: l.lineweight,
    off: !l.visible,
    locked: l.locked,
  };
}

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
