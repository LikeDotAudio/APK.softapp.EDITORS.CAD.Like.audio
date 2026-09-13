// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { Point } from '../../core/types';

export function handleCalibrationClick(store: EditorStore, screen: Point): void {
  const world = store.view.toWorld(screen.x, screen.y);
  if (!store.calibration.p1) {
    store.calibration.p1 = world;
    store.showHint('Now click the second point.', 0);
  } else if (!store.calibration.p2) {
    store.calibration.p2 = world;
    const first = store.view.toScreen(store.calibration.p1.x, store.calibration.p1.y);
    store.calibrationBox = { x: (first.x + screen.x) / 2, y: (first.y + screen.y) / 2 };
    store.hintVisible = false;
  }
  store.requestDraw();
  store.emit();

}
