// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { ensurePaletteBlock } from '../../model/palette/ensurePaletteBlock';
import { paletteBlockName } from '../../model/palette/paletteBlockName';
import type { Palette } from '../../model/palette/PaletteItem';
import type { EditorStore } from '../EditorStore';

/**
 * A host sent its palette: it replaces whatever came before, whole. An item
 * that is armed and still in the new catalogue stays armed — a host resending
 * the same list (on its own reload, say) should not knock the user out of
 * what they were doing. One that vanished disarms, and the Palette tool with it.
 *
 * Every PRODUCT in it (an item with a size) is registered as a block at once,
 * so the Block library lists the host's whole catalogue, not only what has
 * been placed — insertable from there like any other block. Not an edit: no
 * undo step, and a definition already there is rewritten only when it still
 * matches (ensurePaletteBlock's rule).
 */
export function setPalette(store: EditorStore, palette: Palette | null): void {
  store.palette = palette;
  let added = false;
  for (const item of palette?.items ?? []) {
    if (!item.size) continue;
    const had = store.doc.blocks.has(paletteBlockName(item.id));
    if (ensurePaletteBlock(store.doc, item, store.units) && !had) added = true;
  }
  if (added) store.markDocChanged();
  if (store.paletteItemId !== null && !store.paletteItem()) {
    store.paletteItemId = null;
    if (store.toolId === 'palette') store.setTool('select');
  }
  store.requestDraw();
  store.emit();
}
