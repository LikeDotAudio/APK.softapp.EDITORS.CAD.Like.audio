// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function zoomToFit(store: EditorStore): void {
  const bounds = store.doc.bounds();
  if (bounds) {
    store.view.zoomToFit(bounds);
    store.requestDraw();
    store.emit();
    store.showHint('Zoomed to fit drawing extent.', 2000);
  }

}
