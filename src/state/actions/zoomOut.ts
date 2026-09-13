// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function zoomOut(store: EditorStore): void {
  const cx = store.view.width ? store.view.width / 2 : 0;
  const cy = store.view.height ? store.view.height / 2 : 0;
  store.view.zoomAt(cx, cy, 0.77);
  store.requestDraw();
  store.emit();

}
