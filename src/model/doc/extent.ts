// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox, Point } from '../../core/types';
import type { Doc } from '../Doc';

/**
 * Everything on the sheet, not just its strokes: the edges (bounds()), every
 * fill, every text's anchor and every placed block's own line work. What
 * zoom-to-fit frames, so a block or a hatch off to the side of the walls is
 * not left out of the picture. bounds() stays edges-only: the mirror axis and
 * the error banner are about the geometry.
 */
export function extent(doc: Doc): BBox | null {
  let b: BBox | null = doc.bounds();
  const add = (p: Point) => {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    if (!b) b = { x1: p.x, y1: p.y, x2: p.x, y2: p.y };
    else b = { x1: Math.min(b.x1, p.x), y1: Math.min(b.y1, p.y), x2: Math.max(b.x2, p.x), y2: Math.max(b.y2, p.y) };
  };
  for (const f of doc.fills.values()) for (const p of f.points) add(p);
  for (const t of doc.texts.values()) add({ x: t.x, y: t.y });
  for (const inst of doc.blockInstances.values()) {
    const def = doc.blocks.get(inst.blockName);
    if (!def) continue;
    const s = inst.scale ?? 1;
    const rad = ((inst.rotation ?? 0) * Math.PI) / 180;
    const at = (x: number, y: number) => add({ x: inst.x + s * (x * Math.cos(rad) - y * Math.sin(rad)), y: inst.y + s * (x * Math.sin(rad) + y * Math.cos(rad)) });
    at(0, 0);
    for (const l of def.lines) (at(l.x1, l.y1), at(l.x2, l.y2));
    for (const f of def.fills ?? []) for (const p of f.points) at(p.x, p.y);
    for (const t of def.texts ?? []) at(t.x, t.y);
  }
  return b;
}
