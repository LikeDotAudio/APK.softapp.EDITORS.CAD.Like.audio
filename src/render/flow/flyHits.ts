// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { PortPortal } from '../../core/types';

/**
 * Where each fly capsule was drawn on the last frame, in canvas px (drawConnectors
 * records them, drawSchematic clears them first) — so a click on one can find it
 * (flyClick.ts) without the hit test redoing the layout of every port.
 */
export interface FlyHit { x1: number; y1: number; x2: number; y2: number; placementId: number; portId: string; far: PortPortal }

const hits: FlyHit[] = [];

export const clearFlyHits = (): void => { hits.length = 0; };
export const recordFlyHit = (hit: FlyHit): void => { hits.push(hit); };

/** The capsule under canvas point (x, y), the last drawn on top first. */
export function flyHitAt(x: number, y: number): FlyHit | null {
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i]!;
    if (x >= h.x1 && x <= h.x2 && y >= h.y1 && y <= h.y2) return h;
  }
  return null;
}
