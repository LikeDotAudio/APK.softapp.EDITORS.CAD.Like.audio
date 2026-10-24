// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadBlockDefinition, Units } from '../../core/types';
import { metresToUnits } from './metresToUnits';
import { paletteBlockName } from './paletteBlockName';
import { paletteFillStyle } from './paletteFillStyle';
import type { PaletteItem } from './PaletteItem';

/** Longest label drawn in a product block; past this a name is cut, not shrunk to dust. */
const LABEL_CHARS = 18;

/**
 * The block a product item is placed as: its size rectangle, in DOC units,
 * filled in the item's colour and pattern, with its name in the corner.
 *
 * The base point is the rectangle's CENTRE, not a corner. The Virtual Mirror
 * reflects a block by mirroring its insertion point and negating its rotation
 * — it never flips the geometry — and only a shape symmetric about its base
 * point lands where its reflection should. A corner base would put the
 * mirrored panel one width off the wall it was meant to pair with.
 */
export function paletteBlockDefinition(item: PaletteItem, units: Units): CadBlockDefinition | null {
  if (!item.size) return null;
  const w = metresToUnits(item.size[0], units);
  const h = metresToUnits(item.size[1], units);
  const x0 = -w / 2;
  const y0 = -h / 2;
  const x1 = w / 2;
  const y1 = h / 2;
  const { hatchPattern } = paletteFillStyle(item);

  const label = item.name.length > LABEL_CHARS ? `${item.name.slice(0, LABEL_CHARS - 1)}…` : item.name;
  const pad = Math.min(w, h) * 0.06;
  /* A monospace glyph is ~0.86 of the text height wide in the block renderer;
     fit the label across the width, but never taller than a quarter of the box. */
  const textH = Math.min(h * 0.25, (w - 2 * pad) / (0.86 * Math.max(label.length, 1)));

  return {
    name: paletteBlockName(item.id),
    description: item.note ? `${item.name} — ${item.note}` : item.name,
    basePoint: { x: 0, y: 0 },
    lines: [
      { x1: x0, y1: y0, x2: x1, y2: y0 },
      { x1: x1, y1: y0, x2: x1, y2: y1 },
      { x1: x1, y1: y1, x2: x0, y2: y1 },
      { x1: x0, y1: y1, x2: x0, y2: y0 },
    ],
    arcs: [],
    circles: [],
    texts: textH > 0 ? [{ text: label, x: x0 + pad, y: y0 + pad, height: textH }] : [],
    fills: [
      {
        points: [
          { x: x0, y: y0 },
          { x: x1, y: y0 },
          { x: x1, y: y1 },
          { x: x0, y: y1 },
        ],
        color: item.color,
        opacity: 0.45,
        hatchPattern,
      },
    ],
  };
}
