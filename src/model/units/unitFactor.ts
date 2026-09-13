// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Units } from '../../core/types';
import { MM_PER_UNIT } from './mmPerUnit';

/** Multiplier that takes a length in `from` units to `to` units. */
export function unitFactor(from: Units, to: Units): number {
  if (from === to) return 1;
  const fromMM = MM_PER_UNIT[from] ?? 1;
  const toMM = MM_PER_UNIT[to] ?? 1;
  return fromMM / toMM;
}
