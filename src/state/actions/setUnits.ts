// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { Units } from '../../core/types';
import { convertGridSize } from '../../model/units/convertGridSize';
import { unitFactor } from '../../model/units/unitFactor';

export function setUnits(store: EditorStore, units: Units): void {
  if (units === store.units) return;
  const f = unitFactor(store.units, units);
  store.doc.scaleAll(f);
  store.view.scaleBy(f);
  store.tool.scaleState?.(store.toolState, f);
  if (store.tracing) {
    store.tracing.x *= f;
    store.tracing.y *= f;
    store.tracing.worldWidth *= f;
  }
  if (store.calibration.p1) {
    store.calibration.p1 = { x: store.calibration.p1.x * f, y: store.calibration.p1.y * f };
  }
  if (store.calibration.p2) {
    store.calibration.p2 = { x: store.calibration.p2.x * f, y: store.calibration.p2.y * f };
  }
  store.gridSize = convertGridSize(store.gridSize, units);
  store.units = units;
  store.dynCursor = { x: store.dynCursor.x * f, y: store.dynCursor.y * f };
  store.markDocChanged();
  store.requestDraw();
  store.emit();

}
