// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer } from '../../core/types';
import type { EditorStore } from '../EditorStore';
import { STANDARD_LINETYPES, dxfLineweight } from '@io/exportDxf/dxfLinetypes';

/**
 * What the layer row or the style properties ask of a layer. A key left out
 * is left alone; `linetype` CONTINUOUS (or empty) and `lineweight` null go
 * back to the absent defaults.
 */
export interface LayerStyle {
  linetype?: string;
  lineweight?: number | null;
}

/**
 * Set a layer's linetype and lineweight from the DXF vocabulary the writer
 * already declares: a linetype is one of `STANDARD_LINETYPES` (picking one
 * drops a pattern the layer carried in from a file), or the layer's own
 * file-borne name kept as it is; a lineweight snaps to the nearest DXF step
 * (hundredths of a millimetre). Anything else is refused. Returns whether
 * the layer changed.
 */
export function applyLayerStyle(layer: Layer, style: LayerStyle): boolean {
  const before = JSON.stringify([layer.linetype, layer.linetypePattern, layer.lineweight]);

  if ('linetype' in style) {
    const name = style.linetype?.trim() ?? '';
    const upper = name.toUpperCase();
    if (!name || upper === 'CONTINUOUS') {
      delete layer.linetype;
      delete layer.linetypePattern;
    } else if (STANDARD_LINETYPES.includes(upper)) {
      layer.linetype = upper;
      delete layer.linetypePattern;
    }
    // a name that is neither standard nor the layer's own stays refused
  }

  if ('lineweight' in style) {
    const w = style.lineweight === null ? -3 : dxfLineweight(style.lineweight);
    if (w < 0) delete layer.lineweight;
    else layer.lineweight = w;
  }

  return JSON.stringify([layer.linetype, layer.linetypePattern, layer.lineweight]) !== before;
}

/** Give a layer a linetype and/or lineweight — the canvas redraws it, the next DXF writes it. */
export function setLayerStyle(store: EditorStore, id: string, style: LayerStyle): void {
  const layer = store.layers.get(id);
  if (!layer || !applyLayerStyle(layer, style)) return;
  store.requestDraw();
  store.emit();
}
