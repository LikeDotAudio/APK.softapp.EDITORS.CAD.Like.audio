// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

/** Give a layer a host finish (a palette id), or take it away with null. */
export function setLayerFinish(store: EditorStore, id: string, finish: string | null): void {
  const layer = store.layers.get(id);
  if (!layer) return;
  if (finish) layer.finish = finish;
  else delete layer.finish;
  store.requestDraw();
  store.emit();
}
