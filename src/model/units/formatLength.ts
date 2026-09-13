// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Units } from '../../core/types';

/** Status-bar and dimension formatting. */
export function formatLength(v: number, units: Units): string {
  if (units === 'mm' || units === 'cm') return v.toFixed(1);
  return v.toFixed(3);
}
