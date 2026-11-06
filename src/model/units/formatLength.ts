// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Units } from '../../core/types';
import { toDisplay } from './docUnits';

/** Status-bar and dimension formatting: `mm` (a drawing length) shown in `units`. */
export function formatLength(mm: number, units: Units): string {
  const v = toDisplay(mm, units);
  if (units === 'mm' || units === 'cm') return v.toFixed(1);
  return v.toFixed(3);
}
