// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { partToDefinition, partHat, firstSentence, BLOCK } from '../../flow/bimPart';
import { portWords, wordsPx, wordsBelowPx, WORDS_MIN_PX } from './drawConnectors';
import { hatDepth } from './drawHat';
import { refreshDefinition, staleBimDefinitions } from '../../state/actions/refreshBimDefinitions';
import { portColor, SIDE_COLOR } from './flowColors';

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
