// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function handleDoubleClick(store: EditorStore, e: MouseEvent): void {
  if (store.calibration.active) return;
  store.updatePointer(e, store.canvasPoint(e));
  store.tool.onDoubleClick?.(store.toolState, store.input(e), store.api);
  store.requestDraw();
  store.emit();

}
