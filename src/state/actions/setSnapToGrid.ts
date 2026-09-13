// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function setSnapToGrid(store: EditorStore, enabled: boolean): void {
  store.snapToGrid = enabled;
  store.requestDraw();
  store.emit();

}
