// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { partToDefinition, partHat, firstSentence, BLOCK } from '../../flow/bimPart';
import { portWords, wordsPx, wordsBelowPx, WORDS_MIN_PX } from './drawConnectors';
import { hatDepth } from './drawHat';
import { refreshDefinition, staleBimDefinitions } from '../../state/actions/refreshBimDefinitions';
import { portColor, SIDE_COLOR } from './flowColors';
import { createSchematic, placeBlock, portsOf } from '../../flow/Schematic';
import { SCHEMATIC_GRID, wireEndPoint } from '../../flow/onGrid';

const MIC = {
  id: 'sandhill-audio/6011a', manufacturer: 'Sandhill Audio', model: '6011A', category: 'Microphones', class: 'Ribbon',
  stage: 'seeded', description: 'An active ribbon microphone. It runs at unity gain.',
  ports: [
    { group: 'Output', side: 'output', connector: 'XLR3-M', domain: 'audio' },
    { group: 'GPIO', side: 'connection', domain: 'control', connector: 'EUROBLOCK-3' },
    { group: 'Mains', side: 'input', domain: 'power', connector: 'IEC-C14' },
  ],
};

describe('a port, end to end', () => {
  it('beside its dot a port says its own name; a group\'s member says just its member', () => {
    expect(portWords({ id: 'OUT', label: 'Output' })).toBe('Output');
    expect(portWords({ id: 'CH_3', label: 'Ch 3', member: '3' })).toBe('3');
  });
  it('power and control both out the bottom; control keeps amber', () => {
    const d = partToDefinition(MIC);
    const gpio = d.ports.find((p) => p.label === 'GPIO')!;
    expect(gpio.side).toBe('power');
    expect(portColor(gpio)).toBe(SIDE_COLOR.control);
    expect(portColor(d.ports.find((p) => p.label === 'Mains')!)).toBe(SIDE_COLOR.power);
  });
  it('words stay readable when zoomed out, and the label below clears the bottom plugs', () => {
    const d = partToDefinition(MIC);
    expect(wordsPx(d, 'output', 0.5)).toBe(WORDS_MIN_PX);   // a lone port has room
    expect(wordsPx(d, 'power', 1.3)).toBeGreaterThanOrEqual(WORDS_MIN_PX);
    expect(wordsBelowPx(d, 1.3)).toBeGreaterThan(40);
  });
});

describe('the block\'s anatomy (the owner\'s sheet)', () => {
  const DEV = { id: 'x/dev', name: 'DEVICE NAME', ports: [
    { group: 'IN', side: 'input', count: 4, connector: 'XLR3-F' },
    { group: 'AUX A', side: 'input' }, { group: 'AUX B', side: 'input' },
  ] };
  it('the ports start below the header, a group set apart from the singles after it', () => {
    const d = partToDefinition(DEV);
    const y = (label: string) => d.ports.find((p) => p.label === label)!.offset! * d.size.h;
    expect(y('IN 1')).toBeGreaterThan(BLOCK.header);
    expect(y('IN 2') - y('IN 1')).toBeCloseTo(BLOCK.pitch);
    expect(y('AUX A') - y('IN 4')).toBeCloseTo(BLOCK.pitch + BLOCK.groupGap);
    expect(y('AUX B') - y('AUX A')).toBeCloseTo(BLOCK.pitch);
    expect(d.ports[0]).toMatchObject({ group: 'IN', member: '1', connector: 'XLR3-F' });
    expect(d.ports.find((p) => p.label === 'AUX A')?.group).toBeUndefined();
  });
  it('a functional block\'s ports share a band: its IN beside its THRU, bracketed by the block (Genelec 8331AM)', () => {
    const GEN = { id: 'genelec/8331am', ports: [
      { group: 'NETWORK', block: 'Networking-Control', side: 'input', connector: 'RJ45', count: 2, labels: ['NETWORK-1', 'NETWORK-2'] },
      { group: 'DIGITAL IN', block: 'Audio Digital', side: 'input', connector: 'XLR3-F' },
      { group: 'DIGITAL THRU', block: 'Audio Digital', side: 'output', connector: 'XLR3-M' },
      { group: 'ANALOG IN', block: 'Audio Analog', side: 'input', connector: 'XLR3-F' },
      { group: 'MAINS INPUT', block: 'Power', side: 'input', domain: 'power', connector: 'IEC-C14' },
    ] };
    const d = partToDefinition(GEN);
    const y = (label: string) => d.ports.find((p) => p.label === label)!.offset! * d.size.h;
    expect(y('DIGITAL THRU')).toBeCloseTo(y('DIGITAL IN'));
    expect(y('DIGITAL IN') - y('NETWORK NETWORK-2')).toBeCloseTo(BLOCK.pitch + BLOCK.groupGap);
    expect(d.ports.find((p) => p.label === 'DIGITAL THRU')).toMatchObject({ group: 'Audio Digital', member: 'DIGITAL THRU', connector: 'XLR3-M' });
    expect(d.ports.find((p) => p.label === 'NETWORK NETWORK-1')).toMatchObject({ group: 'Networking-Control', member: 'NETWORK-1' });
  });
  it('a group with no block pairs with an earlier one of its domain: AUDIO INPUT beside AUDIO THRU (Meyer)', () => {
    const MEYER = { id: 'meyer/x', ports: [
      { group: 'NETWORK', side: 'input', domain: 'network' },
      { group: 'AUDIO INPUT 1-8', side: 'input', domain: 'audio', count: 8, labels: ['CH-1', 'CH-2', 'CH-3', 'CH-4', 'CH-5', 'CH-6', 'CH-7', 'CH-8'] },
      { group: 'AUDIO THRU 1-8', side: 'output', domain: 'audio', count: 8, labels: ['THRU-1', 'THRU-2', 'THRU-3', 'THRU-4', 'THRU-5', 'THRU-6', 'THRU-7', 'THRU-8'] },
      { group: 'LOUDSPEAKER OUTPUT', side: 'output', domain: 'audio', count: 8 },
    ] };
    const d = partToDefinition(MEYER);
    const y = (id: string) => d.ports.find((p) => p.member === id)!.offset! * d.size.h;
    expect(y('THRU-1')).toBeCloseTo(y('CH-1'));
    expect(y('THRU-8')).toBeCloseTo(y('CH-8'));
    expect(y('1')).toBeCloseTo(y('CH-8') + BLOCK.pitch + BLOCK.groupGap);   // the loudspeaker outs: the next band
  });
  it('a bigger seat keeps the ports under the header on their pitch', () => {
    const small = partToDefinition(DEV);
    const big = partToDefinition(DEV, null, { w: 300, h: 400 });
    expect(big.size).toEqual({ w: 300, h: 400 });
    const y = (d: typeof big) => d.ports[0]!.offset! * d.size.h;
    expect(y(big)).toBeCloseTo(y(small));
  });
});

describe('the header (top hat)', () => {
  it('name, then details and what it is', () => {
    const hat = partHat(MIC);
    expect(hat.title).toBe('Sandhill Audio 6011A');
    expect(hat.lines).toContain('Sandhill Audio · 6011A');
    expect(hat.left).toBe('Microphones › Ribbon');
    expect(hat.right).toBe('⚠ seeded — unverified');
    expect(hat.lines.some((l) => l.includes('XLR3-M'))).toBe(true);
    expect(hat.lines).toContain('An active ribbon microphone.');
    expect(hatDepth(partToDefinition(MIC))).toBe(BLOCK.header);
  });
  it('a long description is cut at its first sentence', () => {
    expect(firstSentence('x'.repeat(200), 20)).toHaveLength(20);
  });
  it('a block saved before hats is rebuilt from its part, same id and ports', () => {
    const old = { ...partToDefinition(MIC) };
    delete old.hat;
    old.ports = old.ports.map(({ connector: _c, ...p }) => p);
    expect(staleBimDefinitions([old])).toHaveLength(1);
    refreshDefinition(old, MIC);
    expect(old.hat?.title).toBe('Sandhill Audio 6011A');
    expect(old.ports.map((p) => p.id)).toEqual(partToDefinition(MIC).ports.map((p) => p.id));
    expect(old.ports[0]?.connector).toBe('XLR3-M');
    expect(staleBimDefinitions([old])).toHaveLength(0);
  });
});

describe('nothing off the grid (the owner, 2026-11-07)', () => {
  const on = (v: number) => Math.abs(v / SCHEMATIC_GRID - Math.round(v / SCHEMATIC_GRID)) < 1e-6;
  it('a BIM block placed anywhere: its centre, every port and every wire end on a grid intersection', () => {
    const GEN = { id: 'g/x', ports: [
      { group: 'NETWORK', block: 'Net', side: 'input', connector: 'RJ45', count: 3 },
      { group: 'IN', block: 'Audio', side: 'input', connector: 'XLR3-F' }, { group: 'THRU', block: 'Audio', side: 'output', connector: 'XLR3-M' },
      { group: 'AC IN', side: 'input', domain: 'power', connector: 'IEC-C14' }, { group: 'GPIO', side: 'connection', domain: 'control' },
    ] };
    const m = createSchematic([]);
    const def = partToDefinition(GEN);
    m.definitions.push(def);
    const p = placeBlock(m, def.id, { x: 123.4, y: -57.2 })!;
    expect(on(p.at.x) && on(p.at.y)).toBe(true);
    for (const r of portsOf(m, p.id)) {
      expect([r.port.label, on(r.world.x), on(r.world.y)]).toEqual([r.port.label, true, true]);
      const end = wireEndPoint(p, def, r.port);
      expect([r.port.label, on(end.x), on(end.y)]).toEqual([r.port.label, true, true]);
    }
  });
});
