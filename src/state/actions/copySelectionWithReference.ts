// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

/**
 * AutoCAD-style copy with base point: the next click names the reference point,
 * and paste puts that exact point under the cursor instead of the bbox centre.
 */
export function copySelectionWithReference(store: EditorStore): void {
  if (store.selection.size === 0) {
    store.showHint('Select something first, then Ctrl+Shift+C to copy from a reference point.', 3000);
    return;
  }
  store.pickingBasePoint = true;
  store.setCursor('crosshair');
  store.showHint('Click the reference point to copy from (Esc cancels) — snaps to endpoints and midpoints.', 0);
  store.requestDraw();
  store.emit();

}
