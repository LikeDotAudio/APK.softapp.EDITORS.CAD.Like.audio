// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function startCalibration(store: EditorStore): void {
  store.calibration = { active: true, p1: null, p2: null };
  store.calibrationBox = null;
  store.setCursor('crosshair');
  store.showHint('Click the first point on the image for scale calibration.', 0);
  store.requestDraw();
  store.emit();

}
