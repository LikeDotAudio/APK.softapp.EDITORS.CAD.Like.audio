// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { BlockDefinition, SchematicModel } from '../core/types';
import { endName, flyPortals, resolvePortal, toggleFly } from './fly';
import { clearFlyHits, flyHitAt, recordFlyHit } from '../render/flow/flyHits';

const BOX: BlockDefinition = { id: 'box', name: 'BOX', size: { w: 100, h: 60 }, glyph: [],
  ports: [{ id: 'IN', side: 'input', label: 'in' }, { id: 'FABRIC_91', side: 'output', label: 'fabric 91' }] };

const model = (): SchematicModel => ({
  definitions: [BOX],
  placements: [
    { id: 1, definitionId: 'box', at: { x: 0, y: 0 }, layerId: '0', refdes: 'U57 · Unidentified NMOS node' },
    { id: 2, definitionId: 'box', at: { x: 500, y: 0 }, layerId: '0', refdes: 'U106 · fabric' },
  ],
  connectors: [{ id: 1, from: { placementId: 1, portId: 'FABRIC_91' }, to: { placementId: 2, portId: 'IN' }, layerId: '0' }],
  groups: [], nextPlacementId: 3, nextConnectorId: 2, nextGroupId: 1,
} as unknown as SchematicModel);

describe('fly-offs and fly-ons', () => {
  it('a portal\'s far end read from its text: a refdes, then a port', () => {
    expect(resolvePortal(model(), { text: 'U106 fabric 91', wired: true })).toEqual({ placementId: 2, portId: 'FABRIC_91' });
    expect(resolvePortal(model(), { text: 'U106', wired: true })).toEqual({ placementId: 2 });
    expect(resolvePortal(model(), { text: 'U999 x', wired: true })).toBeNull();
  });
  it('a `to` wins, and another drawing is named, not guessed', () => {
    expect(resolvePortal(model(), { text: 'whatever', to: { placementId: 1, port: 'IN' } })).toEqual({ placementId: 1, portId: 'IN' });
    expect(resolvePortal(model(), { text: 'SW1 : 24', to: { drawing: 'Network' } })).toMatchObject({ drawing: 'Network' });
  });
  it('a wire made a fly pair: FLY OFF where it leaves, FLY ON where it lands, each naming the other end', () => {
    const m = model();
    expect(flyPortals(m, 1).size).toBe(0);
    expect(toggleFly(m, [1])).toBe(1);
    const off = flyPortals(m, 1).get('FABRIC_91')!;
    const on = flyPortals(m, 2).get('IN')!;
    expect(off.off).toBe(true);
    expect(on.off).toBe(false);
    expect(off.far.text).toBe('U106 : in');
    expect(on.far.text).toBe('U57 : fabric 91');
    expect(resolvePortal(m, off.far)).toEqual({ placementId: 2, portId: 'IN' });
    expect(toggleFly(m, [2])).toBe(1);   // all flying: back to a line
    expect(m.connectors[0]!.fly).toBeUndefined();
    expect(endName(m, { placementId: 2, portId: 'IN' })).toBe('U106 : in');
  });
  it('a click finds the capsule drawn last under it', () => {
    clearFlyHits();
    recordFlyHit({ x1: 0, y1: 0, x2: 10, y2: 10, placementId: 1, portId: 'A', far: { text: 'a' } });
    recordFlyHit({ x1: 5, y1: 5, x2: 20, y2: 20, placementId: 1, portId: 'B', far: { text: 'b' } });
    expect(flyHitAt(7, 7)?.portId).toBe('B');
    expect(flyHitAt(2, 2)?.portId).toBe('A');
    expect(flyHitAt(50, 50)).toBeNull();
  });
});
