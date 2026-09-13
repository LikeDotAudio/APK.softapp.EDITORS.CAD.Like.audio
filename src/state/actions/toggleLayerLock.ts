// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function toggleLayerLock(store: EditorStore, id: string): void {
  const layer = store.layers.get(id);
  if (!layer) return;
  layer.locked = !layer.locked;
  store.requestDraw();
  store.emit();

}
