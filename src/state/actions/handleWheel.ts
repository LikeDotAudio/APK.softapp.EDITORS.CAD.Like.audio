// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function handleWheel(store: EditorStore, e: WheelEvent): void {
  e.preventDefault();
  const screen = store.canvasPoint(e);
  store.view.zoomAt(screen.x, screen.y, e.deltaY < 0 ? 1.12 : 0.89);
  store.updatePointer(e, screen);
  store.requestDraw();
  store.emit();

}
