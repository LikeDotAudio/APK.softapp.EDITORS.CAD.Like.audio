// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../../state/EditorStore';

/**
 * A HOST GRIPS THE WALLS
 *
 * `walls { op, … }` lets the acoustic overlay's Walls mode reshape the room
 * the way an endpoint or midpoint grip does here, while it drags on its own
 * plan — ids and ends as `geometry.walls` reports them, points in drawing
 * units:
 *
 *   begin                              one undo step for the drag to come
 *   vertex { edgeId, end: 'a'|'b', to } that end of that wall to `to`; every
 *                                      wall joined to the corner follows
 *   edge   { edgeId, by: [dx, dy] }    the whole wall moved, its neighbours
 *                                      stretching after it
 *   end                                the drag is over: lines that now cross
 *                                      are split where they do (as a grip
 *                                      drag here ends), never mid-drag
 *   add    { a, b, layer? }            a new wall, on its own undo step,
 *                                      joined to the corners it lands on
 *
 * Arcs are not gripped: a corner moved alone would leave the arc's end off
 * its circle. Returns whether the sheet changed.
 */
export function applyHostWalls(store: EditorStore, msg: { op?: unknown; edgeId?: unknown; end?: unknown; to?: unknown; by?: unknown; a?: unknown; b?: unknown; layer?: unknown }): boolean {
  const pt = (v: unknown): [number, number] | null => (Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && Number.isFinite(n)) ? [v[0], v[1]] : null);
  const doc = store.doc;
  let changed = false;
  if (msg.op === 'begin') {
    store.history.push(doc.snapshot());
    return false;
  }
  if (msg.op === 'end') {
    doc.resolveAllIntersections();
    changed = true;
  } else if (msg.op === 'vertex') {
    const e = typeof msg.edgeId === 'number' ? doc.edge(msg.edgeId) : undefined;
    const to = pt(msg.to);
    if (!e || e.type !== 'line' || !to || (msg.end !== 'a' && msg.end !== 'b')) return false;
    changed = doc.moveVertex(msg.end === 'a' ? e.v1 : e.v2, to[0], to[1]);
  } else if (msg.op === 'edge') {
    const e = typeof msg.edgeId === 'number' ? doc.edge(msg.edgeId) : undefined;
    const by = pt(msg.by);
    if (!e || e.type !== 'line' || !by) return false;
    changed = doc.translateEdges([e.id], by[0], by[1]);
  } else if (msg.op === 'add') {
    const [a, b] = [pt(msg.a), pt(msg.b)];
    if (!a || !b || (a[0] === b[0] && a[1] === b[1])) return false;
    const layer = typeof msg.layer === 'string' && store.layers.has(msg.layer) ? msg.layer : store.activeLayerId;
    store.history.push(doc.snapshot());
    changed = doc.addLine({ x: a[0], y: a[1] }, { x: b[0], y: b[1] }, 0, layer) !== null;
    if (changed) doc.resolveAllIntersections();
  }
  if (!changed) return false;
  store.markDocChanged();
  store.requestDraw();
  store.emit();
  return true;
}

/**
 * `layers { visible: { name: bool } }` switches layers on or off by name —
 * the overlay's modes put its own drawings (layout, blow-up, cut-aways) out
 * of the way while you work, and back after. Hidden, nothing on them can be
 * picked. Unknown names are skipped. Returns whether any changed.
 */
export function applyHostLayers(store: EditorStore, msg: { visible?: unknown }): boolean {
  if (!msg.visible || typeof msg.visible !== 'object') return false;
  let changed = false;
  for (const [name, on] of Object.entries(msg.visible as Record<string, unknown>)) {
    const layer = store.layers.get(name);
    if (!layer || typeof on !== 'boolean' || layer.visible === on) continue;
    layer.visible = on;
    changed = true;
  }
  if (changed) {
    store.requestDraw();
    store.emit();
  }
  return changed;
}

/**
 * `select { edges?: number[], blocks?: string[] }` selects those walls and
 * placed products ('block:<n>') here — what the overlay picked, called out
 * on the sheet too. An empty message clears the selection.
 */
export function applyHostSelect(store: EditorStore, msg: { edges?: unknown; blocks?: unknown }): void {
  store.selection.clear();
  for (const id of Array.isArray(msg.edges) ? msg.edges : []) if (typeof id === 'number' && store.doc.edge(id)) store.selection.add(id);
  for (const ref of Array.isArray(msg.blocks) ? msg.blocks : []) {
    const m = typeof ref === 'string' ? /^block:(\d+)$/.exec(ref) : null;
    if (m && store.doc.blockInstances.has(Number(m[1]))) store.selection.add(Number(m[1]));
  }
  store.requestDraw();
  store.emit();
}

/**
 * What is selected, for the host: `edges` (wall ids, as `geometry.walls`
 * names them) and `blocks` — each placed product or host drawing selected,
 * { id: 'block:<n>', paletteId?, attributes } — so the overlay can call out
 * the speaker, seat, product or surface the user picked here.
 */
export function selectionForHost(store: EditorStore): { edges: number[]; blocks: { id: string; paletteId?: string; attributes: Record<string, string> }[] } {
  const edges: number[] = [];
  const blocks: { id: string; paletteId?: string; attributes: Record<string, string> }[] = [];
  for (const id of store.selection) {
    if (store.doc.edge(id)) edges.push(id);
    const b = store.doc.blockInstances.get(id);
    if (b) blocks.push({ id: `block:${id}`, ...(b.attributes?.paletteId ? { paletteId: b.attributes.paletteId } : {}), attributes: { ...(b.attributes ?? {}) } });
  }
  return { edges, blocks };
}
