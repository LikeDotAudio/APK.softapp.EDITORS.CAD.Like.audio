// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '@state/EditorStore';

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
 *   detach { edgeId, end }             that end of that wall gets a corner of
 *                                      its own, so the next `vertex` moves it
 *                                      alone — the wall comes away from its
 *                                      neighbours (send after `begin`)
 *   end                                the drag is over: lines that now cross
 *                                      are split where they do (as a grip
 *                                      drag here ends), never mid-drag, and
 *                                      corners dropped on each other become
 *                                      one — the walls are joined
 *   add    { a, b, layer? }            a new wall, on its own undo step,
 *                                      joined to the corners it lands on
 *   delete { edgeId }                  that wall gone, on its own undo step
 *
 * Arcs are not gripped: a corner moved alone would leave the arc's end off
 * its circle. Returns whether the sheet changed.
 */
/** The corners this drag has moved (since `begin`): only they are welded at `end`, so a wall pulled away stays away. */
const touched = new Set<number>();

export function applyHostWalls(store: EditorStore, msg: { op?: unknown; edgeId?: unknown; end?: unknown; to?: unknown; by?: unknown; a?: unknown; b?: unknown; layer?: unknown }): boolean {
  const pt = (v: unknown): [number, number] | null => (Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && Number.isFinite(n)) ? [v[0], v[1]] : null);
  const doc = store.doc;
  let changed = false;
  if (msg.op === 'begin') {
    store.history.push(doc.snapshot());
    touched.clear();
    return false;
  }
  if (msg.op === 'end') {
    doc.resolveAllIntersections();
    weldCoincident(doc, 1e-6, touched);
    touched.clear();
    changed = true;
  } else if (msg.op === 'detach') {
    const e = typeof msg.edgeId === 'number' ? doc.edge(msg.edgeId) : undefined;
    if (!e || (msg.end !== 'a' && msg.end !== 'b')) return false;
    const key = msg.end === 'a' ? 'v1' : 'v2';
    const v = doc.vertices.get(e[key]);
    if (!v || ![...doc.edges.values()].some((o) => o.id !== e.id && (o.v1 === v.id || o.v2 === v.id))) return false;
    // inserted directly: addVertex would merge it straight back into the corner it leaves
    const id = doc.nextVertexId++;
    doc.vertices.set(id, { id, x: v.x, y: v.y });
    e[key] = id;
    doc.rebuildVertexGrid();
    changed = true;
  } else if (msg.op === 'delete') {
    const e = typeof msg.edgeId === 'number' ? doc.edge(msg.edgeId) : undefined;
    if (!e) return false;
    store.history.push(doc.snapshot());
    doc.removeEdge(e.id);
    changed = true;
  } else if (msg.op === 'vertex') {
    const e = typeof msg.edgeId === 'number' ? doc.edge(msg.edgeId) : undefined;
    const to = pt(msg.to);
    if (!e || e.type !== 'line' || !to || (msg.end !== 'a' && msg.end !== 'b')) return false;
    const vId = msg.end === 'a' ? e.v1 : e.v2;
    touched.add(vId);
    changed = doc.moveVertex(vId, to[0], to[1]);
  } else if (msg.op === 'edge') {
    const e = typeof msg.edgeId === 'number' ? doc.edge(msg.edgeId) : undefined;
    const by = pt(msg.by);
    if (!e || e.type !== 'line' || !by) return false;
    touched.add(e.v1).add(e.v2);
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

/**
 * Corners that sit on each other become one: every wall end at a coincident
 * corner is moved onto the first, the spare corners dropped. With `only`,
 * just the pairs one of whose corners is in it — the ones a drag moved. A wall left with
 * both ends on one corner is removed, and of two walls left joining the same
 * pair of corners only one is kept. `eps` in drawing units.
 */
export function weldCoincident(doc: EditorStore['doc'], eps = 1e-6, only?: ReadonlySet<number>): number {
  const keep = new Map<number, number>();
  const verts = [...doc.vertices.values()];
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i]!;
    if (keep.has(a.id)) continue;
    for (let j = i + 1; j < verts.length; j++) {
      const b = verts[j]!;
      if (only && !only.has(a.id) && !only.has(b.id)) continue;
      if (!keep.has(b.id) && Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps) keep.set(b.id, a.id);
    }
  }
  if (!keep.size) return 0;
  const seen = new Set<string>();
  for (const e of [...doc.edges.values()]) {
    e.v1 = keep.get(e.v1) ?? e.v1;
    e.v2 = keep.get(e.v2) ?? e.v2;
    const pair = e.v1 < e.v2 ? `${e.v1}-${e.v2}` : `${e.v2}-${e.v1}`;
    if (e.v1 === e.v2 || (e.type === 'line' && seen.has(`${e.layerId}:${pair}`))) doc.edges.delete(e.id);
    else if (e.type === 'line') seen.add(`${e.layerId}:${pair}`);
  }
  for (const id of keep.keys()) doc.vertices.delete(id);
  doc.rebuildVertexGrid();
  return keep.size;
}
