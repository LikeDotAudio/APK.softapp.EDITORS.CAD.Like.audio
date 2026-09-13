// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function deleteLayer(store: EditorStore, id: string): void {
  if (store.layers.size <= 1 || !store.layers.has(id)) return;

  store.history.push(store.doc.snapshot());
  store.layers.delete(id);

  const fallbackLayerId = Array.from(store.layers.keys())[0] || '0';
  if (store.activeLayerId === id) {
    store.activeLayerId = fallbackLayerId;
  }

  for (const e of store.doc.edges.values()) {
    if (e.layerId === id) {
      e.layerId = fallbackLayerId;
    }
  }

  store.markDocChanged();
  store.requestDraw();
  store.emit();
  store.showHint(`Deleted layer "${id}".`, 3000);

}
