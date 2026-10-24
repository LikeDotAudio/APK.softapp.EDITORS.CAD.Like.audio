// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import type { Point } from '../../core/types';

export interface ReflectResult {
  edgeIds: number[];
  textIds: number[];
  blockIds: number[];
  fillIds: number[];
}

/**
 * Ids sorted by kind. Edges, texts, blocks and fills each count from 1, so a
 * bare id set means "this id in every table" — right for a user's selection
 * (which is built that way), wrong for "what an edit just added", where new
 * block 3 must not drag old edge 3 across the axis with it.
 */
export interface MirrorTargets {
  edges: Iterable<number>;
  texts: Iterable<number>;
  blocks: Iterable<number>;
  fills: Iterable<number>;
}

function isTargets(v: Iterable<number> | MirrorTargets): v is MirrorTargets {
  return !(Symbol.iterator in v);
}

/**
 * Duplicates selected entities (or all entities if selection is empty)
 * and reflects them horizontally across the vertical mirror axis at x = mirrorX.
 */
export function reflectAcrossMirror(
  doc: Doc,
  selectedIds: Iterable<number> | MirrorTargets,
  mirrorX: number,
): ReflectResult {
  const typed = isTargets(selectedIds) ? selectedIds : null;
  const selSet = new Set(typed ? [] : (selectedIds as Iterable<number>));
  const edgeSet = typed ? new Set(typed.edges) : selSet;
  const textSet = typed ? new Set(typed.texts) : selSet;
  const blockSet = typed ? new Set(typed.blocks) : selSet;
  const fillSet = typed ? new Set(typed.fills) : selSet;
  const reflectAll = typed
    ? edgeSet.size + textSet.size + blockSet.size + fillSet.size === 0
    : selSet.size === 0;

  const result: ReflectResult = {
    edgeIds: [],
    textIds: [],
    blockIds: [],
    fillIds: [],
  };

  // 1. Reflect Edges
  const edgesToReflect = Array.from(doc.edges.values()).filter(
    (e) => reflectAll || edgeSet.has(e.id),
  );

  for (const e of edgesToReflect) {
    const [v1, v2] = doc.endpointsOf(e);
    const p1: Point = { x: 2 * mirrorX - v1.x, y: v1.y };
    const p2: Point = { x: 2 * mirrorX - v2.x, y: v2.y };

    if (e.type === 'line') {
      const newId = doc.addLine(p1, p2, e.groupId, e.layerId);
      if (newId !== null) result.edgeIds.push(newId);
    } else if (e.type === 'arc') {
      const newCx = 2 * mirrorX - e.cx;
      const newCy = e.cy;
      // Invert arc direction: swap endpoints from p1/p2 to p2/p1 for CCW arc
      const newId = doc.addArc(newCx, newCy, e.r, p2, p1, e.groupId, e.layerId);
      if (newId !== null) result.edgeIds.push(newId);
    }
  }

  // 2. Reflect Texts
  const textsToReflect = Array.from(doc.texts.values()).filter(
    (t) => reflectAll || textSet.has(t.id),
  );
  for (const t of textsToReflect) {
    const newX = 2 * mirrorX - t.x;
    const newId = doc.addText(
      t.text,
      newX,
      t.y,
      t.height,
      t.rotation ? -t.rotation : 0,
      t.layerId,
      t.color,
      t.align,
      t.vAlign,
    );
    result.textIds.push(newId);
  }

  // 3. Reflect Blocks
  const blocksToReflect = Array.from(doc.blockInstances.values()).filter(
    (b) => reflectAll || blockSet.has(b.id),
  );
  for (const b of blocksToReflect) {
    const newX = 2 * mirrorX - b.x;
    const newId = doc.addBlockInstance(
      b.blockName,
      newX,
      b.y,
      b.scale,
      b.rotation ? -b.rotation : 0,
      b.layerId,
      undefined,
      b.attributes ? { ...b.attributes } : undefined,
    );
    result.blockIds.push(newId);
  }

  // 4. Reflect Fills
  const fillsToReflect = Array.from(doc.fills.values()).filter(
    (f) => reflectAll || fillSet.has(f.id),
  );
  for (const f of fillsToReflect) {
    const newPts = f.points.map((pt) => ({
      x: 2 * mirrorX - pt.x,
      y: pt.y,
    }));
    const newId = doc.addFill(newPts, f.type, f.layerId, f.color, f.opacity);
    // The reflection is the same material as the original: keep its pattern and palette tag.
    const copy = doc.fills.get(newId)!;
    if (f.hatchPattern !== undefined) copy.hatchPattern = f.hatchPattern;
    if (f.paletteId !== undefined) copy.paletteId = f.paletteId;
    result.fillIds.push(newId);
  }

  doc.rebuildVertexGrid();
  doc.resolveAllIntersections();
  return result;
}
