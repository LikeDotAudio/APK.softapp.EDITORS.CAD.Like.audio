// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import type { BlockPlacement, SchematicModel } from '../core/types';
import { definitionFor } from './Schematic';

export interface LayoutOptions {
  columnPitch?: number;
  rowPitch?: number;
  originX?: number;
  originY?: number;
}

export const DEFAULT_COLUMN_PITCH = 3.2;
export const DEFAULT_ROW_PITCH = 2.2;

/**
 * ⚡ AUTO-PLACEMENT PIPELINE (ported from OneThing SCHEMATIC.placement-auto)
 *
 * Automatically places and aligns schematic blocks:
 *  1. Identifies signal hierarchy: Source -> Process / Mixed -> Sink
 *  2. Arranges components into left-to-right processing columns
 *  3. Applies barycentric Y-sorting to minimize wire crossings
 *  4. Snaps positions cleanly to a uniform layout grid
 */
export function autoLayoutSchematic(
  model: SchematicModel,
  options: LayoutOptions = {},
): boolean {
  if (model.placements.length === 0) return false;

  const colPitch = options.columnPitch ?? DEFAULT_COLUMN_PITCH;
  const rowPitch = options.rowPitch ?? DEFAULT_ROW_PITCH;
  const originX = options.originX ?? 0;
  const originY = options.originY ?? 0;

  // Build adjacency graph of connections
  const incoming = new Map<number, number[]>();
  const outgoing = new Map<number, number[]>();

  for (const p of model.placements) {
    incoming.set(p.id, []);
    outgoing.set(p.id, []);
  }

  for (const conn of model.connectors) {
    const src = conn.from.placementId;
    const dst = conn.to.placementId;
    if (outgoing.has(src)) outgoing.get(src)!.push(dst);
    if (incoming.has(dst)) incoming.get(dst)!.push(src);
  }

  // 1. Column Assignment (Longest path layering from sources)
  const columns = new Map<number, number>();

  // Determine root sources (no inputs or definition has only outputs)
  const sources: number[] = [];
  for (const p of model.placements) {
    const inc = incoming.get(p.id) ?? [];
    const def = definitionFor(model, p);
    const hasInputs = def?.ports.some((port) => port.side === 'input');
    if (inc.length === 0 || !hasInputs) {
      sources.push(p.id);
      columns.set(p.id, 0);
    }
  }

  if (sources.length === 0 && model.placements.length > 0) {
    // If cyclic or no clear source, pick first placement as column 0
    sources.push(model.placements[0].id);
    columns.set(model.placements[0].id, 0);
  }

  // Forward BFS / topological column distribution
  const queue = [...sources];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currCol = columns.get(curr)!;
    const outs = outgoing.get(curr) ?? [];
    for (const next of outs) {
      const existing = columns.get(next);
      const needed = currCol + 1;
      if (existing === undefined || existing < needed) {
        columns.set(next, needed);
        queue.push(next);
      }
    }
  }

  // Assign any orphaned nodes to column 0
  for (const p of model.placements) {
    if (!columns.has(p.id)) {
      columns.set(p.id, 0);
    }
  }

  // Bucket placements by column
  const colBuckets = new Map<number, BlockPlacement[]>();
  for (const p of model.placements) {
    const col = columns.get(p.id)!;
    if (!colBuckets.has(col)) colBuckets.set(col, []);
    colBuckets.get(col)!.push(p);
  }

  const sortedColIndices = Array.from(colBuckets.keys()).sort((a, b) => a - b);

  // 2. Barycentric sorting within columns to minimize wire crossings
  const yPositions = new Map<number, number>();

  // Initialize column 0 with sequential Y spacing centered around origin
  const col0 = colBuckets.get(sortedColIndices[0]) ?? [];
  const startY0 = originY - ((col0.length - 1) * rowPitch) / 2;
  col0.forEach((p, idx) => {
    yPositions.set(p.id, startY0 + idx * rowPitch);
  });

  // Sweep forward across subsequent columns
  for (let c = 1; c < sortedColIndices.length; c++) {
    const colIdx = sortedColIndices[c];
    const bucket = colBuckets.get(colIdx) ?? [];

    // Calculate barycenter (average Y of incoming connected predecessors)
    const barycenters = bucket.map((p) => {
      const preds = incoming.get(p.id) ?? [];
      const predYs = preds.map((id) => yPositions.get(id)).filter((y): y is number => y !== undefined);
      const avgY = predYs.length > 0 ? predYs.reduce((a, b) => a + b, 0) / predYs.length : 0;
      return { placement: p, avgY };
    });

    // Sort column elements by their barycentric average
    barycenters.sort((a, b) => a.avgY - b.avgY);

    // Position sorted elements vertically
    const startY = originY - ((bucket.length - 1) * rowPitch) / 2;
    barycenters.forEach((item, idx) => {
      yPositions.set(item.placement.id, startY + idx * rowPitch);
    });
  }

  // 3. Write calculated coordinates directly into placement models
  for (const colIdx of sortedColIndices) {
    const bucket = colBuckets.get(colIdx) ?? [];
    const posX = originX + colIdx * colPitch;
    for (const p of bucket) {
      p.at.x = posX;
      p.at.y = yPositions.get(p.id) ?? originY;
    }
  }

  return true;
}
