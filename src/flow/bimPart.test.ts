// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { partToDefinition, bimDefinitionId, liveBoxesFromDevices, liveBoxesOf, PORTS_PER_GROUP } from './bimPart';
import { createSchematic, placeBlock } from './Schematic';

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

describe('a placement names the box it stands for (ROAD-3537)', () => {
  it('takes serials, else a fixed GPIB address, never a bare IP or a gateway MAC', () => {
    const boxes = liveBoxesOf([
      { state: 'online', protocol: 'visa', mac: '00:30:d3:05:70:7e', panel: { serial: 'MY42000747', resource: 'TCPIP::44.44.44.222::gpib7,6::INSTR' } },
      { state: 'online', protocol: 'visa', mac: '00:30:d3:05:70:7e', panel: { serial: '0', resource: 'TCPIP0::44.44.44.222::gpib7,30,1::INSTR' } },
      { state: 'online', protocol: 'visa', panel: { serial: '', resource: 'TCPIP::44.44.44.164::INSTR' } },
      { state: 'graveyard', panel: { serial: 'GONE1' } },
    ]);
    expect(boxes).toEqual([{ serial: 'MY42000747' }, { resource: 'TCPIP::44.44.44.222::GPIB7,30,1::INSTR' }]);
  });
  it('gives each new placement the next box no placement carries yet', () => {
    const model = createSchematic([]);
    const def = { ...partToDefinition({ id: 'agilent/54641d', model: '54641D' }), liveBoxes: [{ serial: 'A1' }, { serial: 'A2' }] };
    model.definitions.push(def);
    expect(placeBlock(model, def.id, { x: 0, y: 0 })?.serial).toBe('A1');
    expect(placeBlock(model, def.id, { x: 50, y: 0 })?.serial).toBe('A2');
    expect(placeBlock(model, def.id, { x: 99, y: 0 })?.serial).toBeUndefined();
  });
});

describe('the OS device list stands in when the library lists no box online', () => {
  it('takes presented boxes of the same model only', () => {
    expect(liveBoxesFromDevices([
      { model: '54641D', serial: 'MY42000747', presented: '54641D_MY42000747', resource: 'TCPIP::h::gpib7,6::INSTR' },
      { model: '54641D', serial: '', presented: null, resource: 'TCPIP::h::gpib7,9::INSTR' },
      { model: '33220A', serial: 'MY44044028', presented: '33220A_MY44044028' },
    ], '54641D')).toEqual([{ serial: 'MY42000747' }]);
  });
});
