// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { definitionOf } from '../../flow/Schematic';

/** Choose the catalogue symbol the Flow tool places, and switch to that tool. */
export function setFlowDefinition(store: EditorStore, id: string): void {
  const def = definitionOf(store.schematic, id);
  if (!def) return;
  store.flowDefinitionId = id;
  if (store.toolId !== 'flow') store.setTool('flow');
  store.showHint(`Flow symbol: ${def.name} — click the sheet to place it.`, 3000);
  store.requestDraw();
  store.emit();
}
