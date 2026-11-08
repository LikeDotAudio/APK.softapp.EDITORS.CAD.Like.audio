// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { partToDefinition, bimDefinitionId, liveBoxesOf, PORTS_PER_GROUP } from './bimPart';
import { createSchematic, placeBlock } from './Schematic';
import { bimPartOfDrop } from '../state/actions/dropBimPart';

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
    expect(d.ports.find((p) => p.label === 'GPIO')?.side).toBe('power');   // control out the bottom too
    expect(d.ports.find((p) => p.label === 'GPIO')?.domain).toBe('control');
    expect(d.ports.find((p) => p.label === 'Mains')?.side).toBe('power');
    expect(d.ports.filter((p) => p.label?.startsWith('LAN')).map((p) => p.label)).toEqual(['LAN A', 'LAN B']);
    const ch = d.ports.filter((p) => p.label?.startsWith('Ch '));
    expect(ch).toHaveLength(PORTS_PER_GROUP);
    expect(ch.at(-1)?.label).toMatch(/\+24$/);
    expect(new Set(d.ports.map((p) => p.id)).size).toBe(d.ports.length);
    expect(d.ports[0]?.domain).toBe('audio');
  });
  it('each port carries the connector its part names', () => {
    const d = partToDefinition({ id: 'a/b', ports: [{ group: 'Out', side: 'output', connector: 'XLR3-M' }, { group: 'In', side: 'input' }] });
    expect(d.ports[0]?.connector).toBe('XLR3-M');
    expect(d.ports[1]?.connector).toBeUndefined();
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

describe('a BIM block keeps its BIM reference (ROAD-3572)', () => {
  const REF = { part: 'keysight/34401a', url: 'http://apk.local:8160/api/bim/parts/keysight/34401a', rev: '3f1c0a9be27d4410', source: 'live' };
  const DMM = { id: 'keysight/34401a', manufacturer: 'Keysight', model: '34401A', ports: [{ group: 'GPIB', side: 'connection', domain: 'control' }] };
  it('the definition carries the pick\'s ref, and every placement of it a copy', () => {
    const d = partToDefinition(DMM, REF);
    expect(d.bimRef).toEqual({ part: 'keysight/34401a', url: REF.url, rev: REF.rev, globalId: '1QkKnL3MfIRgtDc4$PFq_I' });   // the part's IFC type GlobalId (ROAD-3576)
    const s = createSchematic();
    s.definitions.push(d);
    const p = placeBlock(s, d.id, { x: 0, y: 0 });
    expect(p?.bimRef).toEqual(d.bimRef);
    expect(p?.bimRef).not.toBe(d.bimRef);
  });
  it('a full part\'s own ref is used when the pick gave none; a part with none keeps none', () => {
    expect(partToDefinition({ ...DMM, ref: { part: DMM.id, url: '/api/bim/parts/keysight/34401a', rev: 'r1' } }).bimRef?.rev).toBe('r1');
    expect(partToDefinition(CORE).bimRef).toBeUndefined();
  });
  it('a part dropped from the library brings its ref along', () => {
    const got = bimPartOfDrop(JSON.stringify({ bim: DMM, ref: REF }));
    expect(partToDefinition(got!).bimRef?.url).toBe(REF.url);
  });
});
