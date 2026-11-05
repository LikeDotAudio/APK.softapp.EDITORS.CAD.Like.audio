// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { partToDefinition, bimDefinitionId, PORTS_PER_GROUP } from './bimPart';

const CORE = {
  id: 'qsc/core-110f', manufacturer: 'QSC', model: 'Core 110f', name: 'QSC Core 110f',
  ports: [
    { group: 'Mic In', side: 'input', domain: 'audio', count: 8 },
    { group: 'LAN', side: 'connection', domain: 'network', count: 2, labels: ['A', 'B'] },
    { group: 'GPIO', side: 'connection', domain: 'control', count: 1 },
    { group: 'Mains', side: 'input', domain: 'power', count: 1 },
    { group: 'Ch', side: 'output', domain: 'audio', count: 40 },
  ],
};

describe('a BIM library part as a CAD block', () => {
  it('every terminal a port, on the side its role says', () => {
    const d = partToDefinition(CORE);
    expect(d.id).toBe(bimDefinitionId(CORE));
    expect(d.id).toBe('bim.qsc/core-110f');
    expect(d.ports.filter((p) => p.side === 'input')).toHaveLength(8);
    expect(d.ports.find((p) => p.label === 'GPIO')?.side).toBe('control');
    expect(d.ports.find((p) => p.label === 'Mains')?.side).toBe('power');
    expect(d.ports.filter((p) => p.label?.startsWith('LAN')).map((p) => p.label)).toEqual(['LAN A', 'LAN B']);
    const ch = d.ports.filter((p) => p.label?.startsWith('Ch '));
    expect(ch).toHaveLength(PORTS_PER_GROUP);
    expect(ch.at(-1)?.label).toMatch(/\+24$/);
    expect(new Set(d.ports.map((p) => p.id)).size).toBe(d.ports.length);
    expect(d.ports[0]?.domain).toBe('audio');
  });
  it('a DXF-safe block name and a size that fits its ports', () => {
    const d = partToDefinition(CORE);
    expect(d.name).toMatch(/^[A-Z0-9_-]+$/);
    expect(d.size.h).toBeGreaterThanOrEqual(PORTS_PER_GROUP * 10);
    expect(partToDefinition({ id: 'x/y' }).ports).toEqual([]);
  });
});
