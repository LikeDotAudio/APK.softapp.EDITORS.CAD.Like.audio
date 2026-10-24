// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadBlockDefinition, Point } from '../../core/types';
import type { Doc } from '../../model/Doc';
import { addPaletteFill } from '../../model/palette/addPaletteFill';
import type { EditorStore } from '../../state/EditorStore';

/**
 * WHAT A HOST DRAWS ON THE SHEET, AND KEEPS CURRENT
 *
 * Some of a softapp's picture belongs in the drawing itself, not just over it:
 * the acoustic overlay labels each wall's elevation, places absorber panels at
 * the first-reflection points of the speakers it was given, and draws the room
 * in three cut-away views beside the walls. The user did not draw these, the
 * host computes them, and they move when what they were computed from moves.
 *
 * `marks { key, hash, items }` replaces EVERYTHING drawn under `key` with
 * `items`, in drawing units:
 *
 *   { kind: 'fill', layer, points, paletteId?, color?, opacity? }
 *        a region; with a paletteId it is painted like a palette finish and
 *        comes back on `geometry` as a patch, so the host's panels count.
 *   { kind: 'text', layer, at: [x, y], text, height, color?, align?, vAlign? }
 *   { kind: 'drawing', layer, name, at: [x, y], lines, texts?, fills? }
 *        line work that must not become walls — `lines` [[x1, y1, x2, y2,
 *        layer?]] — kept as a block (`HOST:<key>:<name>`) so it never joins
 *        the edge graph that rooms are read from. A line's own layer colours it.
 *        Its `fills` [{ points, color?, opacity?, layer? }] go in the same
 *        block: a set the host drew together is one thing on the sheet, and
 *        selecting or moving it takes everything in it. (A fill that must
 *        count as a treatment stays a top-level `fill`: only those come back.)
 *        Its `attributes` { name: value } (strings) go on the block instance,
 *        as the properties panel shows them: what the drawing is OF — a
 *        speaker, a listener — so it can be told on the sheet.
 *
 * Each thing drawn carries `hostKey` and `hostHash`. A `marks` whose hash is
 * already on the sheet is ignored, so a host can resend freely; `geometry`
 * reports the hash on the sheet for each key (`marks`), so after an undo took
 * them back to an older set the host sees the mismatch and sends again. None
 * of this goes on the undo stack: it is the host's, recomputed, not an edit.
 * Layers named that do not exist are made, with `layerColor` when given.
 */

type XY = [number, number];

interface FillMark {
  kind: 'fill';
  layer: string;
  points: XY[];
  paletteId?: string;
  color?: string;
  opacity?: number;
}
interface TextMark {
  kind: 'text';
  layer: string;
  at: XY;
  text: string;
  height: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  vAlign?: 'top' | 'middle' | 'baseline' | 'bottom';
}
interface DrawingMark {
  kind: 'drawing';
  layer: string;
  name: string;
  at: XY;
  lines: [number, number, number, number, string?][];
  texts?: { text: string; x: number; y: number; height: number }[];
  fills?: { points: XY[]; color?: string; opacity?: number; layer?: string }[];
  attributes?: Record<string, string>;
}
type Mark = (FillMark | TextMark | DrawingMark) & { layerColor?: string };

const num = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const xy = (p: unknown): p is XY => Array.isArray(p) && p.length === 2 && num(p[0]) && num(p[1]);
const blockPrefix = (key: string) => `HOST:${key}:`;

/** The hash of what is on the sheet under each key — what `geometry` reports. */
export function marksInDoc(doc: Doc): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of doc.fills.values()) if (f.hostKey) out[f.hostKey] = f.hostHash ?? '';
  for (const t of doc.texts.values()) if (t.hostKey) out[t.hostKey] = t.hostHash ?? '';
  for (const b of doc.blockInstances.values()) {
    const k = b.attributes?.hostKey;
    if (k) out[k] = b.attributes?.hostHash ?? '';
  }
  return out;
}

/** Takes everything drawn under `key` off the sheet; true when there was any. */
export function clearMarks(doc: Doc, key: string): boolean {
  let any = false;
  for (const f of [...doc.fills.values()]) if (f.hostKey === key) (doc.removeFill(f.id), (any = true));
  for (const t of [...doc.texts.values()]) if (t.hostKey === key) (doc.removeText(t.id), (any = true));
  for (const b of [...doc.blockInstances.values()]) {
    if (b.attributes?.hostKey === key) {
      doc.blockInstances.delete(b.id);
      any = true;
    }
  }
  for (const name of [...doc.blocks.keys()]) if (name.startsWith(blockPrefix(key))) doc.removeBlockDefinition(name);
  return any;
}

export function applyHostMarks(store: EditorStore, msg: { key?: unknown; hash?: unknown; items?: unknown }): void {
  const { key, hash, items } = msg;
  if (typeof key !== 'string' || !key || typeof hash !== 'string' || !Array.isArray(items)) return;
  const doc = store.doc;
  const onSheet = marksInDoc(doc)[key];
  if (onSheet === hash || (onSheet === undefined && !items.length)) return;

  clearMarks(doc, key);
  const ensureLayer = (m: Mark) => {
    if (store.layers.has(m.layer)) return;
    // addLayer makes the new layer current; a host's layer appearing must not move where the user draws.
    const active = store.activeLayerId;
    store.addLayer(m.layer, typeof m.layerColor === 'string' ? m.layerColor : undefined);
    store.activeLayerId = active;
  };

  for (const raw of items as Mark[]) {
    if (!raw || typeof raw.layer !== 'string' || !raw.layer.trim()) continue;
    if (raw.kind === 'fill') {
      if (!Array.isArray(raw.points) || raw.points.length < 3 || !raw.points.every(xy)) continue;
      ensureLayer(raw);
      const pts: Point[] = raw.points.map(([x, y]) => ({ x, y }));
      const item = raw.paletteId ? store.palette?.items.find((i) => i.id === raw.paletteId) : undefined;
      const id = item ? addPaletteFill(doc, item, pts, raw.layer) : doc.addFill(pts, 'solid', raw.layer, raw.color, raw.opacity ?? 0.35);
      const f = id === null ? undefined : doc.fills.get(id);
      if (!f) continue;
      if (raw.paletteId) f.paletteId = raw.paletteId;
      if (raw.color) f.color = raw.color;
      f.hostKey = key;
      f.hostHash = hash;
    } else if (raw.kind === 'text') {
      if (!xy(raw.at) || typeof raw.text !== 'string' || !num(raw.height)) continue;
      ensureLayer(raw);
      const id = doc.addText(raw.text, raw.at[0], raw.at[1], raw.height, 0, raw.layer, raw.color, raw.align, raw.vAlign);
      const t = doc.texts.get(id)!;
      t.hostKey = key;
      t.hostHash = hash;
    } else if (raw.kind === 'drawing') {
      if (!xy(raw.at) || typeof raw.name !== 'string' || !Array.isArray(raw.lines)) continue;
      ensureLayer(raw);
      const def: CadBlockDefinition = {
        name: `${blockPrefix(key)}${raw.name}`,
        description: `Drawn by the host — ${raw.name}`,
        basePoint: { x: 0, y: 0 },
        lines: raw.lines
          .filter((l) => Array.isArray(l) && l.slice(0, 4).every(num))
          .map(([x1, y1, x2, y2, layerId]) => ({ x1, y1, x2, y2, ...(typeof layerId === 'string' ? { layerId } : {}) })),
        arcs: [],
        circles: [],
        texts: (raw.texts ?? []).filter((t) => t && typeof t.text === 'string' && num(t.x) && num(t.y) && num(t.height)),
        fills: (Array.isArray(raw.fills) ? raw.fills : [])
          .filter((f) => f && Array.isArray(f.points) && f.points.length >= 3 && f.points.every(xy))
          .map((f) => ({
            points: f.points.map(([x, y]) => ({ x, y })),
            ...(typeof f.color === 'string' ? { color: f.color } : {}),
            ...(num(f.opacity) ? { opacity: f.opacity } : {}),
            ...(typeof f.layer === 'string' ? { layerId: f.layer } : {}),
          })),
      };
      doc.addBlockDefinition(def);
      // the host's own attributes, strings only; hostKey and hostHash are ours and always win
      const own = Object.fromEntries(Object.entries(raw.attributes && typeof raw.attributes === 'object' ? raw.attributes : {}).filter(([, v]) => typeof v === 'string'));
      doc.addBlockInstance(def.name, raw.at[0], raw.at[1], 1, 0, raw.layer, undefined, { ...own, hostKey: key, hostHash: hash });
    }
  }
  store.markDocChanged();
  store.requestDraw();
  store.emit();
}
