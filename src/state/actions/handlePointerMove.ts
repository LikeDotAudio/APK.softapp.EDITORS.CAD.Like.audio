// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { isOverImage } from '../../image/isOverImage';

export function handlePointerMove(store: EditorStore, e: MouseEvent): void {
  const screen = store.canvasPoint(e);

  if (store.panning) {
    store.view.panX = store.panOrigin.x + (screen.x - store.panStart.x);
    store.view.panY = store.panOrigin.y + (screen.y - store.panStart.y);
    store.requestDraw();
    return;
  }

  if (store.imageDrag && store.tracing) {
    store.tracing.x =
      store.imageDrag.startPos.x + (screen.x - store.imageDrag.startScreen.x) / store.view.zoom;
    store.tracing.y =
      store.imageDrag.startPos.y - (screen.y - store.imageDrag.startScreen.y) / store.view.zoom;
    store.requestDraw();
    return;
  }

  store.updatePointer(e, screen);

  if (!store.calibration.active) {
    store.tool.onPointerMove?.(store.toolState, store.input(e), store.api);
    if (
      store.tool.id === 'select' &&
      store.tracing?.visible &&
      isOverImage(store.view, store.tracing, screen.x, screen.y)
    ) {
      store.setCursor('move');
    }
  }

  store.requestDraw();
  store.emit();

}
