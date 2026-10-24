// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { metresToUnits } from '../../model/palette/metresToUnits';
import { formatField } from '../../model/units/formatField';
import type { EditorStore } from '../EditorStore';

/** Choose the palette item to paint or place, and switch to the Palette tool. */
export function armPaletteItem(store: EditorStore, id: string | null): void {
  store.paletteItemId = id;
  const item = store.paletteItem();
  if (!item) {
    store.paletteItemId = null;
    if (store.toolId === 'palette') store.setTool('select');
    return;
  }
  if (store.toolId !== 'palette') store.setTool('palette');
  // Re-arming mid-drag drops the half-drawn region; it was for the other material.
  else store.toolState = store.tool.createState();

  const layer = store.layers.get(store.activeLayerId)?.name ?? store.activeLayerId;
  if (item.size) {
    const w = formatField(metresToUnits(item.size[0], store.units), store.units);
    const h = formatField(metresToUnits(item.size[1], store.units), store.units);
    store.showHint(`${item.name} (${w} × ${h} ${store.units}) — click to place on "${layer}" · Esc to stop`, 4000);
  } else {
    store.showHint(`${item.name} — drag a region, or click inside a closed outline, on "${layer}" · Esc to stop`, 4000);
  }
  store.requestDraw();
  store.emit();
}
