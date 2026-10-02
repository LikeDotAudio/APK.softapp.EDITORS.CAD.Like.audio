// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { clearSchematic } from '../../flow/Schematic';
import { clearBrowserSession } from '../../io/browserStorage/clearBrowserSession';
import type { EditorStore } from '../EditorStore';

/**
 * Close the current active drawing file:
 * - Cancels pending autosave timers
 * - Saves snapshot to undo history if document had contents
 * - Clears document geometry, blocks, texts, fills, and schematic placements
 * - Clears tracing reference images
 * - Resets layers to default '0'
 * - Clears selection and hover states
 * - Resets tool state and closes dynamic input
 * - Resets view / pan to default center
 * - Clears current file name
 * - Purges browser session storage so closed file doesn't auto-restore
 */
export async function closeFile(store: EditorStore): Promise<void> {
  const closedName = store.currentFileName || 'file';

  if (store.autoSaveTimer) {
    clearTimeout(store.autoSaveTimer);
    store.autoSaveTimer = null;
  }

  if (!store.doc.isEmpty) {
    store.history.push(store.doc.snapshot());
  }

  store.doc.clear();
  clearSchematic(store.schematic);
  store.tracing = null;
  store.imageDrag = null;

  store.layers.clear();
  store.layers.set('0', { id: '0', name: '0', color: '#ffffff', dxfColorIndex: 7, visible: true });
  store.activeLayerId = '0';

  store.selection.clear();
  store.hoverId = null;
  store.toolState = store.tool.createState();
  store.closeDynInput();
  store.viewports = [];
  store.activeViewportId = 'ALL';

  store.currentFileName = null;

  if (store.view.width && store.view.height) {
    store.view.panX = store.view.width / 2;
    store.view.panY = store.view.height / 2;
    store.view.zoom = 80;
  }

  await clearBrowserSession();

  store.requestDraw();
  store.emit();
  store.showHint(`Closed ${closedName}. Canvas cleared.`, 3000);
}
