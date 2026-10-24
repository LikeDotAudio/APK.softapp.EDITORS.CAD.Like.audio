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

describe('resumeFromHash', () => {
  it('resumes only a hosted window that asks to', async () => {
    const { resumeFromHash } = await import('../entrance');
    expect(resumeFromHash('#/drawing?host=acoustic&resume')).toBe(true);
    expect(resumeFromHash('#/drawing?host=acoustic')).toBe(false);
    expect(resumeFromHash('#/drawing?resume')).toBe(false);
    expect(resumeFromHash('#/drawing?host=acoustic&resumed')).toBe(false);
  });
});

const areaOf = (pts: [number, number][]) => Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]!; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);

describe('sceneForHost — rooms three ways, and layer finishes', () => {
  it('a captured plan whose walls overshoot at the corners is a room: its outline', () => {
    const doc = new Doc();
    // four walls, each running 0.5 past the corners, no shared joints at all
    doc.addLine({ x: -0.5, y: 0 }, { x: 6.5, y: 0 });
    doc.addLine({ x: 6, y: -0.5 }, { x: 6, y: 4.5 });
    doc.addLine({ x: 6.5, y: 4 }, { x: -0.5, y: 4 });
    doc.addLine({ x: 0, y: 4.5 }, { x: 0, y: -0.5 });
    doc.addLine({ x: 3, y: 0 }, { x: 3, y: 2.5 }); // a partition ending on the wall, no joint
    const g = sceneForHost(doc, 'm', layers());
    expect(g.rooms).toHaveLength(1);
    expect(g.rooms[0]!.kind).toBe('outline');
    expect(areaOf(g.rooms[0]!.points)).toBeCloseTo(24, 6);
    expect(g.rooms[0]!.id).toBeLessThan(0);
  });

  it('a clean loop is not outlined again', () => {
    const doc = new Doc();
    rectangle(doc, 5, 7);
    const g = sceneForHost(doc, 'm', layers());
    expect(g.rooms.map((r) => r.kind)).toEqual(['loop']);
  });

  it('a selection whose lines make a room is a room of its own', () => {
    const doc = new Doc();
    // two rooms side by side in one pile of overshooting lines
    doc.addLine({ x: -0.5, y: 0 }, { x: 9.5, y: 0 });
    doc.addLine({ x: -0.5, y: 4 }, { x: 9.5, y: 4 });
    const a = doc.addLine({ x: 0, y: -0.5 }, { x: 0, y: 4.5 })!;
    const b = doc.addLine({ x: 4, y: -0.5 }, { x: 4, y: 4.5 })!;
    doc.addLine({ x: 9, y: -0.5 }, { x: 9, y: 4.5 });
    const walls = [...doc.edges.values()];
    const top = walls.find((e) => doc.endpointsOf(e)[0].y === 4)!.id;
    const bottom = walls.find((e) => doc.endpointsOf(e)[0].y === 0)!.id;
    const g = sceneForHost(doc, 'm', layers(), [[a, b, top, bottom]]);
    const picked = g.rooms.filter((r) => r.kind === 'picked');
    expect(picked).toHaveLength(1);
    expect(areaOf(picked[0]!.points)).toBeCloseTo(16, 6);
    // the whole pile's outline is there too: the two rooms together
    expect(areaOf(g.rooms.find((r) => r.kind === 'outline')!.points)).toBeCloseTo(36, 6);
  });

  it('a layer’s finish travels with it', () => {
    const doc = new Doc();
    const l = new Map<string, Layer>([['0', { id: '0', name: '0', color: '#fff', visible: true, finish: 'absorber-100' }], ['A', { id: 'A', name: 'A', color: '#fff', visible: true }]]);
    const g = sceneForHost(doc, 'm', l);
    expect(g.layers.find((x) => x.id === '0')!.finish).toBe('absorber-100');
    expect('finish' in g.layers.find((x) => x.id === 'A')!).toBe(false);
  });
});
