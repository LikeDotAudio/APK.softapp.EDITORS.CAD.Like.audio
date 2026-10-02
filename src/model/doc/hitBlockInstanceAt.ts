// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { HIT_PX } from '../../core/constants';
import type { Doc } from '../Doc';

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

/** Nearest block instance within `maxPx` screen pixels at the given zoom, else null. */
export function hitBlockInstanceAt(
  doc: Doc,
  wx: number,
  wy: number,
  zoom: number,
  maxPx = HIT_PX,
): number | null {
  if (!doc.blockInstances || doc.blockInstances.size === 0) return null;

  let best: number | null = null;
  let bestD = maxPx / zoom;

  for (const inst of doc.blockInstances.values()) {
    const def = doc.blocks.get(inst.blockName);
    if (!def) continue;

    const s = inst.scale ?? 1;
    const rot = inst.rotation ?? 0;
    const rad = (-rot * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Transform world point into block local space
    const dx = wx - inst.x;
    const dy = wy - inst.y;
    const lx = (dx * cos - dy * sin) / s;
    const ly = (dx * sin + dy * cos) / s;

    // Check lines
    for (const l of def.lines) {
      const d = distToSegment(lx, ly, l.x1, l.y1, l.x2, l.y2) * s;
      if (d < bestD) {
        bestD = d;
        best = inst.id;
      }
    }

    // Check circles
    for (const c of def.circles) {
      const dCenter = Math.hypot(lx - c.cx, ly - c.cy);
      const d = Math.abs(dCenter - c.r) * s;
      if (d < bestD) {
        bestD = d;
        best = inst.id;
      }
    }

    // Check insertion point origin
    const dOrigin = Math.hypot(dx, dy);
    if (dOrigin < bestD) {
      bestD = dOrigin;
      best = inst.id;
    }
  }

  return best;
}
