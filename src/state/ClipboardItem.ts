// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';

export interface ClipboardItem {
  type: 'line' | 'arc';
  p1: Point;
  p2: Point;
  cx?: number;
  cy?: number;
  r?: number;
  layerId?: string;
}
