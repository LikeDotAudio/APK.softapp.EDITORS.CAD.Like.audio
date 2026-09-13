// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { idleCalibration } from '../../image/calibration/idleCalibration';

export function cancelCalibration(store: EditorStore): void {
  store.calibration = idleCalibration();
  store.calibrationBox = null;
  store.setCursor(store.tool.cursor);
  store.hintVisible = false;
  store.requestDraw();
  store.emit();

}
