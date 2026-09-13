// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function setGridSize(store: EditorStore, size: number): void {
  store.gridSize = size > 0 ? size : 0.1;
  store.requestDraw();
  store.emit();

}
