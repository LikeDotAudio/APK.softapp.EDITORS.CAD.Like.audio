// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Palette } from '../../model/palette/PaletteItem';
import type { EditorStore } from '../EditorStore';

/**
 * A host sent its palette: it replaces whatever came before, whole. An item
 * that is armed and still in the new catalogue stays armed — a host resending
 * the same list (on its own reload, say) should not knock the user out of
 * what they were doing. One that vanished disarms, and the Palette tool with it.
 */
export function setPalette(store: EditorStore, palette: Palette | null): void {
  store.palette = palette;
  if (store.paletteItemId !== null && !store.paletteItem()) {
    store.paletteItemId = null;
    if (store.toolId === 'palette') store.setTool('select');
  }
  store.requestDraw();
  store.emit();
}
