// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Units } from '../../core/types';
import { toDisplay } from './docUnits';

/** Tighter formatting for editable fields — `mm` (a drawing length) in `units`, trailing zeros stripped. */
export function formatField(mm: number, units: Units): string {
  const v = toDisplay(mm, units);
  const decimals = units === 'mm' || units === 'cm' ? 2 : 3;
  const s = v.toFixed(decimals);
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}
