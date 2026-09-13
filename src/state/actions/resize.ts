// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function resize(store: EditorStore, width: number, height: number): void {
  if (!store.canvas) return;
  store.canvas.width = width;
  store.canvas.height = height;
  store.view.resize(width, height);
  store.requestDraw();

}
