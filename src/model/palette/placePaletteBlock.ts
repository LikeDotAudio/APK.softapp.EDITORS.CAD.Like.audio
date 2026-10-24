// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point, Units } from '../../core/types';
import type { Doc } from '../Doc';
import { ensurePaletteBlock } from './ensurePaletteBlock';
import type { PaletteItem } from './PaletteItem';

/**
 * Place a product item at true size, centred on `at`. The instance carries
 * `paletteId` as an attribute — the one thing the host needs to know what it
 * is — so it survives copy, paste and mirroring like any other attribute.
 */
export function placePaletteBlock(
  doc: Doc,
  item: PaletteItem,
  units: Units,
  at: Point,
  rotation: number,
  layerId: string,
): number | null {
  const block = ensurePaletteBlock(doc, item, units);
  if (!block) return null;
  return doc.addBlockInstance(block.name, at.x, at.y, block.scale, rotation, layerId, undefined, {
    paletteId: item.id,
  });
}
