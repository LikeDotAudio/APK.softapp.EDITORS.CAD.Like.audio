// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it, vi } from 'vitest';
import { EditorStore } from '@state/EditorStore';
import { wireTool } from '../tools/wireTool';
import { connectPorts, createSchematic, placeBlock, portWorldPoint, restoreSchematic, snapshotSchematic } from './Schematic';
import { hitConnectorAt, normaliseCable, setConnectorCable, wirePath, wireTitle } from './cables';
import { CATALOG } from './catalog';

/* ROAD-3582 r4: a drawn wire marked as a cable — found under the pointer, its fields
   normalised, set and cleared without touching the snapshot it came from. */

function rig() {
  const m = createSchematic();
  const src = CATALOG.find((d) => d.ports.some((p) => p.side === 'output'))!;
  const dst = CATALOG.find((d) => d.ports.some((p) => p.side === 'input'))!;
  const a = placeBlock(m, src.id, { x: 0, y: 0 }, 'Flow');
  const b = placeBlock(m, dst.id, { x: 400, y: 0 }, 'Flow');
  const out = src.ports.find((p) => p.side === 'output')!;
  const inp = dst.ports.find((p) => p.side === 'input')!;
  const c = connectPorts(m, { placementId: a.id, portId: out.id }, { placementId: b.id, portId: inp.id }, 'Flow')!;
  return { m, c };
}

describe('a wire as a cable', () => {
  it('finds the wire under the pointer, on its drawn path, and nothing off it', () => {
    const { m, c } = rig();
    const path = wirePath(m, c, 0)!;
    expect(path[0]).toEqual(portWorldPoint(m, c.from));
    expect(path[path.length - 1]).toEqual(portWorldPoint(m, c.to));
    const mid = { x: (path[0].x + path[1].x) / 2, y: (path[0].y + path[1].y) / 2 };
    expect(hitConnectorAt(m, mid, 2)).toBe(c.id);
    expect(hitConnectorAt(m, { x: mid.x, y: mid.y + 500 }, 2)).toBeNull();
    // a drawn route is the path
    c.route = [{ x: 200, y: 300 }];
    expect(hitConnectorAt(m, { x: 200, y: 299 }, 2)).toBe(c.id);
  });

  it('normalises the fields: blanks dropped, part lower-case, length a positive number', () => {
    expect(normaliseCable({ part: ' Hosa/CMR-206 ', tag: 'W-001', length_mm: '1800', colour: '', status: 'made' }))
      .toEqual({ part: 'hosa/cmr-206', tag: 'W-001', length_mm: 1800, status: 'made' });
    expect(normaliseCable({ length_mm: '1,5' })).toEqual({ length_mm: 1.5 });
    expect(normaliseCable({ length_mm: '-3' })).toEqual({});
    expect(normaliseCable({})).toEqual({});
  });

  it('sets and clears the cable as new objects, so a snapshot taken before keeps its wire', () => {
    const { m, c } = rig();
    const before = snapshotSchematic(m);
    expect(setConnectorCable(m, c.id, { tag: 'W-001', length_mm: 1800 })).toBe(true);
    expect(setConnectorCable(m, c.id, { tag: 'W-001', length_mm: 1800 })).toBe(false); // the same: no change
    expect(m.connectors[0].cable).toEqual({ tag: 'W-001', length_mm: 1800 });
    expect(before.connectors[0].cable).toBeUndefined();
    const withCable = snapshotSchematic(m);
    expect(setConnectorCable(m, c.id, null)).toBe(true);
    expect('cable' in m.connectors[0]).toBe(false);
    expect(withCable.connectors[0].cable).toEqual({ tag: 'W-001', length_mm: 1800 });
    expect(setConnectorCable(m, c.id, null)).toBe(false);
    expect(setConnectorCable(m, 999, {})).toBe(false);
    restoreSchematic(m, withCable);
    expect(m.connectors[0].cable?.tag).toBe('W-001');
    expect(wireTitle(m, c)).toMatch(/→/);
  });

  it('the snapshot keeps each placed symbol size, for the .ifc outline', () => {
    const { m } = rig();
    const s = snapshotSchematic(m);
    const ids = [...new Set(m.placements.map((p) => p.definitionId))].sort();
    expect(Object.keys(s.sizes ?? {})).toEqual(ids);
    for (const id of ids) expect(s.sizes![id]).toEqual(m.definitions.find((d) => d.id === id)!.size);
  });
});

describe('the Wire tool opens the cable editor on a wire', () => {
  it('a click on a wire (not a port) opens it; Save makes the wire that cable, Not a cable clears it', () => {
    vi.stubGlobal('requestAnimationFrame', () => 1);
    const store = new EditorStore();
    store.autoSaveSession = async () => {};
    const { m, c } = rig();
    restoreSchematic(store.schematic, snapshotSchematic(m));
    const path = wirePath(store.schematic, store.schematic.connectors[0], 0)!;
    // the middle of the wire's longest run: well away from either port
    const k = path.slice(1).reduce((best, p, i) => (Math.hypot(p.x - path[i].x, p.y - path[i].y) > Math.hypot(path[best + 1].x - path[best].x, path[best + 1].y - path[best].y) ? i : best), 0);
    const mid = { x: (path[k].x + path[k + 1].x) / 2, y: (path[k].y + path[k + 1].y) / 2 };
    const input = { world: mid, rawWorld: mid, screen: mid, client: mid, shiftKey: false, ctrlKey: false, metaKey: false } as Parameters<NonNullable<typeof wireTool.onPointerDown>>[1];
    wireTool.onPointerDown!(wireTool.createState(), input, store.api);
    expect(store.getSnapshot().cable).toMatchObject({ connectorId: c.id, isCable: false, part: '', tag: '' });
    store.setCable(c.id, normaliseCable({ part: 'hosa/cmr-206', tag: 'W-001', length_mm: '1800', status: 'made' }));
    expect(store.getSnapshot().cable).toMatchObject({ isCable: true, part: 'hosa/cmr-206', tag: 'W-001', length_mm: '1800', status: 'made' });
    expect(snapshotSchematic(store.schematic).connectors[0].cable).toEqual({ part: 'hosa/cmr-206', tag: 'W-001', length_mm: 1800, status: 'made' });
    store.setCable(c.id, null);
    store.closeCableEditor();
    expect(store.getSnapshot().cable).toBeNull();
    expect(store.schematic.connectors[0].cable).toBeUndefined();
    vi.unstubAllGlobals();
  });
});
