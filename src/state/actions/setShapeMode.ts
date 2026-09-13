// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function setShapeMode(store: EditorStore, enabled: boolean): void {
  store.shapeMode = enabled;
  store.requestDraw();
  store.emit();

}
