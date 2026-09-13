// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CalibrationState } from './CalibrationState';

/**
 * The factor to multiply all geometry by so the two picked points end up
 * `realDistance` apart. Returns null when the points are too close to be a
 * usable reference.
 */
export function calibrationFactor(cal: CalibrationState, realDistance: number): number | null {
  if (!cal.p1 || !cal.p2 || !(realDistance > 0)) return null;
  const worldDistance = Math.hypot(cal.p2.x - cal.p1.x, cal.p2.y - cal.p1.y);
  if (worldDistance < 1e-9) return null;
  return realDistance / worldDistance;
}
