// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { SHORTCUTS } from '../../tools/registry';

export function handleKeyDown(store: EditorStore, e: KeyboardEvent): void {
  const target = e.target as HTMLElement | null;
  const inField = !!target?.closest?.('input, select, textarea');

  if (e.code === 'Space' && !inField) store.spaceDown = true;

  if (e.key === 'Escape') {
    if (store.pickingBasePoint) {
      store.cancelBasePointPick();
      store.emit();
      return;
    }

    if (store.calibration.active) {
      store.cancelCalibration();
      return;
    }

    const isDrawing = store.tool.isDrawing?.(store.toolState);
    store.tool.onEscape?.(store.toolState, store.api);
    store.closeDynInput();

    // If the tool wasn't mid-drawing or if it's already idle, switch back to the Select tool ('select')
    if (!isDrawing && store.toolId !== 'select') {
      store.setTool('select');
    } else {
      store.requestDraw();
      store.emit();
    }
    return;
  }

  if (inField) return;

  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (store.tool.onDelete) {
      e.preventDefault();
      store.tool.onDelete(store.toolState, store.api);
    }
    return;
  }

  if (e.ctrlKey || e.metaKey) {
    const key = e.key.toLowerCase();
    if (key === 'a') {
      e.preventDefault();
      store.selectAll();
    } else if (key === 'z') {
      e.preventDefault();
      store.undo();
    } else if (key === 'c') {
      e.preventDefault();
      if (e.shiftKey) {
        store.copySelectionWithReference();
      } else {
        store.copySelection();
      }
    } else if (key === 'x') {
      e.preventDefault();
      store.cutSelection();
    } else if (key === 'v') {
      e.preventDefault();
      store.pasteClipboard();
    }
    return;
  }

  const toolId = SHORTCUTS[e.key.toLowerCase()];
  if (toolId) store.setTool(toolId);

}
