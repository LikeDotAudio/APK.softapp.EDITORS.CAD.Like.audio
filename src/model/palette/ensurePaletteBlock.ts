// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadBlockDefinition, Units } from '../../core/types';
import type { Doc } from '../Doc';
import { paletteBlockDefinition } from './paletteBlockDefinition';
import type { PaletteItem } from './PaletteItem';

/** Width of a definition's footprint — its first fill, which is the size rectangle. */
function defWidth(def: CadBlockDefinition | undefined): number | null {
  const pts = def?.fills?.[0]?.points;
  if (!pts || pts.length < 2) return null;
  const xs = pts.map((p) => p.x);
  return Math.max(...xs) - Math.min(...xs);
}

/**
 * Make sure the doc holds the block for a product item, and say at what scale
 * an instance of it is true size NOW.
 *
 * Registered once per item, on first placement — inside the caller's edit, so
 * the definition is in the same undo step as the panel that needed it. A
 * definition that already matches the item's size is rewritten (the host may
 * have changed the colour or the name since). One that does not — the units
 * were switched after it was made, and instances already placed lean on it —
 * is left alone and the new instance is scaled to true size instead.
 */
export function ensurePaletteBlock(doc: Doc, item: PaletteItem, units: Units): { name: string; scale: number } | null {
  const def = paletteBlockDefinition(item, units);
  if (!def) return null;
  const want = defWidth(def)!;
  const have = defWidth(doc.blocks.get(def.name));
  if (have === null || Math.abs(have - want) <= want * 1e-9) {
    doc.addBlockDefinition(def);
    return { name: def.name, scale: 1 };
  }
  return { name: def.name, scale: want / have };
}
