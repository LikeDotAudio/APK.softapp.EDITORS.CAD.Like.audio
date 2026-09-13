// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { clearSchematic, isSchematicEmpty } from '../../flow/Schematic';
import type { EditorStore } from '../EditorStore';

export function clearAll(store: EditorStore): void {
  if (
    store.doc.isEmpty &&
    isSchematicEmpty(store.schematic) &&
    !store.tool.isDrawing?.(store.toolState)
  ) {
    return;
  }
  store.history.push(store.doc.snapshot());
  store.doc.clear();
  clearSchematic(store.schematic);
  store.selection.clear();
  store.hoverId = null;
  store.toolState = store.tool.createState();
  store.closeDynInput();
  store.markDocChanged();
  store.requestDraw();
  store.emit();
  store.showHint('Cleared canvas.', 2000);

}
