// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { Doc } from '../../model/Doc';
import type { EditorStore } from '../../state/EditorStore';
import { applyHostLayers, applyHostSelect, applyHostWalls, selectionForHost } from './hostWalls';

/** Just the store the wall commands touch. */
function fakeStore() {
  const layers = new Map([
    ['0', { id: '0', name: '0', color: '#fff', visible: true }],
    ['Speaker layout', { id: 'Speaker layout', name: 'Speaker layout', color: '#fde047', visible: true }],
  ]);
  const doc = new Doc();
  doc.layerHidden = (id) => layers.get(id)?.visible === false;
  const store = {
    doc,
    layers,
    activeLayerId: '0',
    selection: new Set<number>(),
    history: { pushed: 0, push() { store.history.pushed++; } },
    changes: 0,
    markDocChanged() { store.changes++; },
    requestDraw() {},
    emit() {},
  };
  return store;
}

/** A 4 × 3 room on layer 0: edges 1–4, from the corner at the origin. */
function room() {
  const s = fakeStore();
  const pts = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }];
  pts.forEach((p, i) => s.doc.addLine(p, pts[(i + 1) % 4]!, 0, '0'));
  return s;
}
const asStore = (s: ReturnType<typeof fakeStore>) => s as unknown as EditorStore;

describe('host walls', () => {
  it('drags a corner, and the walls joined to it follow, on one undo step', () => {
    const s = room();
    applyHostWalls(asStore(s), { op: 'begin' });
    expect(applyHostWalls(asStore(s), { op: 'vertex', edgeId: 2, end: 'a', to: [5, -1] })).toBe(true);
    applyHostWalls(asStore(s), { op: 'end' });
    const [a] = s.doc.endpointsOf(s.doc.edge(1)!);
    const [, b] = s.doc.endpointsOf(s.doc.edge(1)!);
    expect(a).toMatchObject({ x: 0, y: 0 });
    expect(b).toMatchObject({ x: 5, y: -1 });
    expect(s.history.pushed).toBe(1);
  });

  it('moves a whole wall', () => {
    const s = room();
    applyHostWalls(asStore(s), { op: 'edge', edgeId: 2, by: [1, 0] });
    const [a, b] = s.doc.endpointsOf(s.doc.edge(2)!);
    expect([a.x, b.x]).toEqual([5, 5]);
  });

  it('adds a wall between two points, joined to the corner it starts on', () => {
    const s = room();
    expect(applyHostWalls(asStore(s), { op: 'add', a: [0, 0], b: [2, 3] })).toBe(true);
    expect(s.doc.vertices.size).toBe(5);
    expect(s.history.pushed).toBe(1);
  });

  it('refuses what is not a wall or not a point', () => {
    const s = room();
    expect(applyHostWalls(asStore(s), { op: 'vertex', edgeId: 99, end: 'a', to: [1, 1] })).toBe(false);
    expect(applyHostWalls(asStore(s), { op: 'vertex', edgeId: 1, end: 'c', to: [1, 1] })).toBe(false);
    expect(applyHostWalls(asStore(s), { op: 'add', a: [0, 0], b: [0, 0] })).toBe(false);
  });
});

describe('host layers and selection', () => {
  it('hides a layer by name, and what is on it can no longer be picked', () => {
    const s = fakeStore();
    s.doc.addLine({ x: 0, y: 0 }, { x: 10, y: 0 }, 0, 'Speaker layout');
    expect(s.doc.hitEdgeAt(5, 0, 1)).not.toBeNull();
    expect(applyHostLayers(asStore(s), { visible: { 'Speaker layout': false, nope: false } })).toBe(true);
    expect(s.doc.hitEdgeAt(5, 0, 1)).toBeNull();
  });

  it('selects what the host picked, and reports the selection back', () => {
    const s = room();
    applyHostSelect(asStore(s), { edges: [2, 99] });
    expect([...s.selection]).toEqual([2]);
    expect(selectionForHost(asStore(s)).edges).toEqual([2]);
  });
});
