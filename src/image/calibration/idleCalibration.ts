// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CalibrationState } from './CalibrationState';

/** The not-calibrating state. */
export function idleCalibration(): CalibrationState {
  return { active: false, p1: null, p2: null };
}
