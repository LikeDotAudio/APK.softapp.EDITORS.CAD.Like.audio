// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { Layer } from '../../core/types';
import { Doc } from '../../model/Doc';
import { addPaletteFill } from '../../model/palette/addPaletteFill';
import { placePaletteBlock } from '../../model/palette/placePaletteBlock';
import { sceneForHost } from './sceneForHost';

const layers = (visible = true): Map<string, Layer> =>
  new Map([['0', { id: '0', name: '0', color: '#ffffff', visible }]]);

function rectangle(doc: Doc, w: number, h: number): void {
  doc.addLine({ x: 0, y: 0 }, { x: w, y: 0 });
  doc.addLine({ x: w, y: 0 }, { x: w, y: h });
  doc.addLine({ x: w, y: h }, { x: 0, y: h });
  doc.addLine({ x: 0, y: h }, { x: 0, y: 0 });
}

describe('sceneForHost', () => {
  it('hands a closed rectangle over as four walls and one room', () => {
    const doc = new Doc();
    rectangle(doc, 5, 7);
    const g = sceneForHost(doc, 'm', layers());
    expect(g.walls).toHaveLength(4);
    expect(g.rooms).toHaveLength(1);
    expect(g.rooms[0]!.points).toHaveLength(4);
    expect(g.units).toBe('m');
  });

  it('tessellates an arc into several wall segments', () => {
    const doc = new Doc();
    doc.addArc(0, 0, 2, { x: 2, y: 0 }, { x: 0, y: 2 });
    const g = sceneForHost(doc, 'm', layers());
    expect(g.walls.length).toBeGreaterThan(2);
    const last = g.walls[g.walls.length - 1]!;
    expect(last.b[0]).toBeCloseTo(0);
    expect(last.b[1]).toBeCloseTo(2);
  });

  it('leaves hidden layers out, so the host never draws over what is not shown', () => {
    const doc = new Doc();
    rectangle(doc, 5, 7);
    const g = sceneForHost(doc, 'm', layers(false));
    expect(g.walls).toHaveLength(0);
    expect(g.rooms).toHaveLength(0);
  });
});

describe('sceneForHost patches', () => {
  const finish = { id: 'carpet', name: 'Carpet', category: 'Floor', color: '#884422' };
  const panel = { id: 'abs-1200', name: 'Absorber', category: 'Absorber', color: '#336699', size: [1.2, 0.6] as [number, number] };

  it('reports a palette fill by its boundary, under fill:<id>', () => {
    const doc = new Doc();
    const id = addPaletteFill(doc, finish, [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }], '0')!;
    doc.addFill([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }]); // a plain fill is not the host's
    const g = sceneForHost(doc, 'm', layers());
    expect(g.patches).toEqual([
      { id: `fill:${id}`, paletteId: 'carpet', layerId: '0', points: [[0, 0], [2, 0], [2, 1]] },
    ]);
  });

  it('reports a rotated, scaled palette block as its world footprint, under block:<id>', () => {
    const doc = new Doc();
    const id = placePaletteBlock(doc, panel, 'm', { x: 10, y: 5 }, 90, '0')!;
    doc.blockInstances.get(id)!.scale = 2;
    const [p] = sceneForHost(doc, 'm', layers()).patches;
    expect(p!.id).toBe(`block:${id}`);
    expect(p!.paletteId).toBe('abs-1200');
    // 1.2 × 0.6 about its centre, doubled, then turned 90° CCW: 1.2 tall, 2.4 wide becomes 2.4 tall, 1.2 wide.
    const xs = p!.points.map((q) => q[0]);
    const ys = p!.points.map((q) => q[1]);
    expect(Math.min(...xs)).toBeCloseTo(9.4);
    expect(Math.max(...xs)).toBeCloseTo(10.6);
    expect(Math.min(...ys)).toBeCloseTo(3.8);
    expect(Math.max(...ys)).toBeCloseTo(6.2);
  });

  it('adds nothing to walls or rooms — a patch is never a candidate room', () => {
    const doc = new Doc();
    rectangle(doc, 5, 3);
    addPaletteFill(doc, finish, [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 3 }, { x: 0, y: 3 }], '0');
    placePaletteBlock(doc, panel, 'm', { x: 2, y: 1 }, 0, '0');
    placePaletteBlock(doc, panel, 'm', { x: 4, y: 1 }, 0, '0');
    const g = sceneForHost(doc, 'm', layers());
    expect(g.walls).toHaveLength(4);
    expect(g.rooms).toHaveLength(1);
    expect(g.patches).toHaveLength(3);
    expect(doc.edges.size).toBe(4);
  });

  it('leaves patches on hidden layers out', () => {
    const doc = new Doc();
    addPaletteFill(doc, finish, [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }], '0');
    placePaletteBlock(doc, panel, 'm', { x: 0, y: 0 }, 0, '0');
    expect(sceneForHost(doc, 'm', layers(true)).patches).toHaveLength(2);
    expect(sceneForHost(doc, 'm', layers(false)).patches).toHaveLength(0);
  });
});

describe('hostFromHash', () => {
  it('reads the host a softapp names in the fragment, and nothing otherwise', async () => {
    const { hostFromHash, entranceFromHash } = await import('../entrance');
    expect(hostFromHash('#/drawing?host=acoustic')).toBe('acoustic');
    expect(hostFromHash('#/drawing')).toBeNull();
    expect(entranceFromHash('#/drawing?host=acoustic')).toBe('drawing');
  });
});
