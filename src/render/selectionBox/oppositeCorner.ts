// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox, Point } from '../../core/types';
import { cornerPoints } from './cornerPoints';

/** The corner diagonally across the box — the anchor a corner drag scales about. */
export function oppositeCorner(b: BBox, index: number): Point {
  return cornerPoints(b)[(index + 2) % 4];
}
