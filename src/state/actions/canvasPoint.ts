// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { Point } from '../../core/types';
import { ORIGIN } from '../origin';

export function canvasPoint(store: EditorStore, e: MouseEvent): Point {
  if (!store.canvas) return ORIGIN;
  const r = store.canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };

}
