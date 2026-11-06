// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadSpace, Point } from '../../core/types';
import { signedArea } from '../../io/ifc/quantities';

/**
 * An area in mm² as a person reads it on the sheet: m² for a room (from a
 * tenth of a square metre up), mm² below that — a cupboard, a riser, a cable
 * pit — so a small one is not printed as 0.00 m².
 */
export function formatArea(mm2: number): string {
  const a = Math.abs(mm2);
  if (a >= 1e5) return `${(a / 1e6).toFixed(2)} m²`;
  return `${Math.round(a).toLocaleString('en-US')} mm²`;
}

/** The area-weighted centre of a ring (mm), or its vertex mean when it has no area. */
export function ringCentroid(pts: readonly Point[]): Point {
  const a = signedArea(pts);
  if (Math.abs(a) < 1e-9) {
    const n = Math.max(1, pts.length);
    return { x: pts.reduce((s, p) => s + p.x, 0) / n, y: pts.reduce((s, p) => s + p.y, 0) / n };
  }
  let cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!, q = pts[(i + 1) % pts.length]!;
    const k = p.x * q.y - q.x * p.y;
    cx += (p.x + q.x) * k;
    cy += (p.y + q.y) * k;
  }
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

/**
 * What a declared room says on the canvas: its name, and its floor area on
 * the axes — the same figure the .ifc gives as Qto_SpaceBaseQuantities
 * GrossFloorArea — at its centre.
 */
export function roomLabel(space: Pick<CadSpace, 'key' | 'name' | 'points'>): { name: string; area: string; areaMm2: number; at: Point } {
  const areaMm2 = Math.abs(signedArea(space.points));
  return { name: space.name || space.key, area: formatArea(areaMm2), areaMm2, at: ringCentroid(space.points) };
}
