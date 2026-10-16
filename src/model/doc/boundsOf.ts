// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox } from '../../core/types';
import type { Doc } from '../Doc';

/** Bounding box of the given element IDs (edges, texts, fills, blocks), or null when none exist. */
export function boundsOf(doc: Doc, ids: Iterable<number>): BBox | null {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  let any = false;

  for (const id of ids) {
    const e = doc.edges.get(id);
    if (e) {
      any = true;
      const b = doc.edgeBBox(e);
      if (b.x1 < x1) x1 = b.x1;
      if (b.y1 < y1) y1 = b.y1;
      if (b.x2 > x2) x2 = b.x2;
      if (b.y2 > y2) y2 = b.y2;
      continue;
    }
    const t = doc.texts.get(id);
    if (t) {
      any = true;
      const w = Math.max(0.5, t.text.length * t.height * 0.6);
      const h = t.height;
      let bx1 = t.x;
      let by1 = t.y - h;
      let bx2 = t.x + w;
      let by2 = t.y;
      if (t.align === 'center') {
        bx1 = t.x - w / 2;
        bx2 = t.x + w / 2;
      } else if (t.align === 'right') {
        bx1 = t.x - w;
        bx2 = t.x;
      }
      if (bx1 < x1) x1 = bx1;
      if (by1 < y1) y1 = by1;
      if (bx2 > x2) x2 = bx2;
      if (by2 > y2) y2 = by2;
      continue;
    }
    const f = doc.fills.get(id);
    if (f) {
      for (const p of f.points) {
        any = true;
        if (p.x < x1) x1 = p.x;
        if (p.y < y1) y1 = p.y;
        if (p.x > x2) x2 = p.x;
        if (p.y > y2) y2 = p.y;
      }
      continue;
    }
    const inst = doc.blockInstances.get(id);
    if (inst) {
      any = true;
      const def = doc.blocks.get(inst.blockName);
      let bw = 2;
      let bh = 2;
      if (def && def.lines.length > 0) {
        let lx1 = Infinity;
        let ly1 = Infinity;
        let lx2 = -Infinity;
        let ly2 = -Infinity;
        for (const l of def.lines) {
          lx1 = Math.min(lx1, l.x1, l.x2);
          ly1 = Math.min(ly1, l.y1, l.y2);
          lx2 = Math.max(lx2, l.x1, l.x2);
          ly2 = Math.max(ly2, l.y1, l.y2);
        }
        bw = (lx2 - lx1) * (inst.scale ?? 1);
        bh = (ly2 - ly1) * (inst.scale ?? 1);
      }
      const hw = Math.max(0.5, bw / 2);
      const hh = Math.max(0.5, bh / 2);
      if (inst.x - hw < x1) x1 = inst.x - hw;
      if (inst.y - hh < y1) y1 = inst.y - hh;
      if (inst.x + hw > x2) x2 = inst.x + hw;
      if (inst.y + hh > y2) y2 = inst.y + hh;
      continue;
    }
  }

  return any ? { x1, y1, x2, y2 } : null;
}
