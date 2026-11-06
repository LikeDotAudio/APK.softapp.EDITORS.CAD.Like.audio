// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { createSchematic, portsOf } from '../../flow/Schematic';
import type { EditorStore } from '@state/EditorStore';
import { dragHostPlacements, hostDragAt, hostPickAt } from './hostDrag';
import { pickForHost } from './hostPick';
import { applyHostSchematic, hostPlacementsOf } from './hostSchematic';

function store() {
  const layers = new Map([['0', { id: '0', name: '0', color: '#fff', visible: true }]]);
  const s = {
    schematic: createSchematic([]), layers, activeLayerId: '0',
    addLayer(name: string) { layers.set(name, { id: name, name, color: '#fff', visible: true }); },
    markDocChanged() {}, requestDraw() {}, emit() {},
  };
  applyHostSchematic(s as unknown as EditorStore, {
    key: 'bench', hash: 'h',
    parts: [{ id: 'p/x', ports: [{ group: 'IN', side: 'input' }, { group: 'OUT', side: 'output' }] }],
    placements: [
      { ref: 'U1', part: 'p/x', at: [0, 0], group: 'g' },
      { ref: 'U2', part: 'p/x', at: [300, 0], group: 'g', size: [200, 120] },
    ],
    connections: [], groups: [{ id: 'g', name: 'Lab' }],
  });
  return s;
}

describe('host blocks under Select', () => {
  it('a press on a host block takes that block; inside its group (between blocks), the whole group', () => {
    const { schematic: m } = store();
    expect(hostDragAt(m, { x: 0, y: 0 }).map((id) => m.placements.find((p) => p.id === id)!.hostRef)).toEqual(['U1']);
    expect(hostDragAt(m, { x: 150, y: 0 })).toHaveLength(2);
    expect(hostDragAt(m, { x: 5000, y: 5000 })).toEqual([]);
  });

  it('a drag moves the seat geometry reports, and never a placement of the user\'s own', () => {
    const { schematic: m } = store();
    m.placements.push({ id: 99, definitionId: m.placements[0]!.definitionId, at: { x: 0, y: 0 }, layerId: '0' });
    expect(dragHostPlacements(m, hostDragAt(m, { x: 150, y: 0 }).concat([99]), 10, -5)).toBe(true);
    expect(hostPlacementsOf(m).map(({ key, ref, at }) => ({ key, ref, at }))).toEqual([{ key: 'bench', ref: 'U1', at: [10, -5] }, { key: 'bench', ref: 'U2', at: [310, -5] }]);
    expect(m.placements.find((p) => p.id === 99)!.at).toEqual({ x: 0, y: 0 });
  });

  it('a seat size makes the block at least that big', () => {
    const { schematic: m } = store();
    const def = m.definitions.find((d) => d.id === m.placements[1]!.definitionId)!;
    expect(def.size).toEqual({ w: 200, h: 120 });
  });

  it('pick says which host block and which port — the terminal the host sent', () => {
    const s = store();
    const port = portsOf(s.schematic, s.schematic.placements[0]!.id).find((p) => p.port.label === 'OUT')!;
    expect(hostPickAt(s.schematic, port.world, 2)).toEqual({ key: 'bench', ref: 'U1', terminal: 'OUT' });
    expect(hostPickAt(s.schematic, { x: 0, y: 0 }, 2)).toEqual({ key: 'bench', ref: 'U1' });
    expect(hostPickAt(s.schematic, { x: 150, y: 0 }, 2)).toEqual({ key: 'bench', group: 'g' });
    const view = { zoom: 1, toWorld: (x: number, y: number) => ({ x, y }) };
    const body = pickForHost({ ...s, view, tool: { id: 'select' } } as never, { left: 0, top: 0 },
      { clientX: port.world.x, clientY: port.world.y, shiftKey: false, ctrlKey: false, metaKey: false }, 1);
    expect(body.host).toEqual({ key: 'bench', ref: 'U1', terminal: 'OUT' });
  });
});
