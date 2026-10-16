// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function setSelectionLayer(store: EditorStore, layerId: string): void {
  if (!store.layers.has(layerId) || store.selection.size === 0) return;
  for (const id of store.selection) {
    const e = store.doc.edges.get(id);
    if (e && !e.protected) e.layerId = layerId;
    const t = store.doc.texts.get(id);
    if (t && !t.protected) t.layerId = layerId;
    const f = store.doc.fills.get(id);
    if (f && !f.protected) f.layerId = layerId;
    const b = store.doc.blockInstances.get(id);
    if (b && !b.protected) b.layerId = layerId;
  }
  store.requestDraw();
  store.emit();

}
