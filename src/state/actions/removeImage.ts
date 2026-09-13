// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function removeImage(store: EditorStore): void {
  store.tracing = null;
  store.imageDrag = null;
  if (store.calibration.active) store.cancelCalibration();
  store.requestDraw();
  store.emit();

}
