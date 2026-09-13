// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function deselectLayerEntities(store: EditorStore, id: string): void {
  for (const e of store.doc.edges.values()) {
    if (e.layerId === id) {
      store.selection.delete(e.id);
    }
  }
  store.requestDraw();
  store.emit();

}
