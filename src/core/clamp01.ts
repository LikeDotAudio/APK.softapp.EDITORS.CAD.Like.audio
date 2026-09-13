// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { clamp } from './clamp';

/** Constrain `v` to the inclusive range [0, 1]. */
export const clamp01 = (v: number) => clamp(v, 0, 1);
