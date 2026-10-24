// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Units } from '../../core/types';
import { unitFactor } from '../units/unitFactor';

/** A host's metres in the drawing's own units — the palette speaks SI, the sheet may not. */
export function metresToUnits(metres: number, units: Units): number {
  return metres * unitFactor('m', units);
}
