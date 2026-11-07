// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { BIM_DRAG_MIME, bimPartOfDrop, occurrenceOfDrop, placeBimPart } from './dropBimPart';
import { offerBimDropToHost } from '../../shell/hostBridge/hostBridge';
import { currentSheet } from '../../shell/bimProjects';

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

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer && [...(e.dataTransfer.types ?? [])].includes(BIM_DRAG_MIME)) e.dataTransfer.dropEffect = 'copy';
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    // a part dragged in from the BIM library: placed where it was let go (dropBimPart.ts)
    const data = e.dataTransfer?.getData(BIM_DRAG_MIME);
    const part = bimPartOfDrop(data);
    if (part) {
      const r = canvas.getBoundingClientRect();
      const w = store.view.toWorld(e.clientX - r.left, e.clientY - r.top);
      // a project's instance (📦 palette, ROAD-3577) is placed here, as that occurrence, on this sheet
      const occurrence = occurrenceOfDrop(data);
      // a host that takes library drops (hello { bimDrops }) places a bare part itself, with its ref (ROAD-3595)
      const { ref, ...bim } = part;
      if (!occurrence && ref?.part && offerBimDropToHost({ bim, ref: { ...ref, part: ref.part } }, w)) return;
      placeBimPart(store, part, { x: w.x, y: w.y }, occurrence && { ...occurrence, sheet: currentSheet(store) });
      return;
    }
    const file = e.dataTransfer?.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.dxf')) {
      void file.text().then((text) => {
        void store.loadDxfText(text, file.name);
      });
    }
  };

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('dblclick', onDouble);
  canvas.addEventListener('auxclick', onAux);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('dragover', onDragOver);
  canvas.addEventListener('drop', onDrop);
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
    canvas.removeEventListener('dragover', onDragOver);
    canvas.removeEventListener('drop', onDrop);
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
