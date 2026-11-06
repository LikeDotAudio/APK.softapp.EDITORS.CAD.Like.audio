// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadSpace, Edge, LayerIfc } from '../../core/types';
import { roomFromEdges } from '../../model/rooms/roomFromEdges';
import type { EditorStore } from '../EditorStore';

/**
 * WALLS AND ROOMS ARE THE USER'S WORD (ROAD-3581, cad-4)
 *
 * The IFC export never guesses what a line is. The user says it: a layer is
 * classified as walls (IfcWall) from its row's right-click menu, with its
 * height and thickness in mm; a room is declared (IfcSpace) from the edges
 * selected round it. Both live in the session — `Layer.ifc`, `store.spaces` —
 * so they are saved, reloaded and written into the .ifc twin every time.
 */

const DEFAULT_WALL: LayerIfc = { entity: 'IfcWall', predefinedType: 'STANDARD' };

/** Classify a layer for the IFC export, or take the classification off with null. */
export function setLayerIfc(store: EditorStore, id: string, ifc: LayerIfc | null): void {
  const layer = store.layers.get(id);
  if (!layer) return;
  if (JSON.stringify(layer.ifc ?? null) === JSON.stringify(ifc)) return;
  if (ifc) layer.ifc = { ...ifc };
  else delete layer.ifc;
  store.markDocChanged();
  store.requestDraw();
  store.emit();
}

/** Layer menu ▸ Walls (IfcWall): on, keeping any size it had; off again. */
export function toggleWallLayer(store: EditorStore, id: string): void {
  const layer = store.layers.get(id);
  if (!layer) return;
  if (layer.ifc?.entity === 'IfcWall') {
    setLayerIfc(store, id, null);
    store.showHint(`${layer.name} is drawing again: its lines export as annotation.`, 3000);
    return;
  }
  setLayerIfc(store, id, DEFAULT_WALL);
  store.showHint(`${layer.name} is walls: every line on it exports as an IfcWall. Wall Size... gives them a height and thickness.`, 4000);
}

/** Parse a positive mm figure from a prompt answer; '' keeps none. */
export function parseMm(text: string | null): number | undefined | null {
  if (text === null) return null;
  const t = text.trim().replace(/\s*mm$/i, '');
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Layer menu ▸ Wall Size...: height and thickness in mm, whatever the drawing's units. */
export function promptWallSize(store: EditorStore, id: string): void {
  const layer = store.layers.get(id);
  if (!layer || layer.ifc?.entity !== 'IfcWall') return;
  const h = parseMm(window.prompt(`Height of the walls on ${layer.name}, mm (empty: not known):`, layer.ifc.height_mm ? String(layer.ifc.height_mm) : ''));
  if (h === null) return;
  const t = parseMm(window.prompt(`Thickness of the walls on ${layer.name}, mm (empty: not known):`, layer.ifc.thickness_mm ? String(layer.ifc.thickness_mm) : ''));
  if (t === null) return;
  const next: LayerIfc = { ...layer.ifc };
  if (h === undefined) delete next.height_mm;
  else next.height_mm = h;
  if (t === undefined) delete next.thickness_mm;
  else next.thickness_mm = t;
  setLayerIfc(store, id, next);
}

/** Layer menu ▸ External Walls: Pset_WallCommon.IsExternal, said by the user (true → false → not said). */
export function cycleWallExternal(store: EditorStore, id: string): void {
  const layer = store.layers.get(id);
  if (!layer || layer.ifc?.entity !== 'IfcWall') return;
  const next: LayerIfc = { ...layer.ifc };
  if (next.isExternal === undefined) next.isExternal = true;
  else if (next.isExternal) next.isExternal = false;
  else delete next.isExternal;
  setLayerIfc(store, id, next);
}

function newRoomKey(store: EditorStore): string {
  const uuid = (globalThis.crypto as Crypto | undefined)?.randomUUID?.();
  if (uuid) return `room-${uuid}`;
  let n = store.spaces.length + 1;
  while (store.spaces.some((s) => s.key === `room-${n}`)) n++;
  return `room-${n}`;
}

/** Modify ▸ Declare Room: the selected edges, one closed loop, become a room (an IfcSpace in the .ifc). */
export function declareRoomFromSelection(store: EditorStore): CadSpace | null {
  const edges = [...store.selection].map((id) => store.doc.edge(id)).filter((e): e is Edge => !!e);
  const loop = roomFromEdges((id) => store.doc.vertex(id), edges);
  if (!loop.ok) {
    store.showHint(loop.why, 4000);
    return null;
  }
  const key = loop.edgeIds.join('.');
  const existing = store.spaces.find((s) => s.edgeIds && s.edgeIds.join('.') === key);
  if (existing) {
    store.showHint(`These edges are already the room ${existing.name ?? existing.key}.`, 3000);
    return existing;
  }
  const n = store.spaces.length + 1;
  const name = window.prompt('Room name:', `Room ${n}`);
  if (name === null) return null;
  const wallHeight = edges.map((e) => store.layers.get(e.layerId)?.ifc?.height_mm).find((h) => h !== undefined);
  const h = parseMm(window.prompt('Floor to ceiling, mm (empty: not known):', wallHeight ? String(wallHeight) : ''));
  if (h === null) return null;
  const space: CadSpace = { key: newRoomKey(store), name: name.trim() || `Room ${n}`, layerId: loop.layerId, points: loop.points, edgeIds: loop.edgeIds };
  if (h !== undefined) space.height_mm = h;
  store.spaces = [...store.spaces, space];
  store.markDocChanged();
  store.requestDraw();
  store.emit();
  store.showHint(`Declared ${space.name}: an IfcSpace bounded by its walls in the .ifc.`, 3000);
  return space;
}

/** Modify ▸ Undeclare Room: every declared room that uses a selected edge goes. */
export function undeclareRoomsInSelection(store: EditorStore): number {
  const before = store.spaces.length;
  store.spaces = store.spaces.filter((s) => !(s.edgeIds ?? []).some((id) => store.selection.has(id)));
  const gone = before - store.spaces.length;
  if (gone) {
    store.markDocChanged();
    store.requestDraw();
    store.emit();
  }
  store.showHint(gone ? `Undeclared ${gone} room(s).` : 'No declared room uses the selected edges.', 3000);
  return gone;
}
