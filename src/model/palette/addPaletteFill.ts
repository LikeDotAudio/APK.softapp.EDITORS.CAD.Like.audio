// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';
import type { Doc } from '../Doc';
import { paletteFillStyle } from './paletteFillStyle';
import type { PaletteItem } from './PaletteItem';

/** Paint a finish item over a closed boundary. Returns the new fill's id. */
export function addPaletteFill(doc: Doc, item: PaletteItem, points: Point[], layerId: string): number | null {
  if (points.length < 3) return null;
  const { type, hatchPattern } = paletteFillStyle(item);
  const id = doc.addFill(
    points.map((p) => ({ x: p.x, y: p.y })),
    type,
    layerId,
    item.color,
    0.45,
  );
  const fill = doc.fills.get(id)!;
  fill.hatchPattern = hatchPattern;
  fill.paletteId = item.id;
  return id;
}
