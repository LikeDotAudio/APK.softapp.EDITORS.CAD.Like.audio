// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { FillType } from '../../core/types';
import { DEFAULT_PALETTE_HATCH, type PaletteItem } from './PaletteItem';

/** How an item's patch is painted: SOLID is a flat fill, every other name a hatch. */
export function paletteFillStyle(item: PaletteItem): { type: FillType; hatchPattern: string } {
  const hatchPattern = (item.hatch ?? DEFAULT_PALETTE_HATCH).toUpperCase();
  return { type: hatchPattern === 'SOLID' ? 'solid' : 'hatch', hatchPattern };
}
