// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';

/** World origin, reused so pointer state never allocates a fresh zero point. */
export const ORIGIN: Point = { x: 0, y: 0 };
