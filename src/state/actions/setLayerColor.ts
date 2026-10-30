// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { hexToAci } from '../../core/dxfColors/hexToAci';

/**
 * Recolour a layer. Its DXF colour index moves with it — the swatch passes its
 * own, anything else takes the nearest — so the next export writes the colour
 * the layer shows, not the one it was opened with.
 */
export function setLayerColor(store: EditorStore, id: string, color: string, aci?: number): void {
  const layer = store.layers.get(id);
  if (!layer) return;
  layer.color = color;
  layer.dxfColorIndex = aci ?? hexToAci(color);
  store.requestDraw();
  store.emit();

}
