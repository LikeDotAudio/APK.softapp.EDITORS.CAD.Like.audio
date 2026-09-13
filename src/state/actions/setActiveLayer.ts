// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function setActiveLayer(store: EditorStore, id: string): void {
  if (store.layers.has(id)) {
    store.activeLayerId = id;
    store.emit();
  }

}
