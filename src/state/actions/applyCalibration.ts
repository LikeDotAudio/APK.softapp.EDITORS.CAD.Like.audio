// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { calibrationFactor } from '../../image/calibration/calibrationFactor';
import { formatField } from '../../model/units/formatField';

/** Rescale everything so the two picked points are `distance` mm apart (the ScaleBox converts what was typed). */
export function applyCalibration(store: EditorStore, distance: number): boolean {
  const factor = calibrationFactor(store.calibration, distance);
  if (factor === null) return false;
  store.doc.scaleAll(factor);
  // Keep the drawing the same size on screen while it is rescaled.
  store.view.zoom /= factor;
  if (store.tracing) {
    store.tracing.x *= factor;
    store.tracing.y *= factor;
    store.tracing.worldWidth *= factor;
  }
  store.cancelCalibration();
  store.markDocChanged();
  store.showHint(`Scale set: ${formatField(distance, store.units)} ${store.units} between points.`, 4000);
  return true;

}
