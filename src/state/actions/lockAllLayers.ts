// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function lockAllLayers(store: EditorStore): void {
  for (const layer of store.layers.values()) {
    layer.locked = true;
  }
  store.requestDraw();
  store.emit();

}
