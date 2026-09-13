// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function handlePointerUp(store: EditorStore, e: MouseEvent): void {
  if (store.imageDrag) {
    store.imageDrag = null;
    store.setCursor(store.tool.cursor);
    store.emit();
  }
  if (store.panning) {
    store.panning = false;
    store.setCursor(store.tool.cursor);
  }
  store.tool.onPointerUp?.(store.toolState, store.input(e), store.api);
  store.requestDraw();
  store.emit();

}
