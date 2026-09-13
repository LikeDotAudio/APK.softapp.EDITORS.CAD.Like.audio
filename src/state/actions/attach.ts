// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function attach(store: EditorStore, canvas: HTMLCanvasElement): () => void {
  store.canvas = canvas;
  store.ctx = canvas.getContext('2d');
  store.setCursor(store.tool.cursor);

  const onMove = (e: MouseEvent) => store.handlePointerMove(e);
  const onDown = (e: MouseEvent) => store.handlePointerDown(e);
  const onUp = (e: MouseEvent) => store.handlePointerUp(e);
  const onDouble = (e: MouseEvent) => store.handleDoubleClick(e);
  const onWheel = (e: WheelEvent) => store.handleWheel(e);
  const onAux = (e: MouseEvent) => {
    if (e.button === 1) e.preventDefault();
  };
  const onKeyDown = (e: KeyboardEvent) => store.handleKeyDown(e);
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      store.spaceDown = false;
      if (!store.panning) store.setCursor(store.tool.cursor);
    }
  };
  const onBlur = () => {
    store.spaceDown = false;
    store.panning = false;
    store.imageDrag = null;
    store.setCursor(store.tool.cursor);
  };

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('dblclick', onDouble);
  canvas.addEventListener('auxclick', onAux);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  return () => {
    canvas.removeEventListener('mousemove', onMove);
    canvas.removeEventListener('mousedown', onDown);
    canvas.removeEventListener('dblclick', onDouble);
    canvas.removeEventListener('auxclick', onAux);
    canvas.removeEventListener('wheel', onWheel);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    if (store.frameHandle) cancelAnimationFrame(store.frameHandle);
    store.frameHandle = 0;
    store.canvas = null;
    store.ctx = null;
  };

}
