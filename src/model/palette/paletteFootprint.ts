// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadBlockInstance, Point } from '../../core/types';
import type { Doc } from '../Doc';

/**
 * Where a placed palette block sits on the sheet: its definition's size
 * rectangle (the first fill) carried through the instance's scale, rotation
 * and position — the same transform the renderer draws it with.
 */
export function paletteFootprint(doc: Doc, inst: CadBlockInstance): Point[] | null {
  const pts = doc.blocks.get(inst.blockName)?.fills?.[0]?.points;
  if (!pts || pts.length < 3) return null;
  const s = inst.scale ?? 1;
  const rad = ((inst.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return pts.map((p) => ({
    x: inst.x + s * (p.x * cos - p.y * sin),
    y: inst.y + s * (p.x * sin + p.y * cos),
  }));
}
