// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function setSelectionLayer(store: EditorStore, layerId: string): void {
  if (!store.layers.has(layerId) || store.selection.size === 0) return;
  for (const edgeId of store.selection) {
    const e = store.doc.edges.get(edgeId);
    if (e && !e.protected) e.layerId = layerId;
  }
  store.requestDraw();
  store.emit();

}
