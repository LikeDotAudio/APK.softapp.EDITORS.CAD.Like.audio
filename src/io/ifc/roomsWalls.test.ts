// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Layer } from '../../core/types';
import { Doc } from '../../model/Doc';
import { roomFromEdges } from '../../model/rooms/roomFromEdges';
import type { EditorStore } from '../../state/EditorStore';
import { declareRoomFromSelection, toggleWallLayer, undeclareRoomsInSelection, promptWallSize, cycleWallExternal } from '../../state/actions/roomsAndWalls';
import type { SavedSession } from '../browserStorage/SavedSession';
import { entitiesByType, getPsets, parseStep, type StepFile, type StepEntity } from '../../vendor/ifc/step';
import { exportIfc } from './exportIfc';
import { importIfc } from './importIfc';
import { insetPolygon, signedArea } from './quantities';
import { wallRuns } from './wallRuns';

/*
 * ROAD-3581 (CAD part): the user classifies a layer as walls and declares a
 * room; the .ifc has one IfcWall per wall (collinear edges the CAD welded
 * apart are one), corners joined, quantities on walls and spaces, and the
 * declared room an IfcSpace bounded by its walls. `CAD_IFC_OUT=<dir>` writes
 * studio.ifc there for IfcOpenShell's validate (schema + EXPRESS rules).
 */

const ref = (v: unknown) => (v as { id: number }).id;
const byId = (f: StepFile, v: unknown) => f.byId.get(ref(v))!;

const LAYERS: Layer[] = [
  { id: '0', name: '0', color: '#ffffff', visible: true },
  { id: 'Walls', name: 'Walls', color: '#94a3b8', visible: true },
  { id: 'Linework', name: 'Linework', color: '#3b82f6', visible: true },
];

/** A 6000 × 4000 mm box split by a partition at x = 2500: the long sides are cut in two at the T. */
function studio() {
  const doc = new Doc();
  const L = (x1: number, y1: number, x2: number, y2: number, layer = 'Walls') => doc.addLine({ x: x1, y: y1 }, { x: x2, y: y2 }, 0, layer)!;
  // drawn as the CAD leaves it once the partition is welded in: each long side two edges
  L(0, 0, 2500, 0); L(2500, 0, 6000, 0); L(6000, 0, 6000, 4000); L(6000, 4000, 2500, 4000); L(2500, 4000, 0, 4000); L(0, 4000, 0, 0);
  L(2500, 0, 2500, 4000);
  L(7000, 0, 8000, 1000, 'Linework');
  return doc;
}

/** The smallest store the actions use. */
function fakeStore(doc: Doc, layers: Layer[]) {
  const hints: string[] = [];
  const store = {
    doc,
    selection: new Set<number>(),
    layers: new Map(layers.map((l) => [l.id, { ...l }])),
    spaces: [] as SavedSession['spaces'] & object,
    changed: 0,
    markDocChanged() { this.changed++; },
    requestDraw() {},
    emit() {},
    showHint(m: string) { hints.push(m); },
  };
  return { store: store as unknown as EditorStore & { changed: number }, hints };
}

/** OK on the offered default: what a user who just presses Enter answers. */
const ENTER = Symbol('enter');

function answer(...replies: (string | null | typeof ENTER)[]) {
  const prompt = vi.fn((_message?: string, offered?: string) => {
    const r = replies.length ? replies.shift()! : null;
    return r === ENTER ? offered ?? '' : r;
  });
  vi.stubGlobal('window', { prompt });
  return prompt;
}

afterEach(() => vi.unstubAllGlobals());

function session(doc: Doc, layers: Layer[], spaces: SavedSession['spaces']): SavedSession {
  return {
    version: 1, timestamp: Date.UTC(2026, 10, 6, 12, 0, 0), docSnapshot: doc.snapshot(), currentFileName: 'studio.dxf', units: 'mm',
    gridSize: 10, snapToGrid: true, shapeMode: false, activeLayerId: 'Walls', layers, tracing: null,
    docKey: '5d1c0000-0000-4000-8000-0000000057d1', spaces,
  };
}

describe('collinear edges are one wall, corners are joined (wallRuns)', () => {
  it('a T keeps the through-wall whole; the stem joins it ATPATH', () => {
    const doc = studio();
    const s = doc.snapshot();
    const { runs, joins } = wallRuns(s.vertices, s.edges.filter((e) => e.layerId === 'Walls'));
    expect(runs.map((r) => r.edgeIds.length).sort()).toEqual([1, 1, 1, 2, 2]);
    const stem = runs.find((r) => r.points[0]!.x === 2500 && r.edgeIds.length === 1)!;
    const t = joins.filter((j) => j.related === stem.id || j.relating === stem.id);
    expect(t).toHaveLength(2);
    expect(t.map((j) => (j.relating === stem.id ? j.relatingType : j.relatedType)).sort()).toEqual(['ATEND', 'ATSTART']);
    for (const j of t) expect(j.relating === stem.id ? j.relatedType : j.relatingType).toBe('ATPATH');
  });

  it('a crossing keeps both walls; a corner joins two ends; an arc is its own wall', () => {
    const doc = new Doc();
    doc.addLine({ x: -1000, y: 0 }, { x: 0, y: 0 }, 0, 'W');
    doc.addLine({ x: 0, y: 0 }, { x: 1000, y: 0 }, 0, 'W');
    doc.addLine({ x: 0, y: -1000 }, { x: 0, y: 0 }, 0, 'W');
    doc.addLine({ x: 0, y: 0 }, { x: 0, y: 1000 }, 0, 'W');
    doc.addLine({ x: 1000, y: 0 }, { x: 1000, y: 1000 }, 0, 'W');
    doc.addArc(2000, 1000, 1000, { x: 1000, y: 1000 }, { x: 2000, y: 2000 }, 0, 'W');
    const s = doc.snapshot();
    const { runs, joins } = wallRuns(s.vertices, s.edges);
    expect(runs.filter((r) => r.edgeIds.length === 2)).toHaveLength(2);
    expect(runs.filter((r) => r.arc)).toHaveLength(1);
    expect(joins.some((j) => j.relatingType === 'ATPATH' && j.relatedType === 'ATPATH')).toBe(true);
    const corner = joins.find((j) => s.vertices.find((v) => v.id === j.vertexId)!.x === 1000 && s.vertices.find((v) => v.id === j.vertexId)!.y === 0)!;
    expect([corner.relatingType, corner.relatedType].sort()).toEqual(['ATEND', 'ATSTART']);
  });

  it('the inset floor of a 3500 × 4000 room in 200 mm walls is 3300 × 3800', () => {
    const ring = [{ x: 2500, y: 0 }, { x: 6000, y: 0 }, { x: 6000, y: 4000 }, { x: 2500, y: 4000 }];
    expect(signedArea(insetPolygon(ring, [100, 100, 100, 100]))).toBeCloseTo(3300 * 3800, 6);
    expect(signedArea(insetPolygon([...ring].reverse(), [100, 100, 100, 100]))).toBeCloseTo(-3300 * 3800, 6);
  });
});

describe('a room is declared from the edges that close it (roomFromEdges)', () => {
  const doc = studio();
  const s = doc.snapshot();
  const edges = (pred: (x: number, y: number, X: number, Y: number) => boolean) => s.edges.filter((e) => {
    const a = s.vertices.find((v) => v.id === e.v1)!, c = s.vertices.find((v) => v.id === e.v2)!;
    return pred(a.x, a.y, c.x, c.y);
  });
  const right = edges((x, _y, X) => x >= 2500 && X >= 2500 && !(x === 7000));

  it('one closed loop is a room, counter-clockwise', () => {
    const loop = roomFromEdges((id) => doc.vertex(id), right);
    expect(loop.ok).toBe(true);
    if (!loop.ok) return;
    expect(loop.points).toHaveLength(4);
    expect(signedArea(loop.points)).toBeCloseTo(3500 * 4000, 6);
    expect(loop.layerId).toBe('Walls');
  });

  it('an open chain or two loops is not', () => {
    expect(roomFromEdges((id) => doc.vertex(id), right.slice(0, 3)).ok).toBe(false);
    expect(roomFromEdges((id) => doc.vertex(id), s.edges.filter((e) => e.layerId === 'Walls')).ok).toBe(false);
  });
});

describe('the user classifies walls and declares a room (roomsAndWalls)', () => {
  it('Walls (IfcWall) on a layer, its size in mm, external said; Declare Room from the selection; persisted on the session', () => {
    const doc = studio();
    const { store } = fakeStore(doc, LAYERS);
    toggleWallLayer(store, 'Walls');
    expect(store.layers.get('Walls')!.ifc).toEqual({ entity: 'IfcWall', predefinedType: 'STANDARD' });
    answer('2700', '200 mm');
    promptWallSize(store, 'Walls');
    cycleWallExternal(store, 'Walls');
    expect(store.layers.get('Walls')!.ifc).toEqual({ entity: 'IfcWall', predefinedType: 'STANDARD', height_mm: 2700, thickness_mm: 200, isExternal: true });

    const s = doc.snapshot();
    const right = s.edges.filter((e) => {
      const a = s.vertices.find((v) => v.id === e.v1)!, c = s.vertices.find((v) => v.id === e.v2)!;
      return e.layerId === 'Walls' && a.x >= 2500 && c.x >= 2500;
    });
    for (const e of right) store.selection.add(e.id);
    answer('Studio', ENTER);
    const room = declareRoomFromSelection(store)!;
    expect(room.name).toBe('Studio');
    expect(room.height_mm).toBe(2700); // the walls' height is offered and taken
    expect(store.spaces).toHaveLength(1);
    expect(store.changed).toBeGreaterThanOrEqual(4); // each change autosaves
    // the same edges again are the same room
    expect(declareRoomFromSelection(store)).toBe(room);
    expect(store.spaces).toHaveLength(1);

    // an open selection is refused with a reason
    store.selection.clear();
    store.selection.add(right[0]!.id);
    expect(declareRoomFromSelection(store)).toBeNull();

    store.selection.add(right[1]!.id);
    expect(undeclareRoomsInSelection(store)).toBe(1);
    expect(store.spaces).toHaveLength(0);
    toggleWallLayer(store, 'Walls');
    expect(store.layers.get('Walls')!.ifc).toBeUndefined();
  });
});

describe('a drawing with a user-declared room exports an IfcSpace bounded by its walls, with quantities', () => {
  const doc = studio();
  const { store } = fakeStore(doc, LAYERS);
  toggleWallLayer(store, 'Walls');
  answer('2700', '200');
  promptWallSize(store, 'Walls');
  cycleWallExternal(store, 'Walls');
  const snap = doc.snapshot();
  for (const e of snap.edges) {
    const a = snap.vertices.find((v) => v.id === e.v1)!, c = snap.vertices.find((v) => v.id === e.v2)!;
    if (e.layerId === 'Walls' && a.x >= 2500 && c.x >= 2500) store.selection.add(e.id);
  }
  answer('Studio', '3000');
  declareRoomFromSelection(store);
  vi.unstubAllGlobals();
  const s = session(doc, [...store.layers.values()], store.spaces);
  const text = exportIfc(s);
  if (process.env.CAD_IFC_OUT) {
    mkdirSync(process.env.CAD_IFC_OUT, { recursive: true });
    writeFileSync(join(process.env.CAD_IFC_OUT, 'studio.ifc'), text);
  }
  const f = parseStep(text);
  const walls = entitiesByType(f, 'IFCWALL');
  const spaces = entitiesByType(f, 'IFCSPACE');
  const studioSpace = spaces.find((x) => x.args[2] === 'Studio')!;
  const qto = (e: StepEntity, name: string) => getPsets(f, e)[name]!;

  it('5 walls for 7 wall edges, and the declared room replaces the wall face it covers', () => {
    expect(walls).toHaveLength(5);
    expect(spaces).toHaveLength(2); // the declared Studio + the other wall face
    expect(studioSpace).toBeTruthy();
    expect(getPsets(f, studioSpace).APK_CadSpace!.Declared).toBe(true);
  });

  it('the Studio is bounded by exactly its 4 walls (the long ones whole)', () => {
    const bounds = entitiesByType(f, 'IFCRELSPACEBOUNDARY').filter((r) => ref(r.args[4]) === studioSpace.id);
    expect(bounds).toHaveLength(4);
    const names = bounds.map((r) => byId(f, r.args[5])).map((w) => getPsets(f, w).APK_CadWall?.EdgeIds ?? [getPsets(f, w).APK_CadEdge!.EdgeId]);
    expect(names.filter((n) => (n as number[]).length === 2)).toHaveLength(2);
  });

  it('corners are IfcRelConnectsPathElements: 4 corners + 2 T junctions', () => {
    const joins = entitiesByType(f, 'IFCRELCONNECTSPATHELEMENTS');
    expect(joins).toHaveLength(6);
    const kinds = joins.map((j) => [(j.args[10] as { value: string }).value, (j.args[9] as { value: string }).value].sort().join('/'));
    expect(kinds.filter((k) => k === 'ATEND/ATSTART')).toHaveLength(4);
    expect(kinds.filter((k) => k.includes('ATPATH'))).toHaveLength(2);
  });

  it('walls carry Qto_WallBaseQuantities and Pset_WallCommon.IsExternal', () => {
    const long = walls.find((w) => (getPsets(f, w).APK_CadWall?.EdgeIds as number[] | undefined)?.length === 2)!;
    const q = qto(long, 'Qto_WallBaseQuantities');
    expect(q.Length).toBe(6000);
    expect(q.Width).toBe(200);
    expect(q.Height).toBe(2700);
    expect(q.GrossFootPrintArea).toBeCloseTo(1.2, 9);
    expect(q.GrossSideArea).toBeCloseTo(16.2, 9);
    expect(q.GrossVolume).toBeCloseTo(3.24, 9);
    expect(getPsets(f, long).Pset_WallCommon!.IsExternal).toBe(true);
  });

  it('the Studio carries Qto_SpaceBaseQuantities: gross on the axes, net inside the walls', () => {
    const q = qto(studioSpace, 'Qto_SpaceBaseQuantities');
    expect(q.Height).toBe(3000);
    expect(q.GrossFloorArea).toBeCloseTo(14, 9);
    expect(q.NetFloorArea).toBeCloseTo(3.3 * 3.8, 9);
    expect(q.GrossPerimeter).toBeCloseTo(15000, 6);
    expect(q.NetPerimeter).toBeCloseTo(14200, 6);
    expect(q.NetVolume).toBeCloseTo(3.3 * 3.8 * 3, 9);
  });

  it('areas and volumes have their units: m² and m³ beside mm', () => {
    const units = entitiesByType(f, 'IFCSIUNIT').map((u) => (u.args[1] as { value: string }).value);
    expect(units).toEqual(expect.arrayContaining(['LENGTHUNIT', 'AREAUNIT', 'VOLUMEUNIT']));
  });

  it('imports back equal: the classification, the room and its edges, every welded edge', () => {
    expect(importIfc(text)).toEqual(s);
    expect(exportIfc(importIfc(text))).toBe(text);
  });
});
