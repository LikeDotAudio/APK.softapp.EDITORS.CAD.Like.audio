// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../../state/EditorStore';

/**
 * A HOST KEEPS A PIECE OF FURNITURE WHERE IT BELONGS
 *
 * `move { items: [{ id: 'block:<n>', at: [x, y], rotation? }] }` sets where a
 * placed palette product sits — its centre and its turn, degrees CCW. Only
 * blocks that carry a `paletteId` (what `geometry` reports as patches) can be
 * moved; anything else, and an id not on the sheet, is skipped. The acoustic
 * overlay uses it to keep the console in front of the mixer's nose: the
 * console follows the seat, recomputed, so like marks it is not an edit and
 * goes on no undo stack. Returns how many moved.
 */
export function moveHostItems(store: EditorStore, msg: { items?: unknown }): number {
  if (!Array.isArray(msg.items)) return 0;
  const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  let n = 0;
  for (const it of msg.items as { id?: unknown; at?: unknown; rotation?: unknown }[]) {
    const m = typeof it?.id === 'string' ? /^block:(\d+)$/.exec(it.id) : null;
    const inst = m ? store.doc.blockInstances.get(Number(m[1])) : undefined;
    const at = it?.at;
    if (!inst?.attributes?.paletteId || !Array.isArray(at) || at.length !== 2 || !at.every(num)) continue;
    inst.x = at[0];
    inst.y = at[1];
    if (num(it.rotation)) inst.rotation = it.rotation;
    n++;
  }
  if (!n) return 0;
  store.markDocChanged();
  store.requestDraw();
  store.emit();
  return n;
}
