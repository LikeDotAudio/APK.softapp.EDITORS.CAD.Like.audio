// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { Doc } from '../../model/Doc';
import type { EditorStore } from '../../state/EditorStore';
import { applyHostMarks, marksInDoc } from './hostMarks';
import { sceneForHost } from './sceneForHost';

/** Just the store a host's marks touch. */
function fakeStore() {
  const layers = new Map([['0', { id: '0', name: '0', color: '#fff', visible: true }]]);
  const store = {
    doc: new Doc(),
    layers,
    activeLayerId: '0',
    palette: { title: 't', items: [{ id: 'panel', name: 'Panel', category: 'Products', color: '#3f8f4a', size: [1.2, 0.6] }] },
    changes: 0,
    addLayer(name: string, color = '#3b82f6') {
      layers.set(name, { id: name, name, color, visible: true });
      store.activeLayerId = name;
    },
    markDocChanged() {
      store.changes++;
    },
    requestDraw() {},
    emit() {},
  };
  return store;
}

const panel = { kind: 'fill', layer: 'Elevation Left', paletteId: 'panel', points: [[0, 0], [1, 0], [1, 1], [0, 1]] };
const label = { kind: 'text', layer: 'Elevation Left', at: [0, 2], text: 'Left wall', height: 0.2 };
const cut = { kind: 'drawing', layer: '3-D', name: 'iso', at: [5, 5], lines: [[0, 0, 1, 1, 'Elevation Left']] };

describe('host marks', () => {
  it('draws fills, texts and line work under a key, and reports its hash', () => {
    const s = fakeStore();
    applyHostMarks(s as unknown as EditorStore, { key: 'auto', hash: 'h1', items: [panel, label, cut] });
    expect(s.doc.fills.size).toBe(1);
    expect(s.doc.texts.size).toBe(1);
    expect(s.doc.blockInstances.size).toBe(1);
    expect(marksInDoc(s.doc)).toEqual({ auto: 'h1' });
    // a new host layer does not take the user's current layer
    expect(s.activeLayerId).toBe('0');
  });

  it('a panel with a palette id comes back as a patch, a cut-away line never as a wall', () => {
    const s = fakeStore();
    applyHostMarks(s as unknown as EditorStore, { key: 'auto', hash: 'h1', items: [panel, cut] });
    const scene = sceneForHost(s.doc, 'm', s.layers as never);
    expect(scene.patches.map((p) => p.paletteId)).toEqual(['panel']);
    expect(scene.walls).toEqual([]);
  });

  it('the same hash again changes nothing; a new one replaces the set; an empty set clears it', () => {
    const s = fakeStore();
    applyHostMarks(s as unknown as EditorStore, { key: 'auto', hash: 'h1', items: [panel, label] });
    applyHostMarks(s as unknown as EditorStore, { key: 'auto', hash: 'h1', items: [panel, label] });
    expect(s.changes).toBe(1);
    applyHostMarks(s as unknown as EditorStore, { key: 'auto', hash: 'h2', items: [label] });
    expect(s.doc.fills.size).toBe(0);
    expect(s.doc.texts.size).toBe(1);
    applyHostMarks(s as unknown as EditorStore, { key: 'auto', hash: 'h3', items: [] });
    expect(marksInDoc(s.doc)).toEqual({});
    expect(s.doc.texts.size).toBe(0);
  });

  it('a drawing’s fills go in its block: the set is one thing on the sheet', () => {
    const s = fakeStore();
    const spot = { points: [[0, 0], [1, 0], [0, 1]], color: '#ff0000', opacity: 0.2, layer: 'Reflections' };
    applyHostMarks(s as unknown as EditorStore, { key: 'cut', hash: 'h1', items: [{ ...cut, fills: [spot, { points: [[0, 0]] }] }] });
    expect(s.doc.fills.size).toBe(0);
    expect(s.doc.blockInstances.size).toBe(1);
    expect(s.doc.blocks.get('HOST:cut:iso')?.fills).toEqual([{ points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], color: '#ff0000', opacity: 0.2, layerId: 'Reflections' }]);
  });

  it('leaves other keys and the user’s own fills alone', () => {
    const s = fakeStore();
    s.doc.addFill([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], 'solid', '0');
    applyHostMarks(s as unknown as EditorStore, { key: 'a', hash: '1', items: [label] });
    applyHostMarks(s as unknown as EditorStore, { key: 'b', hash: '1', items: [label] });
    applyHostMarks(s as unknown as EditorStore, { key: 'a', hash: '2', items: [] });
    expect(s.doc.fills.size).toBe(1);
    expect(marksInDoc(s.doc)).toEqual({ b: '1' });
  });
});

describe('host place', () => {
  it('places products as the user’s own blocks in one undo step, skipping what is not a product', async () => {
    const { placeHostItems } = await import('./hostPlace');
    const s = fakeStore() as ReturnType<typeof fakeStore> & { history: { stack: unknown[]; push(x: unknown): void }; units: string };
    s.units = 'm';
    s.history = { stack: [], push(x) { this.stack.push(x); } };
    const n = placeHostItems(s as unknown as EditorStore, { layer: 'Furniture', items: [{ paletteId: 'panel', at: [1, 2], rotation: 90 }, { paletteId: 'nope', at: [0, 0] }, { paletteId: 'panel', at: ['x', 0] }] });
    expect(n).toBe(1);
    expect(s.history.stack).toHaveLength(1);
    const inst = [...s.doc.blockInstances.values()][0]!;
    expect(inst.attributes?.paletteId).toBe('panel');
    expect(inst.rotation).toBe(90);
    expect(inst.attributes?.hostKey).toBeUndefined();
  });
});

describe('host move', () => {
  it('moves a placed product to a new centre and turn, reports both, and leaves other blocks alone', async () => {
    const { placeHostItems } = await import('./hostPlace');
    const { moveHostItems } = await import('./hostMove');
    const s = fakeStore() as ReturnType<typeof fakeStore> & { history: { stack: unknown[]; push(x: unknown): void }; units: string };
    s.units = 'm';
    s.history = { stack: [], push(x) { this.stack.push(x); } };
    placeHostItems(s as unknown as EditorStore, { layer: 'Furniture', items: [{ paletteId: 'panel', at: [1, 2] }] });
    applyHostMarks(s as unknown as EditorStore, { key: 'cut', hash: 'h', items: [cut] });
    const [placed, marked] = [...s.doc.blockInstances.values()];
    const n = moveHostItems(s as unknown as EditorStore, { items: [{ id: `block:${placed!.id}`, at: [4, 5], rotation: 30 }, { id: `block:${marked!.id}`, at: [9, 9] }, { id: 'block:999', at: [0, 0] }] });
    expect(n).toBe(1);
    expect(s.history.stack).toHaveLength(1);
    expect([placed!.x, placed!.y, placed!.rotation]).toEqual([4, 5, 30]);
    expect([marked!.x, marked!.y]).toEqual([5, 5]);
    const patch = sceneForHost(s.doc, 'm', s.layers as never).patches.find((p) => p.id === `block:${placed!.id}`);
    expect(patch?.at).toEqual([4, 5]);
    expect(patch?.rotation).toBe(30);
  });
});
