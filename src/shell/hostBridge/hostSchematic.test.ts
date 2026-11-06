// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import samples from '../../../contract/host@1/samples.json';
import { createSchematic } from '../../flow/Schematic';
import { groupBounds } from '../../flow/groups';
import { portalPoints } from '../../render/flow/drawPortals';
import type { EditorStore } from '@state/EditorStore';
import { HOST_HANDLERS } from './hostBridge';
import { applyHostSchematic, hostPlacementsOf, schematicInModel } from './hostSchematic';

/** Just the store a host's schematic touches. */
function fakeStore() {
  const layers = new Map([['0', { id: '0', name: '0', color: '#fff', visible: true }]]);
  const store = {
    schematic: createSchematic([]),
    layers,
    activeLayerId: '0',
    changes: 0,
    addLayer(name: string) {
      layers.set(name, { id: name, name, color: '#3b82f6', visible: true });
      store.activeLayerId = name;
    },
    markDocChanged() { store.changes++; },
    requestDraw() {},
    emit() {},
  };
  return store;
}

const speaker = {
  id: 'google/cast-speaker', manufacturer: 'Google', model: 'Cast speaker',
  ports: [{ group: 'MAINS IN', side: 'input', domain: 'power' }, { group: 'AUDIO OUT', side: 'output', domain: 'audio' }],
};
const send = (hash: string, extra: object = {}) => ({
  key: 'bench', hash, parts: [speaker],
  placements: [
    { ref: 'U9', part: 'google/cast-speaker', at: [0, 0], group: 'cast' },
    { ref: 'U10', part: 'google/cast-speaker', at: [200, 0], group: 'cast' },
  ],
  connections: [{ a: { ref: 'U9', terminal: 'AUDIO OUT' }, b: { ref: 'U10', terminal: 'mains in' } }],
  groups: [{ id: 'cast', name: 'Google and Apple' }],
  portals: { U9: { 'AUDIO OUT': { text: 'U10 MAINS IN', wired: true } }, U10: { 'MAINS IN': 'card 1 · E12 pin 9' } },
  ...extra,
});

describe('host schematic — BIM parts placed as blocks with ports', () => {
  it('one part, two placements, one connection: two placements, one connector and two portals', () => {
    const s = fakeStore();
    applyHostSchematic(s as unknown as EditorStore, send('h1'));
    const m = s.schematic;
    expect(m.placements).toHaveLength(2);
    expect(m.connectors).toHaveLength(1);
    const portals = m.placements.flatMap((p) => Object.entries(p.portals ?? {}));
    expect(portals).toHaveLength(2);
    expect(portals.map(([, far]) => far.wired)).toEqual([true, false]);
    // the CAD built the block from the part and found the ports itself
    const c = m.connectors[0]!;
    expect([c.from.portId, c.to.portId]).toEqual(['AUDIO_OUT', 'MAINS_IN']);
    expect(m.definitions.map((d) => d.id)).toEqual(['bim.google/cast-speaker']);
    // grouped, and the group's box holds both
    expect(m.groups).toHaveLength(1);
    expect(m.groups[0]!.members).toHaveLength(2);
    expect(groupBounds(m, m.groups[0]!.id)).not.toBeNull();
    expect(schematicInModel(m)).toEqual({ bench: 'h1' });
    expect(hostPlacementsOf(m)).toEqual([{ key: 'bench', ref: 'U9', at: [0, 0] }, { key: 'bench', ref: 'U10', at: [200, 0] }]);
  });

  it('a resend with the same hash is ignored; a new hash replaces everything under the key', () => {
    const s = fakeStore();
    applyHostSchematic(s as unknown as EditorStore, send('h1'));
    const changes = s.changes;
    applyHostSchematic(s as unknown as EditorStore, send('h1'));
    expect(s.changes).toBe(changes);
    applyHostSchematic(s as unknown as EditorStore, send('h2', { connections: [] }));
    expect(s.schematic.placements).toHaveLength(2);
    expect(s.schematic.connectors).toHaveLength(0);
    expect(s.schematic.groups).toHaveLength(1);
    applyHostSchematic(s as unknown as EditorStore, send('h3', { placements: [] }));
    expect(s.schematic.placements).toHaveLength(0);
    expect(s.schematic.definitions).toHaveLength(0);
  });

  it('an instance with terminals of its own gets a definition of its own; the user\'s placements are left alone', () => {
    const s = fakeStore();
    s.schematic.definitions.push({ id: 'mine', name: 'MINE', size: { w: 10, h: 10 }, glyph: [], ports: [] });
    s.schematic.placements.push({ id: s.schematic.nextPlacementId++, definitionId: 'mine', at: { x: 0, y: 0 }, layerId: '0' });
    applyHostSchematic(s as unknown as EditorStore, send('h1', {
      placements: [{ ref: 'U10', part: 'google/cast-speaker', at: [0, 0], ports: [{ group: 'wlan0', side: 'connection', domain: 'network' }] }],
      connections: [],
    }));
    const def = s.schematic.definitions.find((d) => d.id.startsWith('bim.google/cast-speaker'))!;
    expect(def.id).toBe('bim.google/cast-speaker@bench:U10');
    expect(def.ports.map((p) => p.id)).toEqual(['MAINS_IN', 'AUDIO_OUT', 'WLAN0']);
    applyHostSchematic(s as unknown as EditorStore, send('h2', { placements: [] }));
    expect(s.schematic.placements.map((p) => p.definitionId)).toEqual(['mine']);
    expect(s.activeLayerId).toBe('0');
  });

  it('the published sample is understood', () => {
    const s = fakeStore();
    const sample = (samples.toCad as { type: string }[]).find((m) => m.type === 'schematic')!;
    HOST_HANDLERS.schematic!(s as unknown as EditorStore, sample as never);
    expect(s.schematic.placements).toHaveLength(2);
    expect(s.schematic.connectors).toHaveLength(1);
    expect(s.schematic.placements.flatMap((p) => Object.keys(p.portals ?? {}))).toHaveLength(2);
    expect(s.layers.has('Bench')).toBe(true);
  });

  it('a portal sits beyond its port along the side\'s normal', () => {
    const { centre, text } = portalPoints({ x: 10, y: 0 }, { x: 1, y: 0 });
    expect(centre.x).toBeGreaterThan(10);
    expect(text.x).toBeGreaterThan(centre.x);
  });
});
