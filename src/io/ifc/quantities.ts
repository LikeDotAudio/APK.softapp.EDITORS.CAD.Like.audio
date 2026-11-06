// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';

/**
 * WHAT A WALL AND A ROOM MEASURE (ROAD-3581: Qto_WallBaseQuantities,
 * Qto_SpaceBaseQuantities). Lengths in mm, as the drawing; the export turns
 * areas into m² and volumes into m³ (its IfcUnitAssignment says so).
 *
 * A room's outline is drawn on the wall axes, so its Gross figures are the
 * axis polygon; its Net figures are the floor inside the walls — the outline
 * pulled in by half of each bounding wall's thickness.
 */

/** Signed area (positive counter-clockwise, y up). */
export function signedArea(pts: readonly Point[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!, q = pts[(i + 1) % pts.length]!;
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

export function perimeter(pts: readonly Point[]): number {
  let l = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!, q = pts[(i + 1) % pts.length]!;
    l += Math.hypot(q.x - p.x, q.y - p.y);
  }
  return l;
}

/**
 * The polygon with each side i moved inward by `inset[i]` (side i runs from
 * pts[i] to pts[i+1]). Corners are the crossings of neighbouring moved sides;
 * two sides in line keep the corner moved square to them.
 */
export function insetPolygon(ptsIn: readonly Point[], inset: readonly number[]): Point[] {
  const ccw = signedArea(ptsIn) >= 0;
  const n = ptsIn.length;
  const pts = ccw ? [...ptsIn] : [...ptsIn].reverse();
  // the inset of side i, re-indexed when the ring was turned round
  const d = (i: number) => (ccw ? inset[i] ?? 0 : inset[(2 * n - 2 - i) % n] ?? 0);
  const side = (i: number) => {
    const p = pts[i]!, q = pts[(i + 1) % n]!;
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const ux = (q.x - p.x) / len, uy = (q.y - p.y) / len;
    // inward of a counter-clockwise ring is the left: (-uy, ux)
    return { px: p.x - uy * d(i), py: p.y + ux * d(i), ux, uy, nx: -uy, ny: ux };
  };
  const out: Point[] = [];
  for (let i = 0; i < n; i++) {
    const a = side((i - 1 + n) % n), b = side(i);
    const cross = a.ux * b.uy - a.uy * b.ux;
    if (Math.abs(cross) < 1e-12) {
      out.push({ x: b.px, y: b.py });
      continue;
    }
    const t = ((b.px - a.px) * b.uy - (b.py - a.py) * b.ux) / cross;
    out.push({ x: a.px + a.ux * t, y: a.py + a.uy * t });
  }
  return ccw ? out : out.reverse();
}

/** Distance from p to the segment a–b. */
export function toSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** The length of a counter-clockwise arc about (cx, cy) from a to b. */
export function arcLength(cx: number, cy: number, r: number, a: Point, b: Point): number {
  let sweep = Math.atan2(b.y - cy, b.x - cx) - Math.atan2(a.y - cy, a.x - cx);
  while (sweep <= 0) sweep += 2 * Math.PI;
  return r * sweep;
}
