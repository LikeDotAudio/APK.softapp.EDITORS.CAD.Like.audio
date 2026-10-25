// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadViewport } from '../../core/types';
import type { EditorStore } from '../../state/EditorStore';

/**
 * A HOST NAMES ITS DRAWINGS AS MODEL SPACES
 *
 * `spaces { items: [{ id, name, subtitle?, bounds: [x1, y1, x2, y2] }] }` in
 * drawing units: the drawings a host keeps on the sheet (the acoustic
 * overlay's plan, each wall's elevation, its blow-up, cut-aways and
 * construction sections) as tabs beside ALL, in front of the sheets found in
 * the drawing. Opening one frames it at the scale they share — the one that
 * fits the largest — so they read as one set of drawings at one scale. A bad
 * row is dropped; an empty list takes them away. Returns how many it kept.
 */
export function parseHostSpaces(msg: { items?: unknown }): CadViewport[] {
  if (!Array.isArray(msg.items)) return [];
  const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  const seen = new Set<string>();
  const out: CadViewport[] = [];
  for (const it of msg.items as { id?: unknown; name?: unknown; subtitle?: unknown; bounds?: unknown }[]) {
    const b = it?.bounds;
    if (typeof it?.id !== 'string' || !it.id || seen.has(it.id) || typeof it.name !== 'string' || !Array.isArray(b) || b.length !== 4 || !b.every(num)) continue;
    const [x1, y1, x2, y2] = b as number[];
    if (!(x2 > x1 && y2 > y1)) continue;
    seen.add(it.id);
    out.push({ id: it.id, name: it.name, ...(typeof it.subtitle === 'string' && it.subtitle ? { subtitle: it.subtitle } : {}), bounds: { x1, y1, x2, y2 } });
  }
  return out;
}

export function applyHostSpaces(store: EditorStore, msg: { items?: unknown }): number {
  const spaces = parseHostSpaces(msg);
  store.setHostSpaces(spaces);
  return spaces.length;
}
