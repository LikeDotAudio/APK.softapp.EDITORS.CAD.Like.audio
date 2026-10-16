// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function renameLayer(store: EditorStore, id: string, newName: string): void {
  const clean = newName.trim();
  if (!clean || clean === id || store.layers.has(clean)) return;
  const layer = store.layers.get(id);
  if (!layer) return;

  store.layers.delete(id);
  layer.id = clean;
  layer.name = clean;
  store.layers.set(clean, layer);

  if (store.activeLayerId === id) {
    store.activeLayerId = clean;
  }

  // Update layerId on all entities referencing old layer id
  for (const e of store.doc.edges.values()) {
    if (e.layerId === id) e.layerId = clean;
  }
  for (const t of store.doc.texts.values()) {
    if (t.layerId === id) t.layerId = clean;
  }
  for (const f of store.doc.fills.values()) {
    if (f.layerId === id) f.layerId = clean;
  }
  for (const bi of store.doc.blockInstances.values()) {
    if (bi.layerId === id) bi.layerId = clean;
  }

  store.requestDraw();
  store.emit();

}
