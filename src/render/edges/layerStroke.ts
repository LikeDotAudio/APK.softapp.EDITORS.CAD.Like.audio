// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer, Units } from '../../core/types';
import { standardLinetype } from '../../io/exportDxf/dxfLinetypes';

/** How a layer's edges are stroked on screen: a width in px and a canvas dash array. */
export interface LayerStroke {
  width: number;
  dash: number[];
}

/** The on-screen width of an unweighted line, and of DXF's default 0.25 mm. */
export const BASE_STROKE_PX = 1.5;
/** DXF's default lineweight, hundredths of a millimetre. */
const DEFAULT_WEIGHT = 25;
/** A dash pattern repeating in fewer pixels than this reads as a grey smear; draw it solid. */
const MIN_PERIOD_PX = 4;

/**
 * The layer's linetype and lineweight, as the canvas draws them.
 *
 * LINETYPE is in drawing units — the same pattern the DXF writer puts in the
 * LTYPE table (`standardLinetype`, or the layer's own `linetypePattern` for a
 * name read from a file) — so a dash scales with zoom exactly as it does in
 * any CAD package. A dot (length 0) is drawn as a 1 px dash.
 *
 * LINEWEIGHT is a display width, not a world size, as AutoCAD's LWDISPLAY
 * shows it: 0.25 mm and below is the normal 1.5 px line, heavier weights
 * thicken in proportion (0.50 mm is 3 px), capped at 12 px.
 */
export function layerStroke(layer: Layer | undefined, units: Units, zoom: number): LayerStroke {
  const weight = layer?.lineweight;
  const width =
    weight !== undefined && weight > DEFAULT_WEIGHT
      ? Math.min(12, (BASE_STROKE_PX * weight) / DEFAULT_WEIGHT)
      : BASE_STROKE_PX;

  const name = layer?.linetype?.trim();
  if (!name || /^(continuous|by(layer|block))$/i.test(name)) return { width, dash: [] };
  const pattern = standardLinetype(name, units)?.pattern ?? layer?.linetypePattern ?? [];
  if (pattern.length === 0) return { width, dash: [] };

  const dash = pattern.map((v) => Math.max(1, Math.abs(v) * zoom));
  // A pattern of odd length repeats as dash-gap pairs only when doubled.
  const even = dash.length % 2 ? [...dash, ...dash] : dash;
  const period = even.reduce((sum, v) => sum + v, 0);
  return { width, dash: period < MIN_PERIOD_PX ? [] : even };
}
