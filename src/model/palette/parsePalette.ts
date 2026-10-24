// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Palette, PaletteItem } from './PaletteItem';

const str = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const pos = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

/**
 * Read a `palette` message off the wire. It comes from another app's code, so
 * every row is checked and a bad one is dropped rather than failing the lot:
 * one malformed material should not take the whole catalogue with it. A
 * repeated id keeps its first row, because the id is what a placed patch is
 * reported back under and two rows answering to it would be ambiguous.
 */
export function parsePalette(msg: unknown): Palette | null {
  if (!msg || typeof msg !== 'object') return null;
  const { title, items } = msg as { title?: unknown; items?: unknown };
  if (!Array.isArray(items)) return null;

  const seen = new Set<string>();
  const out: PaletteItem[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    if (!str(r.id) || seen.has(r.id)) continue;
    seen.add(r.id);
    const item: PaletteItem = {
      id: r.id,
      name: str(r.name) ? r.name : r.id,
      category: str(r.category) ? r.category : 'Other',
      color: str(r.color) ? r.color : '#888888',
    };
    if (str(r.hatch)) item.hatch = r.hatch.trim().toUpperCase();
    if (Array.isArray(r.size) && r.size.length === 2 && pos(r.size[0]) && pos(r.size[1])) {
      item.size = [r.size[0], r.size[1]];
    }
    if (str(r.note)) item.note = r.note;
    out.push(item);
  }
  return { title: str(title) ? title : 'Palette', items: out };
}
