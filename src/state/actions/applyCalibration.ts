// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { calibrationFactor } from '../../image/calibration/calibrationFactor';

/** Rescale everything so the two picked points are `distance` units apart. */
export function applyCalibration(store: EditorStore, distance: number): boolean {
  const factor = calibrationFactor(store.calibration, distance);
  if (factor === null) return false;
  store.doc.scaleAll(factor);
  // Keep the drawing the same size on screen while its units change.
  store.view.zoom /= factor;
  if (store.tracing) {
    store.tracing.x *= factor;
    store.tracing.y *= factor;
    store.tracing.worldWidth *= factor;
  }
  store.cancelCalibration();
  store.markDocChanged();
  store.showHint(`Scale set: ${distance} ${store.units} between points.`, 4000);
  return true;

}
