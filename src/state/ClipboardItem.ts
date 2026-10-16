// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';

export interface ClipboardItem {
  type: 'line' | 'arc' | 'text' | 'block';
  p1: Point;
  p2?: Point;
  cx?: number;
  cy?: number;
  r?: number;
  layerId?: string;
  text?: string;
  height?: number;
  rotation?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  vAlign?: 'top' | 'middle' | 'baseline' | 'bottom';
  blockName?: string;
  scale?: number;
  attributes?: Record<string, string>;
}
