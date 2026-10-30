// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { aciToHex } from '../../core/dxfColors/aciToHex';
import type { CadBlockDefinition } from '../../core/types';
import type { Doc } from '../../model/Doc';
import type { DxfBlock, DxfEntity, DxfParseResult } from './DxfParseResult';
import { normalizeDxf } from './normalizeDxf';

/**
 * The circle a bulged LWPOLYLINE segment lies on. A positive bulge runs
 * counter-clockwise from p1 to p2, a negative one clockwise.
 */
function bulgeArc(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  bulge: number,
): { cx: number; cy: number; r: number } {
  const theta = 4 * Math.atan(bulge);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const d = Math.hypot(dx, dy);
  const r = Math.abs(d / (2 * Math.sin(theta / 2)));
  const s = (bulge * d) / 2;
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const nx = -dy / d;
  const ny = dx / d;
  const h = r - Math.abs(s);
  const signH = theta > 0 ? 1 : -1;
  return { cx: mx + nx * h * signH, cy: my + ny * h * signH, r };
}

/**
 * An entity's own colour (group 62). 0 is BYBLOCK and 256 BYLAYER — both mean
 * "no colour of its own", so neither becomes an override.
 */
function entityColor(entity: DxfEntity): string | undefined {
  const aci = entity.colorIndex;
  return aci && aci > 0 && aci < 256 ? aciToHex(aci) : undefined;
}

/**
 * A BLOCK from the file as a block definition, its geometry moved so the
 * block's base point is the origin — the convention every definition in this
 * app keeps (`basePoint` 0,0; an INSERT places the origin). Expects the block
 * already normalized (`normalizeDxf`): nested INSERTs, DIMENSIONs, ELLIPSEs and
 * SPLINEs inside it have been turned into the lines, arcs, text and fills a
 * `CadBlockDefinition` holds.
 */
export function blockFromDxf(block: DxfBlock): CadBlockDefinition {
  const ox = block.baseX;
  const oy = block.baseY;
  const def: CadBlockDefinition = {
    name: block.name,
    basePoint: { x: 0, y: 0 },
    lines: [],
    arcs: [],
    circles: [],
    texts: [],
    fills: [],
  };
  const deg = (cx: number, cy: number, p: { x: number; y: number }) =>
    ((Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI + 360) % 360;
  for (const e of block.entities) {
    const layerId = e.layer || '0';
    if (e.type === 'LINE' && e.x1 !== undefined && e.y1 !== undefined && e.x2 !== undefined && e.y2 !== undefined) {
      def.lines.push({ x1: e.x1 - ox, y1: e.y1 - oy, x2: e.x2 - ox, y2: e.y2 - oy, layerId });
    } else if (e.type === 'CIRCLE' && e.cx !== undefined && e.cy !== undefined && e.r !== undefined) {
      def.circles.push({ cx: e.cx - ox, cy: e.cy - oy, r: e.r, layerId });
    } else if (
      e.type === 'ARC' && e.cx !== undefined && e.cy !== undefined && e.r !== undefined &&
      e.startAngle !== undefined && e.endAngle !== undefined
    ) {
      def.arcs.push({ cx: e.cx - ox, cy: e.cy - oy, r: e.r, a1: e.startAngle, a2: e.endAngle, layerId });
    } else if (e.type === 'LWPOLYLINE' && e.points && e.points.length > 1) {
      const pts = e.points.map((p) => ({ x: p.x - ox, y: p.y - oy, bulge: p.bulge }));
      const segments = e.isClosed ? pts.length : pts.length - 1;
      for (let i = 0; i < segments; i++) {
        const p1 = pts[i]!;
        const p2 = pts[(i + 1) % pts.length]!;
        if (p1.bulge && Math.abs(p1.bulge) > 1e-6) {
          const { cx, cy, r } = bulgeArc(p1, p2, p1.bulge);
          const [from, to] = p1.bulge > 0 ? [p1, p2] : [p2, p1];
          def.arcs.push({ cx, cy, r, a1: deg(cx, cy, from), a2: deg(cx, cy, to), layerId });
        } else {
          def.lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, layerId });
        }
      }
    } else if ((e.type === 'TEXT' || e.type === 'MTEXT') && e.text) {
      const aligned = (e.hAlign ?? 0) !== 0 || (e.vAlign ?? 0) !== 0;
      const x = (aligned && e.x2 !== undefined ? e.x2 : (e.x1 ?? 0)) - ox;
      const y = (aligned && e.y2 !== undefined ? e.y2 : (e.y1 ?? 0)) - oy;
      def.texts!.push({ text: e.text, x, y, height: e.textHeight ?? 0.5, rotation: e.rotation ?? 0, layerId });
    } else if ((e.type === 'HATCH' && e.points && e.points.length >= 3) || (e.type === 'SOLID' && e.x3 !== undefined)) {
      const points =
        e.type === 'HATCH'
          ? e.points!.map((p) => ({ x: p.x - ox, y: p.y - oy }))
          : [
              { x: (e.x1 ?? 0) - ox, y: (e.y1 ?? 0) - oy },
              { x: (e.x2 ?? 0) - ox, y: (e.y2 ?? 0) - oy },
              ...(e.x4 !== undefined ? [{ x: e.x4 - ox, y: (e.y4 ?? 0) - oy }] : []),
              { x: e.x3! - ox, y: (e.y3 ?? 0) - oy },
            ];
      def.fills!.push({ points, color: e.hexColor ?? entityColor(e), layerId, hatchPattern: e.hatchPattern });
    }
  }
  return def;
}

/**
 * A session block definition as the DxfBlock it would have been in a file —
 * the inverse of `blockFromDxf` — so `normalizeDxf` can stretch a block the
 * file INSERTs but does not define. Lines, arcs, circles, texts and fills
 * carry over; a fill's opacity does not (a DXF fill has none).
 */
export function dxfBlockFromDef(def: CadBlockDefinition): DxfBlock {
  const entities: DxfEntity[] = [];
  for (const l of def.lines) entities.push({ type: 'LINE', layer: l.layerId, x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2 });
  for (const c of def.circles) entities.push({ type: 'CIRCLE', layer: c.layerId, cx: c.cx, cy: c.cy, r: c.r });
  for (const a of def.arcs) {
    entities.push({ type: 'ARC', layer: a.layerId, cx: a.cx, cy: a.cy, r: a.r, startAngle: a.a1, endAngle: a.a2 });
  }
  for (const t of def.texts ?? []) {
    entities.push({ type: 'TEXT', layer: t.layerId, text: t.text, x1: t.x, y1: t.y, textHeight: t.height, rotation: t.rotation ?? 0 });
  }
  for (const f of def.fills ?? []) {
    entities.push({
      type: 'HATCH', layer: f.layerId, points: f.points.map((p) => ({ x: p.x, y: p.y })),
      isClosed: true, hatchPattern: f.hatchPattern ?? 'SOLID', hexColor: f.color,
    });
  }
  return { name: def.name, baseX: def.basePoint.x, baseY: def.basePoint.y, entities };
}

/**
 * Loads parsed DXF entities into the Doc instance.
 */
function processEntity(doc: Doc, entity: DxfParseResult['entities'][number]): void {
  const groupId = doc.newGroupId();
  const layerId = entity.layer || '0';

  if (entity.type === 'LINE') {
    if (
      entity.x1 !== undefined &&
      entity.y1 !== undefined &&
      entity.x2 !== undefined &&
      entity.y2 !== undefined
    ) {
      const v1 = doc.addVertex(entity.x1, entity.y1);
      const v2 = doc.addVertex(entity.x2, entity.y2);
      doc.addLineEdge(v1, v2, groupId, layerId);
    }
  } else if (entity.type === 'CIRCLE') {
    if (entity.cx !== undefined && entity.cy !== undefined && entity.r !== undefined) {
      const vRight = doc.addVertex(entity.cx + entity.r, entity.cy);
      const vLeft = doc.addVertex(entity.cx - entity.r, entity.cy);
      doc.addArcEdge(vRight, vLeft, entity.cx, entity.cy, entity.r, groupId, layerId);
      doc.addArcEdge(vLeft, vRight, entity.cx, entity.cy, entity.r, groupId, layerId);
      doc.groupPrimitives.set(groupId, { type: 'circle', cx: entity.cx, cy: entity.cy, r: entity.r });
      doc.groupIntact.add(groupId);
    }
  } else if (entity.type === 'ARC') {
    if (
      entity.cx !== undefined &&
      entity.cy !== undefined &&
      entity.r !== undefined &&
      entity.startAngle !== undefined &&
      entity.endAngle !== undefined
    ) {
      const a1Rad = (entity.startAngle * Math.PI) / 180;
      const a2Rad = (entity.endAngle * Math.PI) / 180;

      const x1 = entity.cx + entity.r * Math.cos(a1Rad);
      const y1 = entity.cy + entity.r * Math.sin(a1Rad);
      const x2 = entity.cx + entity.r * Math.cos(a2Rad);
      const y2 = entity.cy + entity.r * Math.sin(a2Rad);

      const v1 = doc.addVertex(x1, y1);
      const v2 = doc.addVertex(x2, y2);
      doc.addArcEdge(v1, v2, entity.cx, entity.cy, entity.r, groupId, layerId);
    }
  } else if (entity.type === 'LWPOLYLINE' && entity.points && entity.points.length > 1) {
    const pts = entity.points;
    const count = pts.length;
    const segmentCount = entity.isClosed ? count : count - 1;

    for (let i = 0; i < segmentCount; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % count];

      const v1 = doc.addVertex(p1.x, p1.y);
      const v2 = doc.addVertex(p2.x, p2.y);

      if (p1.bulge && Math.abs(p1.bulge) > 1e-6) {
        const { cx, cy, r } = bulgeArc(p1, p2, p1.bulge);

        if (p1.bulge > 0) {
          doc.addArcEdge(v1, v2, cx, cy, r, groupId, layerId);
        } else {
          doc.addArcEdge(v2, v1, cx, cy, r, groupId, layerId);
        }
      } else {
        doc.addLineEdge(v1, v2, groupId, layerId);
      }
    }
  } else if ((entity.type === 'TEXT' || entity.type === 'MTEXT') && entity.text) {
    const hasAlign = (entity.hAlign && entity.hAlign !== 0) || (entity.vAlign && entity.vAlign !== 0);
    const x = hasAlign && entity.x2 !== undefined ? entity.x2 : (entity.x1 ?? 0);
    const y = hasAlign && entity.y2 !== undefined ? entity.y2 : (entity.y1 ?? 0);
    const height = entity.textHeight ?? 0.5;
    const rot = entity.rotation ?? 0;

    let align: 'left' | 'center' | 'right' = 'left';
    if (entity.hAlign === 1 || entity.hAlign === 4) align = 'center';
    else if (entity.hAlign === 2) align = 'right';

    let vAlign: 'top' | 'middle' | 'baseline' | 'bottom' = 'bottom';
    if (entity.vAlign === 3) vAlign = 'top';
    else if (entity.vAlign === 2 || entity.hAlign === 4) vAlign = 'middle';
    else if (entity.vAlign === 1) vAlign = 'bottom';
    else if (entity.vAlign === 0) vAlign = 'baseline';

    doc.addText(entity.text, x, y, height, rot, layerId, entityColor(entity), align, vAlign);
  } else if (
    entity.type === 'SOLID' &&
    entity.x1 !== undefined &&
    entity.x2 !== undefined &&
    entity.x3 !== undefined
  ) {
    const p1 = { x: entity.x1, y: entity.y1 ?? 0 };
    const p2 = { x: entity.x2, y: entity.y2 ?? 0 };
    const p3 = { x: entity.x3, y: entity.y3 ?? 0 };
    const points =
      entity.x4 !== undefined
        ? [p1, p2, { x: entity.x4, y: entity.y4 ?? 0 }, p3]
        : [p1, p2, p3];
    doc.addFill(points, 'solid', layerId, entityColor(entity));
  } else if (entity.type === 'HATCH' && entity.points && entity.points.length >= 3) {
    const solid = !entity.hatchPattern || entity.hatchPattern.toUpperCase() === 'SOLID';
    doc.addFill(
      entity.points.map((p) => ({ x: p.x, y: p.y })),
      solid ? 'solid' : 'hatch',
      layerId,
      entityColor(entity),
    );
  } else if (entity.type === 'INSERT' && entity.blockName) {
    const x = entity.x1 ?? 0;
    const y = entity.y1 ?? 0;
    const scale = entity.scaleX ?? 1;
    const rot = entity.rotation ?? 0;
    doc.addBlockInstance(entity.blockName, x, y, scale, rot, layerId);
  }
}

/**
 * Loads parsed DXF entities into the Doc instance.
 */
export function loadDxfIntoDoc(
  doc: Doc,
  parseResult: DxfParseResult,
  onProgress?: (loaded: number, total: number) => Promise<void> | void,
): Promise<void> | void {
  // The file's own block definitions first, so every INSERT below resolves to
  // the geometry the file carries. A file's definition replaces a same-named
  // one the session already had: the drawing being opened is the authority.
  // Nested INSERTs, DIMENSIONs, ELLIPSEs and SPLINEs become geometry the model holds.
  // A model-space INSERT stretched in one axis of a block only the session
  // knows gets a derived, stretched block from the session's definition.
  const { blocks, entities } = normalizeDxf(parseResult.blocks ?? [], parseResult.entities, (name) => {
    const def = doc.blocks.get(name);
    return def ? dxfBlockFromDef(def) : undefined;
  });
  for (const block of blocks) {
    doc.addBlockDefinition(blockFromDxf(block));
  }

  const total = entities.length;
  if (onProgress) {
    return (async () => {
      for (let i = 0; i < total; i++) {
        processEntity(doc, entities[i]!);
        if (i % 5000 === 0 || i === total - 1) {
          await onProgress(i + 1, total);
        }
      }
    })();
  }

  for (let i = 0; i < total; i++) {
    processEntity(doc, entities[i]!);
  }
}
