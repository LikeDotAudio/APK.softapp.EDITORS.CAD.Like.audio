// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Units } from '../../core/types';

export const MM_PER_INCH = 25.4;

/** Millimetres in one of each supported unit — the basis for every conversion. */
export const MM_PER_UNIT: Record<Units, number> = {
  mm: 1.0,
  cm: 10.0,
  m: 1000.0,
  in: 25.4,
  ft: 304.8,
};
