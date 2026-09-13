// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { isOverImage } from '../../image/isOverImage';

export function handlePointerDown(store: EditorStore, e: MouseEvent): void {
  const screen = store.canvasPoint(e);

  if (e.button === 1 || store.spaceDown) {
    if (e.button === 1) e.preventDefault();
    store.panning = true;
    store.panStart = screen;
    store.panOrigin = { x: store.view.panX, y: store.view.panY };
    store.setCursor('grabbing');
    return;
  }
  if (e.button !== 0) return;

  store.updatePointer(e, screen);

  if (store.pickingBasePoint) {
    store.finishBasePointPick();
    return;
  }

  if (store.calibration.active) {
    store.handleCalibrationClick(screen);
    return;
  }

  if (
    store.tool.id === 'select' &&
    store.tracing?.visible &&
    isOverImage(store.view, store.tracing, screen.x, screen.y)
  ) {
    store.imageDrag = { startScreen: screen, startPos: { x: store.tracing.x, y: store.tracing.y } };
    return;
  }

  store.tool.onPointerDown?.(store.toolState, store.input(e), store.api);
  store.requestDraw();
  store.emit();

}
