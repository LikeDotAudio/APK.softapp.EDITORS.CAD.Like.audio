// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function hideAllLayers(store: EditorStore): void {
  for (const layer of store.layers.values()) {
    if (layer.id !== store.activeLayerId) {
      layer.visible = false;
    }
  }
  store.requestDraw();
  store.emit();

}
