// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';
import type { ArcGeom } from './arcGeom';
import { arcPointAt } from './arcPointAt';

/** Point halfway along the sweep — the arc's snap midpoint. */
export function arcMidpoint(g: ArcGeom): Point {
  return arcPointAt(g, 0.5);
}
